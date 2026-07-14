import { NextResponse } from "next/server";
import { getTrendingPodcasts, getTopChannels } from "@/lib/taddy";

/**
 * GET /api/podcasts/home
 * Returns all data needed for the home page in a single request
 * to minimize Taddy API calls.
 */
export async function GET() {
  try {
    const [featured, noteworthy, trending, trendingAlt, topChannelsData] =
      await Promise.all([
        getTrendingPodcasts("best podcast 2024", 4),
        getTrendingPodcasts("new noteworthy podcast", 5),
        getTrendingPodcasts("trending podcast", 5),
        getTrendingPodcasts("top rated podcast", 5),
        getTopChannels("popular podcast shows", 8),
      ]);

    return NextResponse.json({
      featured,
      noteworthy,
      trending,
      trendingAlt,
      topChannels: topChannelsData,
    });
  } catch (error) {
    console.error("Home API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch home page data" },
      { status: 500 }
    );
  }
}
