/**
 * RAG Retriever — Semantic search over episode transcript chunks.
 *
 * Uses pgvector's cosine distance operator (`<=>`) against the EpisodeChunk
 * table's HNSW index for fast approximate nearest neighbor search.
 *
 * Supports:
 *   - Pure vector search (cosine similarity)
 *   - Episode-scoped or library-wide search
 *   - Filtering by podcastId, tags, date range
 */

import { db } from "@/lib/db";
import { episodeChunk, episode, podcast } from "@/lib/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { getOpenAIClient, RAG_CONFIG } from "./openai";
import { getCachedEmbedding, setCachedEmbedding } from "./cache";
import { storageService } from "@/lib/storage";

export interface RetrievedChunk {
  id: string;
  episodeId: string;
  episodeTitle: string;
  podcastTitle: string;
  artwork: string;
  chunkIndex: number;
  content: string;
  score: number;
  startOffset: number;
  endOffset: number;
  metadata: Record<string, unknown> | null;
}

export interface RetrieveOptions {
  /** Scope to a specific episode */
  episodeId?: string;
  /** Scope to a specific podcast */
  podcastId?: string;
  /** Scope to a specific user's content (includes published episodes + user's own) */
  userId?: string;
  /** Max results to return */
  topK?: number;
  /** Minimum similarity score (0-1) */
  minScore?: number;
  /** Retrieval strategy: hybrid (vector + tsvector RRF) or pure vector */
  mode?: "hybrid" | "vector";
}

/**
 * Pure Reciprocal Rank Fusion (RRF) helper.
 * Fuses two ranked lists of IDs using 1 / (k + rank).
 */
export function computeRrfFusion(
  vectorIds: string[],
  ftsIds: string[],
  k: number = 60
): { id: string; rrfScore: number }[] {
  const scores = new Map<string, number>();

  vectorIds.forEach((id, index) => {
    scores.set(id, (scores.get(id) ?? 0) + 1 / (k + index + 1));
  });

  ftsIds.forEach((id, index) => {
    scores.set(id, (scores.get(id) ?? 0) + 1 / (k + index + 1));
  });

  return Array.from(scores.entries())
    .map(([id, rrfScore]) => ({ id, rrfScore }))
    .sort((a, b) => b.rrfScore - a.rrfScore);
}

/**
 * Embed a text query using the same model used for chunk embeddings.
 * Checks Redis cache first to avoid redundant embedding API calls.
 */
export async function embedQuery(query: string): Promise<number[]> {
  const cached = await getCachedEmbedding(query);
  if (cached) {
    return cached;
  }

  const client = getOpenAIClient();

  const result = await client.embeddings.create({
    input: [query],
    model: RAG_CONFIG.embeddingModel,
  });

  const embedding = result.data[0].embedding;
  await setCachedEmbedding(query, embedding);
  return embedding;
}

/**
 * Hybrid semantic + full-text search over episode transcript chunks.
 * Uses pgvector HNSW cosine similarity + PostgreSQL tsvector BM25-style ranking
 * fused via Reciprocal Rank Fusion (RRF, k=60).
 */
export async function semanticSearch(
  query: string,
  options: RetrieveOptions = {}
): Promise<RetrievedChunk[]> {
  const {
    episodeId,
    podcastId,
    userId,
    topK = RAG_CONFIG.topK,
    minScore = RAG_CONFIG.minScore,
    mode = "hybrid",
  } = options;

  // 1. Embed the query (uses Redis cache)
  const queryEmbedding = await embedQuery(query);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // 2. Build the WHERE clauses
  const conditions: ReturnType<typeof sql>[] = [];

  if (episodeId) {
    conditions.push(sql`ec."episodeId" = ${episodeId}`);
  }
  if (podcastId) {
    conditions.push(sql`e."podcastId" = ${podcastId}`);
  }
  // Allow searching all published episodes, plus private/draft episodes owned by userId
  if (userId) {
    conditions.push(sql`(e.status = 'published' OR e."userId" = ${userId})`);
  } else {
    conditions.push(sql`e.status = 'published'`);
  }

  const whereClause =
    conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

  if (mode === "vector") {
    const results = await db.execute<{
      id: string;
      episode_id: string;
      episode_title: string;
      podcast_title: string;
      artwork: string;
      chunk_index: number;
      content: string;
      score: number;
      start_offset: number;
      end_offset: number;
      metadata: Record<string, unknown> | null;
    }>(sql`
      SELECT
        ec.id,
        ec."episodeId" AS episode_id,
        e.title AS episode_title,
        COALESCE(p.title, '') AS podcast_title,
        COALESCE(e.artwork, p.artwork, '') AS artwork,
        ec."chunkIndex" AS chunk_index,
        ec.content,
        1 - (ec.embedding <=> ${embeddingStr}::vector) AS score,
        ec."startOffset" AS start_offset,
        ec."endOffset" AS end_offset,
        ec.metadata
      FROM "EpisodeChunk" ec
      JOIN "Episode" e ON ec."episodeId" = e.id
      LEFT JOIN "Podcast" p ON e."podcastId" = p.id
      ${whereClause}
      ORDER BY ec.embedding <=> ${embeddingStr}::vector ASC
      LIMIT ${topK}
    `);

    return (results.rows as any[])
      .filter((r) => r.score >= minScore)
      .map((r) => ({
        id: r.id,
        episodeId: r.episode_id,
        episodeTitle: r.episode_title,
        podcastTitle: r.podcast_title,
        artwork: r.artwork ? storageService.generateReadUrl(r.artwork) : "",
        chunkIndex: r.chunk_index,
        content: r.content,
        score: r.score,
        startOffset: r.start_offset,
        endOffset: r.end_offset,
        metadata: r.metadata,
      }));
  }

  // 3. Hybrid Search: Dense Vector + PostgreSQL Full-Text Search (tsvector) + RRF (k=60)
  const candidateLimit = Math.max(topK * 3, 24);
  const ftsFilter = conditions.length > 0 ? sql`AND ${sql.join(conditions, sql` AND `)}` : sql``;

  const results = await db.execute<{
    id: string;
    episode_id: string;
    episode_title: string;
    podcast_title: string;
    artwork: string;
    chunk_index: number;
    content: string;
    score: number;
    rrf_score: number;
    start_offset: number;
    end_offset: number;
    metadata: Record<string, unknown> | null;
  }>(sql`
    WITH vec_candidates AS (
      SELECT
        ec.id,
        1 - (ec.embedding <=> ${embeddingStr}::vector) AS vec_score,
        ROW_NUMBER() OVER (ORDER BY ec.embedding <=> ${embeddingStr}::vector ASC) AS vec_rank
      FROM "EpisodeChunk" ec
      JOIN "Episode" e ON ec."episodeId" = e.id
      ${whereClause}
      ORDER BY ec.embedding <=> ${embeddingStr}::vector ASC
      LIMIT ${candidateLimit}
    ),
    fts_candidates AS (
      SELECT
        ec.id,
        ts_rank_cd(to_tsvector('english', ec.content), websearch_to_tsquery('english', ${query})) AS fts_score,
        ROW_NUMBER() OVER (
          ORDER BY ts_rank_cd(to_tsvector('english', ec.content), websearch_to_tsquery('english', ${query})) DESC
        ) AS fts_rank
      FROM "EpisodeChunk" ec
      JOIN "Episode" e ON ec."episodeId" = e.id
      WHERE to_tsvector('english', ec.content) @@ websearch_to_tsquery('english', ${query})
      ${ftsFilter}
      LIMIT ${candidateLimit}
    ),
    fused AS (
      SELECT
        COALESCE(v.id, f.id) AS id,
        COALESCE(v.vec_score, 1 - (ec.embedding <=> ${embeddingStr}::vector)) AS score,
        (COALESCE(1.0 / (60 + v.vec_rank), 0) + COALESCE(1.0 / (60 + f.fts_rank), 0)) AS rrf_score
      FROM vec_candidates v
      FULL OUTER JOIN fts_candidates f ON v.id = f.id
      JOIN "EpisodeChunk" ec ON ec.id = COALESCE(v.id, f.id)
    )
    SELECT
      ec.id,
      ec."episodeId" AS episode_id,
      e.title AS episode_title,
      COALESCE(p.title, '') AS podcast_title,
      COALESCE(e.artwork, p.artwork, '') AS artwork,
      ec."chunkIndex" AS chunk_index,
      ec.content,
      fused.score,
      fused.rrf_score,
      ec."startOffset" AS start_offset,
      ec."endOffset" AS end_offset,
      ec.metadata
    FROM fused
    JOIN "EpisodeChunk" ec ON fused.id = ec.id
    JOIN "Episode" e ON ec."episodeId" = e.id
    LEFT JOIN "Podcast" p ON e."podcastId" = p.id
    WHERE fused.score >= ${minScore * 0.65}
    ORDER BY fused.rrf_score DESC
    LIMIT ${topK}
  `);

  return (results.rows as any[]).map((r) => ({
    id: r.id,
    episodeId: r.episode_id,
    episodeTitle: r.episode_title,
    podcastTitle: r.podcast_title,
    artwork: r.artwork ? storageService.generateReadUrl(r.artwork) : "",
    chunkIndex: r.chunk_index,
    content: r.content,
    score: Number(r.score),
    startOffset: r.start_offset,
    endOffset: r.end_offset,
    metadata: r.metadata,
  }));
}
