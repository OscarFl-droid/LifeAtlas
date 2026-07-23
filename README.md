# LifeAtlas v0.1 — GitHub Pages PWA

A static, installable, offline-first proof of concept for LifeAtlas. No build step, server, account, analytics, or external API is required.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy to GitHub Pages

1. Create a repository and copy this directory into it.
2. Commit and push to the `main` branch.
3. In **Settings → Pages**, choose **Deploy from a branch**, `main`, `/ (root)`.
4. Open the generated Pages URL. The app can then be installed as a PWA.

## Current capabilities

- Three experience packs: routine and recovery, professional growth, study consistency.
- Local event archive using browser storage.
- Deterministic state reconstruction from event history.
- Sequence-sensitive pattern rules.
- Explainable recommendations with confidence and provenance.
- Living Atlas capability map.
- Corrections by additive superseding events.
- JSON export/import and complete local reset.
- Service-worker offline operation.

## Important limitation

This proof of concept uses `localStorage`, not encrypted IndexedDB. It is suitable for product demonstration and GitHub Pages validation, not sensitive production data.
