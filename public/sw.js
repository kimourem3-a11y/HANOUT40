// Hanouti 40 — Production Service Worker
// Supports Background Sync, Periodic Sync, and Real Push/Local Notifications

const CACHE_NAME = 'hanouti40-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('SW cache.addAll non-critical failure', err);
      });
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Offline First for static, network fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Background Sync Event (WorkManager / Background Sync API)
self.addEventListener('sync', (event) => {
  if (event.tag === 'hanouti40-sync-queue') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'PROCESS_SYNC_QUEUE' });
        });
      })
    );
  }
});

// Periodic Background Sync Event
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'hanouti40-stock-check') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'CHECK_STOCK_AND_REMINDERS' });
        });
      })
    );
  }
});

// Notification Click Handler: VIEW_PRODUCT or CREATE_PURCHASE
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const data = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window or open a new one
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_ACTION_CLICKED',
            action: action || 'DEFAULT',
            data: data
          });
          return;
        }
      }
      if (self.clients.openWindow) {
        let targetUrl = '/';
        if (action === 'VIEW_PRODUCT' && data.productId) {
          targetUrl = `/?action=view_product&id=${data.productId}`;
        } else if (action === 'CREATE_PURCHASE') {
          targetUrl = `/?action=create_purchase&productId=${data.productId || ''}`;
        }
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
