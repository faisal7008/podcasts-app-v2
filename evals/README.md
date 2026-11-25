# RAG Evaluation & Benchmark Suite

This directory contains the golden dataset and automated benchmark scripts for measuring RAG retrieval quality, multi-turn query rewriting, and cache behavior.

## Run Locally

```bash
# Baseline (pure dense vector, no query rewriting)
node evals/bench_retrieval.mjs --mode=baseline --out=evals/results/baseline.json

# Upgraded (Hybrid Vector + BM25 RRF + Query Rewriting)
node evals/bench_retrieval.mjs --mode=upgraded --out=evals/results/final.json
```
