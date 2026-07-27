import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { episode, job, podcast } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { podcastProcessingQueue } from "@/lib/queue";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: podcastId, episodeId } = await params;

    // Verify ownership
    const podcastRecord = await db.query.podcast.findFirst({
      where: and(eq(podcast.id, podcastId), eq(podcast.userId, session.user.id)),
    });

    if (!podcastRecord) {
      return NextResponse.json({ error: "Unauthorized or podcast not found" }, { status: 403 });
    }

    // Check if episode exists
    const episodeRecord = await db.query.episode.findFirst({
      where: and(eq(episode.id, episodeId), eq(episode.podcastId, podcastId)),
    });

    if (!episodeRecord) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    // Update episode status back to processing
    await db
      .update(episode)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(episode.id, episodeId));

    // Create a new job
    const [newJob] = await db
      .insert(job)
      .values({
        episodeId,
        userId: session.user.id,
        type: "full_pipeline",
        status: "pending",
        progress: 0,
      })
      .returning();

    // Enqueue
    await podcastProcessingQueue.add("process-episode", {
      episodeId,
      jobId: newJob.id,
      podcastId,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, job: newJob });
  } catch (error) {
    console.error("[API] Retry Episode error:", error);
    return NextResponse.json({ error: "Failed to retry episode" }, { status: 500 });
  }
}
