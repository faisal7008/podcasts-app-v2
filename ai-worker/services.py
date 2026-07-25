"""
Service layer for ai-worker.
All external service clients are initialized once and reused across jobs.
"""

import json
import tempfile
import os
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
import subprocess
import time

import azure.cognitiveservices.speech as speechsdk
import structlog
from azure.storage.blob import BlobServiceClient
from openai import AzureOpenAI
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

    def download_blob(self, blob_url: str, dest_path: str):
        """Download a blob from Azure Storage to a local file."""
        try:
            path = urlparse(blob_url).path
            blob_name = path.split(f"/{self._container_name}/")[-1]
        except Exception:
            blob_name = blob_url.split("/")[-1]

        blob_client = self._blob_service_client.get_blob_client(
            container=self._container_name, blob=blob_name
        )
        with open(dest_path, "wb") as f:
            f.write(blob_client.download_blob().readall())

        logger.info("blob_downloaded", blob_name=blob_name, dest=dest_path)


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
        self._client = AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint,
        )
        self._speech_config = speechsdk.SpeechConfig(
            subscription=speech_key,
            endpoint=speech_endpoint
        )
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
        """Transcribe audio using Azure Cognitive Services Speech."""
        logger.info("transcription_started", audio_path=audio_path)
        
        # Convert audio to wav format expected by Speech SDK (16kHz, 16-bit PCM, mono)
        wav_path = audio_path + ".wav"
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-i", audio_path, "-ar", "16000", "-ac", "1", wav_path],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            
            audio_config = speechsdk.audio.AudioConfig(filename=wav_path)
            speech_recognizer = speechsdk.SpeechRecognizer(
                speech_config=self._speech_config, 
                audio_config=audio_config
            )

            done = False
            error_msg = None
            full_text = []

            def recognized_handler(evt):
                if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
                    full_text.append(evt.result.text)

            def canceled_cb(evt):
                nonlocal done, error_msg
                if evt.result.reason == speechsdk.ResultReason.Canceled:
                    cancellation_details = evt.cancellation_details
                    if cancellation_details.reason == speechsdk.CancellationReason.Error:
                        logger.error("speech_recognition_error", error=cancellation_details.error_details)
                        error_msg = cancellation_details.error_details
                done = True

            def stop_cb(evt):
                nonlocal done
                done = True

            speech_recognizer.recognized.connect(recognized_handler)
            speech_recognizer.session_stopped.connect(stop_cb)
            speech_recognizer.canceled.connect(canceled_cb)

            speech_recognizer.start_continuous_recognition()
            while not done:
                time.sleep(0.5)
                
            speech_recognizer.stop_continuous_recognition()
            
            if error_msg:
                raise Exception(f"Speech SDK Error: {error_msg}")
            
            result = " ".join(full_text)
            logger.info("transcription_completed", length=len(result))
            return result
        finally:
            if os.path.exists(wav_path):
                os.remove(wav_path)

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

        completion = self._client.chat.completions.create(
            model=self._llm_deployment,
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional podcast editor and summarizer. Output strictly valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )

        metadata = json.loads(completion.choices[0].message.content)
        logger.info("metadata_generation_completed", keys=list(metadata.keys()))
        return metadata

    def generate_embedding(self, text: str) -> List[float]:
        """Generate an embedding vector for the given text."""
        logger.info("embedding_generation_started")
        result = self._client.embeddings.create(
            input=[text],
            model=self._embedding_deployment,
        )
        vector = result.data[0].embedding
        logger.info("embedding_generation_completed", dimensions=len(vector))
        return vector
