import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { episode, job } from "@/lib/db/schema";
import { headers } from "next/headers";
import { createEpisodeSchema } from "@/lib/validations/episode";

/**
 * POST /api/episodes/create — Create an episode and queue a processing job.
 *
 * Called after audio has been successfully uploaded to Azure Blob Storage.
 * Creates the Episode row (status: "uploaded") and a Job row (status: "pending").
 *
 * Request body: { title, description?, podcastId?, audioUrl, durationSeconds?, fileSizeBytes?, mimeType? }
 * Response: { episode, job }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createEpisodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Create episode with "uploaded" status (audio is already in blob storage)
    const [newEpisode] = await db
      .insert(episode)
      .values({
        userId: session.user.id,
        podcastId: data.podcastId,
        title: data.title,
        description: data.description || null,
        audioUrl: data.audioUrl,
        duration: data.duration,
        fileSizeBytes: data.fileSizeBytes,
        mimeType: data.mimeType,
        status: "uploaded",
      })
      .returning();

    // Create a processing job
    const [newJob] = await db
      .insert(job)
      .values({
        episodeId: newEpisode.id,
        userId: session.user.id,
        type: "full_pipeline",
        status: "pending",
      })
      .returning();

    // TODO: Add BullMQ queue job here when worker infrastructure is ready
    // await processingQueue.add("process-episode", { episodeId: newEpisode.id, jobId: newJob.id });

    return NextResponse.json({ episode: newEpisode, job: newJob }, { status: 201 });
  } catch (error) {
    console.error("[API] Create Episode error:", error);
    return NextResponse.json(
      { error: "Failed to create episode" },
      { status: 500 }
    );
  }
}
