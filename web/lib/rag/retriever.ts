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
  /** Scope to a specific user's content */
  userId?: string;
  /** Max results to return */
  topK?: number;
  /** Minimum similarity score (0-1) */
  minScore?: number;
}

/**
 * Embed a text query using the same model used for chunk embeddings.
 */
export async function embedQuery(query: string): Promise<number[]> {
  const client = getOpenAIClient();

  const result = await client.embeddings.create({
    input: [query],
    model: RAG_CONFIG.embeddingModel,
  });

  return result.data[0].embedding;
}

/**
 * Semantic search: embed the query and find the most similar transcript chunks.
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
  } = options;

  // 1. Embed the query
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
  if (userId) {
    conditions.push(sql`e."userId" = ${userId}`);
  }

  const whereClause =
    conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

  // 3. Run cosine similarity search using pgvector
  // The <=> operator returns cosine distance (0 = identical, 2 = opposite).
  // We convert to similarity: 1 - distance.
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

  // 4. Filter by minimum score and map to typed results
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
