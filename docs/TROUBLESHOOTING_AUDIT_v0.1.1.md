# LifeAtlas Phase 1 v0.1.1 — Troubleshooting Audit

Audit date: 2026-07-25

## Scope

The repository was unpacked and audited across the participant app, deterministic engine, IndexedDB layer, encrypted export/restore workflow, Research Console, service worker, GitHub Actions workflow, data files and GitHub Pages asset paths.

## Material defects fixed

1. **Today-screen Daily Check did nothing**
   - Cause: the handler only inserted the form when `#formZone` already existed, but that container is absent from the Today screen.
   - Fix: the app now navigates to Capture, renders the requested form and scrolls it into view.

2. **Determinism test was not testing full output**
   - Cause: `JSON.stringify` used an array replacer that removed most nested properties, while generated timestamps could also vary.
   - Fix: deterministic replay now uses stable recursive key ordering and a null generation timestamp during validation.

3. **Corrections did not supersede target events**
   - Cause: the engine merely removed `event.corrected` records while leaving the incorrect target event active.
   - Fix: correction records now identify and exclude superseded target events during replay while preserving the immutable ledger.

4. **Restore accepted unverified datasets**
   - Cause: decrypted exports were written directly into IndexedDB without format, schema, content-hash or replay checks.
   - Fix: restore now validates format, event structure, timestamps, SHA-256 content integrity and deterministic replay before destructive replacement.

5. **Research Console did not confirm exported state reproducibility**
   - Fix: it now independently replays the ledger and compares the full reconstructed state with the state stored in the export.

6. **Offline fallback could return HTML for missing data/code assets**
   - Cause: every failed request fell back to `index.html`.
   - Fix: only navigation requests receive the app-shell fallback. Missing JSON or JavaScript now fail honestly.

7. **IndexedDB robustness issues**
   - Fixes: transactions now report aborts, database handles close after use, multi-store erasure is atomic, and blocked upgrades produce an actionable error.

8. **Large encrypted exports risked argument-size failure during Base64 conversion**
   - Fix: byte conversion is chunked.

9. **Decryption errors were ambiguous**
   - Fix: unsupported, incomplete, malformed and wrong-passphrase/corruption cases now produce clearer messages.

10. **iPhone home-screen icon support was incomplete**
    - Fix: added a 180×180 Apple touch icon and cached it offline.

## Verification completed

- Engine unit tests: pass
- Correction/supersession tests: pass
- Stable replay tests with reordered inputs: pass
- AES-256-GCM encrypted round trip: pass
- Wrong-passphrase rejection: pass
- Minimum-passphrase enforcement: pass
- SHA-256 generation: pass
- Package structure tests: pass
- JavaScript syntax checks: pass
- JSON and manifest validation: pass
- Local HTTP delivery of all required assets: pass
- GitHub Actions updated to run the expanded test suite before deployment

## Remaining validation that requires an actual iPhone

The package is structurally and logically verified in the available environment. The following must still be tested after GitHub Pages deployment on the target iPhones because they depend on Safari/iOS behaviour:

- Add to Home Screen installation and icon rendering
- persistent-storage grant/retention across device restart and low-storage conditions
- service-worker update behaviour between releases
- encrypted file download and restore through the iOS Files picker
- offline launch after Safari has been fully closed
- layout and keyboard behaviour on each participant's device

These are deployment acceptance tests, not known unresolved code defects.
