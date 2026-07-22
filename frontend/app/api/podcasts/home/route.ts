import { NextResponse } from "next/server";
import { getTrendingPodcasts, getTopChannels } from "@/lib/taddy";

import { db } from "@/lib/db";
import { podcast, episode } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

/**
 * GET /api/podcasts/home
 * Returns all data needed for the home page in a single request
 * to minimize Taddy API calls.
 */
export async function GET() {
  try {
    const [featured, noteworthy, trending, trendingAlt, topChannelsData, localPodcasts] =
      await Promise.all([
        getTrendingPodcasts("best podcast 2024", 4),
        getTrendingPodcasts("new noteworthy podcast", 5),
        getTrendingPodcasts("trending podcast", 5),
        getTrendingPodcasts("top rated podcast", 5),
        getTopChannels("popular podcast shows", 8),
        db
          .select({
            id: podcast.id,
            title: podcast.title,
            author: podcast.author,
            description: podcast.description,
            artwork: podcast.artwork,
            category: podcast.category,
            episodeCount: sql<number>`count(${episode.id})`.mapWith(Number),
          })
          .from(podcast)
          .leftJoin(episode, eq(episode.podcastId, podcast.id))
          .groupBy(podcast.id)
          .orderBy(desc(podcast.createdAt))
          .limit(10),
      ]);

    return NextResponse.json({
      exclusive: localPodcasts,
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
