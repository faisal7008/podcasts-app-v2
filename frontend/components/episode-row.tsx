"use client";

import Link from "next/link";
import { Play, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDuration, truncate } from "@/lib/utils";
import type { Episode } from "@/types/podcast";

interface EpisodeRowProps {
  episode: Episode;
  /** Called when the play button is clicked. */
  onPlay?: (episode: Episode) => void;
  /** Called when the more/context menu button is clicked. */
  onMore?: (episode: Episode) => void;
  className?: string;
}

/**
 * Single episode list item matching Figma's episode row style.
 * Shows number + title (18px bold), truncated description (14px muted),
 * date/duration metadata, and play/more buttons.
 */
export function EpisodeRow({
  episode,
  onPlay,
  onMore,
  className,
}: EpisodeRowProps) {
  return (
    <article
      className={cn(
        "group flex items-start gap-3 py-4",
        "transition-colors hover:bg-gray-50 rounded-lg px-2 -mx-2",
        className
      )}
    >
      {/* Play button */}
      <button
        onClick={() => onPlay?.(episode)}
        className={cn(
          "flex-shrink-0 mt-0.5",
          "flex h-10 w-10 items-center justify-center",
          "rounded-full border border-divider bg-white",
          "text-text-dark transition-all",
          "hover:bg-surface-dark hover:text-white hover:border-surface-dark",
          "active:scale-95"
        )}
        aria-label={`Play ${episode.title}`}
      >
        <Play size={14} fill="currentColor" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/episode/${episode.id}`}
          className="block"
        >
          <h4 className="text-subtitle-bold text-text-dark">
            {episode.number}. {episode.title}
          </h4>
          <p className="text-body text-text-muted mt-1 line-clamp-2">
            {truncate(episode.description, 120)}
          </p>
        </Link>
        {/* Metadata */}
        <p className="text-[12px] text-text-light mt-2">
          {formatDate(episode.date)} · {formatDuration(episode.duration)}
        </p>
      </div>

      {/* More button */}
      <button
        onClick={() => onMore?.(episode)}
        className={cn(
          "flex-shrink-0 mt-1",
          "flex h-8 w-8 items-center justify-center",
          "rounded-full text-text-light",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-gray-100 hover:text-text-dark"
        )}
        aria-label={`More options for ${episode.title}`}
      >
        <MoreHorizontal size={18} />
      </button>
    </article>
  );
}
