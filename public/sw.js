// Service Worker for offline functionality
const CACHE_NAME = 'unityvault-v1';
const API_CACHE = 'unityvault-api-v1';

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
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful GET requests
          if (request.method === 'GET' && response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response for GET if available; always return a valid Response object
          if (request.method === 'GET') {
            return caches.match(request).then((cached) => {
              if (cached) return cached;
              return new Response(
                JSON.stringify({ error: 'Network error. No cached data available.' }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            });
          }

          return new Response(
            JSON.stringify({ error: 'Network error. Please check your connection and try again.' }),
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
