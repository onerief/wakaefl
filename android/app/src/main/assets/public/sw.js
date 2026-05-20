
const CACHE_NAME = 'wakaefl-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/vite.svg'
];

// Install SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate SW
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Strategy: Network First, falling back to cache
// This ensures users always see the latest tournament scores if online
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response to put into cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            // Only cache GET requests
            if (event.request.method === 'GET') {
                try {
                    cache.put(event.request, responseToCache);
                } catch (err) {
                    // Ignore errors for non-cacheable requests
                }
            }
          });

        return response;
      })
      .catch(() => {
        // If network fails, try to return from cache
        return caches.match(event.request);
      })
  );
});
