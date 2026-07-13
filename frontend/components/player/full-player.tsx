"use client";

import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown,
  ListMusic,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPlayerTime } from "@/lib/utils";
import { usePlayer } from "@/components/player/player-provider";

interface FullPlayerProps {
  className?: string;
}

/**
 * Mobile full-screen player.
 * 375px × 752px, dark background (#131414).
 * Matches Figma's "Player" frame on Mobile.
 */
export function FullPlayer({ className }: FullPlayerProps) {
  const player = usePlayer();

  if (!player.currentEpisode || !player.isPlayerOpen) return null;

  const episode = player.currentEpisode;
  const progress =
    player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        "bg-surface-dark text-white",
        "flex flex-col",
        "md:hidden",
        "animate-slide-up",
        className
      )}
      role="dialog"
      aria-label="Full screen player"
      aria-modal="true"
    >
      {/* Handle bar + close */}
      <div className="flex items-center justify-between px-6 pt-safe-top">
        <button
          onClick={player.closePlayer}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
          aria-label="Close player"
        >
          <ChevronDown size={22} />
        </button>
        <span className="text-[12px] font-bold uppercase tracking-wider text-white/40">
          Now Playing
        </span>
        <button
          onClick={player.toggleQueue}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
          aria-label="Show queue"
        >
          <ListMusic size={20} />
        </button>
      </div>

      {/* Artwork */}
      <div className="flex-1 flex items-center justify-center px-10">
        <div className="relative w-full max-w-[280px] aspect-square overflow-hidden rounded-[var(--radius-md)]">
          <Image
            src={episode.artwork}
            alt={`${episode.title} cover art`}
            fill
            className="object-cover"
            priority
          />
          {/* Blurred glow */}
          <div className="absolute -bottom-8 left-8 right-8 h-[60px] overflow-hidden rounded-[var(--radius-md)] opacity-30 -z-10">
            <Image
              src={episode.artwork}
              alt=""
              fill
              className="object-cover blur-[40px] scale-110"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-8 text-center">
        <h3 className="text-subtitle-bold text-white truncate">
          {episode.title}
        </h3>
        <p className="text-body text-white/50 mt-1 truncate">
          {episode.podcastTitle}
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-8 mt-6">
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

      {/* Main controls */}
      <div className="flex items-center justify-center gap-8 mt-4">
        <button
          onClick={() => player.skipBackward(15)}
          className="flex h-12 w-12 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
          aria-label="Skip back 15 seconds"
        >
          <SkipBack size={26} />
        </button>

        <button
          onClick={player.togglePlay}
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full",
            "bg-white text-surface-dark",
            "transition-transform hover:scale-105 active:scale-95"
          )}
          aria-label={player.isPlaying ? "Pause" : "Play"}
        >
          {player.isPlaying ? (
            <Pause size={28} fill="currentColor" />
          ) : (
            <Play size={28} fill="currentColor" className="ml-1" />
          )}
        </button>

        <button
          onClick={() => player.skipForward(30)}
          className="flex h-12 w-12 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
          aria-label="Skip forward 30 seconds"
        >
          <SkipForward size={26} />
        </button>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between px-8 mt-6 mb-safe-bottom pb-6">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => player.setVolume(player.volume > 0 ? 0 : 0.8)}
            className="text-white/40 hover:text-white transition-colors"
            aria-label={player.volume > 0 ? "Mute" : "Unmute"}
          >
            {player.volume > 0 ? (
              <Volume2 size={18} />
            ) : (
              <VolumeX size={18} />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={player.volume}
            onChange={(e) => player.setVolume(Number(e.target.value))}
            className="w-24"
            aria-label="Volume"
            style={{
              background: `linear-gradient(to right, #fff ${player.volume * 100}%, rgba(255,255,255,0.3) ${player.volume * 100}%)`,
            }}
          />
        </div>
        <button
          className="text-white/40 hover:text-white transition-colors"
          aria-label="Share episode"
        >
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
}
