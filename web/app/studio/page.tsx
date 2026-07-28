"use client";

import Link from "next/link";
import { Plus, Mic, CheckCircle2, Loader2, AlertCircle, FileAudio } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";

interface StudioPodcast {
  id: string;
  title: string;
  author: string;
  description: string | null;
  artwork: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

const fetchStudioPodcasts = async (): Promise<StudioPodcast[]> => {
  const data = await fetcher("/api/studio/podcasts");
  return data.podcasts || [];
};

function StudioContent() {
  const { data: podcasts = [], isLoading } = useQuery({
    queryKey: ["studio-podcasts"],
    queryFn: fetchStudioPodcasts,
  });

  return (
    <>
      <Header
        variant="interior"
        backTitle="Studio"
        backHref="/"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Studio", href: "/studio" },
        ]}
      />

      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-title text-text-dark">Podcasts</h1>
              <p className="text-body text-text-muted mt-1">
                Create and manage your podcasts
              </p>
            </div>
            <Link
              href="/studio/podcasts/new"
              className={cn(
                "flex items-center gap-2 px-5 py-2.5",
                "rounded-[var(--radius-sm)] font-bold text-[14px]",
                "bg-surface-dark text-white dark:bg-white dark:text-surface-dark",
                "transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
              )}
            >
              <Plus size={18} />
              New Podcast
            </Link>
          </div>

          {/* Podcasts list */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 rounded-[var(--radius-lg)] bg-divider animate-pulse" />
              ))}
            </div>
          ) : podcasts.length === 0 ? (
            /* Empty state */
            <div className={cn(
              "flex flex-col items-center justify-center py-20",
              "rounded-[var(--radius-lg)] border-2 border-dashed border-divider"
            )}>
              <div className={cn(
                "flex items-center justify-center w-16 h-16 rounded-full mb-4",
                "bg-gray-100 dark:bg-surface-dark"
              )}>
                <Mic size={28} className="text-text-muted" />
              </div>
              <h2 className="text-subtitle-bold text-text-dark mb-1">
                No podcasts yet
              </h2>
              <p className="text-body text-text-muted mb-6 text-center max-w-sm">
                Create your first podcast to start uploading and publishing episodes.
              </p>
              <Link
                href="/studio/podcasts/new"
                className={cn(
                  "flex items-center gap-2 px-6 py-3",
                  "rounded-[var(--radius-full)] font-bold text-[14px]",
                  "bg-surface-dark text-white dark:bg-white dark:text-surface-dark",
                  "transition-all duration-200 hover:opacity-90"
                )}
              >
                <Plus size={18} />
                Create Podcast
              </Link>
            </div>
          ) : (
            /* Podcast cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {podcasts.map((podcast) => (
                <Link
                  key={podcast.id}
                  href={`/studio/podcasts/${podcast.id}`}
                  className={cn(
                    "flex flex-col gap-4 p-5",
                    "rounded-[var(--radius-lg)] border border-divider",
                    "transition-all hover:shadow-md hover:border-text-muted",
                    "bg-bg group"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Artwork */}
                    {podcast.artwork ? (
                      <img
                        src={podcast.artwork}
                        alt={podcast.title}
                        className="w-20 h-20 rounded-[var(--radius-sm)] object-cover shadow-sm group-hover:shadow-md transition-shadow"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-20 h-20 rounded-[var(--radius-sm)] bg-gray-100 dark:bg-surface-dark shrink-0">
                        <Mic size={24} className="text-text-muted" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="text-subtitle-bold text-text-dark truncate">
                        {podcast.title}
                      </h3>
                      <p className="text-[13px] text-text-muted mt-1 truncate">
                        {podcast.author}
                      </p>
                      {podcast.category && (
                        <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gray-100 text-text-muted dark:bg-gray-800">
                          {podcast.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {podcast.description && (
                    <p className="text-[13px] text-text-muted line-clamp-2">
                      {podcast.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function StudioPage() {
  return (
    <ProtectedRoute>
      <StudioContent />
    </ProtectedRoute>
  );
}
