import { db } from "@/lib/db";
import { episode, job, podcast } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { podcastProcessingQueue } from "@/lib/queue";
import { storageService } from "@/lib/storage";

export class EpisodeService {
  /**
   * Resolve episode by ID from local DB (mapping SAS URLs) or fallback to Taddy API
   */
  static async resolveEpisode(episodeId: string) {
    // Check local database first
    const localEpisode = await this.getEpisodeById(episodeId);
    if (localEpisode) {
      const audioBlobPath = localEpisode.processedBlob || localEpisode.rawBlob;
      return {
        ...localEpisode,
        artwork: localEpisode.artwork ? storageService.generateReadUrl(localEpisode.artwork) : "",
        audioSrc: audioBlobPath ? storageService.generateReadUrl(audioBlobPath) : null,
      };
    }

    // Fallback to Taddy API
    const { getEpisodeById: getTaddyEpisode } = await import("@/lib/taddy");
    return await getTaddyEpisode(episodeId);
  }
  /**
   * Fetch all episodes for a specific podcast that belongs to the user
   */
  static async getEpisodesForPodcast(podcastId: string, userId: string) {
    const episodes = await db
      .select()
      .from(episode)
      .where(
        and(
          eq(episode.podcastId, podcastId),
          eq(episode.userId, userId)
        )
      )
      .orderBy(desc(episode.createdAt));

    // Auto-heal stuck episodes (where episode is processing but the latest job failed)
    const processingEpisodes = episodes.filter(ep => 
      ep.status === 'processing' || ep.status === 'processing_ai' || ep.status === 'uploading'
    );
    
    for (const ep of processingEpisodes) {
      // Find the latest job for this episode
      const [latestJob] = await db
        .select()
        .from(job)
        .where(eq(job.episodeId, ep.id))
        .orderBy(desc(job.createdAt))
        .limit(1);
        
      if (latestJob && latestJob.status === 'failed') {
        // Heal it
        await db.update(episode).set({ status: 'failed' }).where(eq(episode.id, ep.id));
        ep.status = 'failed';
      }
    }

    return episodes;
  }

  /**
   * Fetch a single episode by ID, joined with its podcast to get the title
   */
  static async getEpisodeById(episodeId: string) {
    const result = await db
      .select({
        episode: episode,
        podcastTitle: podcast.title,
        podcastArtwork: podcast.artwork,
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
      artwork: ep.artwork || row.podcastArtwork || "",
      rawBlob: ep.rawBlob,
      processedBlob: ep.processedBlob,
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
   * Create a new draft episode, a tracking job, and enqueue it for processing.
   *
   * The blob path (not URL) is stored in the database.
   * The queue message only carries episodeId — workers derive paths from StoragePaths.
   */
  static async createDraftEpisodeAndEnqueue({
    podcastId,
    userId,
    title,
    description,
    rawBlob,
    mimeType,
    fileSizeBytes,
    artwork,
    episodeId,
  }: {
    podcastId: string;
    userId: string;
    title: string;
    description: string;
    rawBlob: string;
    mimeType: string;
    fileSizeBytes: number;
    artwork?: string | null;
    /** Pre-generated episode ID (from the SAS URL flow) */
    episodeId?: string;
  }) {
    // 1. Create Episode record in processing status
    const [newEpisode] = await db
      .insert(episode)
      .values({
        ...(episodeId ? { id: episodeId } : {}),
        podcastId,
        userId,
        title,
        description,
        rawBlob,
        mimeType,
        fileSizeBytes,
        artwork: artwork || null,
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

    // 3. Enqueue BullMQ job — only episodeId, workers derive paths
    await podcastProcessingQueue.add("process-episode", {
      episodeId: newEpisode.id,
      jobId: newJob.id,
      podcastId,
      userId,
    });

    return { episode: newEpisode, job: newJob };
  }
}
