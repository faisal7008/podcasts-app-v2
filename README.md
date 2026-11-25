# Podcasts App v2

A full-stack podcast listening, creator studio, and RAG-powered AI discovery platform.

## Architecture

This repository is organized as a multi-service workspace:

| Service | Stack | Purpose | Documentation |
| --- | --- | --- | --- |
| **web** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Drizzle ORM | Listener web app, Creator Studio, auth, API routes, and RAG search/chat | [web/README.md](./web/README.md) |
| **media-worker** | Node.js, TypeScript, BullMQ, FFmpeg, Drizzle ORM | Consumes `media-pipeline` jobs, normalizes audio with FFmpeg, and enqueues AI jobs | [media-worker/README.md](./media-worker/README.md) |
| **ai-worker** | Python 3, BullMQ, Azure Speech, Azure OpenAI, psycopg | Consumes `ai-pipeline` jobs, transcribes audio, generates metadata, and stores pgvector embeddings | [ai-worker/README.md](./ai-worker/README.md) |
| **shared** | TypeScript, Zod, `@azure/storage-blob` | Shared queue names, Zod job payload schemas, and Azure Blob Storage path/service utilities | [shared/README.md](./shared/README.md) |

### Processing & RAG Pipeline

```text
Creator Upload (web)
  └─▶ Azure Blob Storage (raw audio)
        └─▶ Redis Queue: media-pipeline
              └─▶ media-worker (FFmpeg normalize/transcode)
                    └─▶ Redis Queue: ai-pipeline
                          └─▶ ai-worker
                                ├─ Azure Speech REST API (diarized transcription + timestamps)
                                ├─ Azure OpenAI LLM (summary, chapters, show notes, tags)
                                └─ Azure OpenAI Embeddings -> PostgreSQL (pgvector EpisodeChunk)
                                      └─▶ web (/api/rag/search & /api/rag/chat)
```

## Prerequisites

- **Docker & Docker Compose** (to run the full stack via `docker-compose.yml`)
- **PostgreSQL** with the **`pgvector`** extension enabled (see `web/scripts/enable-pgvector.sql`)
- **Redis** (included in `docker-compose.yml` on port `6379`)
- **Node.js** (v18.17+ / v20+) and **npm** (for local `shared`, `web`, and `media-worker` development)
- **Python 3.x** (for local `ai-worker` development)
- **Cloud & API credentials**:
  - Azure Blob Storage
  - Azure OpenAI (chat/metadata + `text-embedding-3-small` deployments)
  - Azure Cognitive Services Speech (transcription)
  - Taddy GraphQL API (external podcast catalog)
  - Google / GitHub OAuth (for Better Auth social sign-in)

## Getting Started

### 1. Configure Environment Variables

Create `.env` files in each service directory before starting the stack:

- `web/.env` (see [web/README.md](./web/README.md))
- `media-worker/.env` (see [media-worker/README.md](./media-worker/README.md))
- `ai-worker/.env` (see [ai-worker/README.md](./ai-worker/README.md))

### 2. Initialize PostgreSQL & pgvector

Ensure `pgvector` is enabled on your PostgreSQL database and push the Drizzle schema:

```bash
psql "$DATABASE_URL" -f web/scripts/enable-pgvector.sql
cd web && npm install && npm run db:push
```

### 3. Run with Docker Compose

From the repository root:

```bash
docker-compose up -d
```

This starts `redis`, `web` (port `3000`), `media-worker`, and `ai-worker`.

### Local Development

If running services individually outside Docker:

1. Build `@podcasts/shared` first:
   ```bash
   cd shared && npm install && npm run build
   ```
2. Start Redis (e.g., `docker-compose up -d redis`).
3. Start `web`, `media-worker`, and `ai-worker` following their respective READMEs.

## License

This project is proprietary and confidential.
