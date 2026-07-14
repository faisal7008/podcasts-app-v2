"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Divider } from "@/components/divider";
import { SectionHeading } from "@/components/section-heading";
import { MainCarousel } from "@/components/main-carousel";
import { PodcastsCarousel } from "@/components/podcasts-carousel";
import { TopChannels } from "@/components/top-channels";
import {
  podcasts,
  explorePodcasts,
  trendingPodcasts,
  topChannels,
} from "@/lib/mock-data";

/**
 * Home page — main entry point for the Podcasts app.
 * Layout: Header → Main Carousel → Divider → Podcasts Carousel →
 *         Divider → Explore (Top Channels) → Divider → Trending Carousels → Footer
 */
export default function HomePage() {
  const firstHalf = topChannels.slice(0, 4);
  const secondHalf = topChannels.slice(4, 8);

  return (
    <div className="flex min-h-screen flex-col">
        <Header variant="home" />

        <main className="flex-1">
          {/* Hero carousel */}
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8 md:pt-12">
            <MainCarousel podcasts={podcasts.slice(0, 4)} />
          </section>

          {/* Divider */}
          <div className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] py-10 md:py-12">
            <Divider />
          </div>

          {/* Podcasts Carousel — Featured */}
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px]">
            <PodcastsCarousel
              podcasts={explorePodcasts}
              title="New & Noteworthy"
              seeAllHref="/search"
            />
          </section>

          {/* Divider */}
          <div className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] py-10 md:py-12">
            <Divider />
          </div>

          {/* Explore — Top Channels */}
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px]">
            <SectionHeading>Explore</SectionHeading>
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              <TopChannels channels={firstHalf} />
              <TopChannels channels={secondHalf} />
            </div>
          </section>

          {/* Divider */}
          <div className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] py-10 md:py-12">
            <Divider />
          </div>

          {/* Trending */}
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px]">
            <SectionHeading>Trending</SectionHeading>
            <div className="mt-6 flex flex-col gap-8">
              <PodcastsCarousel podcasts={trendingPodcasts} />
              <PodcastsCarousel podcasts={[...podcasts].reverse().slice(0, 5)} />
            </div>
          </section>

          {/* Bottom spacing for mini player */}
          <div className="h-8 md:h-16" />
        </main>

        <Footer />

      </div>
  );
}
