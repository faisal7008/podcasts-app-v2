import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { podcast } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";

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

    return NextResponse.json({ podcasts });
  } catch (error) {
    console.error("[API] Studio Podcasts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch podcasts" },
      { status: 500 }
    );
  }
}
