"use client";

import { use } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PodcastHead } from "@/components/podcast-head";
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
  getPodcastById,
  getEpisodesByPodcast,
  relatedPodcasts,
} from "@/lib/mock-data";
import type { Episode } from "@/types/podcast";

function ChannelPageContent({ id }: { id: string }) {
  const podcast = getPodcastById(id);
  const player = usePlayer();

  if (!podcast) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="interior" backTitle="Home" backHref="/" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-title text-text-dark">Channel Not Found</h1>
            <p className="text-body text-text-muted mt-2">
              The podcast channel you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const episodes = getEpisodesByPodcast(id);

  const handlePlay = (episode: Episode) => {
    player.play(episode);
    player.openPlayer();
  };

  const handleAddToQueue = (episode: Episode) => {
    player.addToQueue(episode);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="interior" backTitle="Home" backHref="/" />

      <main className="flex-1">
        {/* Podcast Head */}
        <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
          <PodcastHead podcast={podcast} />
        </section>

        {/* Episode List */}
        <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
          <EpisodeList
            episodes={episodes}
            title="All Episodes"
            onPlay={handlePlay}
            onMore={handleAddToQueue}
          />
        </section>

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

export default function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <PlayerProvider>
      <ChannelPageContent id={id} />
    </PlayerProvider>
  );
}
