"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { EpisodeHead } from "@/components/episode-head";
import { EpisodeList } from "@/components/episode-list";
import { usePlayer } from "@/components/player/player-provider";
import { useEpisode, usePodcast } from "@/hooks/use-podcasts";
import type { Episode } from "@/types/podcast";

function PlayingPageContent() {
  const searchParams = useSearchParams();
  const episodeId = searchParams.get("episode") || "";
  const player = usePlayer();

  const { data: episode, isLoading, isError } = useEpisode(episodeId);
  const { data: podcastData } = usePodcast(episode?.podcastId || "");

  // Auto-play on mount if not already playing
  useEffect(() => {
    if (episode && !player.currentEpisode) {
      player.play(episode);
      player.openPlayer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="interior" backTitle="Back" backHref="/" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-accent mb-4 mx-auto" />
            <p className="text-body text-text-muted">Loading episode...</p>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !episode) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="interior" backTitle="Back" backHref="/" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-title text-red-500">Episode Not Found</h1>
            <p className="text-body text-text-muted mt-2">
              The episode you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const moreEpisodes = (podcastData?.episodes || []).filter(
    (e: Episode) => e.id !== episode.id
  );

  const handlePlay = (ep: Episode) => {
    player.play(ep);
    player.openPlayer();
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header takes reduced width when player is open (desktop) */}
      <div className={player.isPlayerOpen ? "md:pr-[348px]" : ""}>
        <Header
          variant="interior"
          backTitle={episode.podcastTitle || "Back"}
          backHref={
            episode.podcastId ? `/channel/${episode.podcastId}` : "/"
          }
        />
      </div>

      <div className="flex flex-1">
        {/* Main content area - shrinks when player sidebar is open */}
        <main
          className={`flex-1 transition-all duration-300 ${
            player.isPlayerOpen ? "md:pr-[348px]" : ""
          }`}
        >
          {/* Episode Head */}
          <section className="mx-auto max-w-[1440px] px-4 md:px-[121px] pt-4">
            <EpisodeHead episode={episode} onPlay={() => handlePlay(episode)} />
          </section>

          {/* More Episodes */}
          {moreEpisodes.length > 0 && (
            <section className="mx-auto max-w-[1440px] px-4 md:px-[121px] pt-4">
              <EpisodeList
                episodes={moreEpisodes}
                title="More Episodes"
                onPlay={handlePlay}
              />
            </section>
          )}

          <div className="h-8 md:h-16" />
        </main>
      </div>
    </div>
  );
}

export default function PlayingPage() {
  return <PlayingPageContent />;
}
