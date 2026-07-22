"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

// ─── useSearch ──────────────────────────────────────────────────────────────

export function useSearch(query: string, debounceMs = 400) {
  const [state, setState] = useState<
    AsyncState<{ podcasts: Podcast[]; episodes: Episode[] }>
  >({ data: null, isLoading: false, isError: false, error: null });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setState({ data: null, isLoading: false, isError: false, error: null });
      return;
    }

    const timer = setTimeout(async () => {
      // Cancel previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((prev) => ({ ...prev, isLoading: true, isError: false }));

      try {
        const data = await fetchJson<{
          podcasts: Podcast[];
          episodes: Episode[];
        }>(`/api/podcasts/search?q=${encodeURIComponent(query)}`);

        if (!controller.signal.aborted) {
          setState({ data, isLoading: false, isError: false, error: null });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setState({
            data: null,
            isLoading: false,
            isError: true,
            error: err instanceof Error ? err.message : "Search failed",
          });
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, debounceMs]);

  return state;
}

// ─── usePodcast ─────────────────────────────────────────────────────────────

export function usePodcast(id: string) {
  const [state, setState] = useState<
    AsyncState<{ podcast: Podcast; episodes: Episode[] }>
  >({ data: null, isLoading: true, isError: false, error: null });

  useEffect(() => {
    if (!id) {
      setState({ data: null, isLoading: false, isError: false, error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true }));

    fetchJson<{ podcast: Podcast; episodes: Episode[] }>(
      `/api/podcasts/${encodeURIComponent(id)}`
    )
      .then((data) => {
        if (!cancelled) {
          setState({ data, isLoading: false, isError: false, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            data: null,
            isLoading: false,
            isError: true,
            error: err instanceof Error ? err.message : "Failed to load podcast",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}

// ─── useEpisode ─────────────────────────────────────────────────────────────

export function useEpisode(id: string) {
  const [state, setState] = useState<AsyncState<Episode>>({
    data: null,
    isLoading: true,
    isError: false,
    error: null,
  });

  useEffect(() => {
    if (!id) {
      setState({ data: null, isLoading: false, isError: false, error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true }));

    fetchJson<Episode>(`/api/episodes/${encodeURIComponent(id)}`)
      .then((data) => {
        if (!cancelled) {
          setState({ data, isLoading: false, isError: false, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            data: null,
            isLoading: false,
            isError: true,
            error: err instanceof Error ? err.message : "Failed to load episode",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
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
  const [state, setState] = useState<AsyncState<HomeData>>({
    data: null,
    isLoading: true,
    isError: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    fetchJson<HomeData>("/api/podcasts/home")
      .then((data) => {
        if (!cancelled) {
          setState({ data, isLoading: false, isError: false, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            data: null,
            isLoading: false,
            isError: true,
            error:
              err instanceof Error ? err.message : "Failed to load home data",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

// ─── useCategoryPodcasts ────────────────────────────────────────────────────

export function useCategoryPodcasts(category: string) {
  const [state, setState] = useState<AsyncState<Podcast[]>>({
    data: null,
    isLoading: true,
    isError: false,
    error: null,
  });

  useEffect(() => {
    if (!category) {
      setState({ data: null, isLoading: false, isError: false, error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true }));

    fetchJson<Podcast[]>(`/api/podcasts/explore?category=${encodeURIComponent(category)}`)
      .then((data) => {
        if (!cancelled) {
          setState({ data, isLoading: false, isError: false, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            data: null,
            isLoading: false,
            isError: true,
            error: err instanceof Error ? err.message : "Failed to load category podcasts",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  return state;
}

// ─── useTopCategories ───────────────────────────────────────────────────────

export function useTopCategories() {
  const [state, setState] = useState<AsyncState<string[]>>({
    data: null,
    isLoading: true,
    isError: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    fetchJson<string[]>("/api/podcasts/categories")
      .then((data) => {
        if (!cancelled) {
          setState({ data, isLoading: false, isError: false, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            data: null,
            isLoading: false,
            isError: true,
            error: err instanceof Error ? err.message : "Failed to load categories",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
