"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

/**
 * User avatar with Next.js Image and fallback to initials.
 * Generates initials from the user's name (first two letters of first/last name).
 */
export function Avatar({ src, name, size = 80, className }: AvatarProps) {
  const initials = getInitials(name);

  if (src) {
    return (
      <div
        className={cn(
          "relative rounded-full overflow-hidden bg-divider flex-shrink-0",
          className
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={name || "User avatar"}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-surface-dark flex items-center justify-center flex-shrink-0",
        className
      )}
      style={{ width: size, height: size }}
    >
      <span
        className="text-white font-bold select-none"
        style={{ fontSize: size * 0.35 }}
      >
        {initials}
      </span>
    </div>
  );
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
