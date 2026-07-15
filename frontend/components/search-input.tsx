"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchTab } from "@/types/podcast";

interface SearchInputProps {
  /** Current search query. */
  value: string;
  /** Called when the search query changes. */
  onChange: (value: string) => void;
  /** Current active tab. */
  activeTab: SearchTab;
  /** Called when a tab is selected. */
  onTabChange: (tab: SearchTab) => void;
  /** Whether to show tabs below the input. */
  showTabs?: boolean;
  className?: string;
}

const tabs: { id: SearchTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "channels", label: "Channels" },
  { id: "episodes", label: "Episodes" },
];

/**
 * Search input field with optional tab filters.
 * Matches Figma's "Search / Input" component.
 * Desktop: 898px × 70px. Mobile: 343px × 70px.
 */
export function SearchInput({
  value,
  onChange,
  activeTab,
  onTabChange,
  showTabs = false,
  className,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn("w-full", className)}>
      {/* Input container */}
      <div
        className={cn(
          "flex items-center gap-3 h-[52px] px-4",
          "rounded-[var(--radius-md)] border",
          "transition-all duration-200",
          isFocused
            ? "border-text-dark shadow-sm"
            : "border-divider"
        )}
      >
        <Search
          size={20}
          className={cn(
            "flex-shrink-0 transition-colors",
            isFocused ? "text-text-dark" : "text-text-light"
          )}
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search podcasts, episodes..."
          className={cn(
            "flex-1 bg-transparent outline-none",
            "text-subtitle text-text-dark",
            "placeholder:text-text-light"
          )}
          aria-label="Search podcasts and episodes"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="flex h-6 w-6 items-center justify-center rounded-full text-text-light hover:text-text-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tab filters */}
      {showTabs && (
        <div className="flex gap-1 mt-3" role="tablist" aria-label="Search filter">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-4 py-2 rounded-[var(--radius-sm)]",
                "text-[14px] font-bold transition-all",
                activeTab === tab.id
                  ? "bg-text-dark text-bg"
                  : "text-text-muted hover:bg-gray-100 dark:hover:bg-surface-dark hover:text-text-dark"
              )}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
