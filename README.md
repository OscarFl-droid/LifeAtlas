# LifeAtlas Phase 1 — GitHub Pages Pilot

A local-first, offline-capable longitudinal research and experimental coaching app for a 2–3 person, one-month pilot.

## One-click deployment

1. Create a new **GitHub repository with GitHub Pages enabled**.
2. Upload every file and folder from this package to the repository root.
3. Open **Settings → Pages** and choose **GitHub Actions** as the source.
4. Open the **Actions** tab. The `Deploy LifeAtlas to GitHub Pages` workflow tests and publishes the app.
5. Open the published URL on each iPhone and use **Share → Add to Home Screen**.

No command line, local server, package installation or coding is required.

## Participant workflow

- Complete onboarding.
- Complete the daily accessibility check.
- Record meaningful action plans and reviews.
- Record context changes.
- After sufficient evidence, inspect low-risk coaching hypotheses.
- In **Data**, create an encrypted `.latlas` export and share it voluntarily.

## Researcher workflow

- Open `<your-site>/console/`.
- Select the participant’s `.latlas` file.
- Enter the participant-provided passphrase.
- The console validates integrity, replays the deterministic engine and shows the pilot report locally.

## Included controls

- IndexedDB structured storage.
- Append-only canonical event ledger.
- deterministic replay, correction, encryption and package-structure tests in GitHub Actions.
- AES-256-GCM encrypted export with PBKDF2-SHA256 key derivation.
- content hash verification.
- service-worker offline cache.
- participant-controlled restore and erasure.
- versioned AHOS ontology and measurement catalogue.

## Honest Phase 1 limits

A GitHub Pages web app cannot directly read protected Apple Calendar, Reminders, Screen Time or continuous location services. The web pilot therefore includes manual/context capture and is architected for a later narrow native iOS bridge. Do not promise automated native import until that bridge is signed and installed.

This is a functional research pilot, not a validated clinical, psychological, employment or insurance assessment system.


## v0.1.1 audit fixes

- Fixed the Today-screen Daily Check button, which previously opened no form.
- Replaced the weak determinism assertion with full stable nested-output comparison.
- Implemented actual supersession of corrected ledger events.
- Added restore format, event-schema, integrity and deterministic-replay validation.
- Added Research Console comparison between exported and independently replayed state.
- Prevented offline navigation fallback from masquerading as missing JSON or JavaScript.
- Improved IndexedDB transaction handling, database closure and blocked-upgrade errors.
- Improved large encrypted-export Base64 handling and decryption error messages.
- Added iPhone home-screen touch icon and expanded automated tests.
