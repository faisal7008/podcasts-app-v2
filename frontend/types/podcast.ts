/** Represents a podcast channel/show. */
export interface Podcast {
  id: string;
  title: string;
  author: string;
  description: string;
  artwork: string;
  episodeCount: number;
  category: string;
}

/** Represents a single podcast episode. */
export interface Episode {
  id: string;
  number: number;
  title: string;
  description: string;
  date: string;
  /** Duration in seconds */
  duration: number;
  podcastId: string;
  podcastTitle: string;
  artwork: string;
  /** Optional audio source URL */
  audioSrc?: string;
}

/** Represents a top channel entry with ranking. */
export interface Channel {
  id: string;
  rank: number;
  name: string;
  author: string;
  artwork: string;
  category: string;
}

/** Represents an item in the playback queue. */
export interface QueueItem {
  episode: Episode;
  addedAt: string;
}

/** Search results grouped by type. */
export interface SearchResults {
  podcasts: Podcast[];
  episodes: Episode[];
  query: string;
}

/** Player state for the audio context. */
export interface PlayerState {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: QueueItem[];
  isPlayerOpen: boolean;
  isQueueOpen: boolean;
  isMiniPlayerVisible: boolean;
}

/** Sort options for episode lists. */
export type EpisodeSortOption = "newest" | "oldest" | "popular";

/** Search tab filter options. */
export type SearchTab = "all" | "channels" | "episodes";

/** User Library to track subscriptions and history. */
export interface UserLibrary {
  subscribedPodcasts: Podcast[];
  likedEpisodes: Episode[];
  playHistory: { episodeId: string; progress: number; lastPlayed: number }[];
}
