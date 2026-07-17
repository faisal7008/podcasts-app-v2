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
