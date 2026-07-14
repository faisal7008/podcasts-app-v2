import { useQuery } from "@tanstack/react-query";
import { Podcast, Episode, SearchResults } from "@/types/podcast";

// Helper to fetch JSON and throw on error
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to fetch from ${url}`);
  }
  return res.json();
}

/**
 * Hook to search podcasts and episodes
 */
export function useSearch(query: string) {
  return useQuery<{ podcasts: Podcast[]; episodes: Episode[] }>({
    queryKey: ["search", query],
    queryFn: () => fetchJson(`/api/podcasts/search?q=${encodeURIComponent(query)}`),
    enabled: !!query && query.length > 2, // Only run if query is long enough
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

/**
 * Hook to get a podcast and its episodes by ID
 */
export function usePodcast(id: string) {
  return useQuery<{ podcast: Podcast; episodes: Episode[] }>({
    queryKey: ["podcast", id],
    queryFn: () => fetchJson(`/api/podcasts/${encodeURIComponent(id)}`),
    enabled: !!id,
  });
}

/**
 * Hook to get a single episode by ID
 */
export function useEpisode(id: string) {
  return useQuery<Episode>({
    queryKey: ["episode", id],
    queryFn: () => fetchJson(`/api/episodes/${encodeURIComponent(id)}`),
    enabled: !!id,
  });
}
