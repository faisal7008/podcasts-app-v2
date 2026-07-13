import Image from "next/image";
import { Share2, Download, ListPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDuration } from "@/lib/utils";
import type { Episode } from "@/types/podcast";

interface EpisodeHeadProps {
  episode: Episode;
  onPlay?: () => void;
  className?: string;
}

/**
 * Episode header matching Figma's "Episode Head" component.
 * Shows artwork, title, metadata (date/duration), description, and actions.
 * Desktop: 898px × 424px. Mobile: 343px × 424px.
 */
export function EpisodeHead({ episode, onPlay, className }: EpisodeHeadProps) {
  return (
    <section className={cn("w-full", className)} aria-label={episode.title}>
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Artwork with blur shadow */}
        <div className="relative flex-shrink-0 self-center md:self-start">
          <div className="relative h-[180px] w-[180px] md:h-[200px] md:w-[200px] overflow-hidden rounded-[var(--radius-md)]">
            <Image
              src={episode.artwork}
              alt={`${episode.title} episode art`}
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Blurred shadow */}
          <div className="absolute -bottom-3 left-4 right-4 h-[50px] overflow-hidden rounded-[var(--radius-md)] opacity-40">
            <Image
              src={episode.artwork}
              alt=""
              fill
              className="object-cover blur-[40px]"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3 pt-1">
          {/* Category pill */}
          <span className="inline-flex self-center md:self-start px-3 py-1 rounded-[var(--radius-sm)] bg-surface-dark text-white text-[12px] font-bold uppercase tracking-wider">
            {episode.podcastTitle}
          </span>

          <h1 className="text-title text-text-dark text-center md:text-left">
            {episode.title}
          </h1>

          {/* Metadata */}
          <p className="text-[12px] text-text-light text-center md:text-left">
            {formatDate(episode.date)} · {formatDuration(episode.duration)}
          </p>

          {/* Description */}
          <p className="text-body text-text-primary text-center md:text-left line-clamp-4">
            {episode.description}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-6 mt-2">
            <button
              onClick={onPlay}
              className={cn(
                "flex items-center gap-2 rounded-full",
                "bg-surface-dark px-5 py-2",
                "text-[14px] font-bold text-white",
                "transition-transform hover:scale-105 active:scale-95"
              )}
              aria-label={`Play ${episode.title}`}
            >
              ▶ Play
            </button>
            <button
              className="flex items-center gap-2 text-subtitle text-text-primary transition-opacity hover:opacity-70"
              aria-label="Download episode"
            >
              <Download size={20} strokeWidth={1.5} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              className="flex items-center gap-2 text-subtitle text-text-primary transition-opacity hover:opacity-70"
              aria-label="Share episode"
            >
              <Share2 size={20} strokeWidth={1.5} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              className="flex items-center gap-2 text-subtitle text-text-primary transition-opacity hover:opacity-70"
              aria-label="Add to queue"
            >
              <ListPlus size={20} strokeWidth={1.5} />
              <span className="hidden sm:inline">Queue</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
