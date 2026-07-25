const CACHE = 'lifeatlas-p1-v0.1.1';
const ASSETS = [
  './', './index.html', './assets/styles.css', './assets/app.js', './assets/db.js',
  './assets/engine.js', './assets/crypto.js', './data/ontology.json',
  './data/action-templates.json', './data/measurements.json', './manifest.webmanifest',
  './assets/icon.svg', './assets/apple-touch-icon.png', './console/', './console/index.html', './assets/console.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestURL = new URL(event.request.url);
  if (requestURL.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') return caches.match('./index.html');
      throw error;
    }
  })());
});
