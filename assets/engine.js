const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));
const day = t => new Date(t).toISOString().slice(0, 10);

function stableClone(value) {
  if (Array.isArray(value)) return value.map(stableClone);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(k => [k, stableClone(value[k])]));
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(stableClone(value));
}

export function resolveActiveEvents(events) {
  const superseded = new Set();
  for (const event of events) {
    if (event.type === 'event.corrected') {
      const target = event.supersedes || event.payload?.supersedes || event.payload?.targetEventId;
      if (target) superseded.add(target);
    }
  }
  return events
    .filter(event => event.type !== 'event.corrected' && !superseded.has(event.id))
    .sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)) || String(a.id).localeCompare(String(b.id)));
}

export function replay(events, options = {}) {
  const active = resolveActiveEvents(events);
  const daily = active.filter(e => e.type === 'state.daily');
  const plans = active.filter(e => e.type === 'action.planned');
  const reviews = active.filter(e => e.type === 'action.reviewed');
  const avg = (arr, k) => arr.length ? arr.reduce((s, e) => s + Number(e.payload?.[k] ?? 0), 0) / arr.length : null;
  const last14 = daily.slice(-14);

  const modules = {
    professional: 45, cognitive: 45, physical: 45, emotional: 45, social: 45,
    purpose: 45, learning: 45, risk: 45, household: 45, creative: 45
  };

  for (const event of active) {
    const mappedModules = Array.isArray(event.payload?.modules) ? event.payload.modules : [];
    for (const moduleId of mappedModules) {
      if (modules[moduleId] == null) continue;
      const delta = event.type === 'action.reviewed'
        ? (Number(event.payload?.completion || 0) - 2) * 2
        : event.type === 'action.planned' ? 0.3 : 0;
      modules[moduleId] = clamp(modules[moduleId] + delta);
    }
  }

  const accessibility = {
    restoration: avg(last14, 'restoration'),
    physicalReadiness: avg(last14, 'physicalReadiness'),
    cognitiveClarity: avg(last14, 'cognitiveClarity'),
    attention: avg(last14, 'attention'),
    emotionalLoad: avg(last14, 'emotionalLoad'),
    recoveryReserve: avg(last14, 'recoveryReserve')
  };

  const days = new Set(daily.map(e => day(e.occurredAt))).size;
  const quality = {
    events: active.length,
    canonicalEvents: events.length,
    correctedEvents: events.filter(e => e.type === 'event.corrected').length,
    dailyDays: days,
    actionPlans: plans.length,
    actionReviews: reviews.length,
    completeness: Math.round(Math.min(100, (days / 30 * 55) + (reviews.length / 20 * 45)))
  };

  const eligibility = { baselineDays: days, eligible: days >= 10 && plans.length >= 8 && reviews.length >= 3, reasons: [] };
  if (days < 10) eligibility.reasons.push(`${10 - days} more daily checks`);
  if (plans.length < 8) eligibility.reasons.push(`${8 - plans.length} more action plans`);
  if (reviews.length < 3) eligibility.reasons.push(`${3 - reviews.length} more action reviews`);

  const recommendations = [];
  if (last14.length >= 3) {
    const rest = accessibility.restoration;
    const load = accessibility.emotionalLoad;
    if (rest != null && rest < 1.7) recommendations.push({
      id: 'recovery-window', class: 'experiment', title: 'Protect one recovery window',
      observation: 'Restoration has been below your recent typical range.',
      hypothesis: 'A small protected recovery period may improve later accessibility.',
      alternatives: ['temporary context change', 'measurement noise', 'illness or travel'],
      experiment: 'Schedule one 30–45 minute low-demand recovery window and compare the next check-in.',
      confidence: 'low', risk: 'low'
    });
    if (load != null && load > 2.8) recommendations.push({
      id: 'reduce-coordination', class: 'contextual', title: 'Reduce coordination load',
      observation: 'Reported emotional load is elevated.',
      hypothesis: 'Removing one unresolved dependency may reduce friction.',
      alternatives: ['external event', 'short-lived workload peak'],
      experiment: 'Choose one action and define only its next visible step.',
      confidence: 'low', risk: 'low'
    });
  }

  if (plans.length >= 4 && reviews.length >= 3) {
    const clear = plans.filter(e => String(e.payload?.nextStep || '').trim().length > 5).length / plans.length;
    if (clear < 0.65) recommendations.push({
      id: 'next-step', class: 'experiment', title: 'Make the next action visible',
      observation: 'Several planned actions lack a concrete next step.',
      hypothesis: 'Ambiguity may be contributing to initiation friction.',
      alternatives: ['time shortage', 'low endorsement', 'dependency blockage'],
      experiment: 'For three actions, write a next step that can be started in under five minutes.',
      confidence: 'moderate', risk: 'low'
    });
  }

  return {
    version: '0.1.1',
    generatedAt: options.generatedAt || null,
    modules,
    accessibility,
    quality,
    eligibility,
    recommendations
  };
}

export function validateDeterminism(events) {
  const first = replay(events, { generatedAt: null });
  const second = replay(structuredClone(events), { generatedAt: null });
  return stableStringify(first) === stableStringify(second);
}
