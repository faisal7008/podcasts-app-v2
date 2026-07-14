import { Podcast, Episode, Channel } from "@/types/podcast";
import { formatEpisodeTitle, formatCategory } from "@/lib/sanitize";

const TADDY_API_URL = "https://api.taddy.org";

interface TaddyGraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/**
 * Base generic fetcher for Taddy GraphQL API.
 * Server-side only — uses env vars for auth.
 */
async function fetchTaddyAPI<T>(
  query: string,
  variables: Record<string, unknown> = {},
  revalidate = 3600
): Promise<TaddyGraphQLResponse<T>> {
  const userId = process.env.TADDY_USER_ID;
  const apiKey = process.env.TADDY_API_KEY;

  if (!userId || !apiKey) {
    throw new Error(
      "Taddy API credentials are not configured. Set TADDY_USER_ID and TADDY_API_KEY in .env"
    );
  }

  const response = await fetch(TADDY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-USER-ID": userId,
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(
      `Taddy API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// ─── Transformers ───────────────────────────────────────────────────────────

function transformPodcast(raw: Record<string, unknown>): Podcast {
  return {
    id: raw.uuid as string,
    title: (raw.name as string) || "Untitled",
    author: (raw.authorName as string) || "Unknown Author",
    description: (raw.description as string) || "",
    artwork: (raw.imageUrl as string) || "/images/placeholder.svg",
    episodeCount: (raw.totalEpisodesCount as number) || 0,
    category: Array.isArray(raw.genres) && raw.genres.length > 0
      ? formatCategory(raw.genres[0] as string) || "General"
      : "General",
  };
}

function transformEpisode(
  raw: Record<string, unknown>,
  podcastSeries?: Record<string, unknown>
): Episode {
  const series = (raw.podcastSeries ?? podcastSeries ?? {}) as Record<string, unknown>;
  const podcastTitle = (series.name as string) || "";
  return {
    id: raw.uuid as string,
    number: (raw.episodeNumber as number) || 0,
    title: formatEpisodeTitle((raw.name as string) || "Untitled Episode", podcastTitle),
    description: (raw.description as string) || "",
    date: raw.datePublished
      ? new Date((raw.datePublished as number) * 1000).toISOString()
      : new Date().toISOString(),
    duration: (raw.duration as number) || 0,
    podcastId: (series.uuid as string) || "",
    podcastTitle,
    artwork:
      (raw.imageUrl as string) ||
      (series.imageUrl as string) ||
      "/images/placeholder.svg",
    audioSrc: (raw.audioUrl as string) || "",
  };
}

function transformChannel(
  raw: Record<string, unknown>,
  rank: number
): Channel {
  return {
    id: raw.uuid as string,
    rank,
    name: (raw.name as string) || "Untitled",
    author: (raw.authorName as string) || "Unknown Author",
    artwork: (raw.imageUrl as string) || "/images/placeholder.svg",
    category: Array.isArray(raw.genres) && raw.genres.length > 0
      ? formatCategory(raw.genres[0] as string) || "General"
      : "General",
  };
}

// ─── API functions ──────────────────────────────────────────────────────────

/**
 * Search podcasts and episodes by term.
 */
export async function searchPodcasts(term: string) {
  const query = `
    query Search($term: String!) {
      search(term: $term, filterForTypes: PODCASTSERIES, matchBy: ALL_TERMS) {
        searchId
        podcastSeries {
          uuid
          name
          authorName
          description
          imageUrl
          totalEpisodesCount
          genres
        }
        podcastEpisodes {
          uuid
          name
          description
          datePublished
          duration
          audioUrl
          imageUrl
          podcastSeries {
            uuid
            name
            imageUrl
          }
        }
      }
    }
  `;

  const response = await fetchTaddyAPI<{
    search: {
      podcastSeries: Record<string, unknown>[];
      podcastEpisodes: Record<string, unknown>[];
    };
  }>(query, { term }, 300);

  if (response.errors || !response.data) {
    console.error("Taddy search error:", response.errors);
    return { podcasts: [], episodes: [] };
  }

  const searchData = response.data.search;
  return {
    podcasts: (searchData.podcastSeries || []).map(transformPodcast),
    episodes: (searchData.podcastEpisodes || []).map((ep) =>
      transformEpisode(ep)
    ),
  };
}

/**
 * Get podcast by UUID, including its latest episodes.
 */
export async function getPodcastById(uuid: string) {
  const query = `
    query GetPodcastSeries($uuid: ID!) {
      getPodcastSeries(uuid: $uuid) {
        uuid
        name
        authorName
        description
        imageUrl
        totalEpisodesCount
        genres
        episodes(sortOrder: LATEST, limitPerPage: 25) {
          uuid
          name
          description
          datePublished
          duration
          audioUrl
          imageUrl
          episodeNumber
        }
      }
    }
  `;

  const response = await fetchTaddyAPI<{
    getPodcastSeries: Record<string, unknown>;
  }>(query, { uuid });

  if (response.errors || !response.data?.getPodcastSeries) {
    throw new Error("Failed to get podcast from Taddy API");
  }

  const series = response.data.getPodcastSeries;
  const podcast = transformPodcast(series);
  const episodes = (
    (series.episodes as Record<string, unknown>[]) || []
  ).map((ep) => transformEpisode(ep, series));

  return { podcast, episodes };
}

/**
 * Get a single episode by UUID.
 */
export async function getEpisodeById(uuid: string) {
  const query = `
    query GetPodcastEpisode($uuid: ID!) {
      getPodcastEpisode(uuid: $uuid) {
        uuid
        name
        description
        datePublished
        duration
        audioUrl
        imageUrl
        episodeNumber
        podcastSeries {
          uuid
          name
          imageUrl
        }
      }
    }
  `;

  const response = await fetchTaddyAPI<{
    getPodcastEpisode: Record<string, unknown>;
  }>(query, { uuid });

  if (response.errors || !response.data?.getPodcastEpisode) {
    throw new Error("Failed to get episode from Taddy API");
  }

  return transformEpisode(response.data.getPodcastEpisode);
}

/**
 * Get trending / popular podcasts for the home page.
 * Uses search with popular terms to get diverse results.
 */
export async function getTrendingPodcasts(
  term: string = "popular podcast",
  limit: number = 10
) {
  const query = `
    query Search($term: String!) {
      search(term: $term, filterForTypes: PODCASTSERIES, matchBy: MOST_TERMS) {
        searchId
        podcastSeries {
          uuid
          name
          authorName
          description
          imageUrl
          totalEpisodesCount
          genres
        }
      }
    }
  `;

  const response = await fetchTaddyAPI<{
    search: { podcastSeries: Record<string, unknown>[] };
  }>(query, { term });

  if (response.errors || !response.data) {
    console.error("Taddy trending error:", response.errors);
    return [];
  }

  return (response.data.search.podcastSeries || [])
    .slice(0, limit)
    .map(transformPodcast);
}

/**
 * Get top channels for the "Explore" section on the home page.
 * Searches for popular channels and returns them ranked.
 */
export async function getTopChannels(
  term: string = "top podcast",
  limit: number = 8
): Promise<Channel[]> {
  const query = `
    query Search($term: String!) {
      search(term: $term, filterForTypes: PODCASTSERIES, matchBy: MOST_TERMS) {
        searchId
        podcastSeries {
          uuid
          name
          authorName
          imageUrl
          genres
        }
      }
    }
  `;

  const response = await fetchTaddyAPI<{
    search: { podcastSeries: Record<string, unknown>[] };
  }>(query, { term });

  if (response.errors || !response.data) {
    console.error("Taddy top channels error:", response.errors);
    return [];
  }

  return (response.data.search.podcastSeries || [])
    .slice(0, limit)
    .map((raw, i) => transformChannel(raw, i + 1));
}
