import { NextResponse } from "next/server";
import { getCategoryPodcasts } from "@/lib/taddy";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    
    if (!category) {
      return NextResponse.json({ error: "Missing category parameter" }, { status: 400 });
    }

    const podcasts = await getCategoryPodcasts(category);
    return NextResponse.json(podcasts);
  } catch (error) {
    console.error("Explore API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category podcasts" },
      { status: 500 }
    );
  }
}
