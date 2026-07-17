"use client";

import { use } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PodcastHead } from "@/components/podcast-head";
import { EpisodeList } from "@/components/episode-list";
import { Divider } from "@/components/divider";
import { usePlayer } from "@/components/player/player-provider";
import { usePodcast } from "@/hooks/use-podcasts";
import type { Episode } from "@/types/podcast";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

function ChannelPageContent({ id }: { id: string }) {
  const { data, isLoading, isError } = usePodcast(id);
  const player = usePlayer();
  const { data: progressData } = useSWR("/api/progress", fetcher);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="interior" backTitle="Home" backHref="/" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-accent mb-4 mx-auto" />
            <p className="text-body text-text-muted">Loading channel...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !data || !data.podcast) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="interior" backTitle="Home" backHref="/" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-title text-red-500">Channel Not Found</h1>
            <p className="text-body text-text-muted mt-2">
              The podcast channel you&apos;re looking for doesn&apos;t exist or
              an error occurred.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { podcast, episodes } = data;

  const episodesWithProgress = episodes.map(ep => {
    const historyItem = progressData?.history?.find((h: any) => h.episodeId === ep.id);
    return historyItem ? { ...ep, progressSeconds: historyItem.progressSeconds } : ep;
  });

  const handlePlay = (episode: Episode) => {
    player.play(episode);
    player.openPlayer();
  };

  const handleAddToQueue = (episode: Episode) => {
    player.addToQueue(episode);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header 
        variant="interior" 
        backTitle="Back" 
        backHref="/" 
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: podcast.category || "Channels", href: podcast.category ? `/explore/${encodeURIComponent(podcast.category.toLowerCase())}` : "/explore" },
          { label: podcast.title, href: `/channel/${podcast.id}` }
        ]}
      />

      <main className="flex-1">
        {/* Podcast Head */}
        <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
          <PodcastHead podcast={podcast} />
        </section>

        {/* Episode List */}
        <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8">
          <EpisodeList
            episodes={episodesWithProgress}
            title="All Episodes"
            onPlay={handlePlay}
            onMore={handleAddToQueue}
          />
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] py-10">
          <Divider />
        </div>

        <div className="h-8 md:h-16" />
      </main>

      <Footer />
    </div>
  );
}

export default function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ChannelPageContent id={id} />;
}
