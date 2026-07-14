"use client";

import { use } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { EpisodeHead } from "@/components/episode-head";
import { EpisodeList } from "@/components/episode-list";
import { PodcastsCarousel } from "@/components/podcasts-carousel";
import { Divider } from "@/components/divider";
import { SectionHeading } from "@/components/section-heading";
import { usePlayer } from "@/components/player/player-provider";
import { useEpisode, usePodcast } from "@/hooks/use-podcasts";
import { relatedPodcasts } from "@/lib/mock-data"; // Mock for "You may also like"
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
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-accent mb-4 mx-auto"></div>
            <h2 className="text-heading text-text-dark">Loading Episode...</h2>
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
            <h1 className="text-title text-text-dark text-red-500">Episode Not Found</h1>
            <p className="text-body text-text-muted mt-2">
              The episode you&apos;re looking for doesn&apos;t exist or an error occurred.
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
        backTitle={episode.podcastTitle}
        backHref={`/channel/${episode.podcastId}`}
      />

      <main className="flex-1">
        {/* Episode Head */}
        <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
          <EpisodeHead episode={episode} onPlay={handlePlayCurrent} />
        </section>

        {/* More Episodes */}
        {moreEpisodes.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
            <EpisodeList
              episodes={moreEpisodes}
              title="More Episodes"
              onPlay={handlePlay}
            />
          </section>
        )}

        {/* Divider */}
        <div className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] py-10">
          <Divider />
        </div>

        {/* Related Podcasts */}
        <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px]">
          <SectionHeading>You May Also Like</SectionHeading>
          <div className="mt-6">
            <PodcastsCarousel podcasts={relatedPodcasts} />
          </div>
        </section>

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
