"""
Service layer for ai-worker.
All external service clients are initialized once and reused across jobs.
"""

import json
import tempfile
import os
import uuid
import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse
import subprocess
import time

import azure.cognitiveservices.speech as speechsdk
import structlog
from azure.storage.blob import BlobServiceClient
from openai import OpenAI
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row

from config import Settings

logger = structlog.get_logger(__name__)


class DatabaseService:
    """Manages a connection pool for PostgreSQL access."""

    def __init__(self, database_url: str):
        self._pool = ConnectionPool(
            conninfo=database_url,
            min_size=2,
            max_size=10,
            max_idle=300, # 5 minutes max idle time to prevent dropped connections
            check=ConnectionPool.check_connection,
            kwargs={"row_factory": dict_row},
        )
        logger.info("database_pool_initialized", min_size=2, max_size=10)

    def update_job_progress(self, job_id: str, progress: int, status: str = "processing"):
        """Update job progress and status."""
        with self._pool.connection() as conn:
            conn.execute(
                """
                UPDATE "Job"
                SET progress = %s, status = %s, "updatedAt" = NOW()
                WHERE id = %s
                """,
                (progress, status, job_id),
            )

    def update_job_failed(self, job_id: str, error: str):
        """Mark a job as failed with an error message."""
        with self._pool.connection() as conn:
            conn.execute(
                """
                UPDATE "Job"
                SET status = 'failed', error = %s, "updatedAt" = NOW()
                WHERE id = %s
                """,
                (error, job_id),
            )

    def update_episode_failed(self, episode_id: str):
        """Mark an episode as failed."""
        with self._pool.connection() as conn:
            conn.execute(
                """
                UPDATE "Episode"
                SET status = 'failed', "updatedAt" = NOW()
                WHERE id = %s
                """,
                (episode_id,),
            )

    def save_episode_ai_results(
        self,
        episode_id: str,
        job_id: str,
        transcript: str,
        ai_summary: Optional[str],
        chapters: List[Dict],
        show_notes: Optional[str],
        tags: List[str],
        recommendations: Optional[str],
    ):
        """Save AI-generated data to episode and mark job complete."""
        with self._pool.connection() as conn:
            with conn.transaction():
                conn.execute(
                    """
                    UPDATE "Episode"
                    SET transcript = %s,
                        "aiSummary" = %s,
                        chapters = %s,
                        "showNotes" = %s,
                        tags = %s,
                        recommendations = %s,
                        status = 'published',
                        "updatedAt" = NOW()
                    WHERE id = %s
                    """,
                    (
                        transcript,
                        ai_summary,
                        json.dumps(chapters),
                        show_notes,
                        json.dumps(tags),
                        recommendations,
                        episode_id,
                    ),
                )
                conn.execute(
                    """
                    UPDATE "Job"
                    SET progress = 100, status = 'completed', "updatedAt" = NOW()
                    WHERE id = %s
                    """,
                    (job_id,),
                )

    def save_episode_chunks(
        self,
        episode_id: str,
        chunks: List[Dict[str, Any]],
    ):
        """Save chunked transcript embeddings for RAG retrieval.
        
        Each chunk dict has: content, embedding, chunk_index, start_offset, end_offset, metadata.
        Old chunks for this episode are deleted first (idempotent re-processing).
        """
        with self._pool.connection() as conn:
            with conn.transaction():
                # Delete existing chunks for this episode (idempotent)
                conn.execute(
                    'DELETE FROM "EpisodeChunk" WHERE "episodeId" = %s',
                    (episode_id,),
                )

                # Batch insert new chunks
                for chunk in chunks:
                    conn.execute(
                        """
                        INSERT INTO "EpisodeChunk"
                            (id, "episodeId", "chunkIndex", content, embedding,
                             "startOffset", "endOffset", metadata, "createdAt")
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                        """,
                        (
                            str(uuid.uuid4()),
                            episode_id,
                            chunk["chunk_index"],
                            chunk["content"],
                            chunk["embedding"],  # pgvector accepts list of floats
                            chunk.get("start_offset", 0),
                            chunk.get("end_offset", 0),
                            json.dumps(chunk.get("metadata", {})),
                        ),
                    )

                logger.info(
                    "chunks_saved",
                    episode_id=episode_id,
                    count=len(chunks),
                )

    def close(self):
        """Close the connection pool."""
        self._pool.close()
        logger.info("database_pool_closed")


class StorageService:
    """Manages Azure Blob Storage operations. Singleton client."""

    def __init__(self, connection_string: str, container_name: str):
        self._blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        self._container_name = container_name
        logger.info("storage_service_initialized", container=container_name)

    def download_blob(self, blob_path: str, dest_path: str):
        """Download a blob from Azure Storage to a local file using a blob path (not URL)."""
        blob_client = self._blob_service_client.get_blob_client(
            container=self._container_name, blob=blob_path
        )
        with open(dest_path, "wb") as f:
            f.write(blob_client.download_blob().readall())

        logger.info("blob_downloaded", blob_path=blob_path, dest=dest_path)


class AIService:
    """Manages Azure OpenAI operations. Singleton client."""

    def __init__(
        self,
        api_key: str,
        endpoint: str,
        api_version: str,
        speech_key: str,
        speech_endpoint: str,
        whisper_deployment: str,
        llm_deployment: str,
        embedding_deployment: str,
    ):
        self._client = OpenAI(
            api_key=api_key,
            base_url=endpoint,
        )
        self._speech_config = speechsdk.SpeechConfig(
            subscription=speech_key,
            endpoint=speech_endpoint
        )
        self._speech_key = speech_key
        self._speech_endpoint = speech_endpoint
        self._whisper_deployment = whisper_deployment
        self._llm_deployment = llm_deployment
        self._embedding_deployment = embedding_deployment
        logger.info(
            "ai_service_initialized",
            whisper=whisper_deployment,
            llm=llm_deployment,
            embedding=embedding_deployment,
            speech_endpoint=speech_endpoint,
        )

    def transcribe(self, audio_path: str) -> str:
        """Transcribe audio using Azure Cognitive Services Speech REST API with diarization."""
        logger.info("transcription_started", audio_path=audio_path)
        
        import requests
        import json
        
        # Ensure endpoint doesn't end with a trailing slash
        endpoint = self._speech_endpoint.rstrip("/")
        url = f"{endpoint}/speechtotext/transcriptions:transcribe?api-version=2025-10-15"
        
        headers = {
            "Ocp-Apim-Subscription-Key": self._speech_key,
            # Let requests set the Content-Type automatically for multipart/form-data
        }
        
        definition = {
            "locales": ["en-US"],
            "diarization": {
                "maxSpeakers": 2,
                "enabled": True
            }
        }
        
        try:
            with open(audio_path, "rb") as audio_file:
                files = {
                    "audio": (os.path.basename(audio_path), audio_file, "application/octet-stream"),
                }
                data = {
                    "definition": json.dumps(definition)
                }
                
                response = requests.post(url, headers=headers, files=files, data=data)
                
            response.raise_for_status()
            result_json = response.json()
            
            # Extract combined text. Depending on the exact response structure, 
            # it is typically in result_json["combinedPhrases"][0]["text"] 
            # or we can concatenate the recognized phrases.
            # Assuming a standard transcription result:
            # Extract phrases with timestamps if available to help AI generate chapters
            if "phrases" in result_json:
                import re
                
                def format_timestamp(offset_ms):
                    s = int(offset_ms / 1000)
                    m = s // 60
                    s = s % 60
                    h = m // 60
                    m = m % 60
                    if h > 0:
                        return f"[{h:02d}:{m:02d}:{s:02d}]"
                    return f"[{m:02d}:{s:02d}]"
                
                lines = []
                for p in result_json["phrases"]:
                    text = p.get("text", "")
                    offset = p.get("offset")
                    offset_in_ticks = p.get("offsetInTicks")
                    offset_ms_val = p.get("offsetMilliseconds")
                    
                    offset_ms = 0
                    if offset_ms_val is not None:
                        offset_ms = offset_ms_val
                    elif offset_in_ticks is not None:
                        offset_ms = offset_in_ticks / 10000
                    elif isinstance(offset, (int, float)):
                        offset_ms = offset
                    elif isinstance(offset, str) and offset.startswith("PT"):
                        match = re.match(r"PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?", offset)
                        if match:
                            h_val = float(match.group(1) or 0)
                            m_val = float(match.group(2) or 0)
                            s_val = float(match.group(3) or 0)
                            offset_ms = (h_val * 3600 + m_val * 60 + s_val) * 1000
                            
                    lines.append(f"{format_timestamp(offset_ms)} {text}")
                result_text = "\n".join(lines)
            elif "combinedPhrases" in result_json and result_json["combinedPhrases"]:
                result_text = result_json["combinedPhrases"][0].get("text", "")
            else:
                result_text = result_json.get("text", str(result_json))
                
            logger.info("transcription_completed", length=len(result_text))
            return result_text
            
        except requests.exceptions.RequestException as e:
            error_details = e.response.text if e.response is not None else str(e)
            logger.error("speech_recognition_error", error=error_details)
            raise Exception(f"Speech REST API Error: {error_details}")

    def generate_metadata(self, transcript_text: str) -> Dict[str, Any]:
        """Generate summary, chapters, notes, tags via LLM."""
        logger.info("metadata_generation_started", transcript_length=len(transcript_text))

        if len(transcript_text.strip()) < 10:
            logger.warning("transcript_too_short", length=len(transcript_text))
            return {
                "aiSummary": "No speech detected in audio.",
                "chapters": [],
                "showNotes": "Audio was silent or contained no recognizable speech.",
                "tags": [],
                "recommendations": ""
            }

        # Truncate to avoid token limits — for very long transcripts,
        # implement chunking with overlap and merge results.
        truncated = transcript_text[:15000]

        prompt = f"""
        Analyze the following podcast transcript and extract the following information in JSON format:
        {{
            "aiSummary": "A concise 2-3 paragraph summary",
            "chapters": [{{"title": "Chapter Title", "startTime": 0}}],
            "showNotes": "Detailed bullet points covering key topics, resources mentioned, etc.",
            "tags": ["tag1", "tag2", "tag3"],
            "recommendations": "If applicable, suggest 1-2 related topics or actions for the listener"
        }}

        Transcript:
        {truncated}
        """
        
        system_msg = "You are a professional podcast editor and summarizer. Output strictly valid JSON."
        full_input = f"{system_msg}\n\n{prompt}"

        response = self._client.responses.create(
            model=self._llm_deployment,
            input=full_input,
        )

        out = response.output[0]
        content = getattr(out, 'text', getattr(out, 'content', str(out)))
        
        if isinstance(content, list):
            extracted = []
            for item in content:
                if isinstance(item, str):
                    extracted.append(item)
                elif hasattr(item, 'text'):
                    extracted.append(item.text)
                elif isinstance(item, dict) and 'text' in item:
                    extracted.append(item['text'])
                else:
                    extracted.append(str(item))
            content = "".join(extracted)
        elif not isinstance(content, str):
            content = str(content)
        
        try:
            metadata = json.loads(content)
        except json.JSONDecodeError:
            content = content.strip("`").removeprefix("json").strip()
            metadata = json.loads(content)
            
        logger.info("metadata_generation_completed", keys=list(metadata.keys()))
        return metadata

    def generate_embedding(self, text: str) -> List[float]:
        """Generate an embedding vector for the given text."""
        logger.info("embedding_generation_started")
        
        # Azure OpenAI will throw a 400 if the input string is completely empty.
        if not text.strip():
            logger.warning("empty_text_for_embedding, using fallback string")
            text = "No speech detected in audio."
            
        result = self._client.embeddings.create(
            input=[text],
            model=self._embedding_deployment,
        )
        vector = result.data[0].embedding
        logger.info("embedding_generation_completed", dimensions=len(vector))
        return vector

    def chunk_transcript(
        self,
        transcript: str,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
    ) -> List[Dict[str, Any]]:
        """Split a transcript into overlapping token-based chunks.
        
        Uses whitespace tokenization (word-level) as a lightweight proxy for 
        subword tokens. Each chunk records character offsets for tracing back 
        to the original transcript.
        
        Returns a list of dicts with: content, chunk_index, start_offset, end_offset, metadata.
        """
        if not transcript or not transcript.strip():
            return []

        words = transcript.split()
        chunks = []
        chunk_index = 0
        i = 0

        while i < len(words):
            chunk_words = words[i : i + chunk_size]
            chunk_text = " ".join(chunk_words)

            # Calculate character offsets in the original transcript
            # Find the start of the first word of this chunk
            start_offset = 0
            word_count = 0
            for ci, ch in enumerate(transcript):
                if word_count == i:
                    start_offset = ci
                    break
                if ch == ' ' or ch == '\n':
                    if ci + 1 < len(transcript) and transcript[ci + 1] not in (' ', '\n'):
                        word_count += 1

            end_offset = min(start_offset + len(chunk_text), len(transcript))

            # Extract timestamp metadata from chunk if available
            timestamps = re.findall(r'\[(\d{2}:\d{2}(?::\d{2})?)\]', chunk_text)
            metadata = {}
            if timestamps:
                metadata["first_timestamp"] = timestamps[0]
                metadata["last_timestamp"] = timestamps[-1]

            chunks.append({
                "content": chunk_text,
                "chunk_index": chunk_index,
                "start_offset": start_offset,
                "end_offset": end_offset,
                "metadata": metadata,
            })

            chunk_index += 1
            # Advance by (chunk_size - overlap) to create overlapping windows
            step = max(1, chunk_size - chunk_overlap)
            i += step

        logger.info(
            "transcript_chunked",
            total_words=len(words),
            chunk_count=len(chunks),
            chunk_size=chunk_size,
            overlap=chunk_overlap,
        )
        return chunks

    def generate_chunk_embeddings(
        self,
        chunks: List[Dict[str, Any]],
        batch_size: int = 16,
    ) -> List[Dict[str, Any]]:
        """Batch-generate embeddings for transcript chunks.
        
        Processes chunks in batches to respect API rate limits.
        Mutates each chunk dict in-place by adding an 'embedding' key.
        Returns the chunks list with embeddings attached.
        """
        logger.info("chunk_embedding_started", count=len(chunks))

        for batch_start in range(0, len(chunks), batch_size):
            batch = chunks[batch_start : batch_start + batch_size]
            texts = [c["content"] for c in batch]

            # Replace empty strings with fallback
            texts = [t if t.strip() else "No content." for t in texts]

            result = self._client.embeddings.create(
                input=texts,
                model=self._embedding_deployment,
            )

            for j, embedding_data in enumerate(result.data):
                chunks[batch_start + j]["embedding"] = embedding_data.embedding

            logger.debug(
                "chunk_embedding_batch_done",
                batch_start=batch_start,
                batch_size=len(batch),
            )

        logger.info("chunk_embedding_completed", count=len(chunks))
        return chunks
