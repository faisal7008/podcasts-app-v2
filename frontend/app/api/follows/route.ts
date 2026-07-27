import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SocialService } from "@/services/social.service";

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

    const follow = await SocialService.addFollow(session.user.id, podcastId);
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

    await SocialService.removeFollow(session.user.id, podcastId);

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
      const userFollow = await SocialService.getFollow(session.user.id, podcastId);
      return NextResponse.json({ isFollowing: !!userFollow });
    }

    const follows = await SocialService.getFollowsByUser(session.user.id);
    
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
