import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { podcast } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { storageService } from "@/lib/storage";

/**
 * GET /api/studio/podcasts — List the authenticated user's podcasts.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const podcasts = await db
      .select()
      .from(podcast)
      .where(eq(podcast.userId, session.user.id))
      .orderBy(desc(podcast.createdAt));

    const mappedPodcasts = podcasts.map(p => ({
      ...p,
      artwork: p.artwork ? storageService.generateReadUrl(p.artwork) : null
    }));

    return NextResponse.json({ podcasts: mappedPodcasts });
  } catch (error) {
    console.error("[API] Studio Podcasts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch podcasts" },
      { status: 500 }
    );
  }
}
