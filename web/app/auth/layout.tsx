import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication — Podcasts",
  description: "Sign in or create an account to access your podcast library.",
};

/**
 * Auth layout — minimal centered layout for all auth pages.
 * No header or footer, just the auth content centered on the page.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-8">
      {children}
    </div>
  );
}
