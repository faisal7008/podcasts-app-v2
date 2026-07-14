"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SearchInput } from "@/components/search-input";
import { SearchHeading } from "@/components/search-heading";
import { PodcastsCarousel } from "@/components/podcasts-carousel";
import { PodcastsGrid } from "@/components/podcasts-grid";
import { EpisodeList } from "@/components/episode-list";
import { usePlayer } from "@/components/player/player-provider";
import { useSearch } from "@/hooks/use-podcasts";
import type { SearchTab, Episode } from "@/types/podcast";

function SearchPageContent() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const player = usePlayer();

  const { data: results, isLoading, isError } = useSearch(query);

  const hasResults =
    results &&
    (results.podcasts.length > 0 || results.episodes.length > 0);

  const handlePlay = (episode: Episode) => {
    player.play(episode);
    player.openPlayer();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="interior" backTitle="Search" backHref="/" />

      <main className="flex-1">
        {/* Search Input — always visible (898×70 desktop / 343×70 mobile) */}
        <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
          <SearchInput
            value={query}
            onChange={setQuery}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showTabs={false}
          />
        </section>

        {/* Default state: empty search prompt */}
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
                Find your next favorite podcast by searching for shows,
                episodes, or topics.
              </p>
            </div>
          </section>
        )}

        {/* Loading state */}
        {query.trim().length > 2 && isLoading && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-12">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-accent mb-4"></div>
              <h2 className="text-heading text-text-dark">Searching...</h2>
            </div>
          </section>
        )}

        {/* Error state */}
        {isError && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-12">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h2 className="text-heading text-text-dark text-red-500">Error</h2>
              <p className="text-body text-text-muted mt-2">
                Failed to fetch search results. Check your API limits.
              </p>
            </div>
          </section>
        )}

        {/* No results */}
        {query.trim().length > 2 && !isLoading && !isError && !hasResults && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-12">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h2 className="text-heading text-text-dark">No Results</h2>
              <p className="text-body text-text-muted mt-2">
                No podcasts or episodes found for &ldquo;{query}&rdquo;
              </p>
            </div>
          </section>
        )}

        {/* Results with heading + tabs (293×70px heading as in Figma) */}
        {hasResults && results && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
            {/* Search Heading with tabs — matches Figma Heading (293×70) */}
            <SearchHeading
              query={query}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              className="mb-8"
            />

            {/* All tab — shows carousel + episode list (32px gap) */}
            {activeTab === "all" && (
              <div className="flex flex-col gap-8">
                {results.podcasts.length > 0 && (
                  <PodcastsCarousel
                    podcasts={results.podcasts}
                    title="Channels"
                  />
                )}
                {results.episodes.length > 0 && (
                  <EpisodeList
                    episodes={results.episodes}
                    title="Episodes"
                    onPlay={handlePlay}
                    showSort={false}
                  />
                )}
              </div>
            )}

            {/* Channels tab — shows Podcasts Grid (898×727 desktop) */}
            {activeTab === "channels" && (
              <div>
                {results.podcasts.length > 0 ? (
                  <PodcastsGrid podcasts={results.podcasts} />
                ) : (
                  <p className="text-body text-text-muted text-center py-12">
                    No channels found
                  </p>
                )}
              </div>
            )}

            {/* Episodes tab — shows Episode List (898×1405 desktop) */}
            {activeTab === "episodes" && (
              <div>
                {results.episodes.length > 0 ? (
                  <EpisodeList
                    episodes={results.episodes}
                    onPlay={handlePlay}
                    showSort={true}
                  />
                ) : (
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
    </div>
  );
}

export default function SearchPage() {
  return <SearchPageContent />;
}
