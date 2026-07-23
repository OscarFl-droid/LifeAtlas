# CareerAtlas v0.2 — LifeAtlas ACE Foundation

A static, offline-first GitHub Pages application implementing the first Adaptive Capability Engine (ACE) baseline.

## Implemented

- Twelve-node CareerAtlas competency schema across Direction, Delivery, Growth, Influence and Sustainability.
- Professional evidence events covering decisions, delivery, failure, feedback, leadership, coordination, boundaries, recovery and overload.
- Outcome-, significance- and evidence-quality-weighted capability updates.
- Capability-specific temporal decay and directed capability interactions.
- Deterministic replay from an additive event ledger.
- Behaviour Genome temporal motif detection.
- Explainable recommendations and inspectable capability evidence.
- Local JSON backup/restore and offline service worker.
- Automatic migration of the v0.1 profile; generic v0.1 events are not imported because they do not contain sufficient ACE evidence semantics.

## Deploy

Upload all files to the root of a GitHub repository and enable GitHub Pages from the main branch/root directory. No build step is required.

## Cache update

The service worker cache is `lifeatlas-v0.2.0`. Existing installed copies may require one reload after GitHub Pages finishes deploying.
