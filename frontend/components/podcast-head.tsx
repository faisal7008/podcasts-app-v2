import Image from "next/image";
import { Share2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Podcast } from "@/types/podcast";

interface PodcastHeadProps {
  podcast: Podcast;
  className?: string;
}

/**
 * Channel/podcast header with large artwork, title, description, and actions.
 * Matches Figma's "Podcasts Head" component.
 * Desktop: 898px × 474px. Mobile: 343px × 474px.
 */
export function PodcastHead({ podcast, className }: PodcastHeadProps) {
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
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Category pill */}
          <span className="inline-flex self-center md:self-start px-3 py-1 rounded-[var(--radius-sm)] bg-surface-dark text-white text-[12px] font-bold uppercase tracking-wider">
            {podcast.category}
          </span>

          <h1 className="text-title text-text-dark text-center md:text-left">
            {podcast.title}
          </h1>

          <p className="text-body text-text-primary text-center md:text-left line-clamp-4">
            {podcast.description}
          </p>

          {/* Episode count */}
          <p className="text-label text-text-dark mt-2">
            {podcast.episodeCount} AVAILABLE EPISODES
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-6 mt-1">
            <button
              className="flex items-center gap-2 text-subtitle text-text-primary transition-opacity hover:opacity-70"
              aria-label="Follow this podcast"
            >
              <UserPlus size={20} strokeWidth={1.5} />
              <span>Follow</span>
            </button>
            <button
              className="flex items-center gap-2 text-subtitle text-text-primary transition-opacity hover:opacity-70"
              aria-label="Share this podcast"
            >
              <Share2 size={20} strokeWidth={1.5} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
