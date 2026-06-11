const CACHE = 'lgk-admin-v2';
const OFFLINE_URLS = ['/dashboard', '/orders', '/admin', '/admin/orders', '/login'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  if (request.mode === 'navigate' || url.hostname.includes('supabase.co')) {
    e.respondWith(
      fetch(request).catch(() => caches.match(request) || caches.match('/dashboard'))
    );
    return;
  }

  if (request.destination === 'image' || request.destination === 'font') {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  e.respondWith(fetch(request).catch(() => caches.match(request)));
});

// Push notification handler (Phase 2 — Web Push)
self.addEventListener('push', (e) => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || '💳 Payment sent', {
      body: data.body || 'A client has submitted payment',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'lgk-payment',
      requireInteraction: true,
      data: { url: data.url || '/admin/orders' },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/admin/orders';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(url));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
