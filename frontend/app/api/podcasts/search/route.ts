import { NextResponse } from "next/server";
import { searchPodcasts } from "@/lib/taddy";

// Simple in-memory cache for search results to avoid hitting Taddy rate limits
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase();

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  // Check cache
  const cached = searchCache.get(q);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const results = await searchPodcasts(q);
    
    searchCache.set(q, { data: results, timestamp: Date.now() });
    
    // Keep cache size bounded
    if (searchCache.size > 100) {
      const firstKey = searchCache.keys().next().value;
      if (firstKey) searchCache.delete(firstKey);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Failed to search podcasts" }, { status: 500 });
  }
}
