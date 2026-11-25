"""Unit and performance tests for ai-worker transcript chunking."""

import time
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services import AIService


def _make_service() -> AIService:
    # Instantiate without calling external APIs in __init__ by bypassing __init__
    return AIService.__new__(AIService)


def test_chunk_transcript_empty():
    svc = _make_service()
    assert svc.chunk_transcript("") == []
    assert svc.chunk_transcript("   \n  ") == []


def test_chunk_transcript_timestamps_and_boundaries():
    svc = _make_service()
    transcript = (
        "[00:05] Welcome to the podcast about vector search.\n"
        "[00:15] Today we discuss pgvector HNSW and hybrid retrieval.\n"
        "[00:30] Full text search helps with exact identifiers.\n"
        "[00:45] Combining both with RRF improves recall."
    )
    chunks = svc.chunk_transcript(transcript, chunk_size=15, chunk_overlap=3)

    assert len(chunks) >= 2
    assert chunks[0]["chunk_index"] == 0
    assert chunks[0]["metadata"]["first_timestamp"] == "00:05"
    assert chunks[0]["start_offset"] == 0
    # Ensure offsets monotonically progress and stay within bounds
    for c in chunks:
        assert 0 <= c["start_offset"] < c["end_offset"] <= len(transcript)


def test_chunk_transcript_linear_performance_100k_words():
    svc = _make_service()
    line = "[01:00] Scaling background workers with BullMQ and Redis queues reliably.\n"
    # 10 words per line * 10,000 lines = 100,000 words
    transcript = line * 10_000

    t0 = time.perf_counter()
    chunks = svc.chunk_transcript(transcript, chunk_size=500, chunk_overlap=50)
    elapsed = time.perf_counter() - t0

    assert len(chunks) > 150
    # O(N) chunking should finish 100k words well under 1.0s (old O(N^2) took many seconds)
    assert elapsed < 1.0, f"Chunking 100k words took too long: {elapsed:.3f}s"
