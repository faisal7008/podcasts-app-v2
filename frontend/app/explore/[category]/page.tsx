"use client";

import { use } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SectionHeading } from "@/components/section-heading";
import { PodcastsGrid } from "@/components/podcasts-grid";
import { useCategoryPodcasts } from "@/hooks/use-podcasts";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const resolvedParams = use(params);
  const categoryParam = decodeURIComponent(resolvedParams.category);
  // Capitalize first letter for display
  const categoryName = categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1);

  const { data: podcasts, isLoading, isError } = useCategoryPodcasts(categoryParam);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Explore", href: "/explore" },
    { label: categoryName, href: `/explore/${resolvedParams.category}` },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="interior" breadcrumbs={breadcrumbs} />

      <main className="flex-1 pb-16 pt-8 md:pt-12">
        <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px]">
          {/* <SectionHeading>{categoryName} Podcasts</SectionHeading> */}
          
          <div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-accent mb-4" />
                <p className="text-body text-text-muted">
                  Loading {categoryName} podcasts...
                </p>
              </div>
            ) : isError ? (
              <div className="text-center py-20">
                <p className="text-body text-red-500">
                  Failed to load podcasts for this category.
                </p>
              </div>
            ) : podcasts && podcasts.length > 0 ? (
              <PodcastsGrid podcasts={podcasts} />
            ) : (
              <div className="text-center py-20">
                <p className="text-body text-text-muted">
                  No podcasts found for this category.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
