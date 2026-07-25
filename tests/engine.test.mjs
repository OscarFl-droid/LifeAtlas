import assert from 'node:assert/strict';
import { replay, validateDeterminism, resolveActiveEvents, stableStringify } from '../assets/engine.js';

const events = [
  { id:'1', type:'state.daily', occurredAt:'2026-07-01T08:00:00Z', recordedAt:'2026-07-01T08:00:01Z', payload:{ restoration:2, physicalReadiness:3, cognitiveClarity:3, attention:2, emotionalLoad:1, recoveryReserve:3 } },
  { id:'2', type:'action.planned', occurredAt:'2026-07-01T09:00:00Z', recordedAt:'2026-07-01T09:00:01Z', payload:{ title:'Draft', nextStep:'Open document and outline', modules:['professional','cognitive'] } },
  { id:'3', type:'action.reviewed', occurredAt:'2026-07-01T10:00:00Z', recordedAt:'2026-07-01T10:00:01Z', payload:{ title:'Draft', completion:4, quality:3, modules:['professional','cognitive'] } }
];

const model = replay(events);
assert.equal(model.version, '0.1.1');
assert.equal(model.generatedAt, null);
assert.equal(model.quality.events, 3);
assert.equal(model.quality.canonicalEvents, 3);
assert.equal(model.quality.actionPlans, 1);
assert.equal(model.quality.actionReviews, 1);
assert.equal(validateDeterminism(events), true);
assert.ok(model.modules.professional > 45);

const correction = {
  id:'4', type:'event.corrected', occurredAt:'2026-07-01T11:00:00Z', recordedAt:'2026-07-01T11:00:01Z',
  supersedes:'3', payload:{ targetEventId:'3', reason:'Entered against wrong action' }
};
const corrected = replay([...events, correction]);
assert.equal(resolveActiveEvents([...events, correction]).some(event => event.id === '3'), false);
assert.equal(corrected.quality.actionReviews, 0);
assert.equal(corrected.quality.canonicalEvents, 4);
assert.equal(corrected.quality.correctedEvents, 1);

const reversed = replay([...events].reverse());
assert.equal(stableStringify(reversed), stableStringify(model));

const dated = replay(events, { generatedAt:'2026-07-02T00:00:00Z' });
assert.equal(dated.generatedAt, '2026-07-02T00:00:00Z');
assert.equal(validateDeterminism(events), true);

console.log('LifeAtlas engine tests passed.');
