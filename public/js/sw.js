const CACHE_NAME = 'coconut-cache';
const OFFLINE_URL = '/offline.html';

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/liked-songs.html',
  OFFLINE_URL,
  '/assets/default.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.url.endsWith('.mp3')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(response => {
          return response || fetch(request).then(response => {
            cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
  } else {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request);
      }).catch(() => {
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match(OFFLINE_URL);
        }
      })
    );
  }
});
