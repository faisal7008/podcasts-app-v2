import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadRequestSchema } from "@/lib/validations/episode";
import { generateSasUrl, generateBlobName } from "@/lib/storage";

/**
 * POST /api/upload/sas-url — Generate a signed Azure Blob Storage URL.
 *
 * The browser will use this URL to upload audio directly to Azure,
 * bypassing the Next.js server for large file transfers.
 *
 * Request body: { fileName: string, mimeType: string, fileSizeBytes?: number }
 * Response: { sasUrl: string, blobName: string, publicUrl: string }
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

    const { fileName, mimeType } = parsed.data;
    const blobName = generateBlobName(session.user.id, fileName);
    const { sasUrl, publicUrl } = generateSasUrl(blobName, mimeType);

    return NextResponse.json({ sasUrl, blobName, publicUrl });
  } catch (error) {
    console.error("[API] Upload SAS URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
