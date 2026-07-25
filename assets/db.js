const DB = 'lifeatlas-phase1';
const VERSION = 2;
const STORES = ['events', 'meta', 'snapshots', 'recommendations'];

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, VERSION);
    request.onupgradeneeded = () => {
      for (const store of STORES) {
        if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('LifeAtlas storage upgrade is blocked. Close other LifeAtlas tabs and reopen the app.'));
  });
}

async function withStore(store, mode, operation) {
  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const result = operation(tx.objectStore(store));
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed.'));
      tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction was aborted.'));
    });
  } finally {
    db.close();
  }
}

export async function put(store, obj) {
  await withStore(store, 'readwrite', objectStore => objectStore.put(obj));
  return obj;
}

export async function all(store) {
  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(store, 'readonly').objectStore(store).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function get(store, id) {
  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(store, 'readonly').objectStore(store).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function clearAll() {
  const db = await openDB();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORES, 'readwrite');
      for (const store of STORES) tx.objectStore(store).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function appendEvent(type, payload = {}, source = 'manual', options = {}) {
  if (!type || typeof type !== 'string') throw new Error('Event type is required.');
  const now = new Date().toISOString();
  const occurredAt = payload.occurredAt || options.occurredAt || now;
  if (Number.isNaN(Date.parse(occurredAt))) throw new Error('Event date is invalid.');
  const event = {
    id: options.id || crypto.randomUUID(),
    type,
    occurredAt,
    recordedAt: now,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    payload: { ...payload },
    source,
    schemaVersion: '0.1.1',
    confidence: payload.confidence ?? 1,
    supersedes: options.supersedes || payload.supersedes || null
  };
  delete event.payload.occurredAt;
  await put('events', event);
  return event;
}
