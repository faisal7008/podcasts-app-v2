-- Create GIN full-text search index on EpisodeChunk.content for hybrid RAG search
-- Run once against PostgreSQL:
--   psql "$DATABASE_URL" -f scripts/add-fts-index.sql

CREATE INDEX IF NOT EXISTS "EpisodeChunk_content_fts_idx"
  ON "EpisodeChunk"
  USING gin (to_tsvector('english', content));
