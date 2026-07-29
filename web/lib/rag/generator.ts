/**
 * RAG Generator — Produces grounded answers from retrieved transcript chunks.
 *
 * Takes retrieved chunks + user query + conversation history, constructs a
 * RAG prompt with source citations, and calls Azure OpenAI GPT-4o.
 *
 * Supports both streaming (for real-time UI) and non-streaming modes.
 */

import { getOpenAIClient, RAG_CONFIG } from "./openai";
import type { RetrievedChunk } from "./retriever";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: RetrievedChunk[];
}

const SYSTEM_PROMPT = `You are an intelligent AI assistant for a podcast platform. Your role is to help users understand and explore podcast content by answering questions based on transcript excerpts.

**Rules:**
1. ONLY answer based on the provided transcript excerpts (sources). Do NOT make up information.
2. If the excerpts don't contain enough information to answer, say so honestly.
3. Cite sources by referencing the episode title and timestamp when available. Use the format [Episode Title, HH:MM:SS] for citations.
4. Be conversational and helpful, matching the casual tone of podcast discussions.
5. When summarizing, capture the key points without being overly verbose.
6. If timestamps are available in the source metadata, reference them to help the user find the relevant section.
7. Format your responses with markdown for readability (bold, bullet points, etc.)`;

/**
 * Format retrieved chunks into a context block for the LLM.
 */
function formatContextBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "No relevant transcript excerpts found.";
  }

  return chunks
    .map((chunk, i) => {
      const timestamp =
        (chunk.metadata as Record<string, string>)?.first_timestamp || "";
      const header = `[Source ${i + 1}] Episode: "${chunk.episodeTitle}"${timestamp ? ` | Timestamp: ${timestamp}` : ""} | Relevance: ${(chunk.score * 100).toFixed(0)}%`;
      return `${header}\n${chunk.content}`;
    })
    .join("\n\n---\n\n");
}

/**
 * Generate a streaming answer from retrieved chunks.
 *
 * Returns a ReadableStream that emits text chunks as they arrive from the LLM.
 * The final chunk includes a special `[SOURCES]` marker followed by JSON-encoded
 * source metadata for the UI to parse and display citation cards.
 */
export async function generateStreamingAnswer(
  query: string,
  chunks: RetrievedChunk[],
  conversationHistory: ChatMessage[] = []
): Promise<ReadableStream<Uint8Array>> {
  const client = getOpenAIClient();
  const contextBlock = formatContextBlock(chunks);

  // Build messages array with conversation history
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [{ role: "system", content: SYSTEM_PROMPT }];

  // Add recent conversation history (last 6 messages max)
  const recentHistory = conversationHistory.slice(-6);
  for (const msg of recentHistory) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add current query with context
  messages.push({
    role: "user",
    content: `Based on the following transcript excerpts, answer my question.

**Transcript Excerpts:**
${contextBlock}

**My Question:** ${query}`,
  });

  const stream = await client.chat.completions.create({
    model: RAG_CONFIG.llmModel,
    messages,
    stream: true,
    temperature: 0.3,
    max_completion_tokens: 1500,
  });

  // Convert the OpenAI stream to a web-standard ReadableStream
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        }

        // After the answer, append source metadata as a JSON block
        // The frontend parses this to render source citation cards
        const sourceMeta = chunks.map((c) => ({
          id: c.id,
          episodeId: c.episodeId,
          episodeTitle: c.episodeTitle,
          podcastTitle: c.podcastTitle,
          artwork: c.artwork,
          score: c.score,
          timestamp:
            (c.metadata as Record<string, string>)?.first_timestamp || null,
          preview: c.content.slice(0, 150),
        }));

        controller.enqueue(
          encoder.encode(`\n\n[SOURCES]${JSON.stringify(sourceMeta)}`)
        );

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

/**
 * Generate a non-streaming answer (for simpler use cases).
 */
export async function generateAnswer(
  query: string,
  chunks: RetrievedChunk[],
  conversationHistory: ChatMessage[] = []
): Promise<{ answer: string; sources: RetrievedChunk[] }> {
  const client = getOpenAIClient();
  const contextBlock = formatContextBlock(chunks);

  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [{ role: "system", content: SYSTEM_PROMPT }];

  const recentHistory = conversationHistory.slice(-6);
  for (const msg of recentHistory) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({
    role: "user",
    content: `Based on the following transcript excerpts, answer my question.

**Transcript Excerpts:**
${contextBlock}

**My Question:** ${query}`,
  });

  const response = await client.chat.completions.create({
    model: RAG_CONFIG.llmModel,
    messages,
    temperature: 0.3,
    max_completion_tokens: 1500,
  });

  const answer = response.choices[0]?.message?.content || "I couldn't generate an answer.";

  return { answer, sources: chunks };
}
