"use client";

import { use } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { EpisodeHead } from "@/components/episode-head";
import { EpisodeList } from "@/components/episode-list";
import { Divider } from "@/components/divider";
import { usePlayer } from "@/components/player/player-provider";
import { useEpisode, usePodcast } from "@/hooks/use-podcasts";
import type { Episode } from "@/types/podcast";

function EpisodePageContent({ id }: { id: string }) {
  const { data: episode, isLoading, isError } = useEpisode(id);
  const { data: podcastData } = usePodcast(episode?.podcastId || "");
  const player = usePlayer();

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
        <Footer />
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
              The episode you&apos;re looking for doesn&apos;t exist or an error
              occurred.
            </p>
          </div>
        </main>
        <Footer />
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

  const handlePlayCurrent = () => {
    player.play(episode);
    player.openPlayer();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        variant="interior"
        backTitle={episode.podcastTitle || "Back"}
        backHref={
          episode.podcastId ? `/channel/${episode.podcastId}` : "/"
        }
      />

      <main className="flex-1">
        {/* Episode Head */}
        <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
          <EpisodeHead episode={episode} onPlay={handlePlayCurrent} />
        </section>

        {/* More Episodes from the same podcast */}
        {moreEpisodes.length > 0 && (
          <>
            <section className="mx-auto py-10 max-w-[1440px] px-4 md:px-[180px] lg:px-[271px]">
              <EpisodeList
                episodes={moreEpisodes}
                title="More Episodes"
                onPlay={handlePlay}
              />
            </section>
          </>
        )}

        <div className="h-8 md:h-16" />
      </main>

      <Footer />
    </div>
  );
}

export default function EpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <EpisodePageContent id={id} />;
}
