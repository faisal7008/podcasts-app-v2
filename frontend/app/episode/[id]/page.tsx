"use client";

import { use } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { EpisodeHead } from "@/components/episode-head";
import { EpisodeList } from "@/components/episode-list";
import { PodcastsCarousel } from "@/components/podcasts-carousel";
import { Divider } from "@/components/divider";
import { SectionHeading } from "@/components/section-heading";
import { PlayerSidebar } from "@/components/player/player-sidebar";
import { MiniPlayer } from "@/components/player/mini-player";
import { FullPlayer } from "@/components/player/full-player";
import { Queue } from "@/components/queue";
import { PlayerProvider, usePlayer } from "@/components/player/player-provider";
import {
  getEpisodeById,
  getEpisodesByPodcast,
  relatedPodcasts,
} from "@/lib/mock-data";
import type { Episode } from "@/types/podcast";

function EpisodePageContent({ id }: { id: string }) {
  const episode = getEpisodeById(id);
  const player = usePlayer();

  if (!episode) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="interior" backTitle="Back" backHref="/" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-title text-text-dark">Episode Not Found</h1>
            <p className="text-body text-text-muted mt-2">
              The episode you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const moreEpisodes = getEpisodesByPodcast(episode.podcastId).filter(
    (e) => e.id !== episode.id
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

      {/* Player */}
      <PlayerSidebar />
      <MiniPlayer />
      <FullPlayer />
      <Queue />
    </div>
  );
}

export default function EpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <PlayerProvider>
      <EpisodePageContent id={id} />
    </PlayerProvider>
  );
}
