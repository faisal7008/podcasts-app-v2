/**
 * RAG Query Rewriter — Contextualizes follow-up questions using chat history.
 *
 * Converts ambiguous follow-ups (e.g. "What trade-offs did they mention for it?")
 * into standalone search queries before embedding & retrieval.
 */

import { getOpenAIClient, RAG_CONFIG } from "./openai";
import type { ChatMessage } from "./generator";

const REWRITE_SYSTEM_PROMPT = `You are a search query rewriter for a podcast transcript search engine.
Given the recent conversation history and the user's latest follow-up question, rewrite the latest question into a single self-contained search query that includes any necessary entities or context from the history.
Rules:
- Output ONLY the rewritten search query, nothing else.
- If the latest question is already self-contained, return it unchanged.
- Keep it concise (under 25 words).`;

export async function rewriteQueryWithHistory(
  query: string,
  history: ChatMessage[] = []
): Promise<string> {
  if (!history || history.length === 0) {
    return query;
  }

  try {
    const client = getOpenAIClient();
    const recent = history
      .slice(-4)
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 400)}`)
      .join("\n");

    if (!recent) {
      return query;
    }

    const response = await client.chat.completions.create({
      model: RAG_CONFIG.llmModel,
      temperature: 0,
      max_completion_tokens: 120,
      messages: [
        { role: "system", content: REWRITE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Conversation history:\n${recent}\n\nLatest question: ${query}\n\nStandalone search query:`,
        },
      ],
    });

    const rewritten = response.choices[0]?.message?.content?.trim();
    return rewritten && rewritten.length > 0 ? rewritten : query;
  } catch {
    // Non-fatal: fall back to original query if rewriting fails
    return query;
  }
}
