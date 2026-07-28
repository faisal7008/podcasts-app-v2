"use client";

import { cn } from "@/lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile bottom sheet drawer with blur backdrop.
 * Matches Figma's "Drawer With Button (Blueprint)" component.
 * Backdrop: rgba(255,255,255,0.35) + blur(40px).
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  className,
}: DrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Drawer"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/35 backdrop-blur-[40px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer sheet */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0",
          "bg-white rounded-t-[var(--radius-lg)]",
          "shadow-[0px_-5px_25px_rgba(0,0,0,0.1)]",
          "animate-slide-up",
          "max-h-[80vh] overflow-y-auto",
          className
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-[3px] w-8 rounded-full bg-surface-dark/20" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-6 pb-2">
            <h3 className="text-subtitle-bold text-text-dark">{title}</h3>
          </div>
        )}

        {/* Content */}
        <div className="px-6 pb-6">{children}</div>

        {/* Close button */}
        <div className="border-t border-divider px-6 py-4">
          <button
            onClick={onClose}
            className="w-full text-center text-heading text-text-dark py-2 transition-opacity hover:opacity-70"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
