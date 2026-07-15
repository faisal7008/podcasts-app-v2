"use client";

import Image from "next/image";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  ListMusic,
  Share2,
  Clock,
} from "lucide-react";
import { cn, formatPlayerTime } from "@/lib/utils";
import { usePlayer } from "@/components/player/player-provider";
import { QueuePanel } from "@/components/player/queue-panel";

export function BottomPlayer() {
  const player = usePlayer();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          player.togglePlay();
          break;
        case "arrowleft":
          player.skipBackward(15);
          break;
        case "arrowright":
          player.skipForward(30);
          break;
        case "m":
          player.setVolume(player.volume > 0 ? 0 : 0.8);
          break;
        case "f":
          if (player.isPlayerOpen) player.closePlayer();
          else player.openPlayer();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [player]);

  if (!player.currentEpisode || !player.isMiniPlayerVisible) return null;

  const episode = player.currentEpisode;
  const progress =
    player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <>
      {/* Collapsed Bottom Bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 bg-surface-dark text-white border-t border-white/10 transition-transform duration-300",
          player.isPlayerOpen ? "translate-y-full" : "translate-y-0"
        )}
      >
        {/* Mobile Progress bar (top edge) */}
        <div className="absolute top-0 left-0 h-[3px] w-full bg-white/10 md:hidden cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pos = (e.clientX - rect.left) / rect.width;
          player.seek(pos * player.duration);
        }}>
          <div
            className="h-full bg-white"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 md:gap-4 px-4 h-[64px] md:h-[80px] lg:h-[90px] max-w-7xl mx-auto w-full">
          {/* Artwork */}
          <button
            onClick={player.openPlayer}
            className="relative h-10 w-10 md:h-12 md:w-12 flex-shrink-0 overflow-hidden rounded-[6px]"
            aria-label="Expand player"
          >
            <Image
              src={episode.artwork}
              alt={`${episode.title} cover`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 40px, 48px"
            />
          </button>

          {/* Info */}
          <button
            onClick={player.openPlayer}
            className="flex-1 md:flex-none md:w-[160px] lg:w-[220px] min-w-0 text-left flex flex-col justify-center"
          >
            <h4 className="text-[14px] font-bold text-white truncate">
              {episode.title}
            </h4>
            <p className="text-[12px] text-white/50 truncate">
              {episode.podcastTitle}
            </p>
          </button>

          {/* Play/Skip Controls */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <button
              onClick={() => player.skipBackward(15)}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
              aria-label="Skip back 15 seconds"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={player.togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-surface-dark hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
              aria-label={player.isPlaying ? "Pause" : "Play"}
            >
              {player.isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            <button
              onClick={() => player.skipForward(30)}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
              aria-label="Skip forward 30 seconds"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Desktop Progress Bar */}
          <div className="hidden md:flex flex-1 items-center gap-3 max-w-2xl mx-auto px-4" title={formatPlayerTime(player.currentTime)}>
            <span className="text-[12px] font-mono text-white/50 w-10 text-right flex-shrink-0">
              {formatPlayerTime(player.currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={player.duration || 100}
              value={player.currentTime}
              onChange={(e) => player.seek(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
              aria-label="Seek position"
              style={{
                background: `linear-gradient(to right, #ffffff ${progress}%, rgba(255,255,255,0.2) ${progress}%)`,
              }}
            />
            <span className="text-[12px] font-mono text-white/50 w-10 flex-shrink-0">
              {formatPlayerTime(player.duration)}
            </span>
          </div>

          {/* Desktop Volume */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0 w-28">
            <button
              onClick={() => player.setVolume(player.volume > 0 ? 0 : 0.8)}
              className="text-white/60 hover:text-white transition-colors"
              aria-label={player.volume > 0 ? "Mute" : "Unmute"}
            >
              {player.volume > 0 ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={player.volume}
              onChange={(e) => player.setVolume(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
              aria-label="Volume"
              style={{
                background: `linear-gradient(to right, #fff ${player.volume * 100}%, rgba(255,255,255,0.2) ${player.volume * 100}%)`,
              }}
            />
          </div>
          
          <button
            onClick={player.openPlayer}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full text-white/40 hover:text-white"
            aria-label="Expand player"
          >
            <ChevronUp size={20} />
          </button>
        </div>
      </div>

      {/* Expanded Player Overlay */}
      <AnimatePresence>
        {player.isPlayerOpen && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed inset-0 z-50 flex flex-col bg-surface-dark/95 backdrop-blur-xl text-white",
              "lg:inset-auto lg:bottom-0 lg:left-0 lg:right-0 lg:h-[85vh] lg:rounded-t-[32px] lg:border-t lg:border-white/10",
              "md:pb-safe-bottom"
            )}
            role="dialog"
            aria-label="Full screen player"
            aria-modal="true"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: { offset: { x: number, y: number }, velocity: { x: number, y: number } }) => {
              if (offset.y > 100 || velocity.y > 500) {
                player.closePlayer();
              }
            }}
          >
            {/* Handle bar + close */}
            <div className="flex items-center justify-between px-6 pt-6 lg:pt-8">
              <button
                onClick={player.closePlayer}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
                aria-label="Close player"
              >
                <ChevronDown size={28} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Now Playing
                </span>
                <span className="text-[12px] font-medium text-white/80 mt-0.5">
                  {episode.podcastTitle}
                </span>
              </div>
              <button
                onClick={player.toggleQueue}
                className="flex items-center gap-2 h-10 px-4 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors text-sm font-medium"
                aria-label="Show queue"
              >
                <ListMusic size={18} />
                <span>
                  Queue {player.queue.length > 0 && `(${player.queue.length})`}
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto lg:flex lg:items-center lg:justify-center lg:gap-16 lg:px-12">
              {/* Artwork */}
              <div className="flex-1 flex items-center justify-center px-10 mt-8 lg:mt-0 lg:max-w-[400px]">
                <div className="relative w-full max-w-[320px] lg:max-w-full aspect-square overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src={episode.artwork}
                    alt={`${episode.title} cover art`}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 320px, 400px"
                  />
                </div>
              </div>

              {/* Player Controls Container (Desktop Right Side) */}
              <div className="lg:flex-1 lg:max-w-[500px]">
                {/* Info */}
                <div className="px-8 lg:px-0 mt-8 lg:mt-0 text-center lg:text-left">
                  <h3 className="text-2xl font-bold text-white line-clamp-2">
                    {episode.title}
                  </h3>
                  <p className="text-base text-white/60 mt-2">
                    {episode.podcastTitle}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="px-8 lg:px-0 mt-8">
                  <input
                    type="range"
                    min={0}
                    max={player.duration || 100}
                    value={player.currentTime}
                    onChange={(e) => player.seek(Number(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                    aria-label="Seek position"
                    style={{
                      background: `linear-gradient(to right, #fff ${progress}%, rgba(255,255,255,0.2) ${progress}%)`,
                    }}
                  />
                  <div className="flex justify-between mt-2 text-[12px] font-medium text-white/50">
                    <span>{formatPlayerTime(player.currentTime)}</span>
                    <span>-{formatPlayerTime(player.duration - player.currentTime)}</span>
                  </div>
                </div>

                {/* Main controls */}
                <div className="flex items-center justify-center gap-8 mt-6">
                  <button
                    onClick={() => player.skipBackward(15)}
                    className="flex h-14 w-14 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
                    aria-label="Skip back 15 seconds"
                  >
                    <SkipBack size={32} />
                  </button>

                  <button
                    onClick={player.togglePlay}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-surface-dark transition-transform hover:scale-105 active:scale-95"
                    aria-label={player.isPlaying ? "Pause" : "Play"}
                  >
                    {player.isPlaying ? (
                      <Pause size={36} fill="currentColor" />
                    ) : (
                      <Play size={36} fill="currentColor" className="ml-1.5" />
                    )}
                  </button>

                  <button
                    onClick={() => player.skipForward(30)}
                    className="flex h-14 w-14 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
                    aria-label="Skip forward 30 seconds"
                  >
                    <SkipForward size={32} />
                  </button>
                </div>

                {/* Bottom controls */}
                <div className="flex items-center justify-between px-8 lg:px-0 mt-8 mb-8 flex-wrap gap-4">
                  {/* Secondary Controls (Speed, Timer) */}
                  <div className="flex items-center gap-6">
                    <button className="text-[14px] font-bold text-white/60 hover:text-white transition-colors flex items-center justify-center w-8">
                      1x
                    </button>
                    <button className="text-white/40 hover:text-white transition-colors" aria-label="Sleep Timer">
                      <Clock size={20} />
                    </button>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden lg:flex items-center gap-3 w-32">
                      <button
                      onClick={() => player.setVolume(player.volume > 0 ? 0 : 0.8)}
                      className="text-white/40 hover:text-white transition-colors"
                      aria-label={player.volume > 0 ? "Mute" : "Unmute"}
                    >
                      {player.volume > 0 ? (
                        <Volume2 size={20} />
                      ) : (
                        <VolumeX size={20} />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={player.volume}
                      onChange={(e) => player.setVolume(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                      aria-label="Volume"
                      style={{
                        background: `linear-gradient(to right, #fff ${player.volume * 100}%, rgba(255,255,255,0.2) ${player.volume * 100}%)`,
                      }}
                    />
                  </div>
                  <button
                    className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
                    aria-label="Share episode"
                  >
                    <Share2 size={20} />
                    <span className="hidden lg:inline">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
            
            <QueuePanel />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
