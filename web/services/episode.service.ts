import { db } from "@/lib/db";
import { episode, job, jobStep, podcast } from "@/lib/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
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
    // Explicit column list — excludes `transcript` and `waveformData`, which
    // can be MBs per row and are never needed in list views. Loading them
    // for every episode was creating huge transient heap allocations.
    const episodes = await db
      .select({
        id: episode.id,
        podcastId: episode.podcastId,
        userId: episode.userId,
        number: episode.number,
        title: episode.title,
        description: episode.description,
        datePublished: episode.datePublished,
        artwork: episode.artwork,
        duration: episode.duration,
        rawBlob: episode.rawBlob,
        processedBlob: episode.processedBlob,
        transcriptBlob: episode.transcriptBlob,
        fileSizeBytes: episode.fileSizeBytes,
        mimeType: episode.mimeType,
        status: episode.status,
        aiSummary: episode.aiSummary,
        chapters: episode.chapters,
        showNotes: episode.showNotes,
        tags: episode.tags,
        recommendations: episode.recommendations,
        createdAt: episode.createdAt,
        updatedAt: episode.updatedAt,
      })
      .from(episode)
      .where(
        and(
          eq(episode.podcastId, podcastId),
          eq(episode.userId, userId)
        )
      )
      .orderBy(desc(episode.createdAt));

    const resultEpisodes: any[] = episodes.map(ep => ({ ...ep, latestJob: null, jobSteps: [] }));
    
    if (episodes.length > 0) {
      const episodeIds = episodes.map(e => e.id);
      const allJobs = await db
        .select()
        .from(job)
        .where(inArray(job.episodeId, episodeIds))
        .orderBy(desc(job.createdAt));
        
      const latestJobsMap = new Map();
      for (const j of allJobs) {
        if (!latestJobsMap.has(j.episodeId)) {
          latestJobsMap.set(j.episodeId, j);
        }
      }
      
      const jobIds = Array.from(latestJobsMap.values()).map(j => j.id);
      
      let allJobSteps: any[] = [];
      if (jobIds.length > 0) {
        allJobSteps = await db
          .select()
          .from(jobStep)
          .where(inArray(jobStep.jobId, jobIds))
          .orderBy(jobStep.startedAt);
      }
      
      for (const ep of resultEpisodes) {
        const latestJob = latestJobsMap.get(ep.id);
        if (latestJob) {
          ep.latestJob = latestJob;
          ep.jobSteps = allJobSteps.filter(s => s.jobId === latestJob.id);
          
          if (latestJob.status === 'failed' && (ep.status === 'processing' || ep.status === 'processing_ai' || ep.status === 'uploading')) {
             await db.update(episode).set({ status: 'failed' }).where(eq(episode.id, ep.id));
             ep.status = 'failed';
          }
        }
      }
    }

    return resultEpisodes;
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
