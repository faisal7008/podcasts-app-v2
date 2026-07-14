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
          <img src="/mobile-icon.svg" alt="Podcasts Logo" className="h-7 w-7" />
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
