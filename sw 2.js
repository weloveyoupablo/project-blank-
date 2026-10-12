const CACHE = 'pngea-shell-v0510-social-core-1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest 2',
  './pngea-v0.40.8-basic-ui-fix.js',
  './pngea-v0.40.9-profile-weixin.js',
  './pngea-v0.51.0-social-core.js'
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
    await Promise.all(keys.filter(k => k.startsWith('pngea-shell-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function fetchWithTimeout(request, ms=5000){
  return Promise.race([
    fetch(request),
    new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),ms))
  ]);
}

self.addEventListener('fetch', event => {
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);

  // API, signed media, sockets and external news stay completely outside the shell cache.
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const fresh=await fetchWithTimeout(new Request(request,{cache:'no-store'}),5000);
        if(fresh?.ok)cache.put('./index.html',fresh.clone()).catch(()=>{});
        return fresh;
      }catch{
        return (await cache.match('./index.html')) || (await cache.match('./')) ||
          new Response('<!doctype html><meta name="viewport" content="width=device-width"><body style="background:#050505;color:#eee;font-family:system-ui;padding:28px">PNGEA is offline. Your drafts remain on this device.</body>',{status:503,headers:{'Content-Type':'text/html;charset=utf-8'}});
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(request);
    const network=fetch(request,{cache:'no-cache'}).then(r=>{
      if(r?.ok)cache.put(request,r.clone()).catch(()=>{});
      return r;
    }).catch(()=>null);
    return cached || (await network) || Response.error();
  })());
});

self.addEventListener('message', event => {
  if(event.data==='SKIP_WAITING')self.skipWaiting();
});
