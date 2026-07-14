import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import { GlobalPlayerWrapper } from "@/components/global-player-wrapper";
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
  icons: {
    icon: [
      { url: '/favicon-light.svg', media: '(prefers-color-scheme: light)' },
      { url: '/favicon-dark.svg', media: '(prefers-color-scheme: dark)' },
    ],
    apple: [
      { url: '/mobile-icon.svg' }
    ]
  },
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
      <body className="min-h-full flex flex-col font-sans">
        <GlobalPlayerWrapper>
          {children}
        </GlobalPlayerWrapper>
      </body>
    </html>
  );
}
