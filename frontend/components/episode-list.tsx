"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SlidersHorizontal, ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { EpisodeRow } from "@/components/episode-row";
import { Divider } from "@/components/divider";
import type { Episode, EpisodeSortOption } from "@/types/podcast";

interface EpisodeListProps {
  episodes: Episode[];
  title?: string;
  onPlay?: (episode: Episode) => void;
  onMore?: (episode: Episode) => void;
  showSort?: boolean;
  className?: string;
}

const sortLabels: Record<EpisodeSortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
  longest: "Longest",
  shortest: "Shortest",
};

export function EpisodeList({
  episodes,
  title,
  onPlay,
  onMore,
  showSort = true,
  className,
}: EpisodeListProps) {
  const [sortBy, setSortBy] = useState<EpisodeSortOption>("newest");
  const [filterBy, setFilterBy] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Deduplicate episodes by ID to prevent key collision issues
  const uniqueEpisodes = Array.from(
    new Map(episodes.map((ep) => [ep.id, ep])).values()
  );

  // Sorting
  const sortedEpisodes = [...uniqueEpisodes].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case "oldest":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "longest":
        return b.duration - a.duration;
      case "shortest":
        return a.duration - b.duration;
      default:
        return 0;
    }
  });

  // Filtering (mock filter logic as metadata might be limited)
  const filteredEpisodes = sortedEpisodes.filter((episode) => {
    if (filterBy === "bonus" && !episode.title.toLowerCase().includes("bonus")) return false;
    if (filterBy === "trailer" && !episode.title.toLowerCase().includes("trailer")) return false;
    if (searchQuery && !episode.title.toLowerCase().includes(searchQuery.toLowerCase()) && !episode.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const visibleEpisodes = filteredEpisodes.slice(0, visibleCount);

  // We can just rely on the button instead of Intersection Observer for this phase
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  return (
    <section className={cn("w-full", className)} aria-label={title || "Episodes"}>
      {/* Filters and Sort */}
      {(title || showSort) && (
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {title && (
            <h3 className="text-subtitle-bold text-text-dark">{title}</h3>
          )}
          
          <div className="flex flex-col items-center justify-between md:justify-end gap-3 flex-wrap">
            {/* Filter Pills */}
            {showSort && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide flex-1 md:flex-none">
                {["all", "bonus", "trailer"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setFilterBy(filter);
                      setVisibleCount(10); // reset pagination
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors border",
                      filterBy === filter
                        ? "bg-text-dark text-white border-text-dark dark:bg-white dark:text-bg dark:border-white"
                        : "bg-divider text-text-muted border-transparent hover:bg-gray-100 dark:hover:bg-surface-dark hover:text-text-dark"
                    )}
                  >
                    {filter === "all" ? "All Episodes" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            )}

            
          </div>
          <div className="flex w-full justify-between">
            {showSort && (
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Search episodes..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(10);
                  }}
                  className="w-[140px] sm:w-[180px] bg-transparent border border-divider focus:border-text-dark transition-colors text-[13px] rounded-full py-1.5 pl-8 pr-4 text-text-dark placeholder:text-text-muted outline-none"
                />
              </div>
            )}

            {showSort && (
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className={cn(
                    "flex items-center gap-2 text-[13px] font-medium text-text-muted",
                    "transition-colors hover:text-text-dark whitespace-nowrap",
                    "px-3 py-1.5 rounded-full border border-divider"
                  )}
                  aria-label="Sort episodes"
                  aria-expanded={showSortMenu}
                >
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
                    <div
                      className="fixed inset-0 z-[60]"
                      onClick={() => setShowSortMenu(false)}
                      aria-hidden="true"
                    />
                     <div
                      className={cn(
                        "absolute right-0 top-full mt-2 z-[70]",
                        "w-[200px] rounded-xl bg-bg",
                        "border border-divider shadow-lg dark:shadow-black/40",
                        "py-1"
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
                              setVisibleCount(10); // reset pagination
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 text-left text-[14px]",
                              "transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark flex items-center justify-between",
                              sortBy === option
                                ? "text-primary font-bold"
                                : "text-text-dark"
                            )}
                            role="menuitem"
                          >
                            {sortLabels[option]}
                            {sortBy === option && <Check size={16} />}
                          </button>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            </div>
        </div>
      )}

      {/* Divider */}
      <Divider className="mb-0" />

      {/* Episode rows */}
      <div className="flex flex-col gap-0" role="list">
        {visibleEpisodes.map((episode, i) => (
          <div key={episode.id} role="listitem">
            <EpisodeRow
              episode={episode}
              onPlay={onPlay}
              onMore={onMore}
            />
            {i < filteredEpisodes.length - 1 && (
              <Divider />
            )}
          </div>
        ))}
        
        {filteredEpisodes.length === 0 && (
          <div className="py-12 text-center text-text-muted">
            <p>No episodes found.</p>
          </div>
        )}

        {visibleCount < filteredEpisodes.length && (
          <div className="py-8 flex justify-center">
            <button 
              onClick={handleLoadMore}
              className="px-6 py-2.5 rounded-full border-2 border-divider text-[14px] font-bold text-text-dark hover:border-text-dark hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
            >
              More Episodes
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
