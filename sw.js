const CACHE_NAME = 'm3u-editor-v2'; // bumped so the old cache is purged on activate
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first for navigation requests, cache-first for everything else.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // { cache: 'reload' } forces this fetch to bypass the browser's HTTP
      // cache and go to the network, so a stale (but still "fresh" per
      // Cache-Control headers) copy of index.html can't be served here.
      fetch(event.request, { cache: 'reload' })
        .then((response) => {
          // Keep the cache updated with whatever we just got from the network.
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
