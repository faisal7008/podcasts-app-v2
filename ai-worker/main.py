"""
ai-worker — BullMQ-based podcast AI processing worker.

Consumes jobs from the 'podcast-ai-processing' queue and performs:
1. Audio transcription (Whisper)
2. Metadata generation (GPT-4o)
3. Embedding generation
4. Database update

Uses structlog for structured logging, pydantic for config validation,
and psycopg_pool for connection pooling.
"""

import asyncio
import signal
import tempfile
import shutil
import os
from typing import Any, Dict

import structlog
from bullmq import Worker
from dotenv import load_dotenv

load_dotenv(override=True)

from config import load_settings, Settings
from services import DatabaseService, StorageService, AIService
from storage_paths import StoragePaths

# --- Structured logging setup ---
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(0),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger("ai-worker")

# --- Globals (initialized in main) ---
settings: Settings = None  # type: ignore
db_service: DatabaseService = None  # type: ignore
storage_service: StorageService = None  # type: ignore
ai_service: AIService = None  # type: ignore


def validate_job_data(data: Dict[str, Any]) -> Dict[str, str]:
    """Validate incoming job payload. Raises ValueError on invalid data."""
    required_fields = ["jobId", "episodeId"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    return {
        "job_id": data["jobId"],
        "episode_id": data["episodeId"],
        "user_id": data.get("userId", "unknown"),
    }


async def process_ai_job(job, token):
    """Process a single AI job from the BullMQ queue."""
    job_data = job.data

    try:
        validated = validate_job_data(job_data)
    except ValueError as e:
        logger.error("job_validation_failed", error=str(e), raw_data=job_data)
        raise

    job_id = validated["job_id"]
    episode_id = validated["episode_id"]

    # Derive blob path from episodeId using StoragePaths
    processed_blob_path = StoragePaths.processed_audio(episode_id)

    log = logger.bind(job_id=job_id, episode_id=episode_id)
    log.info("job_started")

    temp_dir = tempfile.mkdtemp(prefix="ai-worker-")

    try:
        # Update progress: AI processing started
        db_service.update_job_progress(job_id, 75, "processing_ai")
        await job.updateProgress(75)

        # 1. Download processed audio using blob path (not URL)
        log.info("downloading_audio", blob_path=processed_blob_path)
        audio_path = os.path.join(temp_dir, "audio.m4a")
        await asyncio.to_thread(storage_service.download_blob, processed_blob_path, audio_path)

        # 2. Transcribe with Whisper
        log.info("transcribing_audio")
        db_service.update_job_progress(job_id, 80, "transcribing")
        transcript_text = await asyncio.to_thread(ai_service.transcribe, audio_path)
        await job.updateProgress(85)

        # 3 & 4. Generate metadata and embeddings in parallel
        log.info("generating_metadata_and_embeddings")
        db_service.update_job_progress(job_id, 85, "generating_ai_content")
        
        metadata_task = asyncio.to_thread(ai_service.generate_metadata, transcript_text)
        embedding_task = asyncio.to_thread(ai_service.generate_embedding, transcript_text[:15000])
        
        metadata, _ = await asyncio.gather(metadata_task, embedding_task)
        await job.updateProgress(96)

        # 5. Save to database
        log.info("saving_results")
        db_service.save_episode_ai_results(
            episode_id=episode_id,
            job_id=job_id,
            transcript=transcript_text,
            ai_summary=metadata.get("aiSummary"),
            chapters=metadata.get("chapters", []),
            show_notes=metadata.get("showNotes"),
            tags=metadata.get("tags", []),
            recommendations=metadata.get("recommendations"),
        )

        await job.updateProgress(100)
        log.info("job_completed")

    except Exception as e:
        log.error("job_failed", error=str(e))
        db_service.update_job_failed(job_id, str(e))
        db_service.update_episode_failed(episode_id)
        raise

    finally:
        # Always clean up temp files
        shutil.rmtree(temp_dir, ignore_errors=True)
        log.debug("temp_dir_cleaned", path=temp_dir)


async def main():
    """Initialize services and start the BullMQ worker."""
    global settings, db_service, storage_service, ai_service

    logger.info("ai_worker_starting")

    # Load and validate configuration (fails fast on missing vars)
    settings = load_settings()
    logger.info(
        "config_loaded",
        redis_host=settings.redis_host,
        redis_port=settings.redis_port,
        openai_endpoint=settings.azure_openai_endpoint,
        whisper_model=settings.whisper_deployment_name,
        llm_model=settings.llm_deployment_name,
        embedding_model=settings.embedding_deployment_name,
        concurrency=settings.worker_concurrency,
    )

    # Initialize singleton services
    db_service = DatabaseService(settings.database_url)
    storage_service = StorageService(
        settings.azure_storage_connection_string,
        settings.azure_storage_container_name,
    )
    ai_service = AIService(
        api_key=settings.azure_openai_api_key,
        endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
        speech_key=settings.azure_speech_key or settings.azure_openai_api_key,
        speech_endpoint=settings.azure_speech_endpoint,
        whisper_deployment=settings.whisper_deployment_name,
        llm_deployment=settings.llm_deployment_name,
        embedding_deployment=settings.embedding_deployment_name,
    )

    # Start BullMQ worker
    worker = Worker(
        "ai-pipeline",
        process_ai_job,
        {
            "connection": f"redis://{':{pwd}@'.format(pwd=settings.redis_password) if settings.redis_password else ''}{settings.redis_host}:{settings.redis_port}",
            "concurrency": settings.worker_concurrency,
        },
    )

    logger.info(
        "worker_listening",
        queue="ai-pipeline",
        concurrency=settings.worker_concurrency,
    )

    # Graceful shutdown
    shutdown_event = asyncio.Event()

    def handle_signal(sig, _frame):
        logger.info("shutdown_signal_received", signal=sig)
        shutdown_event.set()

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    # Block until shutdown signal
    await shutdown_event.wait()

    logger.info("shutting_down")
    await worker.close()
    db_service.close()
    logger.info("shutdown_complete")


if __name__ == "__main__":
    asyncio.run(main())
