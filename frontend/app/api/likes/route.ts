import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SocialService } from "@/services/social.service";

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

    const like = await SocialService.addLike(session.user.id, episodeId);
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

    await SocialService.removeLike(session.user.id, episodeId);

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
      const userLike = await SocialService.getLike(session.user.id, episodeId);
      return NextResponse.json({ isLiked: !!userLike });
    }

    const likes = await SocialService.getLikesByUser(session.user.id);
    
    if (hydrate) {
      const { EpisodeService } = await import("@/services/episode.service");
      const hydrated = await Promise.all(
        likes.map(async (l) => {
          try {
            return await EpisodeService.resolveEpisode(l.episodeId);
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
