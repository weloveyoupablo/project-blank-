const CACHE = 'pngea-shell-v0500-alpha-core-1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest 2',
  './pngea-v0.40.8-basic-ui-fix.js',
  './pngea-v0.40.9-profile-weixin.js',
  './pngea-v0.50.0-alpha-core.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(SHELL.map(url => cache.add(new Request(url,{cache:'reload'}))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('pngea-shell-') && k !== CACHE)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function timeoutFetch(request, ms=4500) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => setTimeout(() => reject(new Error('network timeout')), ms))
  ]);
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache or interfere with PNGEA API, websocket setup, signed media URLs,
  // analytics, or any other cross-origin request.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await timeoutFetch(new Request(request,{cache:'no-store'}), 4500);
        if (fresh?.ok) cache.put('./index.html', fresh.clone()).catch(()=>{});
        return fresh;
      } catch {
        return (await cache.match('./index.html')) ||
               (await cache.match('./')) ||
               new Response(
                 '<!doctype html><meta name="viewport" content="width=device-width"><body style="background:#050505;color:#eee;font-family:system-ui;padding:30px">PNGEA is offline. Your drafts are safe; reopen when your connection returns.</body>',
                 {status:503,headers:{'Content-Type':'text/html;charset=utf-8'}}
               );
      }
    })());
    return;
  }

  // Stale-while-revalidate for same-origin static files:
  // instant refreshes, but updates land in the cache without reloading the page.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    const update = fetch(request, {cache:'no-cache'}).then(fresh => {
      if (fresh?.ok) cache.put(request, fresh.clone()).catch(()=>{});
      return fresh;
    }).catch(()=>null);

    return cached || (await update) || Response.error();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'WARM_CACHE') {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE);
      await Promise.allSettled(SHELL.map(url => cache.add(new Request(url,{cache:'reload'}))));
    })());
  }
});
