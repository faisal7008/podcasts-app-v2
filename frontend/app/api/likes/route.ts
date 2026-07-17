import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * POST /api/likes — Like an episode
 * DELETE /api/likes — Unlike an episode
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { episodeId } = await request.json();
    if (!episodeId) {
      return NextResponse.json({ error: "episodeId is required" }, { status: 400 });
    }

    const like = await prisma.like.upsert({
      where: {
        userId_episodeId: {
          userId: session.user.id,
          episodeId,
        },
      },
      create: {
        userId: session.user.id,
        episodeId,
      },
      update: {},
    });

    return NextResponse.json({ like }, { status: 201 });
  } catch (error) {
    console.error("[API] Like error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { episodeId } = await request.json();
    if (!episodeId) {
      return NextResponse.json({ error: "episodeId is required" }, { status: 400 });
    }

    await prisma.like.deleteMany({
      where: {
        userId: session.user.id,
        episodeId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Unlike error:", error);
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
    const episodeId = searchParams.get("episodeId");

    if (episodeId) {
      const like = await prisma.like.findUnique({
        where: {
          userId_episodeId: {
            userId: session.user.id,
            episodeId,
          },
        },
      });
      return NextResponse.json({ isLiked: !!like });
    }

    const likes = await prisma.like.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ likes });
  } catch (error) {
    console.error("[API] Get likes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
