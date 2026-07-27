import { NextResponse } from "next/server";
import { getEpisodeById } from "@/lib/taddy";
import { EpisodeService } from "@/services/episode.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    // Check local database first for studio-uploaded episodes
    const localEpisode = await EpisodeService.getEpisodeById(resolvedParams.id);
    if (localEpisode) {
      return NextResponse.json(localEpisode);
    }

    // Fallback to Taddy API
    const episode = await getEpisodeById(resolvedParams.id);
    return NextResponse.json(episode);
  } catch (error) {
    console.error("Get Episode API error:", error);
    return NextResponse.json({ error: "Failed to fetch episode details" }, { status: 500 });
  }
}
