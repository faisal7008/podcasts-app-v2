/**
 * storage-paths.ts — Deterministic blob naming helpers.
 *
 * All blob paths for the application are defined here.
 * Workers, API routes, and services all use these helpers
 * so there's a single source of truth for where blobs live.
 *
 * Blob structure:
 *
 *   podcasts/
 *       {podcastId}/
 *           artwork/cover.png
 *           branding/
 *   episodes/
 *       {episodeId}/
 *           raw/audio.webm          ← original upload
 *           processed/audio.mp3     ← normalized by media-worker
 *           transcripts/transcript.json
 *           ai/summary.json
 *           artwork/thumbnail.png
 *           exports/
 */

export const StoragePaths = {
  // ─── Episode Paths ──────────────────────────────────────────────────────

  /** Original uploaded audio: `episodes/{episodeId}/raw/audio.{ext}` */
  rawAudio(episodeId: string, ext: string = "webm"): string {
    return `episodes/${episodeId}/raw/audio.${ext}`;
  },

  /** Processed/normalized audio: `episodes/{episodeId}/processed/audio.m4a` */
  processedAudio(episodeId: string): string {
    return `episodes/${episodeId}/processed/audio.m4a`;
  },

  /** Transcript JSON: `episodes/{episodeId}/transcripts/transcript.json` */
  transcript(episodeId: string): string {
    return `episodes/${episodeId}/transcripts/transcript.json`;
  },

  /** AI summary JSON: `episodes/{episodeId}/ai/summary.json` */
  summary(episodeId: string): string {
    return `episodes/${episodeId}/ai/summary.json`;
  },

  /** Episode artwork/thumbnail: `episodes/{episodeId}/artwork/thumbnail.{ext}` */
  episodeArtwork(episodeId: string, ext: string = "png"): string {
    return `episodes/${episodeId}/artwork/thumbnail.${ext}`;
  },

  /** Prefix for all blobs under an episode: `episodes/{episodeId}/` */
  episodePrefix(episodeId: string): string {
    return `episodes/${episodeId}/`;
  },

  // ─── Podcast Paths ─────────────────────────────────────────────────────

  /** Podcast cover artwork: `podcasts/{podcastId}/artwork/cover.{ext}` */
  podcastArtwork(podcastId: string, ext: string = "png"): string {
    return `podcasts/${podcastId}/artwork/cover.${ext}`;
  },

  /** Prefix for all blobs under a podcast: `podcasts/{podcastId}/` */
  podcastPrefix(podcastId: string): string {
    return `podcasts/${podcastId}/`;
  },

  // ─── Utilities ─────────────────────────────────────────────────────────

  /**
   * Extract the file extension from a filename or MIME type.
   * Falls back to "webm" if nothing can be determined.
   */
  extFromMime(mimeType: string): string {
    const map: Record<string, string> = {
      "audio/webm": "webm",
      "audio/mp3": "mp3",
      "audio/mpeg": "mp3",
      "audio/mp4": "m4a",
      "audio/m4a": "m4a",
      "audio/x-m4a": "m4a",
      "audio/wav": "wav",
      "audio/ogg": "ogg",
      "audio/flac": "flac",
      "audio/aac": "aac",
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    };
    return map[mimeType] ?? "webm";
  },
} as const;
