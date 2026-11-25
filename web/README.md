# 🎙️ Podcasts App v2 — Web

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![Azure Storage](https://img.shields.io/badge/Azure_Blob_Storage-0089D6?style=for-the-badge&logo=microsoft-azure)](https://azure.microsoft.com/en-us/products/storage/blobs/)

> Full-stack podcast streaming, Creator Studio, and RAG-powered AI discovery platform built with the Next.js App Router, Tailwind CSS v4, Drizzle ORM, pgvector, and the Taddy Podcast API.

## 📖 Overview

`web` serves both the listener experience (discovering and playing podcasts via the Taddy GraphQL API and creator-published episodes) and the Creator Studio (recording/uploading audio, tracking background processing jobs, and publishing episodes). It also exposes RAG endpoints backed by PostgreSQL `pgvector`, Redis, and Azure OpenAI for semantic search and conversational Q&A over episode transcripts.

## ✨ Key Features

- **Taddy API Integration:** Proxies Taddy GraphQL requests through Next.js Route Handlers to protect API keys and cache responses with `@tanstack/react-query`.
- **Global Audio Player:** Persistent HTML5 audio player wrapped at the root layout level (`GlobalPlayerWrapper`) for uninterrupted playback across route transitions, with playback speed, queue, and progress tracking.
- **Authentication:** Powered by `better-auth` with email/password and OAuth (Google, GitHub) support.
- **User Library & Social:** Profile management, channel follows, episode likes, and listening progress history.
- **Creator Studio:**
  - Create and manage custom podcasts and episodes.
  - Direct-to-cloud uploads to Azure Blob Storage using short-lived SAS URLs.
  - Native in-browser audio recording via the MediaRecorder API.
  - Real-time job pipeline stepper tracking `media-worker` and `ai-worker` stages.
- **Semantic Search (`GET /api/rag/search`):** Embeds user queries and runs cosine similarity search (`<=>`) against `EpisodeChunk` embeddings in `pgvector`.
- **Streaming AI Chat (`POST /api/rag/chat`):** Retrieves relevant transcript chunks, streams grounded answers from Azure OpenAI with `[SOURCES]` timestamped citation metadata, persists conversations, and enforces Redis-backed rate limiting and embedding caching.

## 🛠️ Tech Stack

| Category | Technologies |
| --- | --- |
| **Framework** | Next.js 16 (App Router), React 19 |
| **Language** | TypeScript |
| **Styling & UI** | Tailwind CSS v4, Framer Motion, Lucide React, Sonner |
| **Database & Vector Search** | PostgreSQL, `pgvector`, Drizzle ORM |
| **Queue & Cache** | Redis (`ioredis`), BullMQ |
| **AI / RAG** | Azure OpenAI (`openai` SDK) |
| **Authentication** | Better Auth |
| **Data Fetching & Forms** | TanStack React Query, React Hook Form, Zod |
| **Cloud Storage** | Azure Blob Storage (`@azure/storage-blob`), `@podcasts/shared` |

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.17.0 or newer) and npm
- PostgreSQL with the `pgvector` extension enabled
- Redis (for BullMQ job queues, RAG embedding cache, and rate limiting)
- Built `@podcasts/shared` package (`cd ../shared && npm install && npm run build`)

### Installation

1. **Install dependencies:**
   ```bash
   cd web
   npm install
   ```

2. **Configure Environment Variables:**
   Create `web/.env` (or `web/.env.local` for local Next.js runs) with the required variables validated in `lib/env.ts` and `lib/rag/openai.ts`:

   | Variable | Required | Description |
   | --- | --- | --- |
   | `DATABASE_URL` | Yes | PostgreSQL connection string. |
   | `DATABASE_CA_CERT` | No | Optional CA certificate for PostgreSQL SSL. |
   | `REDIS_HOST` | No | Redis host (default: `127.0.0.1`). |
   | `REDIS_PORT` | No | Redis port (default: `6379`). |
   | `REDIS_PASSWORD` | No | Redis password, if required. |
   | `BETTER_AUTH_SECRET` | Yes | Secret used to sign auth tokens. |
   | `BETTER_AUTH_URL` | No | Base URL for Better Auth. |
   | `NEXT_PUBLIC_APP_URL` | Yes | Public base URL of the web app (e.g., `http://localhost:3000`). |
   | `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID. |
   | `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret. |
   | `GITHUB_CLIENT_ID` | Yes | GitHub OAuth client ID. |
   | `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth client secret. |
   | `TADDY_USER_ID` | Yes | Taddy GraphQL API user ID. |
   | `TADDY_API_KEY` | Yes | Taddy GraphQL API key. |
   | `AZURE_STORAGE_ACCOUNT_NAME` | Yes | Azure Blob Storage account name. |
   | `AZURE_STORAGE_ACCOUNT_KEY` | Yes | Azure Blob Storage account key. |
   | `AZURE_STORAGE_CONTAINER_NAME` | No | Azure Blob Storage container name (default: `podcasts`). |
   | `AZURE_OPENAI_API_KEY` | Yes (RAG) | Azure OpenAI API key used by `/api/rag/*`. |
   | `AZURE_OPENAI_ENDPOINT` | Yes (RAG) | Azure OpenAI base endpoint URL. |
   | `EMBEDDING_DEPLOYMENT_NAME` | No | Embedding deployment name (default: `text-embedding-3-small`). |
   | `LLM_DEPLOYMENT_NAME` | No | Chat/LLM deployment name (default: `gpt-5.4-nano`). |

3. **Enable `pgvector` and Push the Database Schema:**
   ```bash
   psql "$DATABASE_URL" -f scripts/enable-pgvector.sql
   npm run db:push
   ```
   *Tip: Inspect your database visually with `npm run db:studio`.*

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

   Other available scripts:
   - `npm run dev:turbo` — Run Next.js dev server with Turbopack
   - `npm run build` — Production build (`next build --webpack`)
   - `npm run start` — Start production server
   - `npm run lint` — Run ESLint

## 📂 Project Structure

```text
web/
├── app/                  # Next.js App Router pages and API routes (auth, episodes, podcasts, studio, rag)
├── components/           # UI components (ai-chat, auth, player, profile, studio, semantic search)
├── drizzle/              # Drizzle ORM migrations and snapshots
├── hooks/                # Custom React hooks (useAuth, usePodcasts, useAudioRecorder, uploads)
├── lib/                  # Core utilities (auth, db/schema, env, queue, rag, storage, taddy, validations)
├── public/               # Static assets and placeholder artwork
├── scripts/              # Helper scripts (enable-pgvector.sql, generate-placeholders.sh)
├── services/             # Server/client service helpers (episode, podcast, social)
└── types/                # TypeScript type definitions
```

## 📄 License

This project is proprietary and confidential.
