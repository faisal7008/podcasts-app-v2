"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Podcast } from "@/types/podcast";

interface MainCarouselProps {
  podcasts: Podcast[];
  className?: string;
}

/**
 * Hero featured podcast carousel.
 * Desktop: 1080px × 272px with gradient overlay.
 * Mobile: 343px × 548px (taller on mobile).
 * Includes blur backdrop effect behind artwork.
 */
export function MainCarousel({ podcasts, className }: MainCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const podcast = podcasts[currentIndex];

  const goTo = (index: number) => {
    setCurrentIndex(
      ((index % podcasts.length) + podcasts.length) % podcasts.length
    );
  };

  return (
    <section
      className={cn("relative w-full overflow-hidden", className)}
      aria-label="Featured podcasts"
      aria-roledescription="carousel"
    >
      {/* Background — artwork with heavy blur */}
      <div className="absolute inset-0 overflow-hidden rounded-[var(--radius-md)]">
        <Image
          src={podcast.artwork}
          alt=""
          fill
          className="object-cover scale-110 blur-[60px] opacity-40"
          aria-hidden="true"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/90 to-surface-dark/60" />
      </div>

      {/* Content */}
      <div
        className={cn(
          "relative flex items-center gap-8 rounded-[var(--radius-md)]",
          "p-6 md:p-10",
          "flex-col md:flex-row",
          "min-h-[400px] md:min-h-[272px]"
        )}
        role="group"
        aria-roledescription="slide"
        aria-label={`${currentIndex + 1} of ${podcasts.length}`}
      >
        {/* Artwork */}
        <div className="relative flex-shrink-0">
          <div className="relative h-[180px] w-[180px] md:h-[192px] md:w-[192px] overflow-hidden rounded-[var(--radius-md)]">
            <Image
              src={podcast.artwork}
              alt={`${podcast.title} cover art`}
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Blurred shadow beneath artwork */}
          <div className="absolute -bottom-3 left-3 right-3 h-[40px] overflow-hidden rounded-[var(--radius-md)] opacity-50">
            <Image
              src={podcast.artwork}
              alt=""
              fill
              className="object-cover blur-[20px]"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Text info */}
        <div className="flex flex-col gap-3 text-center md:text-left">
          {/* Category pill */}
          <span className="inline-flex self-center md:self-start px-3 py-1 rounded-[var(--radius-sm)] bg-white/20 text-white text-[12px] font-bold uppercase tracking-wider">
            {podcast.category}
          </span>

          <h2 className="text-title text-white">{podcast.title}</h2>

          <p className="text-body text-white/70 line-clamp-2 max-w-[500px]">
            {podcast.description}
          </p>

          {/* Actions */}
          <div className="mt-2 flex items-center gap-4 self-center md:self-start">
            <Link
              href={`/channel/${podcast.id}`}
              className={cn(
                "flex items-center gap-2 rounded-full",
                "bg-white px-5 py-2.5",
                "text-[14px] font-bold text-surface-dark",
                "transition-transform hover:scale-105 active:scale-95"
              )}
            >
              <Play size={16} fill="currentColor" />
              Listen Now
            </Link>
            <span className="text-label text-white/50">
              {podcast.episodeCount} episodes
            </span>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {podcasts.length > 1 && (
        <>
          <button
            onClick={() => goTo(currentIndex - 1)}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30"
            aria-label="Previous podcast"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => goTo(currentIndex + 1)}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30"
            aria-label="Next podcast"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {podcasts.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {podcasts.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === currentIndex
                  ? "w-6 bg-white"
                  : "w-2 bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === currentIndex ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
