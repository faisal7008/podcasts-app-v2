import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { episode, podcast, job } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import {
  extractBlobNameFromUrl,
  generateReadSasUrl,
} from "@/lib/storage";
import { podcastProcessingQueue } from "@/lib/queue";

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
    const { title, description, audioUrl, mimeType, fileSizeBytes } = body;

    if (!title || !audioUrl) {
      return NextResponse.json(
        { error: "Title and audioUrl are required" },
        { status: 400 }
      );
    }

    // Verify ownership
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

    // Create Episode record in draft status
    const [newEpisode] = await db
      .insert(episode)
      .values({
        podcastId,
        userId: session.user.id,
        title,
        description,
        audioUrl,
        mimeType,
        fileSizeBytes,
        status: "processing",
      })
      .returning();

    // Create Job record
    const [newJob] = await db
      .insert(job)
      .values({
        episodeId: newEpisode.id,
        userId: session.user.id,
        type: "full_pipeline",
        status: "pending",
        progress: 0,
      })
      .returning();

    // Enqueue BullMQ job
    await podcastProcessingQueue.add("process-episode", {
      episodeId: newEpisode.id,
      jobId: newJob.id,
      audioUrl: audioUrl,
      userId: session.user.id,
    });

    return NextResponse.json(
      { episode: newEpisode, job: newJob },
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