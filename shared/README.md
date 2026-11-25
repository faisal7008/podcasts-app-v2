# Shared (`@podcasts/shared`)

A shared TypeScript library containing common queue definitions, validation schemas, and Azure Blob Storage utilities used across `web` and `media-worker`.

## Exports

Defined in `src/index.ts`:

- **`queue.ts`**:
  - `QueueNames`: Canonical BullMQ queue names (`MEDIA_PIPELINE: "media-pipeline"`, `AI_PIPELINE: "ai-pipeline"`).
  - `MediaJobPayloadSchema` / `MediaJobPayload`: Zod schema and TypeScript type for `media-pipeline` job payloads.
  - `AiJobPayloadSchema` / `AiJobPayload`: Zod schema and TypeScript type for `ai-pipeline` job payloads.
- **`storage-paths.ts`**:
  - `StoragePaths`: Deterministic Azure Blob Storage path builders shared across services.
- **`storage-provider.ts`**:
  - `StorageProvider`: Storage abstraction interface.
- **`storage-service.ts`**:
  - `AzureStorageService`: Azure Blob Storage client wrapper and SAS URL helpers (`@azure/storage-blob`).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the package:
   ```bash
   npm run build
   ```

The TypeScript compiler (`tsc`) outputs CommonJS modules and `.d.ts` declaration files to `dist/`. Rebuild this package whenever its source changes so `web` and `media-worker` pick up the updated types and build artifacts.
