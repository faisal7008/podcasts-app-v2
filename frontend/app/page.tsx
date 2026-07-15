"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Divider } from "@/components/divider";
import { SectionHeading } from "@/components/section-heading";
import { MainCarousel } from "@/components/main-carousel";
import { PodcastsCarousel } from "@/components/podcasts-carousel";
import { TopChannels } from "@/components/top-channels";
import { useHomeData } from "@/hooks/use-podcasts";

/**
 * Home page — main entry point for the Podcasts app.
 * All data is fetched from the Taddy API via /api/podcasts/home.
 */
export default function HomePage() {
  const { data, isLoading, isError } = useHomeData();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="home" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-accent mb-4 mx-auto" />
            <p className="text-body text-text-muted">
              Loading podcasts...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="home" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-title text-red-500">Something went wrong</h1>
            <p className="text-body text-text-muted mt-2">
              Failed to load podcasts. Please check your Taddy API credentials.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { featured, noteworthy, trending, trendingAlt, topChannels } = data;
  const firstHalf = topChannels.slice(0, 4);
  const secondHalf = topChannels.slice(4, 8);

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="home" />

      <main className="flex-1">
        {/* Hero carousel */}
        {featured.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] pt-8 md:pt-12">
            <MainCarousel podcasts={featured} />
          </section>
        )}

        {/* Divider */}
        <div className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] py-8 md:py-12">
          <Divider />
        </div>

        {/* Podcasts Carousel — New & Noteworthy */}
        {noteworthy.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px]">
            <PodcastsCarousel
              podcasts={noteworthy}
              title="New & Noteworthy"
              seeAllHref="/search"
            />
          </section>
        )}

        {/* Divider */}
        <div className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] py-8 md:py-12">
          <Divider />
        </div>

        {/* Explore — Top Channels */}
        {topChannels.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px]">
            <SectionHeading>Explore</SectionHeading>
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-16">
              <TopChannels channels={firstHalf} />
              {secondHalf.length > 0 && (
                <TopChannels channels={secondHalf} />
              )}
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] py-8 md:py-12">
          <Divider />
        </div>

        {/* Trending */}
        {(trending.length > 0 || trendingAlt.length > 0) && (
          <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px]">
            <SectionHeading>Trending</SectionHeading>
            <div className="mt-6 flex flex-col gap-8">
              {trending.length > 0 && (
                <PodcastsCarousel podcasts={trending} />
              )}
              {trendingAlt.length > 0 && (
                <PodcastsCarousel podcasts={trendingAlt} />
              )}
            </div>
          </section>
        )}

        {/* Bottom spacing for mini player */}
        <div className="h-8 md:h-16" />
      </main>

      <Footer />
    </div>
  );
}
