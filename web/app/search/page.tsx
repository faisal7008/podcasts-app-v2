"use client";

import { useState } from "react";
import { Sparkles, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SearchInput } from "@/components/search-input";
import { SearchHeading } from "@/components/search-heading";
import { PodcastsCarousel } from "@/components/podcasts-carousel";
import { PodcastsGrid } from "@/components/podcasts-grid";
import { EpisodeList } from "@/components/episode-list";
import { SemanticSearchResult } from "@/components/semantic-search-result";
import { usePlayer } from "@/components/player/player-provider";
import { useSearch, useSemanticSearch } from "@/hooks/use-podcasts";
import type { SearchTab, Episode } from "@/types/podcast";
import type { SearchMode } from "@/hooks/use-podcasts";

function SearchPageContent() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [searchMode, setSearchMode] = useState<SearchMode>("keyword");
  const player = usePlayer();

  const { data: keywordResults, isLoading: isKeywordLoading, isError: isKeywordError } = useSearch(query);
  const { data: semanticResults, isLoading: isSemanticLoading, isError: isSemanticError } = useSemanticSearch(
    searchMode === "semantic" ? query : ""
  );

  const isLoading = searchMode === "keyword" ? isKeywordLoading : isSemanticLoading;
  const isError = searchMode === "keyword" ? isKeywordError : isSemanticError;

  const hasKeywordResults =
    keywordResults &&
    (keywordResults.podcasts.length > 0 || keywordResults.episodes.length > 0);

  const hasSemanticResults =
    semanticResults && semanticResults.totalResults > 0;

  const hasResults = searchMode === "keyword" ? hasKeywordResults : hasSemanticResults;

  const handlePlay = (episode: Episode) => {
    player.play(episode);
    player.openPlayer();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="interior" backTitle="Search" backHref="/" />

      <main className="flex-1">
        {/* Search Input + Mode Toggle */}
        <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
          <div className="flex flex-col gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              showTabs={false}
            />

            {/* Search Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchMode("keyword")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-full",
                  "transition-all duration-150",
                  searchMode === "keyword"
                    ? "bg-surface-dark text-white dark:bg-white dark:text-surface-dark"
                    : "bg-surface-dark/5 text-text-muted hover:bg-surface-dark/10 dark:hover:bg-white/10"
                )}
              >
                <SearchIcon size={12} />
                Keyword
              </button>
              <button
                onClick={() => setSearchMode("semantic")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-full",
                  "transition-all duration-150",
                  searchMode === "semantic"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                    : "bg-surface-dark/5 text-text-muted hover:bg-surface-dark/10 dark:hover:bg-white/10"
                )}
              >
                <Sparkles size={12} />
                AI Search
              </button>
            </div>
          </div>
        </section>

        {/* Default state: empty search prompt */}
        {!query.trim() && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-12">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-surface-dark flex items-center justify-center mb-4">
                {searchMode === "semantic" ? (
                  <Sparkles size={24} className="text-violet-500" />
                ) : (
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
                )}
              </div>
              <h2 className="text-heading text-text-dark">
                {searchMode === "semantic"
                  ? "AI-Powered Search"
                  : "Search for Podcasts"}
              </h2>
              <p className="text-body text-text-muted mt-2 max-w-[300px]">
                {searchMode === "semantic"
                  ? "Search by meaning across your podcast transcripts. Find concepts, topics, and discussions — not just keywords."
                  : "Find your next favorite podcast by searching for shows, episodes, or topics."}
              </p>
            </div>
          </section>
        )}

        {/* Loading state */}
        {query.trim().length > 2 && isLoading && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-12">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-accent mb-4" />
              <h2 className="text-heading text-text-dark">
                {searchMode === "semantic" ? "Searching transcripts..." : "Searching..."}
              </h2>
            </div>
          </section>
        )}

        {/* Error state */}
        {isError && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-12">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h2 className="text-heading text-red-500">Error</h2>
              <p className="text-body text-text-muted mt-2">
                Failed to fetch search results. Please try again.
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
                {searchMode === "semantic"
                  ? `No matching transcript content found for "${query}". Try uploading episodes first.`
                  : `No podcasts or episodes found for \u201c${query}\u201d`}
              </p>
            </div>
          </section>
        )}

        {/* Keyword Results */}
        {searchMode === "keyword" && hasKeywordResults && keywordResults && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
            <SearchHeading
              query={query}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              className="mb-8"
            />

            {/* All tab */}
            {activeTab === "all" && (
              <div className="flex flex-col gap-8">
                {keywordResults.podcasts.length > 0 && (
                  <PodcastsCarousel
                    podcasts={keywordResults.podcasts}
                    title="Channels"
                  />
                )}
                {keywordResults.episodes.length > 0 && (
                  <EpisodeList
                    episodes={keywordResults.episodes}
                    title="Episodes"
                    onPlay={handlePlay}
                    showSort={false}
                  />
                )}
              </div>
            )}

            {/* Channels tab */}
            {activeTab === "channels" && (
              <div>
                {keywordResults.podcasts.length > 0 ? (
                  <PodcastsGrid podcasts={keywordResults.podcasts} />
                ) : (
                  <p className="text-body text-text-muted text-center py-12">
                    No channels found
                  </p>
                )}
              </div>
            )}

            {/* Episodes tab */}
            {activeTab === "episodes" && (
              <div>
                {keywordResults.episodes.length > 0 ? (
                  <EpisodeList
                    episodes={keywordResults.episodes}
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

        {/* Semantic Results */}
        {searchMode === "semantic" && hasSemanticResults && semanticResults && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading text-text-dark">
                {semanticResults.totalResults} results for &ldquo;{query}&rdquo;
              </h2>
              <span className="flex items-center gap-1 text-[11px] text-violet-500 font-medium">
                <Sparkles size={12} />
                AI-powered
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {semanticResults.episodes.map((ep) => (
                <SemanticSearchResult
                  key={ep.episodeId}
                  episodeId={ep.episodeId}
                  episodeTitle={ep.episodeTitle}
                  podcastTitle={ep.podcastTitle}
                  artwork={ep.artwork}
                  chunks={ep.chunks}
                  query={query}
                />
              ))}
            </div>
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

