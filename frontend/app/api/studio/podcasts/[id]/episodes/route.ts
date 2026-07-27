import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { storageService } from "@/lib/storage";
import { PodcastService } from "@/services/podcast.service";
import { EpisodeService } from "@/services/episode.service";

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
    const podcastRecord = await PodcastService.verifyOwnership(podcastId, session.user.id);

    if (!podcastRecord) {
      return NextResponse.json(
        { error: "Podcast not found or unauthorized" },
        { status: 404 }
      );
    }

    // Fetch episodes
    const episodes = await EpisodeService.getEpisodesForPodcast(podcastId, session.user.id);

    // Generate temporary read SAS URLs from blob paths
    const mappedEpisodes = episodes.map((ep) => {
      // Use processedBlob if available, otherwise rawBlob
      const audioBlobPath = ep.processedBlob || ep.rawBlob;

      return {
        ...ep,
        audioUrl: audioBlobPath
          ? storageService.generateReadUrl(audioBlobPath)
          : null,
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

/**
 * POST /api/studio/podcasts/[id]/episodes
 * Create a new episode and enqueue a processing job.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: podcastId } = await params;
    const body = await request.json();
    const { title, description, rawBlob, mimeType, fileSizeBytes, episodeId } = body;

    if (!title || !rawBlob) {
      return NextResponse.json(
        { error: "Title and rawBlob are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const podcastRecord = await PodcastService.verifyOwnership(podcastId, session.user.id);

    if (!podcastRecord) {
      return NextResponse.json(
        { error: "Podcast not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create Episode record and Job, then enqueue
    const { episode, job } = await EpisodeService.createDraftEpisodeAndEnqueue({
      podcastId,
      userId: session.user.id,
      title,
      description,
      rawBlob,
      mimeType,
      fileSizeBytes,
      episodeId,
    });

    return NextResponse.json(
      { episode, job },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Studio Podcast Episodes POST error:", error);
    return NextResponse.json(
      { error: "Failed to create episode" },
      { status: 500 }
    );
  }
}