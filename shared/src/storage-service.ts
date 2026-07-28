/**
 * storage-service.ts — Application-level storage operations.
 *
 * Builds on StorageProvider (low-level SDK wrapper) and StoragePaths
 * (deterministic naming) to provide business-level helpers.
 *
 * Responsibilities:
 *  - Generate episode upload URLs
 *  - Generate podcast artwork upload URLs
 *  - Generate read URLs for audio playback
 *  - Delete all assets for an episode or podcast
 *  - Validate uploads
 */

import { StorageProvider } from "./storage-provider";
import { StoragePaths } from "./storage-paths";

export class StorageService {
  private provider: StorageProvider;

  constructor(provider: StorageProvider) {
    this.provider = provider;
  }

  // ─── Upload URL Generation ────────────────────────────────────────────────

  /**
   * Generate an upload SAS URL for raw episode audio.
   * The frontend uploads directly to this URL.
   *
   * Returns the SAS URL (for uploading) and the blob path (to store in the DB).
   */
  generateEpisodeUploadUrl(
    episodeId: string,
    mimeType: string
  ): { sasUrl: string; blobPath: string } {
    const ext = StoragePaths.extFromMime(mimeType);
    const blobPath = StoragePaths.rawAudio(episodeId, ext);
    return this.provider.generateUploadSasUrl(blobPath, mimeType);
  }

  /**
   * Generate an upload SAS URL for podcast cover artwork.
   */
  generatePodcastArtworkUploadUrl(
    podcastId: string,
    mimeType: string
  ): { sasUrl: string; blobPath: string } {
    const ext = StoragePaths.extFromMime(mimeType);
    const blobPath = StoragePaths.podcastArtwork(podcastId, ext);
    return this.provider.generateUploadSasUrl(blobPath, mimeType);
  }

  /**
   * Generate an upload SAS URL for episode artwork.
   */
  generateEpisodeArtworkUploadUrl(
    episodeId: string,
    mimeType: string
  ): { sasUrl: string; blobPath: string } {
    const ext = StoragePaths.extFromMime(mimeType);
    const blobPath = StoragePaths.episodeArtwork(episodeId, ext);
    return this.provider.generateUploadSasUrl(blobPath, mimeType);
  }

  // ─── Read URL Generation ──────────────────────────────────────────────────

  /**
   * Generate a temporary read SAS URL for a blob path.
   * Used for audio playback, artwork display, etc.
   */
  generateReadUrl(blobPath: string, expiresInMinutes = 60): string {
    return this.provider.generateReadSasUrl(blobPath, expiresInMinutes);
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  /**
   * Delete all blobs associated with an episode.
   * Removes raw audio, processed audio, transcripts, AI data, artwork, exports.
   */
  async deleteEpisodeAssets(episodeId: string): Promise<number> {
    const prefix = StoragePaths.episodePrefix(episodeId);
    return this.provider.deletePrefix(prefix);
  }

  /**
   * Delete all blobs associated with a podcast.
   * Removes artwork, branding, and any other podcast-level assets.
   */
  async deletePodcastAssets(podcastId: string): Promise<number> {
    const prefix = StoragePaths.podcastPrefix(podcastId);
    return this.provider.deletePrefix(prefix);
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  /**
   * Check whether the raw audio blob exists for an episode.
   * Useful for verifying the frontend upload completed before starting processing.
   */
  async verifyEpisodeUpload(
    episodeId: string,
    ext: string = "webm"
  ): Promise<boolean> {
    const blobPath = StoragePaths.rawAudio(episodeId, ext);
    return this.provider.blobExists(blobPath);
  }

  // ─── Direct Provider Access ───────────────────────────────────────────────

  /** Access the underlying StorageProvider for low-level operations. */
  getProvider(): StorageProvider {
    return this.provider;
  }
}
