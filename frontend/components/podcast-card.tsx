import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Podcast } from "@/types/podcast";

interface PodcastCardProps {
  podcast: Podcast;
  /** Card size variant. */
  size?: "small" | "medium" | "large";
  className?: string;
}

/**
 * Podcast card with artwork, title, and author.
 * Used in carousels and grid layouts.
 */
export function PodcastCard({
  podcast,
  size = "medium",
  className,
}: PodcastCardProps) {
  const sizeClasses = {
    small: "w-[120px]",
    medium: "w-[160px]",
    large: "w-[200px]",
  };

  const imageSizes = {
    small: 120,
    medium: 160,
    large: 200,
  };

  return (
    <Link
      href={`/channel/${podcast.id}`}
      className={cn(
        "group flex flex-col gap-2 flex-shrink-0",
        sizeClasses[size],
        className
      )}
      aria-label={`${podcast.title} by ${podcast.author}`}
    >
      {/* Artwork */}
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-[var(--radius-md)]",
          "bg-gray-100 transition-transform duration-200",
          "group-hover:scale-[1.02]"
        )}
      >
        <Image
          src={podcast.artwork}
          alt={`${podcast.title} cover art`}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5">
        <h3
          className={cn(
            "font-bold text-text-dark leading-tight",
            size === "small" ? "text-[13px]" : "text-[14px]"
          )}
          title={podcast.title}
        >
          <span className="line-clamp-2">{podcast.title}</span>
        </h3>
        <p
          className={cn(
            "text-text-muted leading-tight",
            size === "small" ? "text-[11px]" : "text-[12px]"
          )}
        >
          {podcast.author}
        </p>
      </div>
    </Link>
  );
}
