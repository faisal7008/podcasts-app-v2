import test from "node:test";
import assert from "node:assert/strict";

// Pure RRF fusion test matching computeRrfFusion logic in web/lib/rag/retriever.ts
function computeRrfFusion(vectorIds, ftsIds, k = 60) {
  const scores = new Map();
  vectorIds.forEach((id, index) => {
    scores.set(id, (scores.get(id) ?? 0) + 1 / (k + index + 1));
  });
  ftsIds.forEach((id, index) => {
    scores.set(id, (scores.get(id) ?? 0) + 1 / (k + index + 1));
  });
  return Array.from(scores.entries())
    .map(([id, rrfScore]) => ({ id, rrfScore }))
    .sort((a, b) => b.rrfScore - a.rrfScore);
}

test("RRF boosts documents appearing in both vector and FTS rankings", () => {
  const vectorIds = ["c1", "c2", "c3"];
  const ftsIds = ["c3", "c4", "c1"];
  const fused = computeRrfFusion(vectorIds, ftsIds, 60);

  // c1 (rank 1 vec + rank 3 fts) and c3 (rank 3 vec + rank 1 fts) tie at top above c2 & c4
  assert.ok(["c1", "c3"].includes(fused[0].id));
  assert.ok(["c1", "c3"].includes(fused[1].id));
  assert.ok(fused[0].rrfScore > fused[2].rrfScore);
});

test("RRF handles disjoint or empty FTS results gracefully", () => {
  const fused = computeRrfFusion(["c1", "c2"], [], 60);
  assert.deepEqual(
    fused.map((x) => x.id),
    ["c1", "c2"]
  );
});
