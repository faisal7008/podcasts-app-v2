/**
 * RAG Rate Limiter — Per-user rate limiting for chat and search.
 *
 * Uses Redis INCR with TTL for a sliding window approach.
 * Prevents abuse of expensive LLM calls.
 */

import Redis from "ioredis";

const globalForRateLimiter = globalThis as unknown as {
  redisRateLimiter: Redis | undefined;
};

function getRedis(): Redis {
  if (globalForRateLimiter.redisRateLimiter) return globalForRateLimiter.redisRateLimiter;

  const redis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on("error", (err) => {
    console.error("[RAG RateLimiter] Redis error:", err.message);
  });

  if (process.env.NODE_ENV !== "production") globalForRateLimiter.redisRateLimiter = redis;

  return redis;
}

const RATE_LIMIT_PREFIX = "rag:rl:";

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export const RATE_LIMITS = {
  chat: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
  search: { maxRequests: 60, windowSeconds: 60 } as RateLimitConfig,
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Check and consume a rate limit token for the given user + action.
 */
export async function checkRateLimit(
  userId: string,
  action: keyof typeof RATE_LIMITS
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action];
  const key = `${RATE_LIMIT_PREFIX}${action}:${userId}`;

  try {
    const redis = getRedis();

    // Atomic increment + TTL set
    const count = await redis.incr(key);

    if (count === 1) {
      // First request in window — set expiry
      await redis.expire(key, config.windowSeconds);
    }

    const ttl = await redis.ttl(key);

    if (count > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: Math.max(ttl, 0),
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - count,
      resetInSeconds: Math.max(ttl, 0),
    };
  } catch {
    // If Redis is down, allow the request (fail open)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetInSeconds: config.windowSeconds,
    };
  }
}
