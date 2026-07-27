import { db } from "@/lib/db";
import { episode, job, podcast } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { podcastProcessingQueue } from "@/lib/queue";

export class EpisodeService {
  /**
   * Fetch all episodes for a specific podcast that belongs to the user
   */
  static async getEpisodesForPodcast(podcastId: string, userId: string) {
    return await db
      .select()
      .from(episode)
      .where(
        and(
          eq(episode.podcastId, podcastId),
          eq(episode.userId, userId)
        )
      )
      .orderBy(desc(episode.createdAt));
  }

  /**
   * Fetch a single episode by ID, joined with its podcast to get the title
   */
  static async getEpisodeById(episodeId: string) {
    const result = await db
      .select({
        episode: episode,
        podcastTitle: podcast.title,
      })
      .from(episode)
      .leftJoin(podcast, eq(episode.podcastId, podcast.id))
      .where(eq(episode.id, episodeId))
      .limit(1);

    if (!result || result.length === 0) {
      return null;
    }

    const row = result[0];
    const ep = row.episode;
    
    // Map to Episode interface
    return {
      id: ep.id,
      number: ep.number || 0,
      title: ep.title,
      description: ep.description || "",
      date: ep.datePublished.toISOString(),
      duration: ep.duration || 0,
      podcastId: ep.podcastId,
      podcastTitle: row.podcastTitle || "",
      artwork: ep.artwork || "",
      audioSrc: ep.audioUrl,
      // AI fields
      transcript: ep.transcript,
      aiSummary: ep.aiSummary,
      chapters: ep.chapters,
      showNotes: ep.showNotes,
      tags: ep.tags as string[] | null,
      recommendations: ep.recommendations,
    };
  }

  /**
   * Create a new draft episode, a tracking job, and enqueue it for processing
   */
  static async createDraftEpisodeAndEnqueue({
    podcastId,
    userId,
    title,
    description,
    audioUrl,
    mimeType,
    fileSizeBytes,
  }: {
    podcastId: string;
    userId: string;
    title: string;
    description: string;
    audioUrl: string;
    mimeType: string;
    fileSizeBytes: number;
  }) {
    // 1. Create Episode record in draft status
    const [newEpisode] = await db
      .insert(episode)
      .values({
        podcastId,
        userId,
        title,
        description,
        audioUrl,
        mimeType,
        fileSizeBytes,
        status: "processing",
      })
      .returning();

    // 2. Create Job record
    const [newJob] = await db
      .insert(job)
      .values({
        episodeId: newEpisode.id,
        userId,
        type: "full_pipeline",
        status: "pending",
        progress: 0,
      })
      .returning();

    // 3. Enqueue BullMQ job
    await podcastProcessingQueue.add("process-episode", {
      episodeId: newEpisode.id,
      jobId: newJob.id,
      audioUrl: audioUrl,
      userId: userId,
    });

    return { episode: newEpisode, job: newJob };
  }
}
