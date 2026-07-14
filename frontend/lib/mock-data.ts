import type { Podcast, Episode, Channel } from "@/types/podcast";

// ─── Podcast data ───────────────────────────────────────────────────────────

export const podcasts: Podcast[] = [
  {
    id: "p1",
    title: "Burn Before Listening",
    author: "POSTA",
    description:
      "A podcast where we discuss the latest in cinema, TV series, and pop culture. Every week we bring you fresh takes on what's trending.",
    artwork: "/images/podcast-1.svg",
    episodeCount: 24,
    category: "Entertainment",
  },
  {
    id: "p2",
    title: "The Daily Byte",
    author: "Tech Networks",
    description:
      "Your daily dose of technology news, reviews, and deep dives into the world of software, hardware, and everything in between.",
    artwork: "/images/podcast-2.svg",
    episodeCount: 156,
    category: "Technology",
  },
  {
    id: "p3",
    title: "Mind & Matter",
    author: "Science Today",
    description:
      "Exploring the intersection of neuroscience and philosophy. How does the brain create consciousness? Join us on this journey.",
    artwork: "/images/podcast-3.svg",
    episodeCount: 89,
    category: "Science",
  },
  {
    id: "p4",
    title: "Sound Stories",
    author: "Audio Collective",
    description:
      "Immersive audio documentaries that transport you to different corners of the world. Real stories, real people, real impact.",
    artwork: "/images/podcast-4.svg",
    episodeCount: 42,
    category: "Documentary",
  },
  {
    id: "p5",
    title: "Culture Cast",
    author: "Media House",
    description:
      "A weekly roundup of cultural events, art exhibitions, music releases, and literary discussions from around the globe.",
    artwork: "/images/podcast-5.svg",
    episodeCount: 67,
    category: "Culture",
  },
  {
    id: "p6",
    title: "The Creative Hour",
    author: "Design Lab",
    description:
      "Conversations with designers, artists, and creative professionals about their process, inspiration, and the future of design.",
    artwork: "/images/podcast-6.svg",
    episodeCount: 35,
    category: "Design",
  },
  {
    id: "p7",
    title: "History Uncovered",
    author: "Past & Present",
    description:
      "Delving into forgotten chapters of history. From ancient civilizations to modern turning points, we uncover what textbooks left out.",
    artwork: "/images/podcast-7.svg",
    episodeCount: 112,
    category: "History",
  },
  {
    id: "p8",
    title: "Startup Stories",
    author: "Venture Voice",
    description:
      "Behind-the-scenes stories from founders who built companies from scratch. The failures, pivots, and breakthroughs that shaped them.",
    artwork: "/images/podcast-8.svg",
    episodeCount: 78,
    category: "Business",
  },
];

// ─── Episode data ───────────────────────────────────────────────────────────

export const episodes: Episode[] = [
  {
    id: "e1",
    number: 404,
    title: "The Mandalorian",
    description:
      "We've been waiting for this one — here's our podcast about the excellent second season of The Mandalorian. We discuss every episode, character arc, and that incredible finale.",
    date: "2024-12-25",
    duration: 6720,
    podcastId: "p1",
    podcastTitle: "Burn Before Listening",
    artwork: "/images/podcast-1.svg",
    audioSrc: "/audio/sample.mp3",
  },
  {
    id: "e2",
    number: 403,
    title: "The Trial of the Chicago 7",
    description:
      "We chat with Dani about The Trial of the Chicago 7 and the illustrious career of screenwriter and director Aaron Sorkin. A masterpiece of courtroom drama.",
    date: "2024-12-18",
    duration: 5400,
    podcastId: "p1",
    podcastTitle: "Burn Before Listening",
    artwork: "/images/podcast-1.svg",
    audioSrc: "/audio/sample.mp3",
  },
  {
    id: "e3",
    number: 402,
    title: "Soul — Pixar's Masterpiece",
    description:
      "Pixar does it again with Soul, a film that asks the big questions about purpose, passion, and what makes life worth living. We break it all down.",
    date: "2024-12-11",
    duration: 4800,
    podcastId: "p1",
    podcastTitle: "Burn Before Listening",
    artwork: "/images/podcast-1.svg",
    audioSrc: "/audio/sample.mp3",
  },
  {
    id: "e4",
    number: 401,
    title: "Tenet — Understanding Nolan",
    description:
      "Christopher Nolan's most ambitious film yet. We attempt to explain the plot, discuss the time inversion mechanics, and debate whether it actually works.",
    date: "2024-12-04",
    duration: 7200,
    podcastId: "p1",
    podcastTitle: "Burn Before Listening",
    artwork: "/images/podcast-1.svg",
    audioSrc: "/audio/sample.mp3",
  },
  {
    id: "e5",
    number: 400,
    title: "The Queen's Gambit",
    description:
      "The surprise hit of the year — a show about chess that somehow became the most-watched limited series. We discuss why it captivated millions.",
    date: "2024-11-27",
    duration: 5100,
    podcastId: "p1",
    podcastTitle: "Burn Before Listening",
    artwork: "/images/podcast-1.svg",
    audioSrc: "/audio/sample.mp3",
  },
  {
    id: "e6",
    number: 399,
    title: "Dune — Part One",
    description:
      "Denis Villeneuve brings Frank Herbert's epic sci-fi novel to life. We compare it to the book, Lynch's version, and ask: does it deliver?",
    date: "2024-11-20",
    duration: 6300,
    podcastId: "p1",
    podcastTitle: "Burn Before Listening",
    artwork: "/images/podcast-1.svg",
    audioSrc: "/audio/sample.mp3",
  },
  {
    id: "e7",
    number: 398,
    title: "WandaVision Deep Dive",
    description:
      "Marvel's first Disney+ series takes risks with format and storytelling. We analyze each episode's sitcom homage and the MCU implications.",
    date: "2024-11-13",
    duration: 5700,
    podcastId: "p1",
    podcastTitle: "Burn Before Listening",
    artwork: "/images/podcast-1.svg",
    audioSrc: "/audio/sample.mp3",
  },
  {
    id: "e8",
    number: 397,
    title: "Nomadland",
    description:
      "Chloé Zhao's intimate portrait of modern American nomads. We discuss Frances McDormand's performance and why this film resonates so deeply.",
    date: "2024-11-06",
    duration: 4500,
    podcastId: "p1",
    podcastTitle: "Burn Before Listening",
    artwork: "/images/podcast-1.svg",
    audioSrc: "/audio/sample.mp3",
  },
  {
    id: "e9",
    number: 396,
    title: "Minari — The American Dream",
    description:
      "Lee Isaac Chung's semi-autobiographical film about a Korean-American family. A tender, beautifully crafted story about belonging and sacrifice.",
    date: "2024-10-30",
    duration: 4200,
    podcastId: "p1",
    podcastTitle: "Burn Before Listening",
    artwork: "/images/podcast-1.svg",
    audioSrc: "/audio/sample.mp3",
  },
  {
    id: "e10",
    number: 395,
    title: "Promising Young Woman",
    description:
      "Emerald Fennell's debut is sharp, provocative, and impossible to look away from. We dissect the themes, the ending, and Carey Mulligan's tour de force.",
    date: "2024-10-23",
    duration: 5400,
    podcastId: "p1",
    podcastTitle: "Burn Before Listening",
    artwork: "/images/podcast-1.svg",
    audioSrc: "/audio/sample.mp3",
  },
];

// ─── Additional episodes for other podcasts ─────────────────────────────────

export const techEpisodes: Episode[] = [
  {
    id: "te1",
    number: 156,
    title: "AI Revolution 2024",
    description:
      "The latest breakthroughs in artificial intelligence and what they mean for the future of work, creativity, and daily life.",
    date: "2024-12-20",
    duration: 3600,
    podcastId: "p2",
    podcastTitle: "The Daily Byte",
    artwork: "/images/podcast-2.svg",
  },
  {
    id: "te2",
    number: 155,
    title: "Apple Vision Pro Review",
    description:
      "After a month with Apple's spatial computing headset, we share our honest thoughts on what works, what doesn't, and what the future holds.",
    date: "2024-12-13",
    duration: 4200,
    podcastId: "p2",
    podcastTitle: "The Daily Byte",
    artwork: "/images/podcast-2.svg",
  },
];

// ─── Channel rankings ───────────────────────────────────────────────────────

export const topChannels: Channel[] = [
  {
    id: "p1",
    rank: 1,
    name: "Burn Before Listening",
    author: "POSTA",
    artwork: "/images/podcast-1.svg",
    category: "Entertainment",
  },
  {
    id: "p2",
    rank: 2,
    name: "The Daily Byte",
    author: "Tech Networks",
    artwork: "/images/podcast-2.svg",
    category: "Technology",
  },
  {
    id: "p3",
    rank: 3,
    name: "Mind & Matter",
    author: "Science Today",
    artwork: "/images/podcast-3.svg",
    category: "Science",
  },
  {
    id: "p4",
    rank: 4,
    name: "Sound Stories",
    author: "Audio Collective",
    artwork: "/images/podcast-4.jpg",
    category: "Documentary",
  },
  {
    id: "p5",
    rank: 5,
    name: "Culture Cast",
    author: "Media House",
    artwork: "/images/podcast-5.jpg",
    category: "Culture",
  },
  {
    id: "p6",
    rank: 6,
    name: "The Creative Hour",
    author: "Design Lab",
    artwork: "/images/podcast-6.jpg",
    category: "Design",
  },
  {
    id: "p7",
    rank: 7,
    name: "History Uncovered",
    author: "Past & Present",
    artwork: "/images/podcast-7.jpg",
    category: "History",
  },
  {
    id: "p8",
    rank: 8,
    name: "Startup Stories",
    author: "Venture Voice",
    artwork: "/images/podcast-8.jpg",
    category: "Business",
  },
];

// ─── Featured / carousel data ───────────────────────────────────────────────

export const featuredPodcast: Podcast = podcasts[0];

export const explorePodcasts: Podcast[] = podcasts.slice(0, 5);
export const trendingPodcasts: Podcast[] = podcasts.slice(3, 8);
export const relatedPodcasts: Podcast[] = podcasts.slice(1, 6);

/**
 * Get episodes for a specific podcast.
 */
export function getEpisodesByPodcast(podcastId: string): Episode[] {
  if (podcastId === "p2") return techEpisodes;
  return episodes.filter((e) => e.podcastId === podcastId);
}

/**
 * Get a podcast by its ID.
 */
export function getPodcastById(id: string): Podcast | undefined {
  return podcasts.find((p) => p.id === id);
}

/**
 * Get an episode by its ID.
 */
export function getEpisodeById(id: string): Episode | undefined {
  return [...episodes, ...techEpisodes].find((e) => e.id === id);
}

/**
 * Simple search across podcasts and episodes.
 */
export function searchAll(query: string): {
  podcasts: Podcast[];
  episodes: Episode[];
} {
  const q = query.toLowerCase();
  return {
    podcasts: podcasts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    ),
    episodes: [...episodes, ...techEpisodes].filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.podcastTitle.toLowerCase().includes(q)
    ),
  };
}
