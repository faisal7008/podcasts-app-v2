# Podcasts App v2

A modern, full-stack podcast processing and listening application.

## Architecture

This project is a microservices-based application containing the following components:

- **web**: A Next.js front-end and API for the application.
- **media-worker**: A Node.js/TypeScript worker using BullMQ and FFmpeg to process media files.
- **ai-worker**: A Python worker using BullMQ to transcribe audio (Whisper), generate metadata (GPT-4o), and create embeddings for RAG.
- **shared**: Shared TypeScript library and types.

## Prerequisites

- Docker and Docker Compose
- Node.js & npm (for local development)
- Python 3.x (for local development of the ai-worker)
- Redis (runs via Docker)

## Getting Started

You can run the entire stack using Docker Compose:

```bash
docker-compose up -d
```

This will start Redis, the Web app, the Media Worker, and the AI Worker.

### Environment Variables

Ensure you have `.env` files created in the respective directories (`web/.env`, `ai-worker/.env`, `media-worker/.env`) with the required configurations before running the stack.

## License

This project is proprietary and confidential.
