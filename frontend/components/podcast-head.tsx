"use client";

import { useState } from "react";
import Image from "next/image";
import { Share2, UserPlus, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseHtml, formatCategory } from "@/lib/sanitize";
import { usePlayer } from "@/components/player/player-provider";
import type { Podcast } from "@/types/podcast";

interface PodcastHeadProps {
  podcast: Podcast;
  className?: string;
}

export function PodcastHead({ podcast, className }: PodcastHeadProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const player = usePlayer();
  const category = formatCategory(podcast.category);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      player.showToast("Link copied to clipboard!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className={cn("w-full", className)} aria-label={podcast.title}>
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Artwork with blur shadow */}
        <div className="relative flex-shrink-0 self-center md:self-start">
          <div className="relative h-[200px] w-[200px] md:h-[240px] md:w-[240px] overflow-hidden rounded-[var(--radius-md)]">
            <Image
              src={podcast.artwork}
              alt={`${podcast.title} cover art`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 200px, 240px"
            />
          </div>
          {/* Blurred shadow */}
          <div className="absolute -bottom-4 left-4 right-4 h-[60px] overflow-hidden rounded-[var(--radius-md)] opacity-40">
            <Image
              src={podcast.artwork}
              alt=""
              fill
              className="object-cover blur-[40px]"
              aria-hidden="true"
              sizes="(max-width: 768px) 200px, 240px"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Category pill */}
          {category && (
            <span className="inline-flex self-center md:self-start px-3 py-1 rounded-[var(--radius-sm)] bg-surface-dark text-white text-[12px] font-bold uppercase tracking-wider truncate max-w-[250px]">
              {category}
            </span>
          )}

          <h1 className="text-title text-text-dark text-center md:text-left">
            {podcast.title}
          </h1>

          <div className="text-center md:text-left relative">
            <div
              className={cn(
                "text-body text-text-primary prose prose-sm max-w-none prose-p:my-0 prose-a:text-primary",
                !isExpanded && "line-clamp-4"
              )}
            >
              {parseHtml(podcast.description)}
            </div>
            {podcast.description?.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary font-medium mt-1 hover:underline text-sm"
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>

          {/* Episode count */}
          <p className="text-label text-text-dark mt-2 text-center md:text-left">
            {podcast.episodeCount} AVAILABLE EPISODES
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-center md:justify-start gap-4 mt-2 flex-wrap">
            {/* <button
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-full transition-transform hover:scale-105 active:scale-95"
              aria-label="Play latest episode"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Play Latest</span>
            </button> */}
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 border font-bold rounded-full transition-colors",
                isFollowing
                  ? "border-divider text-text-muted hover:bg-gray-50"
                  : "border-primary text-primary hover:bg-primary/10"
              )}
              aria-label={isFollowing ? "Unfollow this podcast" : "Follow this podcast"}
            >
              {isFollowing ? (
                <UserCheck size={18} strokeWidth={2} />
              ) : (
                <UserPlus size={18} strokeWidth={2} />
              )}
              <span>{isFollowing ? "Following" : "Follow"}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-2.5 border border-divider text-text-dark font-bold rounded-full transition-colors hover:bg-gray-100"
              aria-label="Share this podcast"
            >
              <Share2 size={18} strokeWidth={2} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
