"use client";

import { useQuery } from "@tanstack/react-query";
import type { Podcast, Episode, Channel } from "@/types/podcast";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch ${url}`);
  }
  return res.json();
}

// ─── useSearch ──────────────────────────────────────────────────────────────

export function useSearch(query: string, debounceMs = 400) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () =>
      fetchJson<{ podcasts: Podcast[]; episodes: Episode[] }>(
        `/api/podcasts/search?q=${encodeURIComponent(query)}`
      ),
    enabled: !!query && query.trim().length >= 3,
    staleTime: 60 * 1000,
  });
}

// ─── usePodcast ─────────────────────────────────────────────────────────────

export function usePodcast(id: string) {
  return useQuery({
    queryKey: ["podcast", id],
    queryFn: () =>
      fetchJson<{ podcast: Podcast; episodes: Episode[] }>(
        `/api/podcasts/${encodeURIComponent(id)}`
      ),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── useEpisode ─────────────────────────────────────────────────────────────

export function useEpisode(id: string) {
  return useQuery({
    queryKey: ["episode", id],
    queryFn: () => fetchJson<Episode>(`/api/episodes/${encodeURIComponent(id)}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── useHomeData ────────────────────────────────────────────────────────────

interface HomeData {
  exclusive: Podcast[];
  featured: Podcast[];
  noteworthy: Podcast[];
  trending: Podcast[];
  trendingAlt: Podcast[];
  topChannels: Channel[];
}

export function useHomeData() {
  return useQuery({
    queryKey: ["home-data"],
    queryFn: () => fetchJson<HomeData>("/api/podcasts/home"),
    staleTime: 60 * 60 * 1000, // 1 hour for home data
  });
}

// ─── useCategoryPodcasts ────────────────────────────────────────────────────

export function useCategoryPodcasts(category: string) {
  return useQuery({
    queryKey: ["category", category],
    queryFn: () =>
      fetchJson<Podcast[]>(
        `/api/podcasts/explore?category=${encodeURIComponent(category)}`
      ),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── useTopCategories ───────────────────────────────────────────────────────

export function useTopCategories() {
  return useQuery({
    queryKey: ["top-categories"],
    queryFn: () => fetchJson<string[]>("/api/podcasts/categories"),
    staleTime: 60 * 60 * 1000,
  });
}

// ─── Semantic Search (RAG) ──────────────────────────────────────────────────

export type SearchMode = "keyword" | "semantic";

export interface SemanticSearchResult {
  query: string;
  totalResults: number;
  episodes: {
    episodeId: string;
    episodeTitle: string;
    podcastTitle: string;
    artwork: string;
    chunks: {
      id: string;
      content: string;
      score: number;
      timestamp: string | null;
      preview: string;
    }[];
  }[];
}

export function useSemanticSearch(query: string) {
  return useQuery({
    queryKey: ["semantic-search", query],
    queryFn: () =>
      fetchJson<SemanticSearchResult>(
        `/api/rag/search?q=${encodeURIComponent(query)}`
      ),
    enabled: !!query && query.trim().length >= 3,
    staleTime: 60 * 1000,
  });
}

