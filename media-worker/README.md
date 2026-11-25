# Media Worker

The Media Worker is a BullMQ-based background service written in TypeScript that handles the audio processing phase of the podcast pipeline.

## Features

- Consumes jobs from the **`media-pipeline`** Redis queue (`QueueNames.MEDIA_PIPELINE` from `@podcasts/shared`).
- Downloads raw audio files from Azure Blob Storage using canonical paths (`StoragePaths`).
- Processes and normalizes audio using FFmpeg (`fluent-ffmpeg`).
- Uploads processed audio back to Azure Blob Storage.
- Tracks step-level idempotency (`JobStep` table) and updates job progress/status in PostgreSQL via Drizzle ORM.
- Enqueues follow-up jobs onto the **`ai-pipeline`** queue (`QueueNames.AI_PIPELINE`) with exponential backoff retries.

## Tech Stack

- Node.js & TypeScript
- [BullMQ](https://docs.bullmq.io/) for Redis queue management
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) for audio processing (requires `ffmpeg` binary)
- [Drizzle ORM](https://orm.drizzle.team/) & `pg` for PostgreSQL interactions
- `@azure/storage-blob` & `@podcasts/shared`
- `pino` / `pino-pretty` for structured logging

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `DATABASE_CA_CERT` | No | Optional CA certificate for PostgreSQL SSL in production. |
| `REDIS_HOST` | No | Redis host (default: `127.0.0.1`). |
| `REDIS_PORT` | No | Redis port (default: `6379`). |
| `REDIS_PASSWORD` | No | Redis password, if required. |
| `AZURE_STORAGE_CONNECTION_STRING` | Yes | Azure Blob Storage connection string. |
| `AZURE_STORAGE_CONTAINER_NAME` | No | Azure Blob Storage container name (default: `podcasts`). |
| `WORKER_CONCURRENCY` | No | Number of concurrent BullMQ jobs (default: `3`). |
| `LOG_LEVEL` | No | Pino log level (default: `info`). |

## Setup

1. Ensure `@podcasts/shared` is built (`cd ../shared && npm install && npm run build`) and `ffmpeg` is installed on your system.
2. Create `media-worker/.env` with the required environment variables above.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the worker:
   - Development: `npm run dev`
   - Production build & start: `npm run build && npm start`

Note: It is recommended to run this worker as part of the root `docker-compose.yml` stack.
