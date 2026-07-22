import { z } from "zod";

// ─── Upload Request ─────────────────────────────────────────────────────

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",       // MP3
  "audio/mp3",        // MP3 (alternative)
  "audio/wav",        // WAV
  "audio/x-wav",      // WAV (alternative)
  "audio/mp4",        // M4A
  "audio/x-m4a",      // M4A (alternative)
  "audio/ogg",        // OGG
  "audio/flac",       // FLAC
  "audio/webm",       // WebM (MediaRecorder default)
  "audio/aac",        // AAC
] as const;

export const uploadRequestSchema = z.object({
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name too long"),
  mimeType: z
    .string()
    .transform((val) => val.split(";")[0].trim())
    .refine(
      (val) => val.startsWith("audio/") || val.startsWith("video/") || val === "application/octet-stream",
      { message: `Unsupported format. Please upload a valid audio file.` }
    ),
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(500 * 1024 * 1024, "File size must be under 500MB")
    .optional(),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;

// ─── Create Episode ─────────────────────────────────────────────────────

export const createEpisodeSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .default(""),
  podcastId: z
    .string()
    .uuid("Invalid podcast ID"),
  audioUrl: z
    .string()
    .url("Invalid audio URL"),
  duration: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),
  fileSizeBytes: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),
  mimeType: z
    .string()
    .optional()
    .default("audio/mpeg"),
});

export type CreateEpisodeInput = z.infer<typeof createEpisodeSchema>;
