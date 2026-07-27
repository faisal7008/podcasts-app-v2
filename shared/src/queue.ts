import { z } from "zod";

export const QueueNames = {
  MEDIA_PIPELINE: "media-pipeline",
  AI_PIPELINE: "ai-pipeline",
} as const;

/**
 * Media pipeline job payload.
 * Workers derive blob paths from episodeId using StoragePaths.
 * No URLs in queue messages.
 */
export const MediaJobPayloadSchema = z.object({
  jobId: z.string(),
  episodeId: z.string(),
  podcastId: z.string(),
  userId: z.string(),
});

export type MediaJobPayload = z.infer<typeof MediaJobPayloadSchema>;

/**
 * AI pipeline job payload.
 * Workers derive blob paths from episodeId using StoragePaths.
 * No URLs in queue messages.
 */
export const AiJobPayloadSchema = z.object({
  jobId: z.string(),
  episodeId: z.string(),
  podcastId: z.string(),
  userId: z.string(),
});

export type AiJobPayload = z.infer<typeof AiJobPayloadSchema>;
