import DOMPurify from "dompurify";
import parse from "html-react-parser";

/**
 * Sanitizes an HTML string, allowing only a safe subset of tags.
 * Converts <a> tags to include target="_blank" and rel="noopener noreferrer".
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "em", "i", "strong", "b", "a"],
    ALLOWED_ATTR: ["href"],
  });

  // Add target="_blank" and rel="noopener noreferrer" to links
  return cleanHtml.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
}

/**
 * Parses sanitized HTML string into React nodes.
 */
export function parseHtml(html: string) {
  if (!html) return null;
  const sanitized = sanitizeHtml(html);
  return parse(sanitized);
}

/**
 * Formats raw API category enums (e.g., PODCASTSERIES_TRUE_CRIME) into readable strings (e.g., True Crime).
 * Unknown or deeply nested enums can be filtered by the caller if this returns a generic string.
 */
export function formatCategory(category: string): string | null {
  if (!category) return null;
  
  // Remove PODCASTSERIES_ prefix if present
  let clean = category.replace(/^PODCASTSERIES_/, "");
  
  // Replace underscores with spaces
  clean = clean.replace(/_/g, " ");
  
  // Title Case
  clean = clean.split(" ").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(" ");
  
  // If it's still looking like a raw enum or completely unknown, we can return null to hide it
  // But generally, the above transformations will make it presentable.
  return clean;
}

/**
 * Cleans up buggy episode titles that have raw prefixes like "0. " or "1. ".
 */
export function formatEpisodeTitle(title: string): string {
  if (!title) return "";
  // Remove "0. " or "1. " at the beginning of titles if they exist
  return title.replace(/^[0-9]+\.\s/, "");
}

/**
 * Formats season and episode numbers into a clean string like "S1 E2" or "Episode 2".
 */
export function formatEpisodeNumber(season?: number, episode?: number): string | null {
  if (season && episode) return `S${season} E${episode}`;
  if (episode) return `Episode ${episode}`;
  return null;
}
