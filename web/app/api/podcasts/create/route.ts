import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { podcast } from "@/lib/db/schema";
import { headers } from "next/headers";
import { createPodcastSchema } from "@/lib/validations/podcast";

/**
 * POST /api/podcasts/create — Create a new podcast (show).
 *
 * Request body: { title, description?, author, category, artwork? }
 * Response: { podcast }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createPodcastSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const [newPodcast] = await db
      .insert(podcast)
      .values({
        userId: session.user.id,
        title: data.title,
        description: data.description || null,
        author: data.author,
        category: data.category,
        artwork: data.artwork || null,
      })
      .returning();

    return NextResponse.json({ podcast: newPodcast }, { status: 201 });
  } catch (error) {
    console.error("[API] Create Podcast error:", error);
    return NextResponse.json(
      { error: "Failed to create podcast" },
      { status: 500 }
    );
  }
}
