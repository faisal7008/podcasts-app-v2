import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="w-full border-t border-divider bg-white"
      role="contentinfo"
    >
      <div className="mx-auto flex h-[100px] max-w-[1440px] items-center justify-between px-4 md:px-[180px] lg:px-[271px]">
        {/* Left — branding */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-surface-dark">
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8 1C4.134 1 1 4.134 1 8s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7zm0 2.5a4.5 4.5 0 014.5 4.5A4.5 4.5 0 018 12.5 4.5 4.5 0 013.5 8 4.5 4.5 0 018 3.5z"
                fill="white"
              />
            </svg>
          </div>
          <span className="text-sm font-bold text-text-dark">Podcasts</span>
        </div>

        {/* Center — nav links */}
        <nav
          className="hidden md:flex items-center gap-6"
          aria-label="Footer navigation"
        >
          <Link
            href="/"
            className="text-body text-text-muted transition-colors hover:text-text-dark"
          >
            Home
          </Link>
          <Link
            href="/search"
            className="text-body text-text-muted transition-colors hover:text-text-dark"
          >
            Explore
          </Link>
          <Link
            href="/search"
            className="text-body text-text-muted transition-colors hover:text-text-dark"
          >
            Search
          </Link>
        </nav>

        {/* Right — copyright */}
        <p className="text-body text-text-light">
          © {new Date().getFullYear()} Podcasts
        </p>
      </div>
    </footer>
  );
}
