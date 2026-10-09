const CACHE = 'pngea-shell-v0403-bottom-nav-1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Never let an old cached app shell pin PNGEA to a broken build.
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request, { cache: 'no-store' });
        const cache = await caches.open(CACHE);
        cache.put(event.request, fresh.clone()).catch(() => {});
        return fresh;
      } catch (err) {
        return (await caches.match(event.request)) ||
          (await caches.match('./index.html')) ||
          new Response('PNGEA is temporarily offline.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
      }
    })());
    return;
  }

  // Static assets prefer the network, then fall back to cache when offline.
  event.respondWith((async () => {
    try {
      const fresh = await fetch(event.request);
      if (fresh && fresh.ok && fresh.type !== 'opaque') {
        const cache = await caches.open(CACHE);
        cache.put(event.request, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch (err) {
      return (await caches.match(event.request)) || Response.error();
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
