/* PNGEA v0.50.0 — ALPHA CORE
   Real gallery media posting, resilient DMs, refresh resistance, client hardening.
   Requires existing PNGEA live API from index.html.
*/
(() => {
  'use strict';
  if (window.__PNGEA_V0500_ALPHA_CORE__) return;
  window.__PNGEA_V0500_ALPHA_CORE__ = true;

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const ui = window.PNGEA;
  const api = window.PNGEA_API;
  const liveAPI = () => window.PNGEA_LIVE;
  const root = document.documentElement;

  const meta = $('meta[name="pngea-build"]');
  if (meta) meta.setAttribute('content', '0.50.0-alpha-core');

  const style = document.createElement('style');
  style.id = 'pngeaV0500AlphaCoreStyle';
  style.textContent = `
/* Gallery-first post media */
#pngeaMediaPreviewGrid{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px
}
.pngeaMediaPreview{
  position:relative;min-height:120px;border-radius:15px;overflow:hidden;
  border:1px solid #292929;background:#111
}
.pngeaMediaPreview img,.pngeaMediaPreview video{
  width:100%;height:100%;max-height:220px;object-fit:cover;display:block;background:#090909
}
.pngeaMediaPreview button{
  position:absolute;right:7px;top:7px;width:28px;height:28px;border:0;border-radius:50%;
  background:rgba(0,0,0,.72);color:#fff;font-size:17px;display:grid;place-items:center
}
#pngeaUploadProgress{
  display:none;height:3px;background:#1b1b1b;overflow:hidden;margin:0 18px 8px;border-radius:999px
}
#pngeaUploadProgress.show{display:block}
#pngeaUploadProgress>i{display:block;width:0;height:100%;background:#e9e9e9;transition:width .12s linear}
.cap[data-attach^="gallery-"] span{color:#aaa}
.cap[data-attach^="gallery-"] b{font-size:22px}

/* DM media + delivery state */
#pngeaDmAttach{
  flex:none;width:36px;height:36px;border:0;background:transparent;color:#aaa;
  font-size:22px;display:grid;place-items:center
}
.dmCompose{gap:4px}
.pngeaDmMediaPreview{
  display:flex;gap:7px;overflow:auto;padding:6px 12px;background:#080808;border-top:1px solid #171717
}
.pngeaDmMediaPreview:empty{display:none}
.pngeaDmMediaPreview img,.pngeaDmMediaPreview video{
  width:68px;height:68px;object-fit:cover;border-radius:10px;border:1px solid #292929
}
.msgBubble.pngeaPending{opacity:.55}
.msgBubble.pngeaFailed{opacity:.78;border:1px solid #613434}
.msgBubble .pngeaDelivery{display:block;font-size:8px;color:#666;margin-top:3px;text-align:right}

/* Non-destructive recovery notice */
#pngeaRecoveryBar{
  display:none;position:absolute;left:10px;right:10px;top:calc(32px + env(safe-area-inset-top));
  z-index:2147482500;background:#171717;border:1px solid #333;border-radius:12px;
  padding:9px 11px;color:#d9d9d9;font-size:11px;box-shadow:0 12px 35px rgba(0,0,0,.4)
}
#pngeaRecoveryBar.show{display:flex;align-items:center;gap:8px}
#pngeaRecoveryBar span{flex:1}
#pngeaRecoveryBar button{border:0;background:#eee;color:#090909;border-radius:999px;padding:6px 9px;font-weight:800}
`;
  document.head.appendChild(style);

  // ---------- IndexedDB: drafts, media blobs, outbox ----------
  const DB_NAME = 'pngea-resilience-v1';
  const DB_VERSION = 1;
  const STORE = 'kv';

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbSet(key, value) {
    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {}
  }

  async function idbGet(key) {
    try {
      const db = await openDB();
      const value = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      db.close();
      return value;
    } catch { return undefined; }
  }

  async function idbDel(key) {
    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {}
  }

  // ---------- Recovery bar / error containment ----------
  const recovery = document.createElement('div');
  recovery.id = 'pngeaRecoveryBar';
  recovery.innerHTML = '<span>PNGEA recovered from a temporary error. Your draft was kept.</span><button>Dismiss</button>';
  $('.app')?.appendChild(recovery);
  recovery.querySelector('button')?.addEventListener('click', () => recovery.classList.remove('show'));

  let recoveryTimer = 0;
  function showRecovery(message) {
    const span = recovery.querySelector('span');
    if (span) span.textContent = message || 'PNGEA recovered without reloading.';
    recovery.classList.add('show');
    clearTimeout(recoveryTimer);
    recoveryTimer = setTimeout(() => recovery.classList.remove('show'), 5000);
  }

  window.addEventListener('error', e => {
    console.error('[PNGEA contained error]', e.error || e.message);
    showRecovery('A section hit an error, but PNGEA stayed open.');
  });
  window.addEventListener('unhandledrejection', e => {
    console.error('[PNGEA contained rejection]', e.reason);
    showRecovery('A network action failed safely. PNGEA stayed open.');
  });

  // ---------- API timeout / retry wrapper ----------
  const READ_METHODS = [
    'feed','conversations','messages','notifications','now','ticker','settings',
    'getUser','myPosts','userPosts','media','mediaAccess','search'
  ];
  function timeoutPromise(p, ms, label='Request') {
    return Promise.race([
      Promise.resolve(p),
      new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' timed out')), ms))
    ]);
  }
  function retryWrap(name, fn) {
    if (typeof fn !== 'function' || fn.__pngea500) return fn;
    const wrapped = async (...args) => {
      let last;
      for (let attempt=0; attempt<3; attempt++) {
        try { return await timeoutPromise(fn(...args), 18000, name); }
        catch (e) {
          last = e;
          if (!navigator.onLine || attempt === 2) break;
          await new Promise(r => setTimeout(r, 350 * (2 ** attempt) + Math.random()*180));
        }
      }
      throw last;
    };
    wrapped.__pngea500 = true;
    return wrapped;
  }
  if (api) {
    READ_METHODS.forEach(name => {
      if (typeof api[name] === 'function') api[name] = retryWrap(name, api[name].bind(api));
    });
  }

  // ---------- Shared media upload ----------
  const ALLOWED = /^(image|video)\//;
  const MAX_MEDIA = 10;
  const MAX_BYTES = 250 * 1024 * 1024;

  function validateFiles(files) {
    const accepted = [];
    for (const file of files) {
      if (!ALLOWED.test(file.type || '')) {
        ui?.toast?.('Only photos and videos are supported here');
        continue;
      }
      if (file.size > MAX_BYTES) {
        ui?.toast?.(`${file.name || 'Media'} is over 250 MB`);
        continue;
      }
      accepted.push(file);
      if (accepted.length >= MAX_MEDIA) break;
    }
    return accepted;
  }

  function xhrPut(url, headers, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      Object.entries(headers || {}).forEach(([k,v]) => xhr.setRequestHeader(k, v));
      xhr.timeout = 120000;
      xhr.upload.onprogress = ev => {
        if (ev.lengthComputable) onProgress?.(ev.loaded / ev.total);
      };
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
      xhr.onerror = () => reject(new Error('Upload connection failed'));
      xhr.ontimeout = () => reject(new Error('Upload timed out'));
      xhr.send(file);
    });
  }

  async function uploadMedia(file, onProgress) {
    if (!api?.createMediaUpload) throw new Error('Media service unavailable');
    const slot = await api.createMediaUpload({
      mimeType: file.type || 'application/octet-stream',
      byteSize: file.size,
      fileName: file.name
    });
    await xhrPut(slot.uploadUrl, slot.headers, file, onProgress);
    await api.completeMedia(slot.mediaId, {});
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      const media = await api.media(slot.mediaId);
      if (media.status === 'ready') return slot.mediaId;
      if (media.status === 'failed' || media.status === 'blocked') {
        throw new Error('Media processing failed');
      }
      await new Promise(r => setTimeout(r, 900));
    }
    throw new Error('Media processing is taking too long');
  }

  // ---------- POSTING: gallery-first ----------
  const galleryInput = document.createElement('input');
  galleryInput.type = 'file';
  galleryInput.multiple = true;
  galleryInput.accept = 'image/*,video/*';
  galleryInput.hidden = true;
  // Intentionally no capture attribute: mobile opens the user's gallery/media picker.
  document.body.appendChild(galleryInput);

  let postFiles = [];
  let objectURLs = [];

  const attachPreview = $('#attachPreview');
  const oldRemove = $('#removeAttach');
  const grid = document.createElement('div');
  grid.id = 'pngeaMediaPreviewGrid';
  attachPreview?.appendChild(grid);

  const progress = document.createElement('div');
  progress.id = 'pngeaUploadProgress';
  progress.innerHTML = '<i></i>';
  $('#composerLayer .canvas')?.prepend(progress);

  function revokePreviews() {
    objectURLs.forEach(u => URL.revokeObjectURL(u));
    objectURLs = [];
  }

  function syncPostFilesToLive() {
    const live = liveAPI()?.state;
    if (live) live.pendingFiles = [...postFiles];
  }

  async function persistPostDraft() {
    const text = $('#postText')?.value || '';
    const fileRecords = postFiles.map(f => ({
      name: f.name, type: f.type, lastModified: f.lastModified, blob: f
    }));
    await idbSet('postDraft', { text, files: fileRecords, savedAt: Date.now() });
  }

  function renderPostPreview() {
    revokePreviews();
    grid.innerHTML = '';
    if (!postFiles.length) {
      attachPreview?.classList.remove('show');
      syncPostFilesToLive();
      return;
    }
    attachPreview?.classList.add('show');
    $('#previewType') && ($('#previewType').textContent = 'MEDIA');
    $('#previewTitle') && ($('#previewTitle').textContent =
      postFiles.length === 1 ? postFiles[0].name : `${postFiles.length} items selected`);
    postFiles.forEach((file, index) => {
      const wrap = document.createElement('div');
      wrap.className = 'pngeaMediaPreview';
      const url = URL.createObjectURL(file);
      objectURLs.push(url);
      const media = document.createElement(file.type.startsWith('video/') ? 'video' : 'img');
      media.src = url;
      if (media.tagName === 'VIDEO') { media.muted = true; media.playsInline = true; }
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.onclick = async e => {
        e.preventDefault(); e.stopPropagation();
        postFiles.splice(index, 1);
        syncPostFilesToLive();
        renderPostPreview();
        await persistPostDraft();
      };
      wrap.append(media, remove);
      grid.appendChild(wrap);
    });
    syncPostFilesToLive();
    const send = $('#send');
    if (send) send.disabled = !($('#postText')?.value.trim()) && !postFiles.length;
  }

  // Convert the old Camera/Video buttons into actual gallery selectors.
  $$('.cap[data-attach="photo"],.cap[data-attach="video"]').forEach((cap, i) => {
    const original = cap.dataset.attach;
    cap.dataset.attach = original === 'photo' ? 'gallery-photo' : 'gallery-video';
    const span = cap.querySelector('span');
    if (span) span.textContent = original === 'photo' ? 'Photo' : 'Video';
    cap.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      galleryInput.accept = original === 'photo' ? 'image/*' : 'video/*';
      galleryInput.click();
    });
  });

  galleryInput.addEventListener('change', async () => {
    const files = validateFiles([...galleryInput.files]);
    if (!files.length) return;
    postFiles = validateFiles([...postFiles, ...files]).slice(0, MAX_MEDIA);
    galleryInput.value = '';
    renderPostPreview();
    await persistPostDraft();
  });

  oldRemove?.addEventListener('click', async e => {
    if (!postFiles.length) return;
    e.preventDefault(); e.stopImmediatePropagation();
    postFiles = [];
    renderPostPreview();
    await idbDel('postDraft');
  }, true);

  $('#postText')?.addEventListener('input', () => {
    clearTimeout(window.__pngeaPostDraftTimer);
    window.__pngeaPostDraftTimer = setTimeout(persistPostDraft, 250);
  });

  async function restorePostDraft() {
    const draft = await idbGet('postDraft');
    if (!draft) return;
    const text = $('#postText');
    if (text && !text.value && draft.text) text.value = draft.text;
    if (!postFiles.length && Array.isArray(draft.files)) {
      postFiles = draft.files.map(r =>
        new File([r.blob], r.name || 'media', {
          type: r.type || r.blob?.type || 'application/octet-stream',
          lastModified: r.lastModified || Date.now()
        })
      );
    }
    renderPostPreview();
  }

  // Own the live Send click so media upload behaves predictably and progress is visible.
  document.addEventListener('click', async e => {
    const send = e.target.closest?.('#send');
    if (!send || !liveAPI()?.state?.active) return;
    e.preventDefault(); e.stopImmediatePropagation();

    const text = $('#postText')?.value.trim() || '';
    if (!text && !postFiles.length) return;

    send.disabled = true;
    const label = $('#detected');
    const oldLabel = label?.textContent || 'ANYTHING';
    const bar = progress.querySelector('i');
    progress.classList.toggle('show', !!postFiles.length);

    try {
      const mediaIds = [];
      for (let i=0; i<postFiles.length; i++) {
        const file = postFiles[i];
        const id = await uploadMedia(file, frac => {
          const overall = ((i + frac) / Math.max(1, postFiles.length)) * 100;
          if (bar) bar.style.width = `${Math.max(2, overall)}%`;
          if (label) label.textContent = `UPLOADING ${Math.round(overall)}%`;
        });
        mediaIds.push(id);
      }

      if (label) label.textContent = 'POSTING…';
      const live = liveAPI().state;
      const created = await api.createPost({
        text,
        visibility: 'public',
        replyToId: live.replyToId || null,
        mediaIds
      });

      postFiles = [];
      revokePreviews();
      grid.innerHTML = '';
      attachPreview?.classList.remove('show');
      $('#postText') && ($('#postText').value = '');
      live.pendingFiles = [];
      live.replyToId = null;
      await idbDel('postDraft');

      $('#closeComposer')?.click();
      ui?.navigate?.('Home');
      await liveAPI()?.loadFeed?.();
      ui?.toast?.('Posted');
    } catch (err) {
      ui?.toast?.(err?.message || 'Could not post');
      showRecovery('Post failed safely. Your text and media draft were kept.');
      await persistPostDraft();
    } finally {
      if (bar) bar.style.width = '0';
      progress.classList.remove('show');
      if (label) label.textContent = oldLabel;
      send.disabled = false;
    }
  }, true);

  // ---------- MESSAGING: text + photo/video + outbox ----------
  const dmInput = $('#dmInput');
  const dmSend = $('#dmSend');
  const dmCompose = dmInput?.closest('.dmCompose');

  const dmAttach = document.createElement('button');
  dmAttach.id = 'pngeaDmAttach';
  dmAttach.type = 'button';
  dmAttach.setAttribute('aria-label','Attach photo or video');
  dmAttach.textContent = '＋';
  dmCompose?.insertBefore(dmAttach, dmInput || dmSend);

  const dmMediaPreview = document.createElement('div');
  dmMediaPreview.className = 'pngeaDmMediaPreview';
  $('#dmThread')?.insertBefore(dmMediaPreview, dmCompose || null);

  const dmGallery = document.createElement('input');
  dmGallery.type = 'file';
  dmGallery.multiple = true;
  dmGallery.accept = 'image/*,video/*';
  dmGallery.hidden = true;
  document.body.appendChild(dmGallery);

  let dmFiles = [];
  let dmURLs = [];

  function renderDmPreview() {
    dmURLs.forEach(URL.revokeObjectURL); dmURLs = [];
    dmMediaPreview.innerHTML = '';
    dmFiles.forEach(file => {
      const url = URL.createObjectURL(file); dmURLs.push(url);
      const el = document.createElement(file.type.startsWith('video/') ? 'video' : 'img');
      el.src = url;
      if (el.tagName === 'VIDEO') { el.muted = true; el.playsInline = true; }
      dmMediaPreview.appendChild(el);
    });
  }

  dmAttach.addEventListener('click', () => dmGallery.click());
  dmGallery.addEventListener('change', () => {
    dmFiles = validateFiles([...dmFiles, ...dmGallery.files]).slice(0,4);
    dmGallery.value = '';
    renderDmPreview();
  });

  function appendPendingMessage(text, status='Sending…') {
    const host = $('#dmMessages');
    if (!host) return null;
    host.querySelector('.uiState')?.remove();
    const b = document.createElement('div');
    b.className = 'msgBubble me pngeaPending';
    const safeText = document.createElement('span');
    safeText.textContent = text || (dmFiles.length ? 'Media' : '');
    const delivery = document.createElement('small');
    delivery.className = 'pngeaDelivery';
    delivery.textContent = status;
    b.append(safeText, delivery);
    host.appendChild(b);
    host.scrollTop = host.scrollHeight;
    return b;
  }

  async function sendDmLive(route, text) {
    const pending = appendPendingMessage(text);
    const filesSnapshot = [...dmFiles];
    dmFiles = [];
    renderDmPreview();
    dmInput.value = '';

    try {
      const mediaIds = [];
      for (const file of filesSnapshot) mediaIds.push(await uploadMedia(file));
      await api.sendMessage(route.detail, {text, mediaIds});
      pending?.remove();
      await refreshCurrentThread(true);
      await liveAPI()?.loadConversations?.();
      await idbDel('dmDraft:' + route.detail);
    } catch (err) {
      if (pending) {
        pending.classList.remove('pngeaPending');
        pending.classList.add('pngeaFailed');
        pending.querySelector('.pngeaDelivery').textContent = 'Not sent · tap Send to retry';
      }
      await idbSet('dmOutbox:' + route.detail, {
        text, files: filesSnapshot.map(f=>({name:f.name,type:f.type,lastModified:f.lastModified,blob:f})),
        savedAt:Date.now()
      });
      ui?.toast?.(err?.message || 'Message not sent');
    }
  }

  document.addEventListener('click', async e => {
    const btn = e.target.closest?.('#dmSend');
    if (!btn || !liveAPI()?.state?.active) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const route = ui?.parseRoute?.();
    const text = dmInput?.value.trim() || '';
    if (route?.screen !== 'Inbox' || !route.detail || (!text && !dmFiles.length)) return;
    btn.disabled = true;
    try { await sendDmLive(route, text); }
    finally { btn.disabled = false; }
  }, true);

  dmInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      dmSend?.click();
    }
  }, true);

  dmInput?.addEventListener('input', () => {
    const route = ui?.parseRoute?.();
    if (route?.screen === 'Inbox' && route.detail) {
      idbSet('dmDraft:' + route.detail, dmInput.value);
    }
  });

  async function renderMessageMedia(row, media=[]) {
    if (!media?.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'liveMessageMedia';
    row.insertAdjacentElement('afterend', wrap);
    for (const m of media) {
      try {
        const access = await api.mediaAccess(m.id);
        const mime = String(access.mimeType || m.mimeType || '');
        const el = document.createElement(mime.startsWith('video/') ? 'video' : 'img');
        el.src = access.url;
        if (el.tagName === 'VIDEO') { el.controls=true; el.playsInline=true; }
        else el.alt = 'Message media';
        wrap.appendChild(el);
      } catch {}
    }
  }

  let threadBusy = false;
  let lastThreadSig = '';

  async function refreshCurrentThread(silent=false) {
    const route = ui?.parseRoute?.();
    const live = liveAPI()?.state;
    if (!live?.active || route?.screen !== 'Inbox' || !route.detail || threadBusy) return;
    threadBusy = true;
    try {
      const d = await api.messages(route.detail);
      const items = d.items || [];
      const sig = items.map(m=>m.id || `${m.created_at}:${m.text}`).join('|');
      if (silent && sig === lastThreadSig) return;
      lastThreadSig = sig;

      const host = $('#dmMessages');
      if (!host) return;
      host.innerHTML = '<div class="msgDay">TODAY</div>';
      for (const m of items) {
        const b = document.createElement('div');
        b.className = 'msgBubble ' + (m.sender_id === live.me?.id ? 'me' : 'them');
        b.textContent = m.text || '';
        host.appendChild(b);
        await renderMessageMedia(b, m.media || []);
      }
      if (!items.length) host.insertAdjacentHTML('beforeend',
        '<div class="uiState"><div><b>No messages yet</b><small>Start the conversation.</small></div></div>');
      host.scrollTop = host.scrollHeight;
      api.markConversationRead?.(route.detail).catch(()=>{});

      const saved = await idbGet('dmDraft:' + route.detail);
      if (dmInput && !dmInput.value && typeof saved === 'string') dmInput.value = saved;

      const outbox = await idbGet('dmOutbox:' + route.detail);
      if (outbox && navigator.onLine) {
        dmFiles = (outbox.files || []).map(r => new File([r.blob],r.name,{type:r.type,lastModified:r.lastModified}));
        renderDmPreview();
        if (dmInput) dmInput.value = outbox.text || '';
        await idbDel('dmOutbox:' + route.detail);
      }
    } catch (e) {
      if (!silent) ui?.toast?.(e?.message || 'Could not load messages');
    } finally { threadBusy = false; }
  }

  // Realtime remains primary; polling is only a quiet fallback.
  setInterval(() => {
    if (document.visibilityState === 'visible' && navigator.onLine) refreshCurrentThread(true);
  }, 5000);

  window.addEventListener('hashchange', () => setTimeout(() => refreshCurrentThread(false), 120));
  window.addEventListener('online', () => {
    showRecovery('Back online. PNGEA is syncing.');
    refreshCurrentThread(true);
    liveAPI()?.loadFeed?.().catch?.(()=>{});
    liveAPI()?.loadConversations?.().catch?.(()=>{});
  });

  // ---------- Refresh resistance ----------
  // Keep drafts before browser/PWA termination without forcing any reload.
  window.addEventListener('pagehide', () => {
    persistPostDraft();
    const route = ui?.parseRoute?.();
    if (route?.screen === 'Inbox' && route.detail && dmInput) {
      idbSet('dmDraft:' + route.detail, dmInput.value);
    }
  });

  window.addEventListener('pageshow', e => {
    restorePostDraft();
    if (e.persisted) {
      // BFCache restore: sync current view rather than reloading the whole app.
      const route = ui?.parseRoute?.();
      if (route?.screen === 'Inbox' && route.detail) refreshCurrentThread(true);
      else liveAPI()?.loadFeed?.().catch?.(()=>{});
    }
  });

  // Service worker updates should never hard-refresh the user's active session.
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    sessionStorage.setItem('pngea:swUpdated', '1');
    showRecovery('PNGEA updated in the background. No reload needed.');
  });

  // Initial restores.
  setTimeout(restorePostDraft, 400);
  setTimeout(() => refreshCurrentThread(false), 900);
})();
