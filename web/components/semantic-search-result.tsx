"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface SemanticChunk {
  id: string;
  content: string;
  score: number;
  timestamp: string | null;
  preview: string;
}

interface SemanticSearchResultProps {
  episodeId: string;
  episodeTitle: string;
  podcastTitle: string;
  artwork: string;
  chunks: SemanticChunk[];
  query: string;
}

/**
 * Semantic search result card — shows an episode with its matching chunks.
 * Each chunk displays the matched text with relevance score and timestamp.
 */
export function SemanticSearchResult({
  episodeId,
  episodeTitle,
  podcastTitle,
  artwork,
  chunks,
  query,
}: SemanticSearchResultProps) {
  const topScore = chunks[0]?.score || 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4",
        "rounded-[var(--radius-lg)] border border-divider/50",
        "bg-bg hover:shadow-md",
        "transition-all duration-200"
      )}
    >
      {/* Episode header */}
      <a
        href={`/episode/${episodeId}`}
        className="flex items-center gap-3 group"
      >
        <div className="relative w-12 h-12 rounded-[var(--radius-sm)] overflow-hidden shrink-0">
          {artwork ? (
            <Image
              src={artwork.startsWith("http") || artwork.startsWith("/") ? artwork : `https://podcastsaistorage.blob.core.windows.net/podcasts/${artwork}`}
              alt={episodeTitle}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="w-full h-full bg-surface-dark/10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-text-muted">EP</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-text-dark truncate group-hover:underline">
            {episodeTitle}
          </h3>
          <p className="text-[12px] text-text-muted truncate">{podcastTitle}</p>
        </div>

        {/* Top relevance score */}
        <div
          className={cn(
            "px-2 py-1 rounded-full text-[10px] font-bold shrink-0",
            topScore >= 0.7
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : topScore >= 0.5
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          )}
        >
          {(topScore * 100).toFixed(0)}% match
        </div>
      </a>

      {/* Matched chunks */}
      <div className="flex flex-col gap-2 ml-15">
        {chunks.slice(0, 2).map((chunk) => (
          <div
            key={chunk.id}
            className={cn(
              "flex gap-2 p-3 rounded-[var(--radius-sm)]",
              "bg-surface-dark/[0.03] dark:bg-white/[0.03]",
              "border-l-2",
              chunk.score >= 0.7
                ? "border-emerald-500"
                : chunk.score >= 0.5
                  ? "border-amber-500"
                  : "border-divider"
            )}
          >
            <div className="flex-1 min-w-0">
              {chunk.timestamp && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mr-2 mb-1 text-[10px] font-mono font-bold rounded bg-surface-dark/10 dark:bg-white/10 text-text-muted">
                  ▶ {chunk.timestamp}
                </span>
              )}
              <p className="text-[12px] text-text-primary leading-relaxed line-clamp-3">
                <HighlightedText text={chunk.preview} query={query} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Simple text highlighter that bolds query terms in the result text.
 */
function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  if (!query.trim()) return <>{text}</>;

  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (terms.length === 0) return <>{text}</>;

  // Build a regex to match any of the query terms
  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );

  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark
            key={i}
            className="bg-violet-200/50 dark:bg-violet-500/20 text-text-dark rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
