import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types/podcast";

interface TopChannelsProps {
  channels: Channel[];
  className?: string;
}

/**
 * Ranked list of top podcast channels.
 * Matches Figma's "Top Channels" component.
 * Desktop: 402px × 552px. Mobile: 343px × 552px.
 */
export function TopChannels({ channels, className }: TopChannelsProps) {
  return (
    <div className={cn("flex flex-col", className)} role="list">
      {channels.map((channel) => (
        <Link
          key={channel.id}
          href={`/channel/${channel.id}`}
          className={cn(
            "group flex items-center gap-4 py-3",
            "transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark rounded-lg px-2 -mx-2"
          )}
          role="listitem"
        >
          {/* Rank number */}
          <span className="w-6 text-center text-subtitle-bold text-text-light flex-shrink-0">
            {channel.rank}
          </span>

          {/* Artwork */}
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
            <Image
              src={channel.artwork}
              alt={`${channel.name} artwork`}
              fill
              className="object-cover"
              loading="lazy"
              sizes="48px"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] font-bold text-text-dark leading-tight truncate group-hover:text-text-primary">
              {channel.name}
            </h4>
            <p className="text-[12px] text-text-muted leading-tight truncate">
              {channel.author}
            </p>
          </div>

          {/* Category */}
          <span className="hidden sm:inline text-[11px] text-text-light px-2 py-0.5 rounded-[var(--radius-sm)] bg-divider flex-shrink-0">
            {channel.category}
          </span>
        </Link>
      ))}
    </div>
  );
}
