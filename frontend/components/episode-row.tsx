"use client";

import Link from "next/link";
import { Play, Pause, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDuration } from "@/lib/utils";
import { parseHtml, formatEpisodeTitle, formatEpisodeNumber } from "@/lib/sanitize";
import { motion } from "framer-motion";
import { usePlayer } from "@/components/player/player-provider";
import type { Episode } from "@/types/podcast";

interface EpisodeRowProps {
  episode: Episode;
  /** Called when the play button is clicked. */
  onPlay?: (episode: Episode) => void;
  /** Called when the more/context menu button is clicked. */
  onMore?: (episode: Episode) => void;
  className?: string;
}


export function EpisodeRow({
  episode,
  onPlay,
  onMore,
  className,
}: EpisodeRowProps) {
  const player = usePlayer();
  const isPlaying = player.currentEpisode?.id === episode.id && player.isPlaying;
  const isActive = player.currentEpisode?.id === episode.id;

  const handlePlay = () => {
    if (isActive) {
      player.togglePlay();
    } else {
      onPlay?.(episode);
    }
  };

  const title = formatEpisodeTitle(episode.title);
  const epNumber = formatEpisodeNumber(undefined, episode.number);
  const progressPercent = player.duration > 0 ? player.currentTime / player.duration : 0;
  const radius = 23;
  const circumference = 2 * Math.PI * radius;

  return (
    <article
      className={cn(
        "group flex items-start gap-3 md:gap-4 py-4 md:py-5 min-h-[72px]",
        "transition-colors hover:bg-black/5 dark:hover:bg-white/5 rounded-xl px-4 -mx-3",
        isActive && "bg-black/5 dark:bg-white/5 border-l-[3px] border-text-dark dark:border-white",
        className
      )}
    >
      {/* Play button / Circular Progress */}
      <div className="relative flex-shrink-0 mt-0.5 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center">
        {isActive && (
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="23" fill="transparent" className="stroke-divider" strokeWidth="2" />
            <circle
              cx="24"
              cy="24"
              r="23"
              fill="transparent"
              className="stroke-text-dark dark:stroke-white transition-all duration-300 ease-linear"
              strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progressPercent)}
              strokeLinecap="round"
            />
          </svg>
        )}
        <button
          onClick={handlePlay}
          className={cn(
            "flex items-center justify-center rounded-full transition-all active:scale-95 z-10",
            isActive 
              ? "h-8 w-8 md:h-10 md:w-10 bg-text-dark text-white dark:bg-white dark:text-bg" 
              : "h-10 w-10 md:h-12 md:w-12 border border-divider bg-bg dark:bg-surface-dark hover:bg-surface-dark hover:text-white hover:border-surface-dark dark:hover:bg-white dark:hover:text-bg dark:hover:border-white text-text-dark"
          )}
          aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
        >
          {isPlaying ? (
            <Pause size={isActive ? 16 : 18} fill="currentColor" />
          ) : isActive ? (
            <Play size={isActive ? 16 : 18} fill="currentColor" className="ml-1" />
          ) : (
            <Play size={18} fill="currentColor" className="ml-1" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/episode/${episode.id}`}
          className="block w-fit"
        >
          <h4 className={cn(
            "text-[15px] md:text-[16px] text-text-dark font-bold line-clamp-1 hover:underline cursor-pointer tracking-tight",
            isActive && "text-primary"
          )}>
            {epNumber ? `${epNumber} - ${title}` : title}
          </h4>
        </Link>
        <div className="text-[13px] md:text-[14px] text-text-muted mt-1.5 line-clamp-2 prose prose-sm max-w-none prose-p:my-0 prose-a:text-primary leading-relaxed opacity-90">
          {parseHtml(episode.description)}
        </div>
        {/* Metadata */}
        <p className="text-[12px] md:text-[13px] text-text-light mt-2.5 font-medium flex items-center gap-2">
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
          "md:opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-gray-100 dark:hover:bg-surface-dark hover:text-text-dark"
        )}
        aria-label={`More options for ${title}`}
      >
        <MoreHorizontal size={18} />
      </button>
    </article>
  );
}
