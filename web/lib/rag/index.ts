/**
 * RAG Pipeline — Orchestrates retrieval and generation.
 *
 * Entry point for the RAG system. Composes the retriever and generator
 * into a single pipeline: query → embed → retrieve → generate.
 */

export { semanticSearch, embedQuery } from "./retriever";
export type { RetrievedChunk, RetrieveOptions } from "./retriever";

export { generateStreamingAnswer, generateAnswer } from "./generator";
export type { ChatMessage } from "./generator";

export { RAG_CONFIG } from "./openai";
