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

function MiniEqualizer() {
  return (
    <div className="flex items-end justify-center gap-[2px] h-4 w-4">
      <motion.div animate={{ height: ["4px", "14px", "4px"] }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }} className="w-[3px] bg-primary rounded-t-sm" />
      <motion.div animate={{ height: ["12px", "4px", "12px"] }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }} className="w-[3px] bg-primary rounded-t-sm" />
      <motion.div animate={{ height: ["8px", "16px", "8px"] }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="w-[3px] bg-primary rounded-t-sm" />
    </div>
  );
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

  return (
    <article
      className={cn(
        "group flex items-start gap-3 md:gap-4 py-4 md:py-5 min-h-[72px]",
        "transition-colors hover:bg-black/5 dark:hover:bg-white/5 rounded-xl px-4 -mx-3",
        isActive && "bg-primary/5 border-l-[3px] border-primary",
        className
      )}
    >
      {/* Play button / Equalizer */}
      <button
        onClick={handlePlay}
        className={cn(
          "flex-shrink-0 mt-0.5",
          "flex h-10 w-10 md:h-12 md:w-12 items-center justify-center",
          "rounded-full border bg-white",
          "transition-all active:scale-95",
          isActive 
            ? "border-primary text-primary" 
            : "border-divider hover:bg-surface-dark hover:text-white hover:border-surface-dark"
        )}
        aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
      >
        {isPlaying ? (
          <MiniEqualizer />
        ) : isActive ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" className="ml-1" />
        )}
      </button>

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
          {isActive && player.duration > 0 && (
            <span className="block mt-2 h-1 w-full max-w-[200px] bg-gray-200 rounded-full overflow-hidden">
              <span 
                className="block h-full bg-primary" 
                style={{ width: `${(player.currentTime / player.duration) * 100}%` }}
              />
            </span>
          )}
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
          "hover:bg-gray-100 hover:text-text-dark"
        )}
        aria-label={`More options for ${title}`}
      >
        <MoreHorizontal size={18} />
      </button>
    </article>
  );
}
