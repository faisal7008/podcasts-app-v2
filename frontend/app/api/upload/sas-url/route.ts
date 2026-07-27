import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadRequestSchema } from "@/lib/validations/episode";
import { storageService } from "@/lib/storage";
import { StoragePaths } from "@podcasts/shared";

/**
 * POST /api/upload/sas-url — Generate a signed Azure Blob Storage URL.
 *
 * The browser will use this URL to upload audio directly to Azure,
 * bypassing the Next.js server for large file transfers.
 *
 * Request body: { fileName: string, mimeType: string, fileSizeBytes?: number, episodeId?: string }
 * Response: { sasUrl: string, blobPath: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = uploadRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { mimeType } = parsed.data;

    // Generate a temporary episode ID for the upload path.
    // This will be replaced by the real episode ID when the episode is created,
    // OR the caller can pass an episodeId if they've already created the episode record.
    const episodeId = body.episodeId || crypto.randomUUID();

    const { sasUrl, blobPath } = storageService.generateEpisodeUploadUrl(
      episodeId,
      mimeType
    );

    return NextResponse.json({ sasUrl, blobPath, episodeId });
  } catch (error) {
    console.error("[API] Upload SAS URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
