"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { EpisodeRow } from "@/components/episode-row";
import { Divider } from "@/components/divider";
import type { Episode, EpisodeSortOption } from "@/types/podcast";

interface EpisodeListProps {
  episodes: Episode[];
  /** Title shown above the list. */
  title?: string;
  /** Called when an episode play button is clicked. */
  onPlay?: (episode: Episode) => void;
  /** Called when an episode more button is clicked. */
  onMore?: (episode: Episode) => void;
  /** Show sort controls. */
  showSort?: boolean;
  className?: string;
}

const sortLabels: Record<EpisodeSortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
  popular: "Most Popular",
};

/**
 * Episode list with optional sort controls.
 * Matches Figma's "Episode List" component.
 */
export function EpisodeList({
  episodes,
  title,
  onPlay,
  onMore,
  showSort = true,
  className,
}: EpisodeListProps) {
  const [sortBy, setSortBy] = useState<EpisodeSortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortedEpisodes = [...episodes].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case "oldest":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "popular":
        return b.number - a.number;
      default:
        return 0;
    }
  });

  return (
    <section className={cn("w-full", className)} aria-label={title || "Episodes"}>
      {/* Header row with sort */}
      {(title || showSort) && (
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h3 className="text-subtitle-bold text-text-dark">{title}</h3>
          )}
          {showSort && (
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={cn(
                  "flex items-center gap-2 text-body text-text-muted",
                  "transition-colors hover:text-text-dark",
                  "px-3 py-1.5 rounded-[var(--radius-sm)] border border-divider"
                )}
                aria-label="Sort episodes"
                aria-expanded={showSortMenu}
              >
                <SlidersHorizontal size={14} />
                <span>{sortLabels[sortBy]}</span>
                <ChevronDown
                  size={14}
                  className={cn(
                    "transition-transform",
                    showSortMenu && "rotate-180"
                  )}
                />
              </button>

              {/* Sort dropdown */}
              {showSortMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSortMenu(false)}
                    aria-hidden="true"
                  />
                  <div
                    className={cn(
                      "absolute right-0 top-full mt-1 z-50",
                      "w-[200px] rounded-[var(--radius-lg)] bg-white",
                      "border border-border shadow-[var(--shadow-menu)]",
                      "py-2"
                    )}
                    role="menu"
                  >
                    {(Object.keys(sortLabels) as EpisodeSortOption[]).map(
                      (option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSortBy(option);
                            setShowSortMenu(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2.5 text-left text-body",
                            "transition-colors hover:bg-gray-50",
                            sortBy === option
                              ? "text-text-dark font-bold"
                              : "text-text-muted"
                          )}
                          role="menuitem"
                        >
                          {sortLabels[option]}
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <Divider className="mb-2" />

      {/* Episode rows */}
      <div className="flex flex-col" role="list">
        {sortedEpisodes.map((episode, i) => (
          <div key={episode.id} role="listitem">
            <EpisodeRow
              episode={episode}
              onPlay={onPlay}
              onMore={onMore}
            />
            {i < sortedEpisodes.length - 1 && (
              <Divider className="ml-[52px]" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
