"use client";

import Image from "next/image";
import { Play, Pause, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/components/player/player-provider";

interface MiniPlayerProps {
  className?: string;
}

/**
 * Mobile bottom mini player bar.
 * 375px × 80px, dark background (#131414).
 * Matches Figma's "Mini Player Container" component.
 */
export function MiniPlayer({ className }: MiniPlayerProps) {
  const player = usePlayer();

  if (!player.currentEpisode || !player.isMiniPlayerVisible) return null;

  const episode = player.currentEpisode;
  const progress =
    player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-surface-dark text-white",
        "md:hidden",
        className
      )}
      role="region"
      aria-label="Mini player"
    >
      {/* Progress bar */}
      <div className="h-[3px] w-full bg-white/10">
        <div
          className="h-full bg-white transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex items-center gap-3 px-4 h-[77px]">
        {/* Artwork */}
        <button
          onClick={player.openPlayer}
          className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-[6px]"
          aria-label="Open full player"
        >
          <Image
            src={episode.artwork}
            alt={`${episode.title} cover`}
            fill
            className="object-cover"
          />
        </button>

        {/* Info */}
        <button
          onClick={player.openPlayer}
          className="flex-1 min-w-0 text-left"
        >
          <h4 className="text-[14px] font-bold text-white truncate">
            {episode.title}
          </h4>
          <p className="text-[12px] text-white/50 truncate">
            {episode.podcastTitle}
          </p>
        </button>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={player.togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-opacity hover:opacity-80"
            aria-label={player.isPlaying ? "Pause" : "Play"}
          >
            {player.isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          <button
            onClick={player.openPlayer}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/40 transition-opacity hover:text-white"
            aria-label="Expand player"
          >
            <ChevronUp size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
