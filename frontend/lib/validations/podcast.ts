import { z } from "zod";

export const createPodcastSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .default(""),
  author: z
    .string()
    .min(1, "Author is required")
    .max(200, "Author must be 200 characters or less"),
  category: z
    .string()
    .min(1, "Category is required"),
  artwork: z
    .string()
    .url("Invalid artwork URL")
    .optional()
    .nullable(),
});

export type CreatePodcastInput = z.infer<typeof createPodcastSchema>;
