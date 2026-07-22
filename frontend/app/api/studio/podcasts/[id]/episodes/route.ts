import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { episode, podcast } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import {
  extractBlobNameFromUrl,
  generateReadSasUrl,
} from "@/lib/storage";

/**
 * GET /api/studio/podcasts/[id]/episodes
 * List episodes for a specific podcast.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: podcastId } = await params;

    // Verify ownership of the podcast
    const podcastRecord = await db.query.podcast.findFirst({
      where: and(
        eq(podcast.id, podcastId),
        eq(podcast.userId, session.user.id)
      ),
    });

    if (!podcastRecord) {
      return NextResponse.json(
        { error: "Podcast not found or unauthorized" },
        { status: 404 }
      );
    }

    // Fetch episodes
    const episodes = await db
      .select()
      .from(episode)
      .where(
        and(
          eq(episode.podcastId, podcastId),
          eq(episode.userId, session.user.id)
        )
      )
      .orderBy(desc(episode.createdAt));

    // Generate temporary SAS URLs
    const mappedEpisodes = episodes.map((ep) => {
      const blobName = extractBlobNameFromUrl(ep.audioUrl);

      return {
        ...ep,
        audioUrl: blobName
          ? generateReadSasUrl(blobName)
          : ep.audioUrl,
      };
    });

    return NextResponse.json({
      podcast: podcastRecord,
      episodes: mappedEpisodes,
    });
  } catch (error) {
    console.error("[API] Studio Podcast Episodes GET error:", error);

    return NextResponse.json(
      { error: "Failed to fetch episodes" },
      { status: 500 }
    );
  }
}