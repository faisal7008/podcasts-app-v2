"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Library,
  Mic,
  LogOut,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/auth-client";
import { Avatar } from "@/components/profile/avatar";

/** Navigation links shown in the desktop header. */
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
];

export interface Breadcrumb {
  label: string;
  href: string;
}

interface HeaderProps {
  /** If set, shows a back button and this title instead of the logo nav on mobile. */
  backTitle?: string;
  /** If set, the back href for the back button. Defaults to "/". */
  backHref?: string;
  /** Whether this is the home page header variant. */
  variant?: "home" | "interior";
  /** Breadcrumbs to display on desktop */
  breadcrumbs?: Breadcrumb[];
}

export function Header({
  backTitle,
  backHref = "/",
  variant = "home",
  breadcrumbs,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isInterior = variant === "interior" || !!backTitle;
  const { theme, toggleTheme } = useTheme();
  const { user, isLoggedIn, isLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu]);

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
    toast.success("Signed out successfully");
    router.push("/");
    router.refresh();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-bg transition-colors duration-300",
        "border-b border-divider"
      )}
      role="banner"
    >
      <div className="mx-auto flex h-[60px] max-w-[1440px] items-center justify-between px-4 md:px-[180px] lg:px-[271px]">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {isInterior ? (
            <>
              {/* Mobile Back Button */}
              <Link
                href={backHref}
                className={cn(
                  "flex items-center gap-2 text-text-dark transition-opacity hover:opacity-70",
                  breadcrumbs && breadcrumbs.length > 0 ? "md:hidden" : ""
                )}
                aria-label={`Go back to ${backTitle || "previous page"}`}
              >
                <ChevronLeft size={24} strokeWidth={2} />
                {backTitle && (
                  <span className="text-subtitle-bold hidden sm:inline">
                    {backTitle}
                  </span>
                )}
              </Link>
              
              {/* Desktop Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="hidden md:flex items-center" aria-label="Breadcrumb">
                  <ol className="flex items-center gap-2 text-[14px]">
                    {breadcrumbs.map((crumb, index) => {
                      const isLast = index === breadcrumbs.length - 1;
                      return (
                        <li key={crumb.href} className="flex items-center gap-2">
                          <Link
                            href={crumb.href}
                            className={cn(
                              "transition-colors hover:underline line-clamp-1 max-w-[200px]",
                              isLast ? "text-text-dark font-bold" : "text-text-muted hover:text-text-dark"
                            )}
                            aria-current={isLast ? "page" : undefined}
                          >
                            {crumb.label}
                          </Link>
                          {!isLast && (
                            <ChevronRight size={14} className="text-divider" />
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </nav>
              )}
            </>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="Podcasts home"
            >
              <img src="/favicon-light.svg" alt="Podcasts Logo" className="h-7 w-7 dark:hidden" />
              <img src="/favicon-dark.svg" alt="Podcasts Logo" className="h-7 w-7 hidden dark:block" />
              <span className="text-heading text-text-dark font-bold text-xl tracking-tight flex items-center h-8">Podcasts</span>
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
            {isLoggedIn && (
              <Link
                href="/library"
                className={cn(
                  "text-subtitle transition-colors",
                  pathname === "/library"
                    ? "text-text-dark font-bold"
                    : "text-text-muted hover:text-text-dark"
                )}
              >
                Library
              </Link>
            )}
            {isLoggedIn && (
              <Link
                href="/studio"
                className={cn(
                  "text-subtitle transition-colors",
                  pathname?.startsWith("/studio")
                    ? "text-text-dark font-bold"
                    : "text-text-muted hover:text-text-dark"
                )}
              >
                Studio
              </Link>
            )}
          </nav>
        )}

        {/* Right section */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-dark transition-colors hover:bg-gray-100 dark:hover:bg-surface-dark"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon size={20} strokeWidth={2} />
            ) : (
              <Sun size={20} strokeWidth={2} />
            )}
          </button>

          <Link
            href="/search"
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-dark transition-colors hover:bg-gray-100 dark:hover:bg-surface-dark"
            aria-label="Search"
          >
            <Search size={20} strokeWidth={2} />
          </Link>

          {/* User menu */}
          {isLoading ? (
            <div className="h-10 w-10 rounded-full bg-divider animate-pulse" />
          ) : isLoggedIn ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden transition-opacity hover:opacity-80"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <Avatar src={user?.image} name={user?.name} size={36} />
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-12 w-56 bg-bg rounded-[var(--radius-md)] border border-divider shadow-[var(--shadow-menu)] animate-fade-in z-50">
                  <div className="p-3 border-b border-divider">
                    <p className="text-body font-bold text-text-dark truncate">
                      {user?.name}
                    </p>
                    <p className="text-[12px] text-text-muted truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-body text-text-dark hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
                    >
                      <User size={16} />
                      Profile
                    </Link>
                    <Link
                      href="/library"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-body text-text-dark hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
                    >
                      <Library size={16} />
                      Library
                    </Link>
                    <Link
                      href="/studio"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-body text-text-dark hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
                    >
                      <Mic size={16} />
                      Studio
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-body text-text-muted hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className={cn(
                "flex items-center gap-2 px-4 py-2",
                "rounded-[var(--radius-sm)] border border-border",
                "text-body font-bold text-text-dark",
                "transition-all duration-200",
                "hover:bg-gray-50 dark:hover:bg-surface-dark"
              )}
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
