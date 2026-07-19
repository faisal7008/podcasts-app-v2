"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Music, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { EpisodeRow } from "@/components/episode-row";
import { PodcastCard } from "@/components/podcast-card";
import { usePlayer } from "@/components/player/player-provider";
import type { Episode, Podcast } from "@/types/podcast";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";

const fetchHistory = async () => {
  const data = await fetcher("/api/progress?hydrate=true");
  return data.hydrated || [];
};

const fetchFollows = async () => {
  const data = await fetcher("/api/follows?hydrate=true");
  return data.hydrated || [];
};

const fetchLikes = async () => {
  const data = await fetcher("/api/likes?hydrate=true");
  return data.hydrated || [];
};

type Tab = "continue" | "following" | "liked";

const tabs: { id: Tab; label: string; icon: typeof Music }[] = [
  { id: "continue", label: "Continue Listening", icon: Music },
  { id: "following", label: "Following", icon: Users },
  { id: "liked", label: "Liked", icon: Heart },
];

function LibraryContent() {
  const [activeTab, setActiveTab] = useState<Tab>("continue");
  const player = usePlayer();

  const { data: historyItems = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["history"],
    queryFn: fetchHistory,
    enabled: activeTab === "continue",
  });
  
  const { data: followingItems = [], isLoading: isLoadingFollowing } = useQuery({
    queryKey: ["follows"],
    queryFn: fetchFollows,
    enabled: activeTab === "following",
  });
  
  const { data: likedItems = [], isLoading: isLoadingLikes } = useQuery({
    queryKey: ["likes", "hydrated"],
    queryFn: fetchLikes,
    enabled: activeTab === "liked",
  });

  const isLoading = 
    (activeTab === "continue" && isLoadingHistory) || 
    (activeTab === "following" && isLoadingFollowing) || 
    (activeTab === "liked" && isLoadingLikes);

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="interior" backTitle="Library" backHref="/" />

      <main className="flex-1">
        <div className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] py-8 md:py-12">
          <h1 className="text-title text-text-dark mb-6">Your Library</h1>

          {/* Tab Navigation */}
          <div className="flex gap-1 border-b border-divider mb-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-body font-bold whitespace-nowrap",
                  "border-b-2 transition-all duration-200",
                  activeTab === tab.id
                    ? "border-surface-dark text-text-dark dark:border-white"
                    : "border-transparent text-text-muted hover:text-text-dark"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {activeTab === "continue" && (
                  historyItems.length > 0 ? (
                    <div className="flex flex-col gap-0.5 -mt-7">
                      {historyItems.map((ep: any) => (
                        <EpisodeRow 
                          key={ep.id} 
                          episode={ep} 
                          onPlay={() => player.play(ep)}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Music}
                      title="Nothing to continue"
                      description="Start listening to episodes to pick up where you left off."
                      actionLabel="Explore podcasts"
                      actionHref="/explore"
                    />
                  )
                )}
                {activeTab === "following" && (
                  followingItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                      {followingItems.map((pod: any) => (
                        <PodcastCard key={pod.id} podcast={pod} size="medium" className="w-full" />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Users}
                      title="Not following any podcasts"
                      description="Follow podcasts you love to keep up with new episodes."
                      actionLabel="Explore podcasts"
                      actionHref="/explore"
                    />
                  )
                )}
                {activeTab === "liked" && (
                  likedItems.length > 0 ? (
                    <div className="flex flex-col gap-0.5 -mt-7">
                      {likedItems.map((ep: any) => (
                        <EpisodeRow 
                          key={ep.id} 
                          episode={ep} 
                          onPlay={() => player.play(ep)}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Heart}
                      title="No liked episodes"
                      description="Like episodes to save them to your collection."
                      actionLabel="Explore podcasts"
                      actionHref="/explore"
                    />
                  )
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: typeof Music;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-divider/50 flex items-center justify-center mb-4">
        <Icon size={24} className="text-text-muted" />
      </div>
      <h3 className="text-subtitle-bold text-text-dark mb-2">{title}</h3>
      <p className="text-body text-text-muted max-w-sm mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className={cn(
            "px-6 py-2.5 rounded-[var(--radius-sm)]",
            "bg-surface-dark text-white font-bold text-body",
            "transition-all duration-200",
            "hover:opacity-90 active:scale-[0.98]"
          )}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <LibraryContent />
    </ProtectedRoute>
  );
}
