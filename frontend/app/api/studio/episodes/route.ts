import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { episode } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { desc } from "drizzle-orm";

/**
 * GET /api/studio/episodes — List the authenticated user's episodes.
 *
 * Returns all episodes created by the current user, ordered by creation date (newest first).
 * Used by the Studio dashboard to display the user's content.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const episodes = await db
      .select()
      .from(episode)
      .where(eq(episode.userId, session.user.id))
      .orderBy(desc(episode.createdAt));

    return NextResponse.json({ episodes });
  } catch (error) {
    console.error("[API] Studio Episodes GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch episodes" },
      { status: 500 }
    );
  }
}
