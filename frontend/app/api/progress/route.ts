import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { playHistory } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * POST /api/progress — Upsert playback progress for an episode.
 * Auto-save endpoint called every 5s while playing.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { episodeId, podcastId, progressSeconds, completed } = await request.json();

    if (!episodeId || !podcastId) {
      return NextResponse.json(
        { error: "episodeId and podcastId are required" },
        { status: 400 }
      );
    }

    const [progress] = await db.insert(playHistory).values({
      userId: session.user.id,
      episodeId,
      podcastId,
      progressSeconds: progressSeconds ?? 0,
      completed: completed ?? false,
    }).onConflictDoUpdate({
      target: [playHistory.userId, playHistory.episodeId],
      set: {
        progressSeconds: progressSeconds ?? 0,
        completed: completed ?? false,
        podcastId,
        updatedAt: new Date(),
      }
    }).returning();

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[API] Progress error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hydrate = searchParams.get("hydrate") === "true";

    const history = await db.query.playHistory.findMany({
      where: eq(playHistory.userId, session.user.id),
      orderBy: [desc(playHistory.updatedAt)]
    });
    
    if (hydrate) {
      const { getEpisodeById } = await import("@/lib/taddy");
      const hydrated = await Promise.all(
        history.map(async (h) => {
          try {
            const ep = await getEpisodeById(h.episodeId);
            return { ...ep, progressSeconds: h.progressSeconds };
          } catch {
            return null;
          }
        })
      );
      return NextResponse.json({ history, hydrated: hydrated.filter(Boolean) });
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error("[API] Get progress error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
