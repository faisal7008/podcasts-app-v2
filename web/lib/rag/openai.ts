/**
 * OpenAI client for the RAG pipeline (server-side only).
 *
 * Reuses the same Azure OpenAI credentials that the ai-worker uses,
 * but accessed from the Next.js server side for query embedding
 * and answer generation.
 */

import OpenAI from "openai";

// Lazy singleton — instantiated on first use, not at import time
const globalForOpenAI = globalThis as unknown as {
  openAIClient: OpenAI | undefined;
};

function getOpenAIClient(): OpenAI {
  if (globalForOpenAI.openAIClient) return globalForOpenAI.openAIClient;

  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;

  if (!apiKey || !endpoint) {
    throw new Error(
      "Missing AZURE_OPENAI_API_KEY or AZURE_OPENAI_ENDPOINT env vars for RAG pipeline"
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: endpoint,
  });

  if (process.env.NODE_ENV !== "production") globalForOpenAI.openAIClient = client;

  return client;
}

export const RAG_CONFIG = {
  /** Azure OpenAI deployment name for embeddings */
  embeddingModel: process.env.EMBEDDING_DEPLOYMENT_NAME || "text-embedding-3-small",
  /** Azure OpenAI deployment name for chat/generation */
  llmModel: process.env.LLM_DEPLOYMENT_NAME || "gpt-5.4-nano",
  /** Number of chunks to retrieve per query */
  topK: 8,
  /** Minimum cosine similarity score to include a result */
  minScore: 0.3,
  /** Embedding vector dimensions */
  dimensions: 1536,
} as const;

export { getOpenAIClient };
