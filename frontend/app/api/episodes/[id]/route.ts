import { NextResponse } from "next/server";
import { getEpisodeById } from "@/lib/taddy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const episode = await getEpisodeById(resolvedParams.id);
    return NextResponse.json(episode);
  } catch (error) {
    console.error("Get Episode API error:", error);
    return NextResponse.json({ error: "Failed to fetch episode details" }, { status: 500 });
  }
}
