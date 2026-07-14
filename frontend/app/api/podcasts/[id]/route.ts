import { NextResponse } from "next/server";
import { getPodcastById } from "@/lib/taddy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const data = await getPodcastById(resolvedParams.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get Podcast API error:", error);
    return NextResponse.json({ error: "Failed to fetch podcast details" }, { status: 500 });
  }
}
