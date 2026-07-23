# Longitudinal and Offline Architecture

## Principle
The app must remain useful without internet access and retain usable records over many years.

```text
Installable PWA or native application
→ encrypted local database
→ local analytics and rules
→ optional encrypted synchronisation
```

## Offline functions
Onboarding, logging, history, Atlas, local pattern detection, standard recommendations, explanations, templates, reports, backup export.

## Data layers
- event archive;
- derived-state cache;
- evidence registry;
- recommendation archive;
- user interpretation history.

## Corrections
Corrections should be additive, not destructive.

## Durability requirements
Automatic local backups, optional encrypted cloud backup, user-controlled export, open documented format, deterministic migrations, integrity checks, device restore, schema versioning, account-independent emergency recovery.
