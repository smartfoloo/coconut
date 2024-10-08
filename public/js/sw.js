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
      fetch(event.request).catch(function () {
        return caches.match(event.request).then(function (response) {
          if (response) {
            return response;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./offline.html');
          }
        });
      })
    );
  }
});
