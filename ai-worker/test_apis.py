import asyncio
import os
import tempfile
import structlog
from config import load_settings
from services import AIService

logger = structlog.get_logger(__name__)

def test_apis():
    logger.info("loading_settings")
    settings = load_settings()
    
    logger.info("initializing_ai_service")
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
    
    # 1. Test Embeddings API
    logger.info("testing_embedding_api")
    try:
        embedding = ai_service.generate_embedding("This is a test sentence for embeddings.")
        logger.info("embedding_api_success", dimensions=len(embedding))
    except Exception as e:
        logger.error("embedding_api_failed", error=str(e))
        
    # 2. Test LLM Metadata Generation API
    logger.info("testing_llm_metadata_api")
    try:
        transcript_sample = "Welcome to our podcast. Today we are discussing AI and its future."
        metadata = ai_service.generate_metadata(transcript_sample)
        logger.info("llm_metadata_api_success", metadata=metadata)
    except Exception as e:
        logger.error("llm_metadata_api_failed", error=str(e))
        
    # 3. Test Speech-to-Text Transcription API
    # Create a small dummy audio file just to see if the endpoint is reachable (it will likely fail with invalid audio, but tests connectivity)
    # Alternatively, you can point this to a real audio file if you have one.
    logger.info("testing_transcription_api (checking connectivity)")
    try:
        # Create a dummy file that simulates a small audio file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
            dummy_audio_path = f.name
            
        try:
            transcript = ai_service.transcribe(dummy_audio_path)
            logger.info("transcription_api_success", transcript=transcript)
        except Exception as e:
            # Expected to fail if the dummy audio is invalid, but it shouldn't be an auth/404 error
            logger.error("transcription_api_failed (could be due to dummy audio)", error=str(e))
        finally:
            os.remove(dummy_audio_path)
    except Exception as e:
        logger.error("transcription_setup_failed", error=str(e))

if __name__ == "__main__":
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer(),
        ],
    )
    test_apis()
