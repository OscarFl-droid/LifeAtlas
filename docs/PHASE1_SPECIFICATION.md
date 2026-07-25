# LifeAtlas Phase 1 Functional Specification v0.1

## Objective
Generate the highest-quality feasible longitudinal AHOS dataset from 2–3 adult close collaborators over one month, maintain participant control, and activate cautious experimental coaching after an individual baseline is available.

## Pilot configuration
- Mixed occupations, ages and lifestyles.
- All LifeAtlas behavioural domains represented.
- Manual capture guaranteed. Calendar, reminders/tasks, location category and screen-time are represented through manual or import-ready context events until a native bridge exists.
- Requested coaching is available throughout; unsolicited substantive coaching is gated.
- Maximum one substantive suggestion daily, several capped contextual suggestions, and 2–3 new experiments weekly.

## Product boundaries
The system does not diagnose stress, depression, burnout or disease; predict medical deterioration; recommend treatment; replace professional judgement; claim validated psychological measurement; or support employment or insurance decisions.

## Data architecture
Canonical events are append-only. Derived states are reproducible from events, ontology version and model version. Exports are participant initiated and encrypted.

## Acceptance criteria
1. Installable and usable from GitHub Pages on iPhone.
2. Functions offline after first successful load.
3. Daily checks, action plans, action reviews and context events survive reloads.
4. Identical event histories produce identical engine outputs.
5. Encrypted export decrypts and validates in the Research Console.
6. Restore reproduces the canonical event count.
7. No clinical or consequential decision output is generated.
