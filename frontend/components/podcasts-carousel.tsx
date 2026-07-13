"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PodcastCard } from "@/components/podcast-card";
import type { Podcast } from "@/types/podcast";

interface PodcastsCarouselProps {
  podcasts: Podcast[];
  /** Optional title displayed above the carousel. */
  title?: string;
  /** Show "See All" link. */
  seeAllHref?: string;
  className?: string;
}

/**
 * Horizontal scrolling carousel of podcast cards.
 * Desktop: 898px wide, with arrow navigation.
 * Mobile: full-width, horizontal scroll.
 */
export function PodcastsCarousel({
  podcasts,
  title,
  seeAllHref,
  className,
}: PodcastsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -320 : 320;
    el.scrollBy({ left: amount, behavior: "smooth" });
    // Delay check to allow scroll animation
    setTimeout(checkScroll, 350);
  };

  return (
    <section className={cn("w-full", className)} aria-label={title || "Podcasts"}>
      {/* Header row */}
      {(title || seeAllHref) && (
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h3 className="text-subtitle-bold text-text-dark">{title}</h3>
          )}
          {seeAllHref && (
            <a
              href={seeAllHref}
              className="text-body text-text-muted transition-colors hover:text-text-dark"
            >
              See All
            </a>
          )}
        </div>
      )}

      {/* Carousel container */}
      <div className="relative group/carousel">
        {/* Left arrow (desktop only) */}
        <button
          onClick={() => scroll("left")}
          className={cn(
            "absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-3",
            "hidden md:flex h-10 w-10 items-center justify-center",
            "rounded-full bg-white shadow-md border border-divider",
            "transition-all duration-200",
            canScrollLeft
              ? "opacity-0 group-hover/carousel:opacity-100 hover:bg-gray-50"
              : "pointer-events-none opacity-0"
          )}
          aria-label="Scroll left"
          tabIndex={canScrollLeft ? 0 : -1}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        >
          {podcasts.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} size="medium" />
          ))}
        </div>

        {/* Right arrow (desktop only) */}
        <button
          onClick={() => scroll("right")}
          className={cn(
            "absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-3",
            "hidden md:flex h-10 w-10 items-center justify-center",
            "rounded-full bg-white shadow-md border border-divider",
            "transition-all duration-200",
            canScrollRight
              ? "opacity-0 group-hover/carousel:opacity-100 hover:bg-gray-50"
              : "pointer-events-none opacity-0"
          )}
          aria-label="Scroll right"
          tabIndex={canScrollRight ? 0 : -1}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
