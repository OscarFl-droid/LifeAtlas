# CareerAtlas v0.3 — LifeAtlas ACE Full Rebuild

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

The service worker cache is `lifeatlas-v0.3.0`. Existing installed copies may require one reload after GitHub Pages finishes deploying.

## v0.3.1 debugging release

This maintenance release corrects ACE risk-event polarity, so severe overload and avoidance outcomes can no longer increase capability scores. It also makes historical replay recommendations use the replay timestamp rather than the live clock, validates imported and manually entered dates, hardens malformed backup handling, implements additive event correction through supersession, improves iPhone safe-area layout, and prevents the service worker from returning HTML for missing JavaScript or stylesheet requests.
