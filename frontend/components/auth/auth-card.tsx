"use client";

import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

/**
 * Shared auth card wrapper — centered, max-w-md, with Podcasts logo.
 * Matches the existing Figma design tokens.
 */
export function AuthCard({ children, title, subtitle, className }: AuthCardProps) {
  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <img
          src="/favicon-light.svg"
          alt="Podcasts Logo"
          className="h-8 w-8 dark:hidden"
        />
        <img
          src="/favicon-dark.svg"
          alt="Podcasts Logo"
          className="h-8 w-8 hidden dark:block"
        />
        <span className="text-heading text-text-dark font-bold text-xl tracking-tight">
          Podcasts
        </span>
      </div>

      {/* Card */}
      <div className="rounded-[var(--radius-lg)] border border-divider bg-bg p-8 shadow-[var(--shadow-menu)]">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-heading text-text-dark">{title}</h1>
          {subtitle && (
            <p className="text-body text-text-muted mt-2">{subtitle}</p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
