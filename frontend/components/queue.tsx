"use client";

import Image from "next/image";
import { X, GripVertical, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import { usePlayer } from "@/components/player/player-provider";

interface QueueProps {
  className?: string;
}

/**
 * Queue panel showing upcoming episodes.
 * Desktop: 348px wide sidebar. Mobile: full-screen overlay.
 * Dark background (#131414) matching the player.
 */
export function Queue({ className }: QueueProps) {
  const player = usePlayer();

  if (!player.isQueueOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50",
        // Desktop: sidebar
        "md:right-0 md:top-0 md:h-screen md:w-[348px]",
        // Mobile: full screen
        "inset-0 md:inset-auto",
        "bg-surface-dark text-white",
        "shadow-[var(--shadow-queue)]",
        "flex flex-col",
        className
      )}
      role="dialog"
      aria-label="Playback queue"
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h2 className="text-[14px] font-bold uppercase tracking-wider text-white/60">
          Queue
        </h2>
        <div className="flex items-center gap-2">
          {player.queue.length > 0 && (
            <button
              onClick={player.clearQueue}
              className="text-[12px] text-white/40 hover:text-white transition-colors px-2 py-1"
              aria-label="Clear queue"
            >
              Clear All
            </button>
          )}
          <button
            onClick={player.toggleQueue}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
            aria-label="Close queue"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Currently playing */}
      {player.currentEpisode && (
        <div className="px-6 py-4 border-b border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-3">
            Now Playing
          </p>
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-[6px]">
              <Image
                src={player.currentEpisode.artwork}
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-bold text-white truncate">
                {player.currentEpisode.title}
              </h4>
              <p className="text-[11px] text-white/40 truncate">
                {player.currentEpisode.podcastTitle}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={player.togglePlay}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
                aria-label={player.isPlaying ? "Pause" : "Play"}
              >
                {player.isPlaying ? (
                  <Play size={14} fill="currentColor" />
                ) : (
                  <Play size={14} fill="currentColor" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {player.queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 px-8 text-center">
            <p className="text-subtitle">Your queue is empty</p>
            <p className="text-body mt-2">
              Add episodes to play them next
            </p>
          </div>
        ) : (
          <div className="py-2">
            <p className="px-6 text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
              Up Next ({player.queue.length})
            </p>
            {player.queue.map((item, index) => (
              <div
                key={item.episode.id}
                className="flex items-center gap-3 px-6 py-3 hover:bg-white/5 transition-colors group"
              >
                <GripVertical
                  size={14}
                  className="text-white/20 flex-shrink-0"
                />
                <span className="text-[12px] text-white/30 w-4 text-center flex-shrink-0">
                  {index + 1}
                </span>
                <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-[4px]">
                  <Image
                    src={item.episode.artwork}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-white truncate">
                    {item.episode.title}
                  </h4>
                  <p className="text-[11px] text-white/40">
                    {formatDuration(item.episode.duration)}
                  </p>
                </div>
                <button
                  onClick={() => player.removeFromQueue(item.episode.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white/20 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                  aria-label={`Remove ${item.episode.title} from queue`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
