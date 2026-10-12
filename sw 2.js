/* PNGEA temporary network-only service worker
   Purpose: eliminate stale shell/version conflicts while v0.51 stabilizes.
   Drafts remain persisted by IndexedDB in the app itself.
*/

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith('pngea-shell-'))
        .map(key => caches.delete(key))
    );

    await self.clients.claim();

    // PNGEA temporarily runs without a persistent service worker.
    // index.html may register this file again on a later load; it will
    // simply clear stale caches and unregister itself again.
    await self.registration.unregister();
  })());
});

// Intentionally NO fetch handler.
// Every page/script/media request goes directly to the network.
