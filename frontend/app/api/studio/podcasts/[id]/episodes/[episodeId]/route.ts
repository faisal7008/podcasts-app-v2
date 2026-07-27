import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { episode, podcast } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { storageService } from "@/lib/storage";

const updateEpisodeSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
});

export async function PATCH(
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

    const body = await request.json();
    const parsed = updateEpisodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updatedEpisode] = await db
      .update(episode)
      .set({
        title: parsed.data.title,
        description: parsed.data.description || null,
        updatedAt: new Date(),
      })
      .where(and(eq(episode.id, episodeId), eq(episode.podcastId, podcastId)))
      .returning();

    if (!updatedEpisode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    return NextResponse.json({ episode: updatedEpisode });
  } catch (error) {
    console.error("[API] Edit Episode error:", error);
    return NextResponse.json({ error: "Failed to update episode" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Delete episode (cascade delete will handle related jobs)
    const [deletedEpisode] = await db
      .delete(episode)
      .where(and(eq(episode.id, episodeId), eq(episode.podcastId, podcastId)))
      .returning();

    if (!deletedEpisode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    // Delete ALL blob storage artifacts under the episode prefix.
    // This removes raw audio, processed audio, transcripts, AI data, artwork — everything.
    try {
      const deletedCount = await storageService.deleteEpisodeAssets(episodeId);
      console.log(`[API] Deleted ${deletedCount} blobs for episode ${episodeId}`);
    } catch (cleanupError) {
      console.error("[API] Failed to clean up blobs for deleted episode:", cleanupError);
      // We don't fail the deletion if cleanup fails, but we log it
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Delete Episode error:", error);
    return NextResponse.json({ error: "Failed to delete episode" }, { status: 500 });
  }
}
