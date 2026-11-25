# AI Worker

The AI Worker is a BullMQ-based background service written in Python that transcribes processed podcast audio, generates AI metadata, and builds vector embeddings for RAG.

## Features

Consumes jobs from the **`ai-pipeline`** Redis queue and executes an idempotent, step-tracked pipeline (`JobStep` table in PostgreSQL):

1. **Audio Download**: Downloads processed audio (`.m4a`) from Azure Blob Storage using `StoragePaths`.
2. **Audio Transcription**: Transcribes audio with speaker diarization and phrase timestamps using the Azure Cognitive Services Speech REST API.
3. **Metadata Generation**: Uses Azure OpenAI (`LLM_DEPLOYMENT_NAME`, default `gpt-5.4-nano`) to generate an AI summary, timestamped chapters, show notes, tags, and recommendations.
4. **RAG Embeddings**: Chunks the transcript (`CHUNK_SIZE`, `CHUNK_OVERLAP`), generates vector embeddings in batches (`EMBEDDING_DEPLOYMENT_NAME`, default `text-embedding-3-small`), and stores them in PostgreSQL (`EpisodeChunk` with `pgvector`).
5. **Completion**: Marks the episode as published and updates the job status in PostgreSQL.

## Tech Stack

- Python 3
- [BullMQ](https://docs.bullmq.io/) (Python port)
- [Azure Cognitive Services Speech](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/) & [OpenAI Python SDK](https://github.com/openai/openai-python) (Azure OpenAI)
- `azure-storage-blob`
- `psycopg` & `psycopg-pool` for PostgreSQL connection pooling
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) for configuration validation
- [structlog](https://www.structlog.org/) for structured logging
- `pytest` for unit tests (`tests/`)

## Environment Variables

Validated at startup by `config.py`:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string. |
| `AZURE_STORAGE_CONNECTION_STRING` | Yes | — | Azure Blob Storage connection string. |
| `AZURE_STORAGE_CONTAINER_NAME` | No | `podcasts` | Azure Blob Storage container name. |
| `AZURE_OPENAI_API_KEY` | Yes | — | Azure OpenAI API key. |
| `AZURE_OPENAI_ENDPOINT` | Yes | — | Azure OpenAI endpoint URL. |
| `AZURE_OPENAI_API_VERSION` | No | `2024-02-01` | Azure OpenAI API version. |
| `AZURE_SPEECH_ENDPOINT` | No | `https://podcasts-ai-foundry.cognitiveservices.azure.com/` | Azure Speech endpoint URL. |
| `AZURE_SPEECH_KEY` | No | Falls back to `AZURE_OPENAI_API_KEY` | Azure Speech subscription key. |
| `WHISPER_DEPLOYMENT_NAME` | No | `whisper` | Whisper deployment name. |
| `LLM_DEPLOYMENT_NAME` | No | `gpt-5.4-nano` | LLM deployment name for metadata generation. |
| `EMBEDDING_DEPLOYMENT_NAME` | No | `text-embedding-3-small` | Embedding deployment name for RAG chunks. |
| `REDIS_HOST` | No | `localhost` | Redis host. |
| `REDIS_PORT` | No | `6379` | Redis port. |
| `REDIS_PASSWORD` | No | `""` | Redis password. |
| `WORKER_CONCURRENCY` | No | `3` | Concurrent BullMQ jobs. |
| `CHUNK_SIZE` | No | `500` | Transcript chunk size for RAG embeddings. |
| `CHUNK_OVERLAP` | No | `50` | Overlap between consecutive transcript chunks. |
| `EMBEDDING_BATCH_SIZE` | No | `16` | Batch size for embedding API requests. |

## Setup

1. Create `ai-worker/.env` with the required environment variables above.
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. Run the worker:
   ```bash
   python main.py
   ```
4. Run tests:
   ```bash
   pytest
   ```

Note: It is recommended to run this worker as part of the root `docker-compose.yml` stack.
