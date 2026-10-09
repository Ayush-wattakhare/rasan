// Service Worker - Rasan App
// Minimal service worker to prevent 404 errors
// Can be extended with caching strategies in future

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests - no caching yet
  event.respondWith(fetch(event.request));
});
