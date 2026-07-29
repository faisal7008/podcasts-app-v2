/**
 * POST /api/rag/chat — RAG Chat Endpoint
 *
 * Accepts a user query, retrieves relevant transcript chunks via pgvector
 * semantic search, and streams a grounded answer from GPT-4o.
 *
 * Request body:
 *   { query: string, episodeId?: string, podcastId?: string, conversationId?: string, history?: ChatMessage[] }
 *
 * Response: Streaming text/event-stream with answer + [SOURCES] JSON suffix.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { semanticSearch, generateStreamingAnswer } from "@/lib/rag";
import type { ChatMessage } from "@/lib/rag";
import { checkRateLimit } from "@/lib/rag/rate-limiter";
import { getCachedEmbedding, setCachedEmbedding } from "@/lib/rag/cache";
import { embedQuery } from "@/lib/rag/retriever";
import { db } from "@/lib/db";
import { chatConversation } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    // 2. Rate limit
    const rateLimit = await checkRateLimit(userId, "chat");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before sending more messages.",
          resetInSeconds: rateLimit.resetInSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetInSeconds),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { query, episodeId, podcastId, conversationId, history } = body as {
      query: string;
      episodeId?: string;
      podcastId?: string;
      conversationId?: string;
      history?: ChatMessage[];
    };

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    if (query.trim().length > 2000) {
      return NextResponse.json(
        { error: "Query too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    // 4. Retrieve relevant chunks
    const chunks = await semanticSearch(query.trim(), {
      episodeId,
      podcastId,
      userId,
      topK: 8,
    });

    // 5. Generate streaming answer
    const conversationHistory = history || [];
    const stream = await generateStreamingAnswer(
      query.trim(),
      chunks,
      conversationHistory
    );

    // 6. Optionally save to conversation history (fire-and-forget)
    if (conversationId) {
      // Don't await — let it happen in the background
      saveToConversation(conversationId, userId, query.trim(), episodeId).catch(
        () => {}
      );
    }

    // 7. Return streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });
  } catch (error) {
    console.error("[RAG Chat] Error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}

/**
 * Save a user query to an existing or new conversation (fire-and-forget).
 */
async function saveToConversation(
  conversationId: string,
  userId: string,
  query: string,
  episodeId?: string
) {
  try {
    // Check if conversation exists
    const existing = await db
      .select()
      .from(chatConversation)
      .where(
        and(
          eq(chatConversation.id, conversationId),
          eq(chatConversation.userId, userId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Append to existing conversation
      const messages = (existing[0].messages as any[]) || [];
      messages.push({ role: "user", content: query, timestamp: new Date().toISOString() });

      await db
        .update(chatConversation)
        .set({ messages, updatedAt: new Date() })
        .where(eq(chatConversation.id, conversationId));
    } else {
      // Create new conversation
      await db.insert(chatConversation).values({
        id: conversationId,
        userId,
        episodeId: episodeId || null,
        title: query.slice(0, 100),
        messages: [{ role: "user", content: query, timestamp: new Date().toISOString() }],
      });
    }
  } catch (err) {
    console.error("[RAG Chat] Failed to save conversation:", err);
  }
}
