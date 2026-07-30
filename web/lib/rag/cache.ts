/**
 * RAG Cache — Redis-based embedding and response caching.
 *
 * Caches query embeddings to avoid re-computing identical queries,
 * which are expensive API calls. Uses the existing Redis instance
 * from docker-compose.
 */

import Redis from "ioredis";

const globalForRedisCache = globalThis as unknown as {
  redisCache: Redis | undefined;
};

function getRedis(): Redis {
  if (globalForRedisCache.redisCache) return globalForRedisCache.redisCache;

  const redis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on("error", (err) => {
    console.error("[RAG Cache] Redis error:", err.message);
  });

  if (process.env.NODE_ENV !== "production") globalForRedisCache.redisCache = redis;

  return redis;
}

const EMBEDDING_TTL = 24 * 60 * 60; // 24 hours
const EMBEDDING_PREFIX = "rag:emb:";

/**
 * Get a cached query embedding.
 * Returns null if not cached.
 */
export async function getCachedEmbedding(
  query: string
): Promise<number[] | null> {
  try {
    const redis = getRedis();
    const key = `${EMBEDDING_PREFIX}${normalizeQuery(query)}`;
    const cached = await redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Cache miss is non-fatal — fall through to compute
  }

  return null;
}

/**
 * Cache a query embedding.
 */
export async function setCachedEmbedding(
  query: string,
  embedding: number[]
): Promise<void> {
  try {
    const redis = getRedis();
    const key = `${EMBEDDING_PREFIX}${normalizeQuery(query)}`;
    await redis.setex(key, EMBEDDING_TTL, JSON.stringify(embedding));
  } catch {
    // Cache write failure is non-fatal
  }
}

/**
 * Normalize a query for cache key consistency.
 * Lowercases, trims, and collapses whitespace.
 */
function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, " ");
}
