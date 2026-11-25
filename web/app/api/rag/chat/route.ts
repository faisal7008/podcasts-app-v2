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
import { semanticSearch, generateStreamingAnswer, rewriteQueryWithHistory } from "@/lib/rag";
import type { ChatMessage, RetrievedChunk } from "@/lib/rag";
import { checkRateLimit } from "@/lib/rag/rate-limiter";
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

    // 4. Contextualize follow-up queries and retrieve relevant chunks (hybrid search)
    const conversationHistory = history || [];
    const searchQuery = await rewriteQueryWithHistory(query.trim(), conversationHistory);
    const chunks = await semanticSearch(searchQuery, {
      episodeId,
      podcastId,
      userId,
      topK: 8,
    });

    // 5. Short-circuit if no relevant transcript chunks were found (saves LLM cost)
    if (chunks.length === 0) {
      const noMatchText =
        "I couldn't find any relevant transcript excerpts for your question. Try rephrasing or asking about another topic covered in the podcast.";
      const encoder = new TextEncoder();
      const emptyStream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(`${noMatchText}\n\n[SOURCES][]`));
          controller.close();
        },
      });

      if (conversationId) {
        saveTurnToConversation(
          conversationId,
          userId,
          query.trim(),
          noMatchText,
          [],
          episodeId
        ).catch(() => {});
      }

      return new Response(emptyStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      });
    }

    // 6. Generate streaming answer and tee/capture full text for persistence
    const rawStream = await generateStreamingAnswer(
      query.trim(),
      chunks,
      conversationHistory
    );

    let streamToReturn = rawStream;
    if (conversationId) {
      const [clientStream, persistStream] = rawStream.tee();
      streamToReturn = clientStream;
      persistStreamedTurn(
        persistStream,
        conversationId,
        userId,
        query.trim(),
        chunks,
        episodeId
      ).catch(() => {});
    }

    // 7. Return streaming response
    return new Response(streamToReturn, {
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
 * Consume the tee'd response stream and persist both user and assistant messages.
 */
async function persistStreamedTurn(
  stream: ReadableStream<Uint8Array>,
  conversationId: string,
  userId: string,
  query: string,
  chunks: RetrievedChunk[],
  episodeId?: string
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }

  const answerText = fullText.split("\n\n[SOURCES]")[0].trim();
  const sources = chunks.map((c) => ({
    id: c.id,
    episodeId: c.episodeId,
    episodeTitle: c.episodeTitle,
    podcastTitle: c.podcastTitle,
    score: c.score,
    timestamp: (c.metadata as Record<string, string>)?.first_timestamp || null,
  }));

  await saveTurnToConversation(
    conversationId,
    userId,
    query,
    answerText,
    sources,
    episodeId
  );
}

/**
 * Save a user + assistant turn to an existing or new conversation.
 */
async function saveTurnToConversation(
  conversationId: string,
  userId: string,
  query: string,
  answer: string,
  sources: Record<string, unknown>[],
  episodeId?: string
) {
  try {
    const now = new Date().toISOString();
    const newEntries = [
      { role: "user", content: query, timestamp: now },
      { role: "assistant", content: answer, sources, timestamp: now },
    ];

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
      const messages = (existing[0].messages as unknown[]) || [];
      messages.push(...newEntries);

      await db
        .update(chatConversation)
        .set({ messages, updatedAt: new Date() })
        .where(eq(chatConversation.id, conversationId));
    } else {
      await db.insert(chatConversation).values({
        id: conversationId,
        userId,
        episodeId: episodeId || null,
        title: query.slice(0, 100),
        messages: newEntries,
      });
    }
  } catch (err) {
    console.error("[RAG Chat] Failed to save conversation:", err);
  }
}
