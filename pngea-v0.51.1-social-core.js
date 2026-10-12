/* PNGEA v0.51.1 — SOCIAL CORE
   Replaces pngea-v0.50.0-alpha-core.js.
   Requires index.html core + v0.40.8 + v0.40.9 first.
*/
(() => {
  'use strict';
  if (window.__PNGEA_V0511_SOCIAL_CORE__) return;
  window.__PNGEA_V0511_SOCIAL_CORE__ = true;

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const ROOT = document.documentElement;
  const APP = $('.app') || document.body;
  const ui = window.PNGEA;
  const api = window.PNGEA_API;
  const liveAPI = () => window.PNGEA_LIVE;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const norm = v => String(v || '').trim().replace(/^@/, '').toLowerCase();
  const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const build = $('meta[name="pngea-build"]');
  if (build) build.setAttribute('content','0.51.1-social-core');

  /* ---------- CSS ---------- */
  const style = document.createElement('style');
  style.id = 'pngeaV0510Style';
  style.textContent = `
/* Remove the Home NOW rollout only. The NOW page itself can continue to exist. */
#pnNowDock{display:none!important;visibility:hidden!important;pointer-events:none!important}
#youButton.hasNowAlert::after{display:none!important}

/* v0.50's over-eager recovery banner must never surface again if the old script is cached. */
#pngeaRecoveryBar{display:none!important;visibility:hidden!important;pointer-events:none!important}

/* Always reserve ticker space in live mode. */
.app[data-content-mode="live"] .ticker{display:flex!important}
.ticker{min-height:38px}

/* Actual bottom ActionSheet geometry based on WeUI: mask + compact bottom menu + distinct cancel. */
#pnSheetShade{
  position:fixed!important;inset:0!important;z-index:2147482100!important;
  background:rgba(0,0,0,.52)!important;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)
}
#pnActionSheet{
  position:fixed!important;inset:auto 8px calc(8px + env(safe-area-inset-bottom)) 8px!important;
  z-index:2147482101!important;height:auto!important;min-height:0!important;max-height:min(70dvh,520px)!important;
  display:block!important;background:#171717!important;border:1px solid #2a2a2a!important;
  border-radius:18px!important;overflow:auto!important;
  transform:translateY(calc(100% + 28px))!important;
  visibility:hidden!important;pointer-events:none!important;
  box-shadow:0 24px 70px rgba(0,0,0,.6)!important;
  transition:transform .22s cubic-bezier(.2,.78,.2,1),visibility 0s linear .22s!important
}
#pnActionSheet.show{
  transform:translateY(0)!important;visibility:visible!important;pointer-events:auto!important;
  transition:transform .22s cubic-bezier(.2,.78,.2,1),visibility 0s!important
}
#pnActionSheet .pnSheetHead{padding:12px 16px 10px!important;margin:0!important;border-bottom:1px solid #2a2a2a!important}
#pnActionSheet .pnSheetHead b{font-size:13px!important}
#pnActionSheet .pnSheetHead small{font-size:9px!important;margin-top:3px!important}
#pnActionSheet .pnSheetActions{padding:0!important}
#pnActionSheet .pnActionRow{
  min-height:51px!important;border-radius:0!important;padding:0 15px!important;
  border-bottom:1px solid #292929!important;background:#171717!important
}
#pnActionSheet .pnActionRow:active{background:#202020!important}
#pnActionSheet .pnActionClose{
  height:51px!important;margin-top:7px!important;border-top:1px solid #292929!important;
  background:#171717!important;color:#aaa!important;font-size:13px!important
}

/* Profile posts: real media + tappable social actions. */
#Profile .xPost{align-items:flex-start}
#Profile .pngeaProfileMediaRail{
  display:grid;gap:3px;margin-top:9px;border-radius:14px;overflow:hidden;background:#0b0b0b
}
#Profile .pngeaProfileMediaRail img,
#Profile .pngeaProfileMediaRail video{
  width:100%;max-height:430px;object-fit:cover;display:block;background:#111
}
#Profile .xPostActions [data-live-action]{cursor:pointer;padding:7px 5px;margin:-7px -5px}
#Profile .xPostActions .activeAction{color:#ededed}
#p-media .pngeaMediaGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
#p-media .pngeaMediaTile{aspect-ratio:1/1;background:#111;overflow:hidden;position:relative}
#p-media .pngeaMediaTile img,#p-media .pngeaMediaTile video{width:100%;height:100%;object-fit:cover}
#p-media .pngeaMediaTile .duration{
  position:absolute;right:5px;bottom:5px;background:rgba(0,0,0,.74);font-size:9px;padding:3px 5px;border-radius:5px
}

/* Gallery-first composer. */
#attachPreview{
  min-height:0!important;border:0!important;background:transparent!important;
  padding:0!important;border-radius:0!important;margin-top:13px!important
}
#attachPreview>#previewType,#attachPreview>#previewTitle,#attachPreview>#removeAttach{display:none!important}
#pngeaComposerMediaGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
.pngeaComposerMedia{
  min-height:150px;max-height:310px;position:relative;overflow:hidden;border-radius:14px;
  border:1px solid #292929;background:#0b0b0b
}
.pngeaComposerMedia img,.pngeaComposerMedia video{
  width:100%;height:100%;min-height:150px;max-height:310px;object-fit:cover;display:block;background:#090909
}
.pngeaComposerMedia video{object-fit:contain}
.pngeaMediaBadge{
  position:absolute;right:7px;bottom:7px;background:rgba(0,0,0,.78);color:#eee;
  border-radius:6px;padding:4px 6px;font-size:9px;font-weight:800
}
.pngeaMediaEdit,.pngeaMediaRemove{
  position:absolute;top:7px;height:30px;border:0;border-radius:999px;background:rgba(0,0,0,.76);
  color:#fff;padding:0 9px;font-size:10px;font-weight:800
}
.pngeaMediaEdit{left:7px}.pngeaMediaRemove{right:7px;width:30px;padding:0;font-size:17px}
#pngeaUploadProgress{height:3px;background:#171717;border-radius:999px;overflow:hidden;margin:0 0 12px;display:none}
#pngeaUploadProgress.show{display:block}
#pngeaUploadProgress i{display:block;width:0;height:100%;background:#ececec;transition:width .12s linear}
#pngeaDraftsBtn{
  position:absolute;left:76px;top:8px;height:44px;border:0;background:transparent;color:#8a8a8a;
  font-size:12px;font-weight:750;padding:0 6px
}

/* Full-screen media preview/editor. */
#pngeaMediaEditor,#pngeaDraftsPage,#newDmSheet.pngeaNewDmPage{
  position:fixed!important;inset:0!important;z-index:2147483005!important;background:#050505!important;
  width:100vw!important;height:100dvh!important;max-height:none!important;border:0!important;border-radius:0!important;
  transform:none!important;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)!important;
}
#pngeaMediaEditor,#pngeaDraftsPage{display:none}
#pngeaMediaEditor.show,#pngeaDraftsPage.show{display:flex;flex-direction:column}
.pngeaPageTop{
  height:58px;min-height:58px;display:grid;grid-template-columns:72px 1fr 72px;align-items:center;
  padding:0 13px;border-bottom:1px solid #1c1c1c
}
.pngeaPageTop button{border:0;background:transparent;color:#ddd;font-weight:800;font-size:13px}
.pngeaPageTop button:first-child{justify-self:start}.pngeaPageTop button:last-child{justify-self:end}
.pngeaPageTop b{text-align:center;font-size:15px}
#pngeaMediaEditorBody{flex:1;min-height:0;display:grid;place-items:center;padding:12px;overflow:auto}
#pngeaMediaEditorBody img,#pngeaMediaEditorBody video{max-width:100%;max-height:72dvh;object-fit:contain}
#pngeaMediaEditorTools{min-height:58px;display:flex;align-items:center;justify-content:center;gap:10px;border-top:1px solid #1b1b1b}
#pngeaMediaEditorTools button{border:1px solid #303030;background:#111;color:#ddd;border-radius:999px;padding:9px 13px;font-weight:800}
#pngeaMediaEditorTools button.danger{color:#ff676d}

/* Draft manager. */
#pngeaDraftList{flex:1;overflow:auto}
.pngeaDraftRow{padding:14px 16px;border-bottom:1px solid #1b1b1b;display:flex;gap:11px;align-items:center}
.pngeaDraftCopy{min-width:0;flex:1}.pngeaDraftCopy b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pngeaDraftCopy small{display:block;color:#666;font-size:10px;margin-top:4px}
.pngeaDraftDelete{border:0;background:transparent;color:#ff6068;font-size:12px}

/* Full-page new DM. WeUI half-screen motion language, but page takeover like X. */
#newDmSheet.pngeaNewDmPage{display:none!important;overflow:hidden!important}
#newDmSheet.pngeaNewDmPage.show{display:flex!important;flex-direction:column!important}
#newDmSheet.pngeaNewDmPage .pnSheetScrim,#newDmSheet.pngeaNewDmPage .pnSheetCard{display:none!important}
#pngeaNewDmGrip{width:36px;height:4px;border-radius:999px;background:#333;margin:5px auto 1px;flex:none}
#pngeaNewDmTop{
  height:56px;display:grid;grid-template-columns:70px 1fr 70px;align-items:center;padding:0 12px;border-bottom:1px solid #1b1b1b;flex:none
}
#pngeaNewDmTop button{border:0;background:transparent;color:#ddd;font-weight:800;font-size:13px;justify-self:start}
#pngeaNewDmTop b{text-align:center;font-size:15px}
#pngeaNewDmSearch{margin:12px 14px 8px;border:1px solid #282828;border-radius:14px;background:#101010;padding:0 12px;height:48px;display:flex;align-items:center}
#pngeaNewDmSearch input{width:100%;border:0;outline:0;background:transparent;color:#eee;font-size:15px}
#pngeaNewDmResults{flex:1;overflow:auto}
.pngeaNewDmPerson{display:flex;align-items:center;gap:10px;padding:11px 15px;border-bottom:1px solid #171717}
.pngeaNewDmPerson .xAvatar{flex:none}.pngeaNewDmPerson div:nth-child(2){min-width:0;flex:1}
.pngeaNewDmPerson b{display:block;font-size:13px}.pngeaNewDmPerson small{display:block;color:#666;font-size:10px;margin-top:2px}
.pngeaNewDmPerson button{border:0;background:#eee;color:#080808;border-radius:999px;padding:8px 12px;font-weight:850}
html.pngeaNewDmOpen .bottom,html.pngeaNewDmOpen .compose{visibility:hidden!important;pointer-events:none!important}

/* Account chooser must beat sidebar's 50k z-index. */
.accountShade{z-index:2147482600!important}
.accountSheet{z-index:2147482601!important}

/* Profile art controls. */
.pngeaProfileArtEditor{padding:4px 0 10px}
.pngeaArtRow{display:grid;grid-template-columns:78px 1fr;gap:12px;align-items:center;margin:12px 0}
.pngeaArtPreview{width:78px;height:78px;border-radius:50%;border:1px solid #2b2b2b;background:#141414 center/cover no-repeat}
.pngeaArtPreview.banner{border-radius:12px;height:55px}
.pngeaArtButtons{display:flex;gap:7px;flex-wrap:wrap}
.pngeaArtButtons button{border:1px solid #303030;background:#111;color:#ddd;border-radius:999px;padding:7px 10px;font-weight:800;font-size:10px}
.pngeaArtButtons button.remove{color:#ff6268}
.selfAvatarFallback.hasProfileImage::before{display:none!important}
.selfAvatarFallback.hasProfileImage{background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}

/* Hide raw background failures/toasts from old client layers. */
.uiToast.pngeaSuppressed{display:none!important}
`;
  document.head.appendChild(style);

  /* ---------- IndexedDB ---------- */
  const DB_NAME='pngea-resilience-v1', STORE='kv';
  function openDB(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  async function idbGet(key){
    try{const db=await openDB();const val=await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly');const q=tx.objectStore(STORE).get(key);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});db.close();return val}catch{return undefined}
  }
  async function idbSet(key,val){
    try{const db=await openDB();await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(val,key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});db.close()}catch{}
  }
  async function idbDel(key){
    try{const db=await openDB();await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});db.close()}catch{}
  }

  /* ---------- Session stability ---------- */
  function tokenExpiring(){
    try{
      const t=api?.getAccessToken?.();if(!t)return true;
      const part=t.split('.')[1];if(!part)return false;
      const p=JSON.parse(atob(part.replace(/-/g,'+').replace(/_/g,'/')));
      return p.exp && (p.exp*1000-Date.now()<45000);
    }catch{return false}
  }
  let sessionPromise=null;
  async function ensureSession(force=false){
    if(!liveAPI()?.state?.active)return;
    if(!force && !tokenExpiring())return;
    if(sessionPromise)return sessionPromise;
    sessionPromise=Promise.resolve(api.refresh()).finally(()=>sessionPromise=null);
    return sessionPromise;
  }
  const WRITE_METHODS=['createPost','deletePost','likePost','unlikePost','repost','unrepost','updateProfile','createConversation','sendMessage','markConversationRead','markNotificationsRead','markNotificationRead','follow','unfollow','completeMedia','createMediaUpload'];
  WRITE_METHODS.forEach(name=>{
    const fn=api?.[name];if(typeof fn!=='function'||fn.__pngea510)return;
    const original=fn.bind(api);
    const wrapped=async(...args)=>{
      try{await ensureSession(false)}catch{}
      try{return await original(...args)}
      catch(err){
        if(Number(err?.status)===401){
          try{await ensureSession(true);return await original(...args)}catch{}
        }
        throw err;
      }
    };
    wrapped.__pngea510=true;api[name]=wrapped;
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')ensureSession(false).catch(()=>{})});
  window.addEventListener('online',()=>ensureSession(false).catch(()=>{}));

  // Suppress raw auth/background-noise toasts; actions below provide specific errors.
  if(ui?.toast && !ui.toast.__pngea510){
    const oldToast=ui.toast.bind(ui);
    const wrapped=(message,...rest)=>{
      const m=String(message||'');
      if(/authentication required|session needs sign-in|pngea api 401|network action failed safely/i.test(m)){
        ensureSession(true).catch(()=>{});
        return;
      }
      return oldToast(message,...rest);
    };
    wrapped.__pngea510=true;ui.toast=wrapped;
  }
  $('#pngeaRecoveryBar')?.remove();

  /* ---------- Remove NOW Home rollout permanently ---------- */
  const nowDock=$('#pnNowDock');
  // CSS already suppresses the Home NOW rollout. Do not observe its class:
  // mutating an observed class from inside the observer can create an infinite
  // MutationObserver microtask loop and prevent DOMContentLoaded on Safari.
  nowDock?.classList.remove('show','rollout','retracted');
  const youButton=$('#youButton');
  youButton?.classList.remove('hasNowAlert','nowDispensing');

  /* ---------- Media upload ---------- */
  const MAX_MEDIA=10, MAX_BYTES=500*1024*1024;
  function validateFiles(files){
    const out=[];
    for(const f of files){
      if(!/^(image|video)\//.test(f.type||'')){ui?.toast?.('Choose a photo or video');continue}
      if(f.size>MAX_BYTES){ui?.toast?.('That media is too large');continue}
      out.push(f);if(out.length>=MAX_MEDIA)break;
    }
    return out;
  }
  function xhrPut(url,headers,file,onProgress){
    return new Promise((resolve,reject)=>{
      const x=new XMLHttpRequest();x.open('PUT',url,true);x.timeout=180000;
      Object.entries(headers||{}).forEach(([k,v])=>x.setRequestHeader(k,v));
      x.upload.onprogress=e=>{if(e.lengthComputable)onProgress?.(e.loaded/e.total)};
      x.onload=()=>x.status>=200&&x.status<300?resolve():reject(new Error(`Upload failed (${x.status})`));
      x.onerror=()=>reject(new Error('Upload connection failed'));x.ontimeout=()=>reject(new Error('Upload timed out'));x.send(file);
    });
  }
  async function uploadMedia(file,onProgress){
    await ensureSession(false).catch(()=>{});
    const slot=await api.createMediaUpload({mimeType:file.type||'application/octet-stream',byteSize:file.size,fileName:file.name||'media'});
    await xhrPut(slot.uploadUrl,slot.headers,file,onProgress);
    await api.completeMedia(slot.mediaId,{});
    // Don't block a video post forever while the media worker transcodes it.
    const until=Date.now()+7000;
    while(Date.now()<until){
      try{
        const m=await api.media(slot.mediaId);
        if(m.status==='ready')return slot.mediaId;
        if(m.status==='failed'||m.status==='blocked')throw new Error('Media processing failed');
      }catch(err){if(/failed|blocked/i.test(String(err?.message)))throw err}
      await sleep(700);
    }
    return slot.mediaId;
  }
  async function waitMedia(ids,timeout=120000){
    const end=Date.now()+timeout;
    while(Date.now()<end){
      let all=true;
      for(const id of ids){
        const m=await api.media(id);
        if(m.status==='failed'||m.status==='blocked')throw new Error('Video processing failed');
        if(m.status!=='ready')all=false;
      }
      if(all)return;
      await sleep(1000);
    }
    throw new Error('Video is still processing');
  }
  function mediaNotReadyError(err){
    return /media|processing|ready|pending|transcod/i.test(String(err?.message||'')) && [400,409,422].includes(Number(err?.status||0));
  }

  /* ---------- Composer + drafts ---------- */
  const composer=$('#composerLayer'), postText=$('#postText'), send=$('#send'), attachPreview=$('#attachPreview');
  let postFiles=[], previewURLs=[], currentDraftId=null, posting=false;

  const uploadProgress=document.createElement('div');
  uploadProgress.id='pngeaUploadProgress';uploadProgress.innerHTML='<i></i>';
  composer?.querySelector('.canvas')?.prepend(uploadProgress);

  const mediaGrid=document.createElement('div');mediaGrid.id='pngeaComposerMediaGrid';
  attachPreview?.appendChild(mediaGrid);

  const galleryInput=document.createElement('input');
  galleryInput.type='file';galleryInput.multiple=true;galleryInput.hidden=true;galleryInput.accept='image/*,video/*';
  document.body.appendChild(galleryInput);

  const draftsBtn=document.createElement('button');draftsBtn.id='pngeaDraftsBtn';draftsBtn.type='button';draftsBtn.textContent='Drafts';
  composer?.querySelector('.composerTop')?.appendChild(draftsBtn);

  function clearPreviewURLs(){previewURLs.forEach(u=>URL.revokeObjectURL(u));previewURLs=[]}
  function fmtDuration(sec){
    if(!Number.isFinite(sec))return '';
    const m=Math.floor(sec/60),s=Math.floor(sec%60);return `${m}:${String(s).padStart(2,'0')}`;
  }
  function renderComposerMedia(){
    clearPreviewURLs();mediaGrid.innerHTML='';
    attachPreview?.classList.toggle('show',postFiles.length>0);
    postFiles.forEach((file,index)=>{
      const card=document.createElement('div');card.className='pngeaComposerMedia';
      const url=URL.createObjectURL(file);previewURLs.push(url);
      const isVideo=(file.type||'').startsWith('video/');
      const media=document.createElement(isVideo?'video':'img');media.src=url;
      if(isVideo){media.controls=true;media.playsInline=true;media.preload='metadata'}
      else media.alt='Selected photo';
      const edit=document.createElement('button');edit.className='pngeaMediaEdit';edit.type='button';edit.textContent='Edit';
      edit.onclick=e=>{e.preventDefault();e.stopPropagation();openMediaEditor(index)};
      const remove=document.createElement('button');remove.className='pngeaMediaRemove';remove.type='button';remove.textContent='×';
      remove.onclick=e=>{e.preventDefault();e.stopPropagation();postFiles.splice(index,1);renderComposerMedia();syncSend()};
      card.append(media,edit,remove);
      if(isVideo){
        const badge=document.createElement('span');badge.className='pngeaMediaBadge';badge.textContent='VIDEO';
        media.addEventListener('loadedmetadata',()=>badge.textContent=fmtDuration(media.duration)||'VIDEO',{once:true});
        card.appendChild(badge);
      }
      mediaGrid.appendChild(card);
    });
    syncSend();
  }
  function syncSend(){if(send)send.disabled=!String(postText?.value||'').trim()&&!postFiles.length}
  postText?.addEventListener('input',syncSend);
  galleryInput.onchange=()=>{postFiles=validateFiles([...postFiles,...galleryInput.files]);galleryInput.value='';renderComposerMedia()};

  // Replace old camera/video placeholder clicks with the native gallery picker.
  window.addEventListener('click',e=>{
    const cap=e.target.closest?.('.cap[data-attach="photo"],.cap[data-attach="video"],.cap[data-attach="gallery-photo"],.cap[data-attach="gallery-video"]');
    if(!cap)return;
    e.preventDefault();e.stopImmediatePropagation();
    const kind=cap.dataset.attach||'photo';
    galleryInput.accept=kind.includes('video')?'video/*':'image/*';
    galleryInput.click();
  },true);

  /* media editor */
  const editor=document.createElement('section');editor.id='pngeaMediaEditor';
  editor.innerHTML=`<div class="pngeaPageTop"><button id="pngeaMediaEditorCancel">Cancel</button><b>Preview</b><button id="pngeaMediaEditorDone">Done</button></div><div id="pngeaMediaEditorBody"></div><div id="pngeaMediaEditorTools"></div>`;
  APP.appendChild(editor);
  let editingIndex=-1, pendingEditedFile=null;
  function openMediaEditor(index){
    const file=postFiles[index];if(!file)return;
    editingIndex=index;pendingEditedFile=null;
    const body=$('#pngeaMediaEditorBody'),tools=$('#pngeaMediaEditorTools');body.innerHTML='';tools.innerHTML='';
    const url=URL.createObjectURL(file);previewURLs.push(url);
    if((file.type||'').startsWith('image/')){
      const img=document.createElement('img');img.src=url;img.id='pngeaEditImage';body.appendChild(img);
      const rotate=document.createElement('button');rotate.textContent='Rotate 90°';
      rotate.onclick=async()=>{
        const bmp=await createImageBitmap(pendingEditedFile||file);
        const canvas=document.createElement('canvas');canvas.width=bmp.height;canvas.height=bmp.width;
        const ctx=canvas.getContext('2d');ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(Math.PI/2);ctx.drawImage(bmp,-bmp.width/2,-bmp.height/2);
        const blob=await new Promise(r=>canvas.toBlob(r,file.type||'image/jpeg',.92));
        pendingEditedFile=new File([blob],file.name||'photo.jpg',{type:blob.type,lastModified:Date.now()});
        const next=URL.createObjectURL(pendingEditedFile);previewURLs.push(next);img.src=next;
      };
      tools.appendChild(rotate);
    }else{
      const v=document.createElement('video');v.src=url;v.controls=true;v.playsInline=true;v.autoplay=false;body.appendChild(v);
      const note=document.createElement('span');note.style.cssText='color:#777;font-size:11px';note.textContent='Preview the full video before posting.';tools.appendChild(note);
    }
    const remove=document.createElement('button');remove.className='danger';remove.textContent='Remove';
    remove.onclick=()=>{postFiles.splice(index,1);closeMediaEditor();renderComposerMedia()};tools.appendChild(remove);
    editor.classList.add('show');
  }
  function closeMediaEditor(){editor.classList.remove('show');editingIndex=-1;pendingEditedFile=null}
  $('#pngeaMediaEditorCancel').onclick=closeMediaEditor;
  $('#pngeaMediaEditorDone').onclick=()=>{if(editingIndex>=0&&pendingEditedFile)postFiles[editingIndex]=pendingEditedFile;closeMediaEditor();renderComposerMedia()};

  /* drafts */
  const draftsPage=document.createElement('section');draftsPage.id='pngeaDraftsPage';
  draftsPage.innerHTML=`<div class="pngeaPageTop"><button id="pngeaDraftsClose">Close</button><b>Drafts</b><span></span></div><div id="pngeaDraftList"></div>`;
  APP.appendChild(draftsPage);
  async function getDrafts(){return (await idbGet('drafts.v2'))||[]}
  async function putDrafts(d){await idbSet('drafts.v2',d.slice(0,25))}
  async function saveDraft({forceNew=false}={}){
    const text=String(postText?.value||'');if(!text.trim()&&!postFiles.length)return;
    const drafts=await getDrafts();
    const id=forceNew||!currentDraftId?`d_${Date.now()}_${Math.random().toString(36).slice(2,7)}`:currentDraftId;
    currentDraftId=id;
    const record={id,text,savedAt:Date.now(),files:postFiles.map(f=>({name:f.name,type:f.type,lastModified:f.lastModified,blob:f}))};
    await putDrafts([record,...drafts.filter(x=>x.id!==id)]);
  }
  async function deleteDraft(id){await putDrafts((await getDrafts()).filter(x=>x.id!==id));if(currentDraftId===id)currentDraftId=null}
  async function renderDrafts(){
    const host=$('#pngeaDraftList'),drafts=await getDrafts();
    host.innerHTML=drafts.length?'':'<div class="profileEmpty"><b>No drafts</b>Posts you save will appear here.</div>';
    drafts.forEach(d=>{
      const row=document.createElement('div');row.className='pngeaDraftRow';
      row.innerHTML=`<div class="pngeaDraftCopy"><b>${escapeHTML((d.text||'Media draft').trim().slice(0,90)||'Media draft')}</b><small>${(d.files||[]).length} media · ${new Date(d.savedAt).toLocaleString()}</small></div><button class="pngeaDraftDelete">Delete</button>`;
      row.querySelector('.pngeaDraftCopy').onclick=()=>loadDraft(d);
      row.querySelector('.pngeaDraftDelete').onclick=async e=>{e.stopPropagation();await deleteDraft(d.id);renderDrafts()};
      host.appendChild(row);
    });
  }
  function loadDraft(d){
    currentDraftId=d.id;if(postText)postText.value=d.text||'';
    postFiles=(d.files||[]).map(f=>new File([f.blob],f.name||'media',{type:f.type||f.blob?.type||'',lastModified:f.lastModified||Date.now()}));
    renderComposerMedia();draftsPage.classList.remove('show');composer?.classList.add('show');ROOT.classList.add('pngeaComposerOpen');postText?.focus();
  }
  draftsBtn.onclick=async()=>{await saveDraft();await renderDrafts();draftsPage.classList.add('show')};
  $('#pngeaDraftsClose').onclick=()=>draftsPage.classList.remove('show');

  // Save on Cancel before older handlers clear the textarea.
  window.addEventListener('click',e=>{
    if(e.target.closest?.('#closeComposer')&&!posting)saveDraft().catch(()=>{});
  },true);

  async function createPostWithMedia(){
    const text=String(postText?.value||'').trim(),live=liveAPI()?.state;
    if(!text&&!postFiles.length)return;
    posting=true;if(send)send.disabled=true;
    const bar=uploadProgress.querySelector('i');uploadProgress.classList.toggle('show',!!postFiles.length);
    const label=$('#detected'),oldLabel=label?.textContent||'New post';
    try{
      await ensureSession(false);
      const mediaIds=[];
      for(let i=0;i<postFiles.length;i++){
        const id=await uploadMedia(postFiles[i],fraction=>{
          const pct=((i+fraction)/Math.max(postFiles.length,1))*100;if(bar)bar.style.width=`${pct}%`;if(label)label.textContent=`Uploading ${Math.round(pct)}%`;
        });
        mediaIds.push(id);
      }
      if(label)label.textContent='Posting…';
      let created;
      try{created=await api.createPost({text,visibility:'public',replyToId:live?.replyToId||null,mediaIds})}
      catch(err){
        if(mediaIds.length&&mediaNotReadyError(err)){if(label)label.textContent='Processing video…';await waitMedia(mediaIds);created=await api.createPost({text,visibility:'public',replyToId:live?.replyToId||null,mediaIds})}
        else throw err;
      }
      if(currentDraftId)await deleteDraft(currentDraftId);
      currentDraftId=null;postFiles=[];clearPreviewURLs();renderComposerMedia();
      if(postText)postText.value='';if(live)live.replyToId=null;
      composer?.classList.remove('show');ROOT.classList.remove('pngeaComposerOpen');
      await Promise.allSettled([liveAPI()?.loadFeed?.(),enhanceProfile()]);
      ui?.toast?.('Posted');
    }catch(err){
      await saveDraft();ui?.toast?.(err?.message||'Could not post');
    }finally{
      posting=false;if(send)send.disabled=false;if(bar)bar.style.width='0';uploadProgress.classList.remove('show');if(label)label.textContent=oldLabel;syncSend();
    }
  }
  window.addEventListener('click',e=>{
    if(!e.target.closest?.('#send')||!liveAPI()?.state?.active)return;
    e.preventDefault();e.stopImmediatePropagation();createPostWithMedia();
  },true);

  /* ---------- Profile social renderer ---------- */
  async function mediaElement(media,cls=''){
    const a=await api.mediaAccess(media.id);
    const mime=String(a.mimeType||media.mimeType||'');
    const el=document.createElement(mime.startsWith('video/')?'video':'img');
    el.className=cls;el.src=a.url;
    if(el.tagName==='VIDEO'){el.controls=true;el.playsInline=true;el.preload='metadata'}
    else el.loading='lazy';
    return el;
  }
  async function hydrateProfileRail(rail,media=[]){
    if(!media.length){rail.remove();return}
    for(const m of media){try{rail.appendChild(await mediaElement(m))}catch{}}
  }
  function profilePostMarkup(p,profile){
    const liked=!!p.viewer_liked,reposted=!!p.viewer_reposted;
    return `<div class="xPost" data-server-post="${escapeHTML(p.id)}"><div class="xAvatar" data-profile="${escapeHTML(profile.handle)}">${escapeHTML((profile.display_name||profile.handle||'?').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase())}</div><div class="xPostBody"><div class="xPostWho" data-profile="${escapeHTML(profile.handle)}"><b>${escapeHTML(profile.display_name||profile.handle)}</b><span>@${escapeHTML(displayHandle(profile.handle))} · ${escapeHTML(relativeTime(p.created_at))}</span></div><div class="xPostText">${escapeHTML(p.text||'')}</div><div class="pngeaProfileMediaRail"></div><div class="xPostActions"><span data-live-action="reply">◯ ${Number(p.replies||0)}</span><span class="${reposted?'activeAction':''}" data-live-action="repost">⇄ ${Number(p.reposts||0)}</span><span class="${liked?'activeAction':''}" data-live-action="like">${liked?'♥':'♡'} ${Number(p.likes||0)}</span><span data-live-action="share">↗</span></div></div></div>`;
  }
  function relativeTime(d){
    if(!d)return 'now';const sec=Math.max(0,(Date.now()-new Date(d).getTime())/1000);
    if(sec<60)return 'now';if(sec<3600)return `${Math.floor(sec/60)}m`;if(sec<86400)return `${Math.floor(sec/3600)}h`;return `${Math.floor(sec/86400)}d`;
  }

  /* alias compatibility until server-side handle migration is hardened */
  function aliasKey(){return `pngea:handleAlias:${api?.getActiveAccountKey?.()||'active'}`}
  function getAlias(){return norm(localStorage.getItem(aliasKey())||'')}
  function setAlias(h){h?localStorage.setItem(aliasKey(),norm(h)):localStorage.removeItem(aliasKey())}
  function serverHandle(){return norm(liveAPI()?.state?.me?.handle||ui?.state?.user?.handle||'you')}
  function displayHandle(h){const sh=serverHandle(),alias=getAlias();return alias&&norm(h)===sh?alias:norm(h)}

  async function enhanceProfile(){
    const live=liveAPI()?.state;if(!live?.active||!ui?.parseRoute)return;
    const route=ui.parseRoute();if(route.screen!=='Profile')return;
    const requested=norm(route.detail||live.me?.handle);if(!requested)return;
    try{
      const self=requested===serverHandle()||requested===getAlias();
      const realHandle=self?serverHandle():requested;
      const [profile,posts]=await Promise.all([api.getUser(realHandle),self?api.myPosts():api.userPosts(realHandle)]);
      const items=posts.items||[];
      const host=$('#p-posts');
      if(host){
        host.innerHTML=items.filter(p=>!p.reply_to_id).map(p=>profilePostMarkup(p,profile)).join('')||'<div class="profileEmpty"><b>No posts yet</b>Your posts will appear here.</div>';
        [...host.querySelectorAll('.xPost')].forEach((row,i)=>hydrateProfileRail(row.querySelector('.pngeaProfileMediaRail'),items.filter(p=>!p.reply_to_id)[i]?.media||[]));
      }
      const replies=$('#p-replies');
      if(replies){
        const reps=items.filter(p=>p.reply_to_id);replies.innerHTML=reps.map(p=>profilePostMarkup(p,profile)).join('')||'<div class="profileEmpty"><b>No replies yet</b>Your replies will appear here.</div>';
        [...replies.querySelectorAll('.xPost')].forEach((row,i)=>hydrateProfileRail(row.querySelector('.pngeaProfileMediaRail'),reps[i]?.media||[]));
      }
      const mediaHost=$('#p-media');
      if(mediaHost){
        const mediaPosts=items.filter(p=>p.media?.length);
        mediaHost.innerHTML=mediaPosts.length?'<div class="pngeaMediaGrid"></div>':'<div class="profileEmpty"><b>No media yet</b>Photos and video will appear here.</div>';
        const grid=mediaHost.querySelector('.pngeaMediaGrid');
        if(grid)for(const p of mediaPosts)for(const m of p.media||[]){
          const tile=document.createElement('div');tile.className='pngeaMediaTile';tile.dataset.serverPost=p.id;
          try{tile.appendChild(await mediaElement(m))}catch{}
          grid.appendChild(tile);
        }
      }
      if(self){
        const alias=getAlias();if(alias){
          $('#Profile .profileHandle')&&($('#Profile .profileHandle').textContent='@'+alias);
          $('#Profile .xTopTitle small')&&($('#Profile .xTopTitle small').textContent='Your profile');
        }
      }
      await applyProfileArt();
    }catch{}
  }

  // Handle Like / Reply / Repost / Share BEFORE the older document-level controller.
  window.addEventListener('click',async e=>{
    const action=e.target.closest?.('[data-live-action]');if(!action||!liveAPI()?.state?.active)return;
    const post=action.closest('[data-server-post]');if(!post)return;
    e.preventDefault();e.stopImmediatePropagation();
    const id=post.dataset.serverPost,kind=action.dataset.liveAction;
    try{
      await ensureSession(false);
      if(kind==='like'){
        const on=action.classList.contains('activeAction');on?await api.unlikePost(id):await api.likePost(id);
      }else if(kind==='repost'){
        const on=action.classList.contains('activeAction');on?await api.unrepost(id):await api.repost(id);
      }else if(kind==='reply'){
        const live=liveAPI().state;live.replyToId=id;composer?.classList.add('show');ROOT.classList.add('pngeaComposerOpen');$('#detected')&&($('#detected').textContent='Reply');postText?.focus();return;
      }else if(kind==='share'){
        const url=`${location.origin}${location.pathname}#/post/${encodeURIComponent(id)}`;
        if(navigator.share)await navigator.share({title:'PNGEA post',url});else{await navigator.clipboard.writeText(url);ui?.toast?.('Link copied')}return;
      }
      await Promise.allSettled([liveAPI()?.loadFeed?.(),enhanceProfile()]);
    }catch(err){ui?.toast?.(err?.message||'Could not update post')}
  },true);

  /* ---------- Profile save + username recovery ---------- */
  function syncSelfIdentity(person,requestedHandle){
    const live=liveAPI()?.state;if(!live)return;
    const old=serverHandle(),fresh=norm(person?.handle||old);
    live.me={...(live.me||{}),...(person||{}),handle:fresh,display_name:person?.display_name||person?.displayName||live.me?.display_name};
    if(fresh===norm(requestedHandle))setAlias('');
    else if(requestedHandle)setAlias(requestedHandle);
    const shown=getAlias()||fresh,name=live.me.display_name||'You';
    if(ui?.state?.user){ui.state.user.name=name;ui.state.user.handle='@'+shown;ui.state.user.bio=live.me.bio||'';ui.save?.()}
    $('.sideName')&&($('.sideName').textContent=name);$('.sideHandle')&&($('.sideHandle').textContent='@'+shown);
    $('#sideFootHandle')&&($('#sideFootHandle').textContent='@'+shown);$('#Profile .profileName')&&($('#Profile .profileName').textContent=name);
    $('#Profile .profileHandle')&&($('#Profile .profileHandle').textContent='@'+shown);$('#Profile .profileBio')&&($('#Profile .profileBio').textContent=live.me.bio||'');
    try{api.rememberAccount?.(live.me)}catch{}
  }
  window.addEventListener('click',async e=>{
    const save=e.target.closest?.('#profileEditSave');if(!save||!liveAPI()?.state?.active)return;
    e.preventDefault();e.stopImmediatePropagation();
    const name=$('#peName')?.value.trim()||'You',requested=norm($('#peHandle')?.value||serverHandle()),bio=$('#peBio')?.value.trim()||'',location=$('#peLocation')?.value.trim()||'',website=$('#peWebsite')?.value.trim()||'';
    if(!/^[a-z0-9_]{2,30}$/i.test(requested)){ui?.toast?.('Username: 2–30 letters, numbers, or underscores');return}
    save.disabled=true;const oldLabel=save.textContent;save.textContent='Saving…';
    try{
      // Force a fresh access token first; this is the edit path that was surfacing "Authentication required".
      await ensureSession(true).catch(()=>{});
      await api.updateProfile({displayName:name,handle:requested,bio,location,website});
      const fresh=await api.me();
      syncSelfIdentity(fresh,requested);
      $('#profileEditLayer')?.classList.remove('show');
      await Promise.allSettled([liveAPI()?.loadFeed?.(),enhanceProfile()]);
      if(norm(fresh?.handle)!==requested)ui?.toast?.('Username saved locally; server handle sync is pending');
      else ui?.toast?.('Profile updated');
    }catch(err){
      // Keep the requested username visible locally so the UI does not snap back while server-side handle migration is fixed.
      const live=liveAPI().state;setAlias(requested);syncSelfIdentity({...live.me,display_name:name,bio,location,website},requested);
      $('#profileEditLayer')?.classList.remove('show');await enhanceProfile();
      if(Number(err?.status)!==401)ui?.toast?.(err?.message||'Profile saved locally');
    }finally{save.disabled=false;save.textContent=oldLabel||'Save'}
  },true);

  /* ---------- Profile picture + banner ---------- */
  const artKey=()=>`pngea:profileArt:${api?.getActiveAccountKey?.()||'active'}`;
  function getArt(){try{return JSON.parse(localStorage.getItem(artKey())||'{}')}catch{return{}}}
  function putArt(v){localStorage.setItem(artKey(),JSON.stringify(v))}
  const avatarInput=document.createElement('input'),bannerInput=document.createElement('input');
  avatarInput.type=bannerInput.type='file';avatarInput.accept=bannerInput.accept='image/*';avatarInput.hidden=bannerInput.hidden=true;document.body.append(avatarInput,bannerInput);

  async function mediaURL(id){if(!id)return'';try{return (await api.mediaAccess(id)).url||''}catch{return''}}
  async function applyProfileArt(){
    const art=getArt(),live=liveAPI()?.state,serverAvatar=live?.me?.avatar_url||'',serverBanner=live?.me?.banner_url||'';
    const avatar=serverAvatar||await mediaURL(art.avatarMediaId),banner=serverBanner||await mediaURL(art.bannerMediaId);
    if(avatar){
      $$('.selfAvatarFallback').forEach(el=>{el.classList.add('hasProfileImage');el.style.backgroundImage=`url("${avatar}")`});
      const sh=serverHandle();$$(`[data-profile="${CSS.escape(sh)}"]`).forEach(el=>{if(el.classList.contains('avatar')||el.classList.contains('xAvatar')){el.style.backgroundImage=`url("${avatar}")`;el.style.backgroundSize='cover';el.style.backgroundPosition='center';el.textContent=''}});
    }else $$('.selfAvatarFallback').forEach(el=>{el.classList.remove('hasProfileImage');el.style.backgroundImage=''});
    const cover=$('#Profile .profileCover');if(cover)cover.style.backgroundImage=banner?`url("${banner}")`:'';
    const ap=$('#pngeaAvatarPreview'),bp=$('#pngeaBannerPreview');if(ap)ap.style.backgroundImage=avatar?`url("${avatar}")`:'';if(bp)bp.style.backgroundImage=banner?`url("${banner}")`:'';
  }
  function installArtEditor(){
    const form=$('#profileEditLayer .pnForm');if(!form||$('#pngeaProfileArtEditor'))return;
    const box=document.createElement('div');box.className='pngeaProfileArtEditor';box.id='pngeaProfileArtEditor';
    box.innerHTML=`<div class="pngeaArtRow"><div class="pngeaArtPreview" id="pngeaAvatarPreview"></div><div><b>Profile photo</b><div class="pngeaArtButtons"><button id="pngeaChangeAvatar" type="button">Change</button><button class="remove" id="pngeaRemoveAvatar" type="button">Remove</button></div></div></div><div class="pngeaArtRow"><div class="pngeaArtPreview banner" id="pngeaBannerPreview"></div><div><b>Banner</b><div class="pngeaArtButtons"><button id="pngeaChangeBanner" type="button">Change</button><button class="remove" id="pngeaRemoveBanner" type="button">Remove</button></div></div></div>`;
    form.prepend(box);
    $('#pngeaChangeAvatar').onclick=()=>avatarInput.click();$('#pngeaChangeBanner').onclick=()=>bannerInput.click();
    $('#pngeaRemoveAvatar').onclick=()=>{const a=getArt();delete a.avatarMediaId;putArt(a);applyProfileArt()};
    $('#pngeaRemoveBanner').onclick=()=>{const a=getArt();delete a.bannerMediaId;putArt(a);applyProfileArt()};
    applyProfileArt();
  }
  async function uploadArt(file,kind){
    try{
      const id=await uploadMedia(file);const a=getArt();a[kind==='avatar'?'avatarMediaId':'bannerMediaId']=id;putArt(a);
      // Best effort server association; local media ID remains the compatibility fallback.
      try{await api.updateProfile(kind==='avatar'?{avatarMediaId:id}:{bannerMediaId:id})}catch{}
      await applyProfileArt();ui?.toast?.(kind==='avatar'?'Profile photo updated':'Banner updated');
    }catch(err){ui?.toast?.(err?.message||'Could not update image')}
  }
  avatarInput.onchange=()=>{const f=avatarInput.files?.[0];avatarInput.value='';if(f)uploadArt(f,'avatar')};
  bannerInput.onchange=()=>{const f=bannerInput.files?.[0];bannerInput.value='';if(f)uploadArt(f,'banner')};
  installArtEditor();
  setTimeout(installArtEditor,400);

  /* ---------- Full-page new message ---------- */
  const newDm=$('#newDmSheet');
  if(newDm){
    newDm.classList.add('pngeaNewDmPage');
    newDm.innerHTML=`<div id="pngeaNewDmGrip"></div><div id="pngeaNewDmTop"><button id="pngeaNewDmCancel">Cancel</button><b>New message</b><span></span></div><div id="pngeaNewDmSearch"><input id="pngeaNewDmInput" autocomplete="off" placeholder="Search people"></div><div id="pngeaNewDmResults"><div class="dmEmpty"><b>Find someone</b>Search by name or @username.</div></div>`;
  }
  let dmSearchTimer=0,dmStartY=null;
  function closeNewDm(){newDm?.classList.remove('show');ROOT.classList.remove('pngeaNewDmOpen');newDm&&(newDm.style.transform='')}
  function openNewDm(){if(!newDm)return;newDm.classList.add('show');ROOT.classList.add('pngeaNewDmOpen');setTimeout(()=>$('#pngeaNewDmInput')?.focus(),70)}
  $('#pngeaNewDmCancel')?.addEventListener('click',closeNewDm);
  $('#pngeaNewDmInput')?.addEventListener('input',()=>{
    clearTimeout(dmSearchTimer);const q=$('#pngeaNewDmInput').value.trim();dmSearchTimer=setTimeout(()=>searchDmPeople(q),180);
  });
  async function searchDmPeople(q){
    const host=$('#pngeaNewDmResults');if(!host)return;
    if(!q){host.innerHTML='<div class="dmEmpty"><b>Find someone</b>Search by name or @username.</div>';return}
    try{
      const d=await api.search(q.replace(/^@/,'')),people=d.people||[];
      host.innerHTML=people.length?'':'<div class="dmEmpty"><b>No people found</b>Try another name or username.</div>';
      people.forEach(p=>{
        const row=document.createElement('div');row.className='pngeaNewDmPerson';
        row.innerHTML=`<div class="xAvatar">${escapeHTML((p.display_name||p.handle||'?').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase())}</div><div><b>${escapeHTML(p.display_name||p.handle)}</b><small>@${escapeHTML(p.handle)}</small></div><button>Message</button>`;
        row.querySelector('button').onclick=()=>startDm(p);host.appendChild(row);
      });
    }catch{host.innerHTML='<div class="dmEmpty"><b>Search unavailable</b>Try again in a moment.</div>'}
  }
  async function startDm(p){
    try{await ensureSession(false);const c=await api.createConversation({memberIds:[p.id],title:null});closeNewDm();await liveAPI()?.loadConversations?.();ui?.navigate?.('Inbox',c.id)}
    catch(err){ui?.toast?.(err?.message||'Could not start conversation')}
  }
  window.addEventListener('click',e=>{
    const compose=e.target.closest?.('.compose');if(!compose)return;
    const r=ui?.parseRoute?.();if(r?.screen==='Inbox'){e.preventDefault();e.stopImmediatePropagation();openNewDm()}
  },true);
  window.addEventListener('hashchange',closeNewDm);
  document.addEventListener('click',e=>{if(e.target.closest?.('.nav,[data-screen],[data-side-screen]')){const r=ui?.parseRoute?.();if(r?.screen!=='Inbox')closeNewDm()}},true);
  newDm?.addEventListener('touchstart',e=>{dmStartY=e.touches?.[0]?.clientY??null},{passive:true});
  newDm?.addEventListener('touchmove',e=>{if(dmStartY==null)return;const dy=Math.max(0,(e.touches?.[0]?.clientY??dmStartY)-dmStartY);if(dy)newDm.style.transform=`translateY(${dy}px)`},{passive:true});
  newDm?.addEventListener('touchend',e=>{if(dmStartY==null)return;const dy=Math.max(0,(e.changedTouches?.[0]?.clientY??dmStartY)-dmStartY);dmStartY=null;if(dy>85)closeNewDm();else newDm.style.transform=''},{passive:true});

  /* ---------- Ticker: persistent + moderated mix ---------- */
  function category(item){
    const s=`${item?.kind||''} ${item?.label||''}`.toLowerCase();
    if(/you|notif|mention|reply|follow/.test(s))return'you';
    if(/sport/.test(s))return'sports';
    if(/stock|market|equity|nasdaq|dow|s&p/.test(s))return'stocks';
    if(/internet|trend|viral|tech|culture/.test(s))return'internet';
    return'news';
  }
  function balanced(items=[]){
    const quotas={news:2,internet:2,stocks:1,sports:2,you:1},groups={news:[],internet:[],stocks:[],sports:[],you:[]};
    items.filter(x=>x&&x.text).forEach(x=>groups[category(x)].push(x));
    const out=[];Object.keys(quotas).forEach(k=>out.push(...groups[k].slice(0,quotas[k])));
    const used=new Set(out);for(const x of items)if(x?.text&&!used.has(x)&&out.length<8){out.push(x);used.add(x)}
    return out.slice(0,8);
  }
  function renderTicker510(items=[]){
    const ticker=$('.ticker'),track=$('#tickerTrack');if(!ticker||!track)return;
    const rows=balanced(items);
    rows.push({kind:'time',label:'TIME',text:new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})});
    if(rows.length===1)rows.unshift({kind:'news',label:'PNGEA',text:navigator.onLine?'Headlines updating':'Offline · reconnecting'});
    const html=rows.map(x=>{
      const cls=x.kind==='you'?'tickerItem you':'tickerItem';
      const attrs=[x.route?`data-screen="${escapeHTML(x.route)}"`:'',x.url?`data-ticker-url="${escapeHTML(x.url)}"`:'',x.query?`data-ticker-query="${escapeHTML(x.query)}"`:''].filter(Boolean).join(' ');
      return `<span class="${cls}" ${attrs}><b class="tickerLabel">${escapeHTML(x.label||String(x.kind||'').toUpperCase())}</b><span>${escapeHTML(x.text)}</span></span>`;
    }).join('');
    track.innerHTML=html+html;ticker.classList.add('liveTickerReady');
  }
  async function updateTicker510(){
    try{const d=await api.ticker();renderTicker510(d.items||[])}catch{renderTicker510([])}
  }
  setTimeout(updateTicker510,700);setInterval(()=>{if(document.visibilityState==='visible')updateTicker510()},60000);

  /* ---------- Route / mutation maintenance ---------- */
  window.addEventListener('hashchange',()=>setTimeout(()=>{enhanceProfile();installArtEditor();applyProfileArt()},220));
  const maintenance=new MutationObserver(()=>{
    installArtEditor();
    if($('#Profile')?.classList.contains('active'))applyProfileArt();
  });
  maintenance.observe(APP,{childList:true,subtree:true});

  setTimeout(()=>{enhanceProfile();applyProfileArt();renderComposerMedia();syncSend()},900);
})();
