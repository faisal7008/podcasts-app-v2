import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { episode, job, podcast, jobStep } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
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

    // Find the latest job for the episode
    const [latestJob] = await db
      .select()
      .from(job)
      .where(eq(job.episodeId, episodeId))
      .orderBy(desc(job.createdAt))
      .limit(1);

    if (!latestJob) {
      return NextResponse.json({ error: "No job found to retry" }, { status: 404 });
    }

    // Update episode status back to processing
    await db
      .update(episode)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(episode.id, episodeId));

    // Reset failed job step if any
    await db
      .update(jobStep)
      .set({ status: "pending", error: null })
      .where(and(eq(jobStep.jobId, latestJob.id), eq(jobStep.status, "failed")));

    // Update the job status back to processing/pending
    await db
      .update(job)
      .set({ status: "pending", error: null, progress: latestJob.progress > 0 ? latestJob.progress : 0, updatedAt: new Date() })
      .where(eq(job.id, latestJob.id));

    // Enqueue
    await podcastProcessingQueue.add("process-media", {
      jobId: latestJob.id,
      episodeId,
      podcastId,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, job: latestJob });
  } catch (error) {
    console.error("[API] Retry Episode error:", error);
    return NextResponse.json({ error: "Failed to retry episode" }, { status: 500 });
  }
}
