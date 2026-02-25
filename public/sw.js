// Service Worker for offline functionality
const CACHE_NAME = 'unityvault-v2';
const API_CACHE = 'unityvault-api-v2';
const API_CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
const API_CACHE_MAX_ENTRIES = 50;

// Cache static assets
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== API_CACHE)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    // Never cache auth, payment, or write-operation API calls
    if (request.method !== 'GET' || url.pathname.includes('/auth/') || url.pathname.includes('/payments/')) {
      event.respondWith(fetch(request));
      return;
    }

    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful GET requests with a timestamp header
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then(async cache => {
              // Add a timestamp to track TTL
              const headers = new Headers(responseClone.headers);
              headers.set('x-sw-cached-at', String(Date.now()));
              const timedResponse = new Response(await responseClone.blob(), { headers, status: responseClone.status });
              cache.put(request, timedResponse);
              // Evict oldest entries if over limit
              const keys = await cache.keys();
              if (keys.length > API_CACHE_MAX_ENTRIES) {
                await cache.delete(keys[0]);
              }
            });
          }
          return response;
        })
        .catch(async () => {
          // Return cached response for GET if available and not expired
          const cached = await caches.match(request);
          if (cached) {
            const cachedAt = Number(cached.headers.get('x-sw-cached-at') || 0);
            if (Date.now() - cachedAt < API_CACHE_MAX_AGE_MS) {
              return cached;
            }
            // Expired — delete stale cache
            const cache = await caches.open(API_CACHE);
            await cache.delete(request);
          }
          return new Response(
            JSON.stringify({ error: 'Network error. No cached data available.' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // Static assets - Cache first, network fallback
  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request))
      .catch(() => caches.match('/offline.html'))
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'unityvault-notification',
    requireInteraction: false,
    actions: data.actions || [],
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'UnityVault', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there's already a window open
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
