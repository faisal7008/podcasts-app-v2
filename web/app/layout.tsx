import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { GlobalPlayerWrapper } from "@/components/global-player-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
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
      { url: '/favicon-light.svg', media: '(prefers-color-scheme: dark)' },
      { url: '/favicon-dark.svg', media: '(prefers-color-scheme: light)' },
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
    <html lang="en" className={`${firaSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || !theme) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-bg text-text-primary">
        <QueryProvider>
          <ThemeProvider>
            <GlobalPlayerWrapper>
              {children}
            </GlobalPlayerWrapper>
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: "font-sans",
                style: {
                  fontFamily: "var(--font-fira-sans), Arial, Helvetica, sans-serif",
                },
              }}
            />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
