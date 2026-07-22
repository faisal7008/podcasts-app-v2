import { NextResponse } from "next/server";
import { getPodcastById } from "@/lib/taddy";
import { db } from "@/lib/db";
import { podcast, episode } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { extractBlobNameFromUrl, generateReadSasUrl } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const podcastId = resolvedParams.id;

    // Check local database first
    const localPodcast = await db.query.podcast.findFirst({
      where: eq(podcast.id, podcastId),
    });

    if (localPodcast) {
      const localEpisodes = await db.query.episode.findMany({
        where: eq(episode.podcastId, podcastId),
        orderBy: [desc(episode.createdAt)],
      });

      // Map to UI schema
      const mappedPodcast = {
        id: localPodcast.id,
        title: localPodcast.title,
        author: localPodcast.author || "Unknown",
        description: localPodcast.description || "",
        artwork: localPodcast.artwork || "",
        episodeCount: localEpisodes.length,
        category: localPodcast.category || "General",
      };

      const mappedEpisodes = localEpisodes.map((ep) => {
        const blobName = extractBlobNameFromUrl(ep.audioUrl);
        const audioSrc = blobName ? generateReadSasUrl(blobName) : ep.audioUrl;

        return {
          id: ep.id,
          number: ep.number || 0,
          title: ep.title,
          description: ep.description || "",
          date: ep.datePublished.toISOString(),
          duration: ep.duration || 0,
          podcastId: localPodcast.id,
          podcastTitle: localPodcast.title,
          artwork: ep.artwork || localPodcast.artwork || "",
          audioSrc: audioSrc,
        };
      });

      return NextResponse.json({ podcast: mappedPodcast, episodes: mappedEpisodes });
    }

    // Fallback to Taddy API
    const data = await getPodcastById(podcastId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get Podcast API error:", error);
    return NextResponse.json({ error: "Failed to fetch podcast details" }, { status: 500 });
  }
}
