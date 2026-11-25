"use client";

import { cn } from "@/lib/utils";
import { usePlayer } from "@/components/player/player-provider";
import type { SourceMeta } from "./chat-provider";
import Image from "next/image";

interface SourceCardProps {
  source: SourceMeta;
  index: number;
}

/**
 * Source citation card — shows the episode + timestamp that the AI answer is grounded in.
 * Clicking the timestamp badge seeks the player to that point in the episode.
 */
export function SourceCard({ source, index }: SourceCardProps) {
  const player = usePlayer();

  const handleTimestampClick = async () => {
    if (!source.timestamp) return;

    // Parse timestamp (MM:SS or HH:MM:SS) to seconds
    const parts = source.timestamp.split(":").map(Number);
    let seconds = 0;
    if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    }

    // If this episode is already loaded, seek directly; otherwise load & seek
    if (player.currentEpisode?.id === source.episodeId) {
      player.seek(seconds);
      return;
    }

    try {
      const res = await fetch(`/api/episodes/${encodeURIComponent(source.episodeId)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.episode) {
        player.play(data.episode);
        setTimeout(() => player.seek(seconds), 250);
      }
    } catch {
      // Non-fatal if episode fetch fails
    }
  };

  const relevanceColor =
    source.score >= 0.7
      ? "text-emerald-500"
      : source.score >= 0.5
        ? "text-amber-500"
        : "text-text-muted";

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-[var(--radius-sm)]",
        "bg-surface-dark/5 dark:bg-white/5",
        "border border-divider/50",
        "transition-colors hover:bg-surface-dark/10 dark:hover:bg-white/10"
      )}
    >
      {/* Mini artwork */}
      <div className="relative w-10 h-10 rounded-[4px] overflow-hidden shrink-0">
        {source.artwork ? (
          <Image
            src={source.artwork}
            alt={source.episodeTitle}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="w-full h-full bg-surface-dark/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-text-muted">
              {index + 1}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-bold text-text-dark truncate">
            {source.episodeTitle}
          </span>
          <span className={cn("text-[10px] font-mono shrink-0", relevanceColor)}>
            {(source.score * 100).toFixed(0)}%
          </span>
        </div>

        {source.timestamp && (
          <button
            onClick={handleTimestampClick}
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 mb-1",
              "text-[10px] font-mono font-bold rounded",
              "bg-surface-dark/10 dark:bg-white/10",
              "text-text-muted hover:text-text-dark",
              "transition-colors cursor-pointer"
            )}
          >
            ▶ {source.timestamp}
          </button>
        )}

        <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
          {source.preview}
        </p>
      </div>
    </div>
  );
}
