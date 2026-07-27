import { z } from "zod";

export const QueueNames = {
  MEDIA_PIPELINE: "media-pipeline",
  AI_PIPELINE: "ai-pipeline",
} as const;

export const MediaJobPayloadSchema = z.object({
  jobId: z.string(),
  episodeId: z.string(),
  podcastId: z.string(),
  userId: z.string(),
  blobUrl: z.string(), // The original uploaded audio file in Azure
  mimeType: z.string(),
});

export type MediaJobPayload = z.infer<typeof MediaJobPayloadSchema>;

export const AiJobPayloadSchema = z.object({
  jobId: z.string(),
  episodeId: z.string(),
  podcastId: z.string(),
  userId: z.string(),
  normalizedAudioUrl: z.string(), // The normalized audio processed by media-worker
});

export type AiJobPayload = z.infer<typeof AiJobPayloadSchema>;
