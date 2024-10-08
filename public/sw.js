const CACHE_NAME = 'coconut-cache';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        OFFLINE_URL,
        '/index.html',
        '/liked-songs.html',
        '/js/app.js',
        '/css/global.css',
        '/assets/default.png'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    clients.claim()
  );
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.open(CACHE_NAME).then(cache => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
  } else {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then(response => {
          return response || caches.match(OFFLINE_URL);
        });
      })
    );
  }
});
