"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SearchInput } from "@/components/search-input";
import { PodcastsCarousel } from "@/components/podcasts-carousel";
import { PodcastsGrid } from "@/components/podcasts-grid";
import { EpisodeList } from "@/components/episode-list";
import { SectionHeading } from "@/components/section-heading";
import { PlayerSidebar } from "@/components/player/player-sidebar";
import { MiniPlayer } from "@/components/player/mini-player";
import { FullPlayer } from "@/components/player/full-player";
import { Queue } from "@/components/queue";
import { PlayerProvider, usePlayer } from "@/components/player/player-provider";
import { searchAll, podcasts } from "@/lib/mock-data";
import type { SearchTab, Episode } from "@/types/podcast";

function SearchPageContent() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const player = usePlayer();

  const results = useMemo(() => {
    if (!query.trim()) return null;
    return searchAll(query);
  }, [query]);

  const hasResults = results && (results.podcasts.length > 0 || results.episodes.length > 0);

  const handlePlay = (episode: Episode) => {
    player.play(episode);
    player.openPlayer();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="interior" backTitle="Search" backHref="/" />

      <main className="flex-1">
        {/* Search Input */}
        <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
          <SearchInput
            value={query}
            onChange={setQuery}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showTabs={!!hasResults}
          />
        </section>

        {/* No search yet — show browse */}
        {!query.trim() && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-12">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-text-light"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <h2 className="text-heading text-text-dark">
                Search for Podcasts
              </h2>
              <p className="text-body text-text-muted mt-2 max-w-[300px]">
                Find your next favorite podcast by searching for shows, episodes,
                or topics.
              </p>
            </div>
          </section>
        )}

        {/* No results */}
        {query.trim() && !hasResults && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-12">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h2 className="text-heading text-text-dark">No Results</h2>
              <p className="text-body text-text-muted mt-2">
                No podcasts or episodes found for &ldquo;{query}&rdquo;
              </p>
            </div>
          </section>
        )}

        {/* Results */}
        {hasResults && results && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
            {/* All tab */}
            {activeTab === "all" && (
              <div className="flex flex-col gap-10">
                {results.podcasts.length > 0 && (
                  <div>
                    <SectionHeading className="mb-4">Channels</SectionHeading>
                    <PodcastsCarousel podcasts={results.podcasts} />
                  </div>
                )}
                {results.episodes.length > 0 && (
                  <div>
                    <SectionHeading className="mb-4">Episodes</SectionHeading>
                    <EpisodeList
                      episodes={results.episodes}
                      onPlay={handlePlay}
                      showSort={false}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Channels tab */}
            {activeTab === "channels" && (
              <div>
                <SectionHeading className="mb-6">
                  Channels matching &ldquo;{query}&rdquo;
                </SectionHeading>
                <PodcastsGrid podcasts={results.podcasts} />
                {results.podcasts.length === 0 && (
                  <p className="text-body text-text-muted text-center py-12">
                    No channels found
                  </p>
                )}
              </div>
            )}

            {/* Episodes tab */}
            {activeTab === "episodes" && (
              <div>
                <SectionHeading className="mb-4">
                  Episodes matching &ldquo;{query}&rdquo;
                </SectionHeading>
                <EpisodeList
                  episodes={results.episodes}
                  onPlay={handlePlay}
                  showSort={false}
                />
                {results.episodes.length === 0 && (
                  <p className="text-body text-text-muted text-center py-12">
                    No episodes found
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        <div className="h-8 md:h-16" />
      </main>

      <Footer />

      {/* Player */}
      <PlayerSidebar />
      <MiniPlayer />
      <FullPlayer />
      <Queue />
    </div>
  );
}

export default function SearchPage() {
  return (
    <PlayerProvider>
      <SearchPageContent />
    </PlayerProvider>
  );
}
