"use client";

import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SectionHeading } from "@/components/section-heading";
import { useTopCategories } from "@/hooks/use-podcasts";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-slate-700 to-slate-900",
  "from-indigo-800 to-blue-900",
  "from-teal-700 to-emerald-900",
  "from-rose-800 to-rose-950",
  "from-violet-800 to-purple-950",
  "from-cyan-800 to-blue-950",
  "from-zinc-700 to-neutral-900",
  "from-sky-800 to-indigo-950",
  "from-purple-800 to-fuchsia-900",
  "from-emerald-800 to-teal-950",
  "from-fuchsia-800 to-rose-900",
  "from-blue-800 to-indigo-950"
];

function getGradientForCategory(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

export default function ExplorePage() {
  const { data: categories, isLoading, isError } = useTopCategories();
  
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Explore", href: "/explore" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="interior" breadcrumbs={breadcrumbs} />

      <main className="flex-1 pb-16 pt-6 md:pt-8">
        <section className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px]">
          <SectionHeading>Explore Categories</SectionHeading>
          
          <div className="mt-6 md:mt-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-accent mb-4" />
                <p className="text-body text-text-muted">Loading categories...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-20">
                <p className="text-body text-red-500">
                  Failed to load categories. Please try again.
                </p>
              </div>
            ) : categories && categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {categories.map((categoryName) => {
                  return (
                    <Link
                      key={categoryName}
                      href={`/explore/${encodeURIComponent(categoryName.toLowerCase())}`}
                      className="group relative flex items-center justify-between p-6 md:p-8 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95 border border-divider/10"
                    >
                      <div className={cn(
                        "absolute inset-0 opacity-90 transition-opacity duration-300 group-hover:opacity-100",
                        "bg-gradient-to-br",
                        getGradientForCategory(categoryName)
                      )} />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                      
                      <h3 className="relative z-10 text-xl md:text-2xl font-bold text-white tracking-wide drop-shadow-sm">
                        {categoryName}
                      </h3>
                      
                      <div className="relative z-10 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/30">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14"></path>
                          <path d="m12 5 7 7-7 7"></path>
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-body text-text-muted">
                  No categories found.
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
