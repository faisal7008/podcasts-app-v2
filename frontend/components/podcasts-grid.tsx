import { cn } from "@/lib/utils";
import { PodcastCard } from "@/components/podcast-card";
import type { Podcast } from "@/types/podcast";

interface PodcastsGridProps {
  podcasts: Podcast[];
  className?: string;
}

/**
 * Grid layout for podcast cards.
 * Used in search results (channels tab).
 * Desktop: 4 columns, Mobile: 2 columns.
 */
export function PodcastsGrid({ podcasts, className }: PodcastsGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6",
        className
      )}
      role="list"
    >
      {podcasts.map((podcast) => (
        <div key={podcast.id} role="listitem">
          <PodcastCard podcast={podcast} size="large" className="w-full" />
        </div>
      ))}
    </div>
  );
}
