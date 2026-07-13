import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import "./globals.css";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Podcasts — Discover & Listen",
  description:
    "Discover, browse, and listen to your favorite podcasts. Explore trending channels, curated collections, and new episodes.",
  openGraph: {
    title: "Podcasts — Discover & Listen",
    description:
      "Discover, browse, and listen to your favorite podcasts.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${firaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
