"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Navigation links shown in the desktop header. */
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Explore" },
];

interface HeaderProps {
  /** If set, shows a back button and this title instead of the logo nav. */
  backTitle?: string;
  /** If set, the back href for the back button. Defaults to "/". */
  backHref?: string;
  /** Whether this is the home page header variant. */
  variant?: "home" | "interior";
}

export function Header({
  backTitle,
  backHref = "/",
  variant = "home",
}: HeaderProps) {
  const pathname = usePathname();
  const isInterior = variant === "interior" || !!backTitle;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-white",
        "border-b border-divider"
      )}
      role="banner"
    >
      <div className="mx-auto flex h-[60px] max-w-[1440px] items-center justify-between px-4 md:px-[180px] lg:px-[271px]">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {isInterior ? (
            <Link
              href={backHref}
              className="flex items-center gap-2 text-text-dark transition-opacity hover:opacity-70"
              aria-label={`Go back to ${backTitle || "previous page"}`}
            >
              <ChevronLeft size={20} strokeWidth={2} />
              {backTitle && (
                <span className="text-subtitle-bold hidden sm:inline">
                  {backTitle}
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2"
              aria-label="Podcasts home"
            >
              {/* Logo mark */}
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-surface-dark">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M8 1C4.134 1 1 4.134 1 8s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7zm0 2.5a4.5 4.5 0 014.5 4.5A4.5 4.5 0 018 12.5 4.5 4.5 0 013.5 8 4.5 4.5 0 018 3.5zM8 6a2 2 0 00-2 2 2 2 0 002 2 2 2 0 002-2 2 2 0 00-2-2z"
                    fill="white"
                  />
                </svg>
              </div>
              <span className="text-heading text-text-dark">Podcasts</span>
            </Link>
          )}
        </div>

        {/* Center navigation (desktop only) */}
        {!isInterior && (
          <nav
            className="hidden md:flex items-center gap-8"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-subtitle transition-colors",
                  pathname === link.href
                    ? "text-text-dark font-bold"
                    : "text-text-muted hover:text-text-dark"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right section */}
        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-dark transition-colors hover:bg-gray-100"
            aria-label="Search"
          >
            <Search size={20} strokeWidth={2} />
          </Link>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-dark transition-colors hover:bg-gray-100"
            aria-label="User profile"
          >
            <User size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
