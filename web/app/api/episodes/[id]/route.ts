import { NextResponse } from "next/server";
import { EpisodeService } from "@/services/episode.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const episode = await EpisodeService.resolveEpisode(resolvedParams.id);

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    return NextResponse.json(episode);
  } catch (error) {
    console.error("Get Episode API error:", error);
    return NextResponse.json({ error: "Failed to fetch episode details" }, { status: 500 });
  }
}
