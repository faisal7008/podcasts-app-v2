import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * POST /api/follows — Follow a podcast
 * DELETE /api/follows — Unfollow a podcast
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { podcastId } = await request.json();
    if (!podcastId) {
      return NextResponse.json({ error: "podcastId is required" }, { status: 400 });
    }

    const follow = await prisma.follow.upsert({
      where: {
        userId_podcastId: {
          userId: session.user.id,
          podcastId,
        },
      },
      create: {
        userId: session.user.id,
        podcastId,
      },
      update: {},
    });

    return NextResponse.json({ follow }, { status: 201 });
  } catch (error) {
    console.error("[API] Follow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { podcastId } = await request.json();
    if (!podcastId) {
      return NextResponse.json({ error: "podcastId is required" }, { status: 400 });
    }

    await prisma.follow.deleteMany({
      where: {
        userId: session.user.id,
        podcastId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Unfollow error:", error);
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
    const podcastId = searchParams.get("podcastId");
    const hydrate = searchParams.get("hydrate") === "true";

    if (podcastId) {
      const follow = await prisma.follow.findUnique({
        where: {
          userId_podcastId: {
            userId: session.user.id,
            podcastId,
          },
        },
      });
      return NextResponse.json({ isFollowing: !!follow });
    }

    const follows = await prisma.follow.findMany({
      where: { userId: session.user.id },
    });
    
    if (hydrate) {
      const { getPodcastById } = await import("@/lib/taddy");
      const hydrated = await Promise.all(
        follows.map(async (f) => {
          try {
            const { podcast } = await getPodcastById(f.podcastId);
            return podcast;
          } catch {
            return null;
          }
        })
      );
      return NextResponse.json({ follows, hydrated: hydrated.filter(Boolean) });
    }
    
    return NextResponse.json({ follows });
  } catch (error) {
    console.error("[API] Get follows error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
