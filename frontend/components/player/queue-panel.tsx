"use client";

import Image from "next/image";
import { X, GripVertical, Play, Trash2, ListMusic } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayer } from "@/components/player/player-provider";

export function QueuePanel() {
  const player = usePlayer();

  return (
    <AnimatePresence>
      {player.isQueueOpen && (
        <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={player.toggleQueue}
        className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
        aria-hidden="true"
      />
      
      {/* Queue Panel Slide-out */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(e: any, { offset, velocity }: any) => {
          if (offset.x > 100 || velocity.x > 500) {
            player.toggleQueue();
          }
        }}
        className={cn(
          "absolute right-0 top-0 bottom-0 z-[70]",
          "w-full md:w-[360px]",
          "bg-surface-dark/95 backdrop-blur-3xl md:bg-surface-dark/90",
          "border-l border-white/10 shadow-2xl rounded-tr-[32px]",
          "flex flex-col text-white"
        )}
        role="dialog"
        aria-label="Playback queue"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-[15px] font-bold tracking-wide text-white flex items-center gap-2">
            <ListMusic size={18} />
            Queue
          </h2>
          <div className="flex items-center gap-3">
            {player.queue.length > 0 && (
              <button
                onClick={player.clearQueue}
                className="text-[12px] font-medium text-white/50 hover:text-white transition-colors"
                aria-label="Clear queue"
              >
                Clear All
              </button>
            )}
            <button
              onClick={player.toggleQueue}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Close queue"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Currently playing */}
        {player.currentEpisode && (
          <div className="px-6 py-5 border-b border-white/10 bg-white/5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
              Now Playing
            </p>
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-[8px] shadow-md">
                <Image
                  src={player.currentEpisode.artwork}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-bold text-white truncate">
                  {player.currentEpisode.title}
                </h4>
                <p className="text-[12px] text-white/50 truncate mt-0.5">
                  {player.currentEpisode.podcastTitle}
                </p>
              </div>
              <button
                onClick={player.togglePlay}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-surface-dark hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                aria-label={player.isPlaying ? "Pause" : "Play"}
              >
                {player.isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <Play size={16} fill="currentColor" className="ml-0.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-safe-bottom">
          {player.queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 px-8 text-center pb-12">
              <ListMusic size={48} className="mb-4 opacity-50" strokeWidth={1} />
              <p className="text-[16px] font-bold text-white">Your queue is empty</p>
              <p className="text-[14px] mt-2 max-w-[200px] leading-relaxed">
                Add episodes to play them next
              </p>
            </div>
          ) : (
            <div className="py-4">
              <p className="px-6 text-[11px] font-bold uppercase tracking-wider text-white/40 mb-3">
                Up Next ({player.queue.length})
              </p>
              <Reorder.Group 
                axis="y" 
                values={player.queue} 
                onReorder={player.reorderQueue}
                className="flex flex-col gap-1"
              >
                {player.queue.map((item, index) => (
                  <Reorder.Item
                    key={item.episode.id}
                    value={item}
                    className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-[8px] hover:bg-white/5 transition-colors group cursor-grab active:cursor-grabbing bg-surface-dark md:bg-transparent"
                  >
                    <GripVertical
                      size={16}
                      className="text-white/20 flex-shrink-0 group-hover:text-white/50 transition-colors"
                    />
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-[6px]">
                      <Image
                        src={item.episode.artwork}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="text-[13px] font-bold text-white truncate group-hover:text-primary transition-colors">
                        {item.episode.title}
                      </h4>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        {formatDuration(item.episode.duration)}
                      </p>
                    </div>
                    <button
                      onClick={() => player.removeFromQueue(item.episode.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-red-400 transition-all"
                      aria-label={`Remove ${item.episode.title} from queue`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          )}
        </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
