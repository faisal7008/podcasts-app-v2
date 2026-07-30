# AI Worker

The AI Worker is a BullMQ-based background service written in Python that processes podcast audio.

## Features

Consumes jobs from the `podcast-ai-processing` queue and performs the following pipeline:
1. **Audio Transcription**: Uses OpenAI's Whisper model to transcribe processed audio.
2. **Metadata Generation**: Uses GPT-4o to generate AI summaries, chapters, show notes, and tags based on the transcription.
3. **Embeddings Generation**: Chunks the transcript and generates embeddings for Retrieval-Augmented Generation (RAG).
4. **Database Updates**: Stores the transcription, metadata, and embeddings in the Postgres database.

## Tech Stack

- Python 3
- [BullMQ](https://docs.bullmq.io/) (via Python port)
- [structlog](https://www.structlog.org/) for structured logging
- [Pydantic](https://docs.pydantic.dev/) for configuration validation

## Setup

1. Create a `.env` file based on the required settings (see `config.py`).
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

Note: It's recommended to run this worker as part of the overall `docker-compose` stack.
