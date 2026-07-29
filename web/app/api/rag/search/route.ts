/**
 * GET /api/rag/search — Semantic Search Endpoint
 *
 * Performs vector similarity search across episode transcript chunks.
 * Returns ranked results with episode metadata and relevance scores.
 *
 * Query params:
 *   q: string (required) — search query
 *   podcastId?: string — scope to a specific podcast
 *   limit?: number — max results (default 10)
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { semanticSearch } from "@/lib/rag";
import { checkRateLimit } from "@/lib/rag/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate (optional — allows anonymous search with limited results)
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    // 2. Rate limit (only for authenticated users, anonymous is more restricted)
    if (userId) {
      const rateLimit = await checkRateLimit(userId, "search");
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            resetInSeconds: rateLimit.resetInSeconds,
          },
          { status: 429 }
        );
      }
    }

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const podcastId = searchParams.get("podcastId") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required (min 2 characters)" },
        { status: 400 }
      );
    }

    // 4. Run semantic search
    const results = await semanticSearch(query.trim(), {
      podcastId,
      userId,
      topK: limit,
      minScore: 0.25,
    });

    // 5. Group results by episode for a cleaner response
    const episodeMap = new Map<
      string,
      {
        episodeId: string;
        episodeTitle: string;
        podcastTitle: string;
        artwork: string;
        chunks: {
          id: string;
          content: string;
          score: number;
          timestamp: string | null;
          preview: string;
        }[];
      }
    >();

    for (const result of results) {
      if (!episodeMap.has(result.episodeId)) {
        episodeMap.set(result.episodeId, {
          episodeId: result.episodeId,
          episodeTitle: result.episodeTitle,
          podcastTitle: result.podcastTitle,
          artwork: result.artwork,
          chunks: [],
        });
      }

      episodeMap.get(result.episodeId)!.chunks.push({
        id: result.id,
        content: result.content,
        score: result.score,
        timestamp:
          (result.metadata as Record<string, string>)?.first_timestamp || null,
        preview: result.content.slice(0, 200),
      });
    }

    return NextResponse.json({
      query: query.trim(),
      totalResults: results.length,
      episodes: Array.from(episodeMap.values()),
    });
  } catch (error) {
    console.error("[RAG Search] Error:", error);
    return NextResponse.json(
      { error: "Failed to perform semantic search" },
      { status: 500 }
    );
  }
}
