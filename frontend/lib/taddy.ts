import { Podcast, Episode } from "@/types/podcast";

const TADDY_API_URL = "https://api.taddy.org";

interface TaddyGraphQLResponse<T> {
  data?: T;
  errors?: any[];
}

/**
 * Base generic fetcher for Taddy GraphQL API
 */
async function fetchTaddyAPI<T>(query: string, variables: any = {}): Promise<TaddyGraphQLResponse<T>> {
  const userId = process.env.TADDY_USER_ID;
  const apiKey = process.env.TADDY_API_KEY;

  if (!userId || !apiKey) {
    throw new Error("Taddy API credentials are not configured in environment variables.");
  }

  const response = await fetch(TADDY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-USER-ID": userId,
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ query, variables }),
    // Adding Next.js revalidation cache rules
    next: { revalidate: 3600 }, // cache for 1 hour by default to save quota
  });

  if (!response.ok) {
    throw new Error(`Taddy API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Transforms a Taddy PodcastSeries object to our internal Podcast type.
 */
function transformPodcast(taddyPodcast: any): Podcast {
  return {
    id: taddyPodcast.uuid,
    title: taddyPodcast.name,
    author: taddyPodcast.authorName || "Unknown Author",
    description: taddyPodcast.description || "",
    artwork: taddyPodcast.imageUrl || "",
    episodeCount: taddyPodcast.totalEpisodesCount || 0,
    category: taddyPodcast.genres ? taddyPodcast.genres[0] : "General",
  };
}

/**
 * Transforms a Taddy PodcastEpisode object to our internal Episode type.
 */
function transformEpisode(taddyEpisode: any, podcastSeries?: any): Episode {
  return {
    id: taddyEpisode.uuid,
    number: taddyEpisode.episodeNumber || 0,
    title: taddyEpisode.name,
    description: taddyEpisode.description || "",
    date: taddyEpisode.datePublished ? new Date(taddyEpisode.datePublished * 1000).toISOString() : new Date().toISOString(),
    duration: taddyEpisode.duration || 0,
    podcastId: podcastSeries?.uuid || taddyEpisode.podcastSeries?.uuid || "",
    podcastTitle: podcastSeries?.name || taddyEpisode.podcastSeries?.name || "",
    artwork: taddyEpisode.imageUrl || podcastSeries?.imageUrl || "",
    audioSrc: taddyEpisode.audioUrl || "",
  };
}

/**
 * Search podcasts and episodes
 */
export async function searchPodcasts(term: string) {
  const query = `
    query Search($term: String!) {
      search(term: $term, matchBy: ALL_TERMS) {
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
          podcastSeries {
            uuid
            name
            imageUrl
          }
        }
      }
    }
  `;

  const response = await fetchTaddyAPI<any>(query, { term });
  
  if (response.errors || !response.data) {
    throw new Error("Failed to search Taddy API");
  }

  const searchData = response.data.search;

  return {
    podcasts: (searchData.podcastSeries || []).map(transformPodcast),
    episodes: (searchData.podcastEpisodes || []).map((ep: any) => transformEpisode(ep)),
  };
}

/**
 * Get podcast by ID
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
        episodes(sortOrder: LATEST, limitPerPage: 20) {
          uuid
          name
          description
          datePublished
          duration
          audioUrl
        }
      }
    }
  `;

  const response = await fetchTaddyAPI<any>(query, { uuid });
  
  if (response.errors || !response.data?.getPodcastSeries) {
    throw new Error("Failed to get podcast from Taddy API");
  }

  const series = response.data.getPodcastSeries;
  const podcast = transformPodcast(series);
  const episodes = (series.episodes || []).map((ep: any) => transformEpisode(ep, series));

  return { podcast, episodes };
}

/**
 * Get episode by ID
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
        podcastSeries {
          uuid
          name
          imageUrl
        }
      }
    }
  `;

  const response = await fetchTaddyAPI<any>(query, { uuid });
  
  if (response.errors || !response.data?.getPodcastEpisode) {
    throw new Error("Failed to get episode from Taddy API");
  }

  return transformEpisode(response.data.getPodcastEpisode);
}
