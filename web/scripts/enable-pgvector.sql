-- Enable pgvector extension for vector similarity search
-- Run this against your PostgreSQL instance before pushing the schema.
-- Azure Database for PostgreSQL Flexible Server supports pgvector natively.
--
-- Usage:
--   psql $DATABASE_URL -f scripts/enable-pgvector.sql

CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
