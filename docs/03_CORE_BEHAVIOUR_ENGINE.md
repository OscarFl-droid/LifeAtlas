# Core Behaviour Engine

## Universal event model

```json
{
  "event_id": "evt_01JXYZ",
  "event_type": "exercise_completed",
  "occurred_at": "2026-07-23T18:30:00+02:00",
  "recorded_at": "2026-07-23T18:44:12+02:00",
  "value": {"duration_minutes": 35, "intensity": 3},
  "context": ["poor_sleep", "high_workload"],
  "source": "manual",
  "confidence": 1.0,
  "schema_version": 1
}
```

## Universal primitives
Action, context, outcome, intensity, timing, confidence, source, state effect, correction link, evidence relevance.

## Components
1. Event archive
2. Sequence detector
3. Pattern detector
4. Threshold engine
5. Temporary-state engine
6. Long-term conditioning engine
7. Capability resolver
8. Risk resolver
9. Recommendation engine
10. Explanation generator
11. Atlas renderer
12. Replay and audit engine

## Explainability
Every recommendation must answer why it appeared, which behaviours contributed, over what period, whether it comes from expert evidence or personal history, how confident it is, and what would change it.
