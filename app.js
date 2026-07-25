import { all, appendEvent, put, get, clearAll } from './db.js';
import { replay, validateDeterminism } from './engine.js';
import { encryptJSON, decryptJSON, sha256 } from './crypto.js';

const APP_VERSION = '0.1.1';
const app = document.querySelector('#app');
let route = 'today';
let ontology;
let templates;
let measurements;

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const scale = (name, label) => `<label class="field">${label}<div class="scale">${[0,1,2,3,4]
  .map(value => `<label><input type="radio" name="${name}" value="${value}" required>${value}</label>`).join('')}</div></label>`;

async function load() {
  try {
    const responses = await Promise.all(['data/ontology.json', 'data/action-templates.json', 'data/measurements.json'].map(path => fetch(path)));
    if (responses.some(response => !response.ok)) throw new Error('A required LifeAtlas configuration file could not be loaded.');
    [ontology, templates, measurements] = await Promise.all(responses.map(response => response.json()));
    await initialiseStorage();
    await render();
  } catch (error) {
    app.innerHTML = `<main class="shell"><section class="panel"><h1>LifeAtlas could not start</h1><p class="error">${esc(error.message)}</p><p>Reload while connected once, then reopen the installed app.</p></section></main>`;
  }
}

async function initialiseStorage() {
  if (navigator.storage?.persist) {
    try { await navigator.storage.persist(); } catch { /* availability varies by browser */ }
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.warn);
}

async function currentState() {
  const events = await all('events');
  return { events, model: replay(events), profile: await get('meta', 'profile') };
}

async function render() {
  const state = await currentState();
  app.innerHTML = `<div class="shell"><header class="top"><div><p class="eyebrow">ADAPTIVE HUMAN OPERATING SYSTEM</p><h2>LifeAtlas</h2></div><span class="badge">Local-first</span></header>${
    route === 'today' ? today(state) : route === 'log' ? log() : route === 'atlas' ? atlas(state) : route === 'history' ? history(state) : settings(state)
  }</div>${nav()}`;
  bind();
}

function today({ model, profile }) {
  if (!profile) return onboarding();
  const recommendation = model.recommendations[0];
  return `<section class="panel hero"><p class="eyebrow">TODAY</p><h1>${esc(profile.displayName || 'Your Atlas')}</h1><p class="muted">Day ${model.quality.dailyDays || 1} of the one-month pilot · ${model.quality.completeness}% dataset completeness</p><div class="button-row"><button class="primary" data-go="daily">Daily check</button><button class="secondary" data-route="log">Record action</button></div></section>
  <section class="grid">${Object.entries({ Checks:model.quality.dailyDays, Plans:model.quality.actionPlans, Reviews:model.quality.actionReviews, Events:model.quality.events }).map(([key,value]) => `<div class="metric"><span class="muted">${key}</span><strong>${value}</strong></div>`).join('')}</section>
  <section class="panel"><p class="eyebrow">COACHING STATUS</p>${model.eligibility.eligible ? '<h2>Experimental coaching eligible</h2><p>One substantive suggestion per day, up to three active experiments.</p>' : `<h2>Calibration in progress</h2><p class="muted">${esc(model.eligibility.reasons.join(' · ') || 'Continue collecting baseline evidence.')}</p>`}${recommendation ? `<div class="notice"><span class="badge">${esc(recommendation.class)}</span><h3>${esc(recommendation.title)}</h3><p>${esc(recommendation.observation)}</p><p><strong>Test:</strong> ${esc(recommendation.experiment)}</p><p class="muted">Confidence: ${esc(recommendation.confidence)} · Alternatives: ${esc(recommendation.alternatives.join(', '))}</p></div>` : ''}</section>`;
}

function onboarding() {
  return `<section class="panel hero"><p class="eyebrow">PHASE 1 PILOT</p><h1>Build your first living atlas.</h1><p>One month of local, participant-controlled evidence. No account. No automatic upload.</p><form id="onboard"><label class="field">Name shown on this device<input name="displayName" required></label><label class="field">Occupation or main role<input name="occupation" required></label><label class="field">What matters most this month?<textarea name="priority" required></textarea></label><label class="field"><input type="checkbox" name="consent" required> I understand this is a non-clinical functional pilot and my data stays on this device until I export it.</label><button class="primary">Begin pilot</button></form></section>`;
}

function log() {
  return `<section class="panel"><p class="eyebrow">CAPTURE</p><h1>Record evidence</h1><div class="button-row"><button class="primary" data-go="plan">Plan an action</button><button class="secondary" data-go="review">Review an action</button><button class="secondary" data-go="daily">Daily check</button><button class="secondary" data-go="context">Context event</button></div></section><section id="formZone"></section>`;
}

function atlas({ model }) {
  return `<section class="panel"><p class="eyebrow">INTEGRATED LIFEATLAS</p><h1>Living Atlas</h1><p class="muted">Modules are views over one event ledger—not separate trackers.</p></section><section class="atlas">${Object.entries(model.modules).map(([key,value]) => `<article class="node"><span class="badge">${Math.round(value)}</span><h3>${esc(key[0].toUpperCase()+key.slice(1))}</h3><div class="bar"><i style="width:${value}%"></i></div><p class="muted">Evidence strength grows through repeated, context-linked observations.</p></article>`).join('')}</section>`;
}

function history({ events }) {
  return `<section class="panel"><p class="eyebrow">IMMUTABLE LEDGER</p><h1>History</h1><p>${events.length} canonical events</p></section><section class="list">${[...events].sort((a,b) => String(b.occurredAt).localeCompare(String(a.occurredAt))).map(event => `<article class="item"><span class="badge">${esc(event.type)}</span><h3>${esc(event.payload?.title || event.payload?.context || event.type)}</h3><time>${new Date(event.occurredAt).toLocaleString()}</time><p class="muted">${esc(event.payload?.note || event.payload?.outcome || '')}</p></article>`).join('') || '<p class="muted">No events yet.</p>'}</section>`;
}

function settings({ events }) {
  return `<section class="panel"><p class="eyebrow">DATA CONTROL</p><h1>Participant data</h1><p>IndexedDB storage · encrypted export · deterministic replay</p><div class="grid"><div class="metric"><span class="muted">Replay</span><strong>${validateDeterminism(events) ? 'Pass' : 'Fail'}</strong></div><div class="metric"><span class="muted">Ontology</span><strong>${ontology.constructs.length}</strong></div></div><label class="field">Export passphrase<input id="exportPass" type="password" minlength="10" autocomplete="new-password" placeholder="At least 10 characters"></label><div class="button-row"><button id="export" class="primary">Encrypted export</button><label class="secondary">Restore<input id="restore" type="file" accept=".latlas" hidden></label><button id="wipe" class="danger">Erase this device</button></div><p class="muted">You must remember the passphrase. It is never uploaded or recoverable.</p></section><section class="panel"><h2>Data-source status</h2><div class="list"><div class="item">Manual data <span class="badge">Active</span></div><div class="item">Calendar <span class="badge">Manual/ICS bridge</span></div><div class="item">Reminders/tasks <span class="badge">Manual/bridge</span></div><div class="item">Location category <span class="badge">Manual in web pilot</span></div><div class="item">Screen-time summary <span class="badge">Manual fallback</span></div></div></section><a class="secondary" href="console/">Open Research Console</a>`;
}

function nav() {
  return `<nav class="nav">${[['today','Today'],['log','Capture'],['atlas','Atlas'],['history','History'],['settings','Data']].map(([key,label]) => `<button data-route="${key}" class="${route===key?'active':''}">${label}</button>`).join('')}</nav>`;
}

function dailyForm() {
  return `<section class="panel"><h2>Daily accessibility check</h2><form id="dailyForm">${measurements.daily.map(question => scale(question.id, question.label)).join('')}<label class="field">Dominant constraint<select name="constraint"><option>None clear</option><option>Time</option><option>Energy</option><option>Attention</option><option>Emotion</option><option>Dependencies</option><option>Social demands</option></select></label><label class="field">Exceptional context<input name="context" placeholder="Travel, illness, deadline, caregiving…"></label><button class="primary">Save check</button></form></section>`;
}
function planForm() {
  return `<section class="panel"><h2>Plan an action</h2><form id="planForm"><label class="field">Action type<select name="template">${templates.templates.map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('')}</select></label><label class="field">What will be done?<input name="title" required></label>${scale('importance','Importance')}${scale('endorsement','Personal endorsement')}${scale('control','Perceived control')}${scale('difficulty','Expected difficulty')}<label class="field">Next visible action<input name="nextStep" required></label><label class="field">Expected window<input name="window" placeholder="e.g. before lunch, 45 minutes"></label><button class="primary">Save plan</button></form></section>`;
}
function reviewForm() {
  return `<section class="panel"><h2>Review an action</h2><form id="reviewForm"><label class="field">Action title<input name="title" required></label>${scale('completion','Completion')}${scale('quality','Process quality')}${scale('effort','Mental effort')}${scale('recoveryCost','Recovery cost')}<label class="field">What happened?<textarea name="outcome"></textarea></label><button class="primary">Save review</button></form></section>`;
}
function contextForm() {
  return `<section class="panel"><h2>Context event</h2><form id="contextForm"><label class="field">Category<select name="context"><option>home</option><option>workplace</option><option>commuting</option><option>outdoors</option><option>social</option><option>travel</option><option>caregiving</option><option>deadline pressure</option><option>screen-time summary</option><option>other</option></select></label><label class="field">What changed?<textarea name="note" required></textarea></label><button class="primary">Save context</button></form></section>`;
}

function formValues(form) { return Object.fromEntries(new FormData(form).entries()); }
function numericValues(payload) {
  for (const key of Object.keys(payload)) {
    if (/^(restoration|physicalReadiness|cognitiveClarity|attention|emotionalLoad|recoveryReserve|importance|endorsement|control|difficulty|completion|quality|effort|recoveryCost)$/.test(key)) payload[key] = Number(payload[key]);
  }
  return payload;
}
function openCapture(kind) {
  const zone = document.querySelector('#formZone');
  if (!zone) return;
  zone.innerHTML = kind === 'daily' ? dailyForm() : kind === 'plan' ? planForm() : kind === 'review' ? reviewForm() : contextForm();
  zone.scrollIntoView({ behavior:'smooth', block:'start' });
  bindForms();
}
function validateDataset(data) {
  if (!data || data.manifest?.format !== 'LifeAtlasPhase1') throw new Error('This is not a supported LifeAtlas dataset.');
  if (!Array.isArray(data.events)) throw new Error('Dataset has no valid event ledger.');
  for (const event of data.events) {
    if (!event?.id || !event?.type || !event?.occurredAt || !event?.recordedAt || typeof event.payload !== 'object') throw new Error('Dataset contains a malformed event.');
    if (Number.isNaN(Date.parse(event.occurredAt)) || Number.isNaN(Date.parse(event.recordedAt))) throw new Error('Dataset contains an invalid event date.');
  }
}

function bind() {
  document.querySelectorAll('[data-route]').forEach(button => button.onclick = async () => { route = button.dataset.route; await render(); });
  document.querySelector('#onboard')?.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = formValues(event.target);
    await put('meta', { id:'profile', ...payload, consent:true, startedAt:new Date().toISOString(), studyVersion:APP_VERSION });
    await appendEvent('profile.created', { displayName:payload.displayName });
    await render();
  });
  document.querySelectorAll('[data-go]').forEach(button => button.onclick = async () => {
    const kind = button.dataset.go;
    if (!document.querySelector('#formZone')) {
      route = 'log';
      await render();
    }
    openCapture(kind);
  });
  bindForms();
  document.querySelector('#export')?.addEventListener('click', doExport);
  document.querySelector('#restore')?.addEventListener('change', doRestore);
  document.querySelector('#wipe')?.addEventListener('click', async () => {
    if (confirm('Permanently erase all local LifeAtlas data? This cannot be undone.')) { await clearAll(); route='today'; await render(); }
  });
}

function bindForms() {
  for (const [id,type] of [['dailyForm','state.daily'],['planForm','action.planned'],['reviewForm','action.reviewed'],['contextForm','context.recorded']]) {
    document.querySelector(`#${id}`)?.addEventListener('submit', async event => {
      event.preventDefault();
      const payload = numericValues(formValues(event.target));
      if (type.startsWith('action.')) {
        const template = templates.templates.find(item => item.id === payload.template);
        payload.modules = template?.modules || ['professional'];
      }
      await appendEvent(type, payload);
      route = 'today';
      await render();
    }, { once:true });
  }
}

async function doExport() {
  try {
    const passphrase = document.querySelector('#exportPass').value;
    const events = await all('events');
    const profile = await get('meta', 'profile');
    const exportedAt = new Date().toISOString();
    const model = replay(events, { generatedAt:exportedAt });
    const payload = {
      manifest: {
        format:'LifeAtlasPhase1', version:APP_VERSION, appVersion:APP_VERSION, exportedAt,
        participantId:await sha256((profile?.startedAt || '') + (profile?.displayName || '')),
        eventCount:events.length, ontologyVersion:ontology.version, modelVersion:model.version
      },
      profile, events, derived:model, ontology, templates, measurements
    };
    payload.manifest.contentHash = await sha256({ events, profile });
    const encrypted = await encryptJSON(payload, passphrase);
    const url = URL.createObjectURL(new Blob([encrypted], { type:'application/octet-stream' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `lifeatlas-${new Date().toISOString().slice(0,10)}.latlas`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) { alert(error.message); }
}

async function doRestore(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const passphrase = prompt('Enter the export passphrase');
  if (!passphrase) { event.target.value=''; return; }
  try {
    const data = await decryptJSON(await file.text(), passphrase);
    validateDataset(data);
    const expectedHash = await sha256({ events:data.events, profile:data.profile });
    if (expectedHash !== data.manifest.contentHash) throw new Error('Dataset integrity check failed.');
    if (!validateDeterminism(data.events)) throw new Error('Dataset replay is not deterministic.');
    if (!confirm(`Restore ${data.events.length} events? Existing local data will be erased.`)) return;
    await clearAll();
    if (data.profile) await put('meta', { ...data.profile, id:'profile' });
    for (const ledgerEvent of data.events) await put('events', ledgerEvent);
    route = 'today';
    await render();
    alert('Restore completed and verified.');
  } catch (error) {
    alert(`Restore failed: ${error.message}`);
  } finally {
    event.target.value='';
  }
}

load();
