"use client";

import { Share2, Download, ListPlus, Heart } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatDate, formatDuration } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Episode } from "@/types/podcast";
import Image from "next/image";

interface EpisodeHeadProps {
  episode: Episode;
  onPlay?: () => void;
  className?: string;
}

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

/**
 * Episode header matching Figma's "Episode Head" component.
 * Shows artwork, title, metadata (date/duration), description, and actions.
 * Desktop: 898px × 424px. Mobile: 343px × 424px.
 */
export function EpisodeHead({ episode, onPlay, className }: EpisodeHeadProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: likeData, mutate: mutateLike, isLoading: isLikeLoading } = useSWR(
    `/api/likes?episodeId=${episode.id}`,
    fetcher
  );

  const isLiked = likeData?.isLiked ?? false;

  const handleLike = async () => {
    if (isLikeLoading) return;
    // Optimistic UI update
    const previousState = isLiked;
    mutateLike({ isLiked: !isLiked }, false);

    try {
      if (previousState) {
        const res = await fetch("/api/likes", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ episodeId: episode.id }),
        });
        if (!res.ok) throw new Error("Failed to unlike");
      } else {
        const res = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ episodeId: episode.id }),
        });
        if (!res.ok) {
          if (res.status === 401) {
            toast.error("Sign in to like episodes");
            mutateLike({ isLiked: previousState }, false);
            return;
          }
          throw new Error("Failed to like");
        }
      }
      mutateLike(); // Revalidate
    } catch (err) {
      mutateLike({ isLiked: previousState }, false);
      toast.error("Something went wrong. Please try again.");
    }
  };

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
              sizes="(max-width: 768px) 180px, 200px"
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
              sizes="(max-width: 768px) 180px, 200px"
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
          {/* <div className="text-body text-text-primary text-center md:text-left line-clamp-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(episode.description) }} /> */}
          <div className="text-center md:text-left relative">
            <div
              className={cn(
                "text-body text-text-primary prose prose-sm max-w-none prose-p:my-0 prose-a:text-primary",
                !isExpanded && "line-clamp-4"
              )}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(episode.description) }}
            />
            {episode.description?.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary font-medium mt-1 hover:underline text-sm"
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>

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
              onClick={handleLike}
              disabled={isLikeLoading}
              className={cn(
                "flex items-center gap-2 text-subtitle transition-opacity hover:opacity-70",
                isLiked ? "text-red-500" : "text-text-primary"
              )}
              aria-label={isLiked ? "Unlike episode" : "Like episode"}
            >
              <Heart size={20} strokeWidth={1.5} fill={isLiked ? "currentColor" : "none"} />
              <span className="hidden sm:inline">{isLiked ? "Liked" : "Like"}</span>
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
