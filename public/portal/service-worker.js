const CACHE_NAME = "cerebro-legislativo-cache-v5";
const STATIC_ASSETS = [
  "./index.html",
  "./styles.css",
  "./app.js",
  "./data.js",
  "./search.js",
  "./tracking.js",
  "./ui.js",
  "./pdf-viewer.js",
  "./utils.js",
  "./views/helpers.js",
  "./views/junta.js",
  "./views/laws.js",
  "./views/legislators.js",
  "./views/agenda.js",
  "./views/stats.js",
  "./logo.png",
  "./manifest.json"
];

// Install Event - Pre-cache shell assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Smart Caching Strategy
self.addEventListener("fetch", event => {
  const requestUrl = new URL(event.request.url);

  // Network-First for dynamic JSON data to ensure freshness, fall back to Cache if offline
  if (requestUrl.pathname.endsWith(".json")) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-First / Stale-While-Revalidate for static shell elements and assets
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // If found in cache, return it but update in background
      if (cachedResponse) {
        fetch(event.request).then(networkResponse => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Silent catch for background update failures */});
        
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request)
        .then(response => {
          // Only cache successful responses and ignore non-http(s) (like chrome-extension)
          if (response.status === 200 && event.request.url.startsWith('http')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(error => {
          // If fetch fails (e.g., blocked by adblocker), return a null response instead of letting the promise reject
          console.warn('Fetch failed for:', event.request.url, error);
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('', { status: 408, statusText: 'Network Error or Blocked' });
        });
    })
  );
});
