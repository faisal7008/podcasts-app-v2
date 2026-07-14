"use client";

import { cn } from "@/lib/utils";
import type { SearchTab } from "@/types/podcast";

interface SearchHeadingProps {
  /** Current active tab. */
  activeTab: SearchTab;
  /** Called when a tab is selected. */
  onTabChange: (tab: SearchTab) => void;
  /** Query to display in title. */
  query: string;
  className?: string;
}

const tabs: { id: SearchTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "channels", label: "Channels" },
  { id: "episodes", label: "Episodes" },
];

/**
 * Search results heading with tab filters.
 * Matches Figma's "Heading" component in search screens (293×70px).
 * Shows query + filter tabs.
 */
export function SearchHeading({
  activeTab,
  onTabChange,
  query,
  className,
}: SearchHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Results title */}
      <h2 className="text-heading text-text-dark">
        Results for &ldquo;{query}&rdquo;
      </h2>

      {/* Tab filters */}
      <div className="flex gap-1" role="tablist" aria-label="Search filter">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-4 py-2 rounded-[var(--radius-sm)]",
              "text-[14px] font-bold transition-all",
              activeTab === tab.id
                ? "bg-surface-dark text-white"
                : "text-text-muted hover:bg-gray-100 hover:text-text-dark"
            )}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
