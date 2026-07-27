"""
storage_paths.py — Deterministic blob naming helpers for the AI worker.

This mirrors the TypeScript StoragePaths in shared/src/storage-paths.ts.
All blob paths for the application are defined here so there's a
single source of truth for where blobs live.
"""


class StoragePaths:
    """Deterministic blob path generators. Mirrors the TS version."""

    @staticmethod
    def raw_audio(episode_id: str, ext: str = "webm") -> str:
        """Original uploaded audio: episodes/{episodeId}/raw/audio.{ext}"""
        return f"episodes/{episode_id}/raw/audio.{ext}"

    @staticmethod
    def processed_audio(episode_id: str) -> str:
        """Processed/normalized audio: episodes/{episodeId}/processed/audio.m4a"""
        return f"episodes/{episode_id}/processed/audio.m4a"

    @staticmethod
    def transcript(episode_id: str) -> str:
        """Transcript JSON: episodes/{episodeId}/transcripts/transcript.json"""
        return f"episodes/{episode_id}/transcripts/transcript.json"

    @staticmethod
    def summary(episode_id: str) -> str:
        """AI summary JSON: episodes/{episodeId}/ai/summary.json"""
        return f"episodes/{episode_id}/ai/summary.json"

    @staticmethod
    def episode_artwork(episode_id: str, ext: str = "png") -> str:
        """Episode artwork: episodes/{episodeId}/artwork/thumbnail.{ext}"""
        return f"episodes/{episode_id}/artwork/thumbnail.{ext}"

    @staticmethod
    def episode_prefix(episode_id: str) -> str:
        """Prefix for all blobs under an episode: episodes/{episodeId}/"""
        return f"episodes/{episode_id}/"

    @staticmethod
    def podcast_artwork(podcast_id: str, ext: str = "png") -> str:
        """Podcast cover artwork: podcasts/{podcastId}/artwork/cover.{ext}"""
        return f"podcasts/{podcast_id}/artwork/cover.{ext}"

    @staticmethod
    def podcast_prefix(podcast_id: str) -> str:
        """Prefix for all blobs under a podcast: podcasts/{podcastId}/"""
        return f"podcasts/{podcast_id}/"
