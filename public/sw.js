const CACHE = 'lgk-v1';
const OFFLINE_URLS = ['/dashboard', '/orders', '/addresses', '/login'];

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

  // Network-first for navigation and API
  if (request.mode === 'navigate' || url.hostname.includes('supabase.co')) {
    e.respondWith(
      fetch(request).catch(() => caches.match(request) || caches.match('/dashboard'))
    );
    return;
  }

  // Cache-first for static assets
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
