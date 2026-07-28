import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { storageService } from "@/lib/storage";

const imageUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z
    .string()
    .transform((val) => val.split(";")[0].trim())
    .refine((val) => val.startsWith("image/"), {
      message: "Unsupported format. Please upload a valid image file.",
    }),
  fileSizeBytes: z.number().int().positive().max(10 * 1024 * 1024, "Image must be under 10MB").optional(),
  type: z.enum(["podcast", "episode"]),
  targetId: z.string().optional(),
});

/**
 * POST /api/upload/image-sas-url
 * Generate a signed Azure Blob Storage URL for image uploads.
 *
 * Request body: { fileName, mimeType, fileSizeBytes, type: "podcast" | "episode", targetId?: string }
 * If targetId is omitted, a random UUID will be generated.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = imageUploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { mimeType, type, targetId } = parsed.data;
    const id = targetId || crypto.randomUUID();

    let result;
    if (type === "podcast") {
      result = storageService.generatePodcastArtworkUploadUrl(id, mimeType);
    } else {
      result = storageService.generateEpisodeArtworkUploadUrl(id, mimeType);
    }

    return NextResponse.json({
      sasUrl: result.sasUrl,
      blobPath: result.blobPath,
      targetId: id,
    });
  } catch (error) {
    console.error("[API] Image Upload SAS URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate image upload URL" },
      { status: 500 }
    );
  }
}
