"use client";

import { Download, Share2, ListPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Episode } from "@/types/podcast";

interface ContextMenuProps {
  episode: Episode;
  isOpen: boolean;
  onClose: () => void;
  /** Position relative to parent. */
  position?: { top: number; left: number };
  onAddToQueue?: (episode: Episode) => void;
  className?: string;
}

/**
 * Episode context menu (3-dot menu).
 * Matches Figma's "Menu (Blueprint)" component.
 * 257px × 185px, white background, 16px border radius.
 */
export function ContextMenu({
  episode,
  isOpen,
  onClose,
  position,
  onAddToQueue,
  className,
}: ContextMenuProps) {
  if (!isOpen) return null;

  const menuItems = [
    {
      icon: ListPlus,
      label: "Add To Queue",
      action: () => {
        onAddToQueue?.(episode);
        onClose();
      },
    },
    {
      icon: Download,
      label: "Download",
      action: () => onClose(),
    },
    {
      icon: Share2,
      label: "Share",
      action: () => onClose(),
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu */}
      <div
        className={cn(
          "absolute z-50",
          "w-[257px] rounded-[var(--radius-lg)]",
          "bg-white border border-border",
          "shadow-[var(--shadow-menu)]",
          "py-2",
          className
        )}
        style={
          position
            ? { top: position.top, left: position.left }
            : undefined
        }
        role="menu"
        aria-label={`Options for ${episode.title}`}
      >
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-3",
              "text-subtitle text-text-primary",
              "transition-colors hover:bg-gray-50"
            )}
            role="menuitem"
          >
            <item.icon size={20} strokeWidth={1.5} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
