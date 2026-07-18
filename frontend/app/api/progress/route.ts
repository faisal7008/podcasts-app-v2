import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    const progress = await prisma.playHistory.upsert({
      where: {
        userId_episodeId: {
          userId: session.user.id,
          episodeId,
        },
      },
      create: {
        userId: session.user.id,
        episodeId,
        podcastId,
        progressSeconds: progressSeconds ?? 0,
        completed: completed ?? false,
      },
      update: {
        progressSeconds: progressSeconds ?? 0,
        completed: completed ?? false,
        podcastId,
      },
    });

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

    const history = await prisma.playHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' }
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
