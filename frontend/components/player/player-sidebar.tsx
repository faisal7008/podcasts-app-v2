"use client";

import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPlayerTime } from "@/lib/utils";
import { usePlayer } from "@/components/player/player-provider";

interface PlayerSidebarProps {
  className?: string;
}

/**
 * Desktop sidebar player panel.
 * 348px wide, full-height, dark background (#131414).
 * Matches Figma's "Player" component.
 */
export function PlayerSidebar({ className }: PlayerSidebarProps) {
  const player = usePlayer();

  if (!player.currentEpisode || !player.isPlayerOpen) return null;

  const episode = player.currentEpisode;
  const progress =
    player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-40",
        "h-screen w-[348px]",
        "bg-surface-dark text-white",
        "shadow-[var(--shadow-player)]",
        "flex flex-col",
        "animate-slide-in-right",
        className
      )}
      role="complementary"
      aria-label="Audio player"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-[14px] font-bold uppercase tracking-wider text-white/60">
          Now Playing
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={player.toggleQueue}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
            aria-label="Toggle queue"
          >
            <ListMusic size={18} />
          </button>
          <button
            onClick={player.closePlayer}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
            aria-label="Close player"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Artwork */}
      <div className="px-6 mt-4">
        <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-md)]">
          <Image
            src={episode.artwork}
            alt={`${episode.title} cover art`}
            fill
            className="object-cover"
          />
        </div>
        {/* Blurred shadow */}
        <div className="relative mx-6 -mt-4 h-[40px] overflow-hidden rounded-[var(--radius-md)] opacity-30">
          <Image
            src={episode.artwork}
            alt=""
            fill
            className="object-cover blur-[30px]"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Episode info */}
      <div className="px-6 mt-6 text-center">
        <h3 className="text-subtitle-bold text-white truncate">
          {episode.title}
        </h3>
        <p className="text-body text-white/50 mt-1 truncate">
          {episode.podcastTitle}
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-6 mt-8">
        <input
          type="range"
          min={0}
          max={player.duration || 100}
          value={player.currentTime}
          onChange={(e) => player.seek(Number(e.target.value))}
          className="w-full"
          aria-label="Seek position"
          style={{
            background: `linear-gradient(to right, #fff ${progress}%, rgba(255,255,255,0.3) ${progress}%)`,
          }}
        />
        <div className="flex justify-between mt-2 text-[11px] text-white/40">
          <span>{formatPlayerTime(player.currentTime)}</span>
          <span>{formatPlayerTime(player.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mt-6">
        <button
          onClick={() => player.skipBackward(15)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
          aria-label="Skip back 15 seconds"
        >
          <SkipBack size={22} />
        </button>

        <button
          onClick={player.togglePlay}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full",
            "bg-white text-surface-dark",
            "transition-transform hover:scale-105 active:scale-95"
          )}
          aria-label={player.isPlaying ? "Pause" : "Play"}
        >
          {player.isPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <button
          onClick={() => player.skipForward(30)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
          aria-label="Skip forward 30 seconds"
        >
          <SkipForward size={22} />
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3 px-8 mt-auto mb-8">
        <button
          onClick={() => player.setVolume(player.volume > 0 ? 0 : 0.8)}
          className="text-white/40 hover:text-white transition-colors"
          aria-label={player.volume > 0 ? "Mute" : "Unmute"}
        >
          {player.volume > 0 ? (
            <Volume2 size={16} />
          ) : (
            <VolumeX size={16} />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={player.volume}
          onChange={(e) => player.setVolume(Number(e.target.value))}
          className="flex-1"
          aria-label="Volume"
          style={{
            background: `linear-gradient(to right, #fff ${player.volume * 100}%, rgba(255,255,255,0.3) ${player.volume * 100}%)`,
          }}
        />
      </div>
    </aside>
  );
}
