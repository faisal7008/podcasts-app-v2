import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { like } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
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

    const existingLike = await db.query.like.findFirst({
      where: and(
        eq(like.userId, session.user.id),
        eq(like.episodeId, episodeId)
      )
    });

    if (existingLike) {
      return NextResponse.json({ like: existingLike }, { status: 200 });
    }

    const [newLike] = await db.insert(like).values({
      userId: session.user.id,
      episodeId,
    }).returning();

    return NextResponse.json({ like: newLike }, { status: 201 });
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

    await db.delete(like).where(
      and(
        eq(like.userId, session.user.id),
        eq(like.episodeId, episodeId)
      )
    );

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
    const hydrate = searchParams.get("hydrate") === "true";

    if (episodeId) {
      const userLike = await db.query.like.findFirst({
        where: and(
          eq(like.userId, session.user.id),
          eq(like.episodeId, episodeId)
        )
      });
      return NextResponse.json({ isLiked: !!userLike });
    }

    const likes = await db.query.like.findMany({
      where: eq(like.userId, session.user.id),
      orderBy: [desc(like.createdAt)]
    });
    
    if (hydrate) {
      const { getEpisodeById } = await import("@/lib/taddy");
      const hydrated = await Promise.all(
        likes.map(async (l) => {
          try {
            return await getEpisodeById(l.episodeId);
          } catch {
            return null;
          }
        })
      );
      return NextResponse.json({ likes, hydrated: hydrated.filter(Boolean) });
    }
    
    return NextResponse.json({ likes });
  } catch (error) {
    console.error("[API] Get likes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
