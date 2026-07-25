"""
Centralized configuration for ai-worker.
Uses pydantic-settings for validation and type safety.
Fails fast on missing required config.
"""

import os
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Redis
    redis_host: str = Field(default="localhost", alias="REDIS_HOST")
    redis_port: int = Field(default=6379, alias="REDIS_PORT")
    redis_password: str = Field(default="", alias="REDIS_PASSWORD")

    # Database
    database_url: str = Field(..., alias="DATABASE_URL")

    # Azure Storage
    azure_storage_connection_string: str = Field(..., alias="AZURE_STORAGE_CONNECTION_STRING")
    azure_storage_container_name: str = Field(default="podcasts", alias="AZURE_STORAGE_CONTAINER_NAME")

    # Azure Speech (Cognitive Services)
    azure_speech_endpoint: str = Field(default="https://podcasts-ai-foundry.cognitiveservices.azure.com/", alias="AZURE_SPEECH_ENDPOINT")
    azure_speech_key: str = Field(default="", alias="AZURE_SPEECH_KEY")

    # Azure OpenAI
    azure_openai_api_key: str = Field(..., alias="AZURE_OPENAI_API_KEY")
    azure_openai_endpoint: str = Field(..., alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_api_version: str = Field(default="2024-02-01", alias="AZURE_OPENAI_API_VERSION")

    # Model Deployments
    whisper_deployment_name: str = Field(default="whisper", alias="WHISPER_DEPLOYMENT_NAME")
    llm_deployment_name: str = Field(default="gpt-4o", alias="LLM_DEPLOYMENT_NAME")
    embedding_deployment_name: str = Field(default="text-embedding-3-small", alias="EMBEDDING_DEPLOYMENT_NAME")

    # Worker Settings
    worker_concurrency: int = Field(default=3, alias="WORKER_CONCURRENCY")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        populate_by_name = True


def load_settings() -> Settings:
    """Load and validate settings. Fails fast with clear error messages."""
    try:
        return Settings()
    except Exception as e:
        raise SystemExit(f"Configuration error: {e}") from e
