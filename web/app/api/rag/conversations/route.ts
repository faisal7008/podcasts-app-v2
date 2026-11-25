/**
 * GET / DELETE /api/rag/conversations — Manage persisted AI chat conversations.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatConversation } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const episodeId = searchParams.get("episodeId");

    if (id) {
      const [conv] = await db
        .select()
        .from(chatConversation)
        .where(
          and(
            eq(chatConversation.id, id),
            eq(chatConversation.userId, session.user.id)
          )
        )
        .limit(1);

      if (!conv) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
      return NextResponse.json({ conversation: conv });
    }

    const conditions = [eq(chatConversation.userId, session.user.id)];
    if (episodeId) {
      conditions.push(eq(chatConversation.episodeId, episodeId));
    }

    const conversations = await db
      .select({
        id: chatConversation.id,
        episodeId: chatConversation.episodeId,
        title: chatConversation.title,
        updatedAt: chatConversation.updatedAt,
        createdAt: chatConversation.createdAt,
      })
      .from(chatConversation)
      .where(and(...conditions))
      .orderBy(desc(chatConversation.updatedAt))
      .limit(20);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[RAG Conversations] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Conversation id is required" }, { status: 400 });
    }

    await db
      .delete(chatConversation)
      .where(
        and(
          eq(chatConversation.id, id),
          eq(chatConversation.userId, session.user.id)
        )
      );

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[RAG Conversations] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
