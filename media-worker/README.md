# Media Worker

The Media Worker is a BullMQ-based background service written in TypeScript that handles the audio processing phase of the podcast pipeline.

## Features

Consumes jobs from a Redis queue to:
- Download raw media files from Azure Storage.
- Process and normalize audio using FFmpeg.
- Upload processed audio back to storage for further AI processing.
- Update job progress and status in the Postgres database.

## Tech Stack

- Node.js & TypeScript
- [BullMQ](https://docs.bullmq.io/) for queue management
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) for audio processing
- [Drizzle ORM](https://orm.drizzle.team/) for database interactions
- Azure Storage Blob

## Setup

1. Create a `.env` file by copying `.env.example`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the worker in development mode:
   ```bash
   npm run dev
   ```

Note: It's recommended to run this worker as part of the overall `docker-compose` stack.
