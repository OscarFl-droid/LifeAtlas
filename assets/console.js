import { decryptJSON, sha256 } from './crypto.js';
import { replay, validateDeterminism, stableStringify } from './engine.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[char]));

function validateDataset(data) {
  if (!data || data.manifest?.format !== 'LifeAtlasPhase1') throw new Error('Unsupported LifeAtlas dataset format.');
  if (!Array.isArray(data.events)) throw new Error('Dataset event ledger is missing.');
  for (const event of data.events) {
    if (!event?.id || !event?.type || !event?.occurredAt || !event?.recordedAt || typeof event.payload !== 'object') throw new Error('Dataset contains a malformed event.');
    if (Number.isNaN(Date.parse(event.occurredAt)) || Number.isNaN(Date.parse(event.recordedAt))) throw new Error('Dataset contains an invalid event date.');
  }
}

$('#open').onclick = async () => {
  const file = $('#file').files?.[0];
  const passphrase = $('#pass').value;
  if (!file) { $('#status').textContent = 'Choose an export.'; return; }
  try {
    $('#status').textContent = 'Decrypting and validating locally…';
    const data = await decryptJSON(await file.text(), passphrase);
    validateDataset(data);
    const hash = await sha256({ events:data.events, profile:data.profile });
    const integrity = hash === data.manifest.contentHash && Number(data.manifest.eventCount) === data.events.length;
    const model = replay(data.events, { generatedAt:data.derived?.generatedAt || data.manifest.exportedAt || null });
    const deterministic = validateDeterminism(data.events);
    const storedComparable = data.derived ? { ...data.derived, generatedAt:model.generatedAt } : null;
    const replayMatchesExport = storedComparable ? stableStringify(storedComparable) === stableStringify(model) : false;
    $('#status').textContent = 'Dataset opened.';
    $('#report').innerHTML = `<section class="panel"><p class="eyebrow">VALIDATION</p><h2>${integrity && deterministic && replayMatchesExport ? 'Dataset passed core checks' : 'Review required'}</h2><div class="grid"><div class="metric"><span class="muted">Integrity</span><strong>${integrity?'Pass':'Fail'}</strong></div><div class="metric"><span class="muted">Replay deterministic</span><strong>${deterministic?'Pass':'Fail'}</strong></div><div class="metric"><span class="muted">Replay matches export</span><strong>${replayMatchesExport?'Pass':'Fail'}</strong></div><div class="metric"><span class="muted">Events</span><strong>${data.events.length}</strong></div><div class="metric"><span class="muted">Completeness</span><strong>${model.quality.completeness}%</strong></div></div></section>
    <section class="panel"><h2>Participant summary</h2><table class="table"><tr><th>Occupation</th><td>${esc(data.profile?.occupation)}</td></tr><tr><th>Priority</th><td>${esc(data.profile?.priority)}</td></tr><tr><th>Daily check days</th><td>${model.quality.dailyDays}</td></tr><tr><th>Action plans</th><td>${model.quality.actionPlans}</td></tr><tr><th>Action reviews</th><td>${model.quality.actionReviews}</td></tr><tr><th>Corrected events</th><td>${model.quality.correctedEvents}</td></tr><tr><th>Coaching eligible</th><td>${model.eligibility.eligible?'Yes':'No'}</td></tr></table></section>
    <section class="panel"><h2>Atlas projections</h2>${Object.entries(model.modules).map(([key,value]) => `<div class="item"><strong>${esc(key)}</strong><div class="bar"><i style="width:${value}%"></i></div><span class="muted">${Math.round(value)}</span></div>`).join('')}</section>
    <section class="panel"><h2>Coaching hypotheses</h2>${model.recommendations.map(item => `<div class="item"><span class="badge">${esc(item.class)}</span><h3>${esc(item.title)}</h3><p>${esc(item.observation)}</p><p class="muted">${esc(item.experiment)}</p></div>`).join('') || '<p class="muted">No eligible hypotheses.</p>'}</section>`;
  } catch (error) {
    $('#status').innerHTML = `<span class="error">${esc(error.message)}</span>`;
    $('#report').innerHTML = '';
  }
};
