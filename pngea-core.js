/* PNGEA v0.53.2 — CONSOLIDATED RELIABILITY
   Replaces pngea-v0.50.0-alpha-core.js.
   Requires index.html core + v0.40.8 + v0.40.9 first.
*/
(() => {
  'use strict';
  if (window.__PNGEA_CORE__) return;
  window.__PNGEA_CORE__ = true;

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

  const ICONS={
    reply:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.4c0 4.6-4.1 8.1-8.8 8.1-1.1 0-2.2-.2-3.2-.5L4 21l1.3-4C3.9 15.6 3.1 13.7 3.1 11.4c0-4.6 3.8-8.2 8.6-8.2s8.8 3.6 8.8 8.2Z"/></svg>`,
    repost:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.7 3.8 1.2 7.1l1.6 1.7L4 7.7v7.8A5.5 5.5 0 0 0 9.5 21H13v-2.3H9.5a3.2 3.2 0 0 1-3.2-3.2V7.7l1.2 1.1 1.6-1.7-4.4-3.3Zm14.6 16.4 3.5-3.3-1.6-1.7-1.2 1.1V8.5A5.5 5.5 0 0 0 14.5 3H11v2.3h3.5a3.2 3.2 0 0 1 3.2 3.2v7.8l-1.2-1.1-1.6 1.7 4.4 3.3Z"/></svg>`,
    like:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.6 4.4 13.4C.1 9.3 2.7 3.2 7.5 3.2c2 0 3.6 1.1 4.5 2.5.9-1.4 2.5-2.5 4.5-2.5 4.8 0 7.4 6.1 3.1 10.2L12 20.6Z"/></svg>`,
    share:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 9-18 9 4-9-4-9Zm4 9h14"/></svg>`,
    longform:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 10h16M4 15h16M4 20h11"/></svg>`,
    save:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14v18l-7-4-7 4V3Z"/></svg>`,
    gallery:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m5 18 5-5 3 3 2-2 4 4"/></svg>`,
    camera:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6.5 9.5 4h5L16 6.5h3.2A1.8 1.8 0 0 1 21 8.3v9.9a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 18.2V8.3a1.8 1.8 0 0 1 1.8-1.8H8Z"/><circle cx="12" cy="13" r="4"/></svg>`,
    mic:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/></svg>`
  };
  const reactionState=new Map(),reactionDirtyUntil=new Map(),savedPosts=new Map(),saveLocks=new Set();
  function ingestPostState(p,{force=false}={}){
    if(!p?.id)return;
    const key=String(p.id),dirtyUntil=reactionDirtyUntil.get(key)||0;
    if(p.viewer_saved!==undefined&&!saveLocks.has(key))savedPosts.set(key,!!p.viewer_saved);
    if(!force&&(Date.now()<dirtyUntil||reactionLocks.has(`like:${key}`)||reactionLocks.has(`repost:${key}`))&&reactionState.has(key)){
      // Preserve optimistic like/repost state while the API/feed catches up.
      const cur=reactionState.get(key);
      cur.replies=Math.max(Number(cur.replies||0),Number(p.replies||0));
      reactionState.set(key,cur);
      return;
    }
    reactionState.set(key,{
      liked:!!p.viewer_liked,reposted:!!p.viewer_reposted,
      likes:Number(p.likes||0),reposts:Number(p.reposts||0),replies:Number(p.replies||0)
    });
    if(force)reactionDirtyUntil.delete(key);
  }

  const postOrder=new Map(),postRecords=new Map();
  function postTime(p){const t=Date.parse(p?.created_at||'');return Number.isFinite(t)?t:0}
  function rememberPost(p){if(p?.id){postOrder.set(String(p.id),postTime(p));postRecords.set(String(p.id),{...p,text:undefined});if(postRecords.size>1000)postRecords.delete(postRecords.keys().next().value)}}
  function stablePosts(items=[]){
    const unique=new Map();
    for(const p of items||[]){if(p?.id&&!unique.has(String(p.id))){unique.set(String(p.id),p);rememberPost(p)}}
    return [...unique.values()].sort((a,b)=>postTime(b)-postTime(a)||String(b.id).localeCompare(String(a.id)));
  }

  const build = $('meta[name="pngea-build"]');
  if (build) build.setAttribute('content','0.53.2-compose-sports');

  /* ---------- CSS ---------- */
  const style = document.createElement('style');
  style.id = 'pngeaV0515Style';
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
  position:fixed!important;inset:0!important;z-index:2147483646!important;
  background:rgba(0,0,0,.52)!important;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)
}
#pnActionSheet{
  position:fixed!important;inset:auto 8px calc(8px + env(safe-area-inset-bottom)) 8px!important;
  z-index:2147483647!important;height:auto!important;min-height:0!important;max-height:min(70dvh,520px)!important;
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


/* v0.51.4 — messages, badges, editor, history */
.dmThread{position:fixed!important;inset:auto auto auto 50%!important;transform:translateX(-50%);width:min(430px,100vw)!important;top:var(--pn-thread-top,0px)!important;height:var(--pn-thread-height,calc(100dvh - 70px - var(--pn-safe-bottom)))!important;min-height:0!important;max-height:none!important;overflow:hidden!important;padding:var(--pn-safe-top) 0 0!important;user-select:none;-webkit-user-select:none}
html.pngeaDmThreadOpen .compose{display:none!important}
#pngeaDmAttachments{display:none;gap:6px;overflow-x:auto;padding:8px 10px 0;background:#050505;border-top:1px solid #171717}
#pngeaDmAttachments.show{display:flex}
#pngeaDmAttachments .dmAttach{width:64px;height:64px;flex:none;border-radius:12px;overflow:hidden;position:relative;background:#111;border:1px solid #292929}
#pngeaDmAttachments img,#pngeaDmAttachments video{width:100%;height:100%;object-fit:cover}
#pngeaDmAttachments audio{width:62px;height:48px;margin-top:8px}
#pngeaDmAttachments button{position:absolute;right:3px;top:3px;width:22px;height:22px;border:0;border-radius:50%;background:rgba(0,0,0,.75);color:#fff;font-size:15px}
.dmCompose{height:auto!important;min-height:58px!important;padding:8px 10px!important;display:grid!important;grid-template-columns:38px minmax(0,1fr) 38px 38px!important;gap:7px!important;align-items:center!important;background:#070707!important}
.dmCompose input{min-width:0!important;height:42px!important;font-size:16px!important;padding:0 14px!important}
.dmCompose button{width:38px!important;height:38px!important;border-radius:50%!important;display:grid!important;place-items:center!important;padding:0!important}
#pngeaDmPlus,#pngeaDmMic{background:#121212!important;color:#eee!important;border:1px solid #2b2b2b!important}
#pngeaDmMic svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9}
#pngeaDmPlus{font-size:24px!important;font-weight:500!important}
#dmSend{font-size:18px!important}
#dmMessages>.pngeaMessageRow{display:flex;flex-direction:column;align-items:flex-start;width:100%;min-width:0}
#dmMessages>.pngeaMessageRow.me{align-items:flex-end}
.liveMessageMedia{width:fit-content;max-width:78%;display:flex;flex-direction:column;align-items:flex-start;gap:4px;margin:5px 12px}
.liveMessageMedia.me{align-self:flex-end;align-items:flex-end;margin-left:auto}
.liveMessageMedia.them{align-self:flex-start;margin-right:auto}
.liveMessageMedia img,.liveMessageMedia video{display:block;width:auto;max-width:min(100%,280px);max-height:320px;border-radius:15px;background:#111}
.liveMessageMedia audio{width:min(280px,76vw)}
.pngeaNavBadge{position:absolute;top:0;left:calc(50% + 10px);min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#f1f1f1;color:#080808;border:2px solid #060606;display:none;place-items:center;font-size:9px;font-weight:950;line-height:14px;z-index:7}
.pngeaNavBadge.show{display:grid}
#History .xScroll{padding-bottom:calc(20px + var(--pn-safe-bottom))}
#History .historyRow{cursor:pointer}
#History .historyThumb{font-size:18px}
#History .historyEmpty{padding:56px 24px;text-align:center;color:#666}
#History .historyEmpty b{display:block;color:#ddd;font-size:18px;margin-bottom:6px}
#pngeaMediaEditorBody{overflow:hidden!important;padding:16px!important}
#pngeaEditorStage{width:100%;height:100%;min-height:0;display:grid;place-items:center;overflow:hidden;position:relative;background:#050505}
#pngeaEditorStage img,#pngeaEditorStage video{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;transform-origin:center center}
#pngeaMediaEditorTools{min-height:112px!important;align-items:stretch!important;flex-direction:column!important;padding:10px 12px calc(10px + var(--pn-safe-bottom))!important}
.pngeaEditToolRow{display:flex;gap:7px;align-items:center;justify-content:center;overflow-x:auto}
.pngeaEditToolRow button{white-space:nowrap}
.pngeaEditToolRow button.selected{background:#eee!important;color:#080808!important}
.pngeaEditSlider{display:grid;grid-template-columns:48px 1fr 48px;align-items:center;gap:7px;color:#777;font-size:10px}
.pngeaEditSlider input{width:100%}
.pngeaEditLabel{text-align:center;color:#7d7d7d;font-size:10px}
.pngeaVideoCropFrame{overflow:hidden;border-radius:14px;background:#000;display:grid;place-items:center;max-width:100%;max-height:100%}
.pngeaVideoCropFrame video{width:100%;height:100%;object-fit:cover}
.avatar.pngeaAvatarReady,.xAvatar.pngeaAvatarReady,.sideAvatar.pngeaAvatarReady,.sideMini.pngeaAvatarReady,.pngeaDetailAvatar.pngeaAvatarReady,.selfAvatarFallback.pngeaAvatarReady{overflow:hidden!important;position:relative!important;color:transparent!important}
.avatar>.pngeaAvatarImg,.xAvatar>.pngeaAvatarImg,.sideAvatar>.pngeaAvatarImg,.sideMini>.pngeaAvatarImg,.pngeaDetailAvatar>.pngeaAvatarImg,.selfAvatarFallback>.pngeaAvatarImg{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;border-radius:inherit!important;pointer-events:none!important}
[data-profile]:not(.avatar):not(.xAvatar):not(.sideAvatar):not(.sideMini):not(.pngeaDetailAvatar).pngeaAvatarReady{background-image:none!important;background:none!important;color:inherit!important}
[data-profile]:not(.avatar):not(.xAvatar):not(.sideAvatar):not(.sideMini):not(.pngeaDetailAvatar){background-image:none!important}


/* v0.51.5 baseline stability */
#Profile .profileCover{overflow:hidden!important;background-color:#181818!important}
#p-posts .pngeaProfileMediaRail,#p-replies .pngeaProfileMediaRail{width:100%;min-width:0}
#p-posts .pngeaProfileMediaRail img,#p-posts .pngeaProfileMediaRail video,#p-replies .pngeaProfileMediaRail img,#p-replies .pngeaProfileMediaRail video{width:100%;height:auto;max-height:520px;object-fit:cover}
[data-pngea-profile-row="515"]{contain:layout paint}
.pngeaAvatarReady{isolation:isolate}

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



/* v0.51.2 — iPhone safe areas, fixed viewport, media-first posts. */
:root{--pn-safe-top:env(safe-area-inset-top,0px);--pn-safe-bottom:env(safe-area-inset-bottom,0px)}
.status{height:calc(28px + var(--pn-safe-top))!important;padding-top:var(--pn-safe-top)!important}
.bottom{
  height:calc(70px + var(--pn-safe-bottom))!important;
  padding:8px 18px calc(10px + var(--pn-safe-bottom))!important;
  align-items:flex-start!important
}
.compose{bottom:calc(88px + var(--pn-safe-bottom))!important}
.profileEditLayer,.composerLayer,.connectionsLayer,#pngeaLiveAuth{
  padding-top:var(--pn-safe-top)!important;
  padding-bottom:var(--pn-safe-bottom)!important
}
#profileEditLayer{
  position:fixed!important;inset:0 auto 0 50%!important;transform:translateX(-50%)!important;
  width:min(430px,100vw)!important;height:100dvh!important;max-height:100dvh!important;
  z-index:2147483300!important;background:#050505!important;overflow:hidden!important
}
body:has(#profileEditLayer.show) .bottom,
body:has(#pngeaMediaEditor.show) .bottom,
body:has(#pngeaDraftsPage.show) .bottom,
body:has(#newDmSheet.show) .bottom{visibility:hidden!important;pointer-events:none!important}

/* Stop iOS focus-zoom. Keep text readable instead of disabling accessibility zoom globally. */
@supports (-webkit-touch-callout:none){
  input,textarea,select{font-size:16px!important}
}
html,body,.app{overscroll-behavior:none}
.app,.screen,.bottom,.top,.simpleTop,.profileEditLayer,.composerLayer{touch-action:pan-x pan-y}
.pngeaZoomSurface,#pngeaMediaViewerBody img,#pngeaMediaViewerBody video,#pngeaMediaEditorBody img,#pngeaMediaEditorBody video{touch-action:pinch-zoom pan-x pan-y!important}

/* Media-only posts do not reserve a blank caption row. */
.body:empty,.xPostText:empty,.caption:empty{display:none!important;margin:0!important}
.body:empty + .liveMediaRail,.xPostText:empty + .pngeaProfileMediaRail{margin-top:7px!important}
.liveMediaRail,.pngeaProfileMediaRail{position:relative}
.liveMediaRail img,.liveMediaRail video,.pngeaProfileMediaRail img,.pngeaProfileMediaRail video{cursor:zoom-in}

/* Full-screen viewer/editors must live above every app stacking context. */
#pngeaMediaEditor,#pngeaDraftsPage,#newDmSheet.pngeaNewDmPage,#pngeaMediaViewer{
  z-index:2147483600!important
}
#pngeaMediaViewer{
  display:none;position:fixed;inset:0;background:#000;z-index:2147483646!important;
  padding:var(--pn-safe-top) 0 var(--pn-safe-bottom);flex-direction:column
}
#pngeaMediaViewer.show{display:flex!important}
#pngeaMediaViewerTop{
  height:54px;flex:none;display:flex;align-items:center;justify-content:space-between;
  padding:0 14px;background:rgba(0,0,0,.88);border-bottom:1px solid #1d1d1d
}
#pngeaMediaViewerTop button{border:0;background:transparent;color:#eee;font-size:14px;font-weight:850;padding:10px}
#pngeaMediaViewerTop b{font-size:13px}
#pngeaMediaViewerBody{flex:1;min-height:0;display:grid;place-items:center;overflow:hidden;background:#000}
#pngeaMediaViewerBody img,#pngeaMediaViewerBody video{display:block;max-width:100%;max-height:100%;object-fit:contain;background:#000}
#pngeaMediaViewerBody video{width:100%;height:100%}
.pngeaMediaSlot.pngeaVideoSlot{aspect-ratio:var(--pn-media-ratio,1.777778)!important;width:100%;max-width:min(100%,calc(620px * var(--pn-media-ratio,1.777778)),calc(78svh * var(--pn-media-ratio,1.777778)));max-height:none!important;justify-self:center}.pngeaFormat-reel .pngeaCardHeader{max-width:min(100%,calc(620px * var(--pn-video-ratio,1.777778)),calc(78svh * var(--pn-video-ratio,1.777778)));margin:0 auto;box-sizing:border-box}.pngeaReelSlot .pngeaReelMute{position:absolute;right:10px;bottom:10px;width:34px;height:34px;border:1px solid #ffffff35;border-radius:50%;background:#0008;color:#fff;font-size:16px;z-index:1}.pngeaReelSlot .pngeaReelMute svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8}.pngeaReelSlot video{cursor:zoom-in}
#pngeaMediaViewer.pngeaReelViewer{padding:0;overscroll-behavior:none;touch-action:none}#pngeaMediaViewer.pngeaReelViewer #pngeaMediaViewerTop{position:absolute;inset:0 0 auto;height:calc(50px + var(--pn-safe-top));padding-top:var(--pn-safe-top);box-sizing:border-box;z-index:3;background:linear-gradient(#0008,transparent);border:0}#pngeaMediaViewer.pngeaReelViewer #pngeaMediaViewerBody{position:relative;display:block;height:100%;flex:none}#pngeaMediaViewer.pngeaReelViewer video{position:absolute;inset:0;width:100%;height:100%;max-height:none;object-fit:contain;background:#000}#pngeaMediaViewer.pngeaReelViewer #pngeaMediaViewerTop b{display:none}.pngeaReelOverlay{position:absolute;inset:0;pointer-events:none;color:#fff;text-shadow:0 1px 5px #0008}.pngeaReelOverlay button,.pngeaReelOverlay [data-live-action],.pngeaReelOverlay [data-profile],.pngeaReelOverlay input{pointer-events:auto}.pngeaReelIdentity{position:absolute;left:16px;right:76px;bottom:calc(90px + var(--pn-safe-bottom));padding-top:50px;background:linear-gradient(transparent,#0005)}.pngeaReelAuthor{display:flex;gap:9px;align-items:center;font-size:15px;font-weight:750}.pngeaReelAuthor .xAvatar{width:36px;height:36px;flex:none;border:1px solid #ffffff45}.pngeaReelCaption{font-size:14px;line-height:1.35;margin-top:9px;max-height:20vh;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;touch-action:pan-y}.pngeaReelActions{position:absolute;right:10px;bottom:calc(100px + var(--pn-safe-bottom));display:flex;flex-direction:column;gap:13px}.pngeaReelActions [data-live-action]{display:flex;flex-direction:column;gap:2px;min-width:42px;border:0;background:none;color:#fff!important;padding:0;font-size:11px}.pngeaReelActions svg{width:27px;height:27px;fill:none;stroke:currentColor;stroke-width:1.7}.pngeaReelActions [data-live-action="save"].activeAction svg{fill:currentColor}.pngeaReelPlayback{position:absolute;left:16px;right:16px;bottom:calc(10px + var(--pn-safe-bottom));display:grid;grid-template-columns:36px 1fr 36px;align-items:center;gap:10px;padding-top:26px;background:linear-gradient(transparent,#0008)}.pngeaReelPlayback button{width:34px;height:34px;border:0;border-radius:50%;background:#0007;color:#fff;font-size:16px}.pngeaReelPlayback svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8}.pngeaReelSeekWrap{min-width:0}.pngeaReelSeek{width:100%;height:24px;margin:0;accent-color:#fff;touch-action:none}.pngeaReelTime{display:flex;justify-content:space-between;color:#eee;font-size:10px;font-variant-numeric:tabular-nums}.pngeaReelStatus{position:absolute;top:50%;left:20px;right:20px;text-align:center;font-size:13px;pointer-events:none}

/* Reaction bar: immediate tactile feedback, larger hit areas, no layout jump. */
[data-live-action]{min-width:36px;min-height:32px;display:inline-flex;align-items:center;gap:4px;justify-content:center;
  border-radius:999px;user-select:none;-webkit-user-select:none;transition:transform .08s ease,color .12s ease,background .12s ease}
[data-live-action]:active{transform:scale(.92);background:rgba(255,255,255,.055)}
[data-live-action].pngeaPending{opacity:1}

/* Smoother feed rendering. */
#feed [data-live-content="true"]{contain:layout paint;content-visibility:auto;contain-intrinsic-size:180px}
.liveMediaRail img,.liveMediaRail video{display:block}

/* Hide raw background failures/toasts from old client layers. */
.uiToast.pngeaSuppressed{display:none!important}


/* v0.51.3 — compact X-style composer. */
#composerLayer .canvas{padding:14px 18px 8px!important;display:flex!important;flex-direction:column!important}
#composerLayer #postText{
  min-height:112px!important;height:auto!important;max-height:30dvh!important;
  padding:10px 4px 4px!important;font-size:21px!important;line-height:1.3!important;
  flex:0 0 auto!important;resize:none!important
}
#composerLayer #attachPreview.show{display:block!important;margin-top:4px!important;flex:0 0 auto!important}
#pngeaComposerMediaGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%!important}
.pngeaComposerMedia:only-child{grid-column:1/-1!important;width:100%!important;min-height:0!important;max-height:none!important}
.pngeaComposerMedia:only-child img,.pngeaComposerMedia:only-child video{
  width:100%!important;height:auto!important;min-height:0!important;max-height:52dvh!important;object-fit:contain!important
}
.pngeaComposerMedia.voice{min-height:78px!important;height:78px!important;display:flex!important;align-items:center!important;padding:14px!important}
.pngeaComposerMedia.voice audio{width:100%!important;height:46px!important;min-height:0!important}
#composerLayer .captureRow{grid-template-columns:repeat(4,1fr)!important}
#composerLayer .captureRow .cap{min-width:0}
#composerLayer .captureRow .cap b{display:grid;place-items:center}
#composerLayer .cap svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}

/* No hidden sheet should peek from below Home. */
.accountSheet:not(.show),.pnSheet:not(.show){
  transform:translateY(calc(100% + 140px))!important;
  visibility:hidden!important;pointer-events:none!important
}
.accountSheet.show,.pnSheet.show{visibility:visible!important}

/* Unified reaction controls. */
[data-live-action]{color:#777!important;gap:7px!important;min-width:48px!important}
[data-live-action] svg{width:19px;height:19px;display:block;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
[data-live-action] .pngeaActionCount{font:600 12px/1 system-ui,-apple-system,sans-serif;min-width:8px}
[data-live-action="like"].activeAction{color:#fff!important}
[data-live-action="like"].activeAction svg{fill:#fff!important;stroke:#fff!important}
[data-live-action="repost"].activeAction{color:#fff!important}
[data-live-action="repost"].activeAction svg{stroke:#fff!important}

/* Full post page + reply composer. */
#pngeaPostPage,#pngeaVoiceRecorder{
  position:fixed;inset:0;z-index:2147483645;background:#050505;color:#eee;
  padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)
}
#pngeaPostPage{display:none;flex-direction:column}
#pngeaPostPage.show{display:flex}
.pngeaPostTop{
  height:56px;flex:none;display:grid;grid-template-columns:64px 1fr 64px;align-items:center;
  border-bottom:1px solid #1c1c1c;padding:0 12px;background:#050505
}
.pngeaPostTop button{border:0;background:none;color:#eee;font-size:26px;padding:8px;text-align:left}
.pngeaPostTop b{text-align:center;font-size:16px}
#pngeaPostScroll{flex:1;min-height:0;overflow:auto;padding-bottom:92px}
.pngeaDetailPost{padding:16px;border-bottom:1px solid #1c1c1c}
.pngeaDetailWho{display:flex;align-items:center;gap:10px}
.pngeaDetailAvatar{width:48px;height:48px;border-radius:50%;background:#151515;border:1px solid #333;display:grid;place-items:center;font-weight:850}
.pngeaDetailName b{display:block;font-size:16px}.pngeaDetailName span{display:block;color:#666;font-size:13px}
.pngeaDetailText{font-size:22px;line-height:1.35;margin:16px 0 10px;white-space:pre-wrap}
.pngeaDetailText:empty{display:none}
.pngeaDetailMedia{display:grid;gap:3px;border-radius:15px;overflow:hidden;margin-top:10px}
.pngeaDetailMedia img,.pngeaDetailMedia video{width:100%;max-height:65dvh;object-fit:contain;background:#000}
.pngeaDetailMedia audio{width:100%;margin:10px 0}
.pngeaDetailMeta{color:#666;font-size:12px;padding:11px 0;border-bottom:1px solid #1b1b1b}
.pngeaDetailActions{display:flex;justify-content:space-around;padding:8px 0;border-bottom:1px solid #1b1b1b}
.pngeaReplyList .pngeaReplyItem{padding:13px 15px;border-bottom:1px solid #171717}
.pngeaReplyItem .pngeaDetailText{font-size:15px;margin:7px 0}
#pngeaPostReplyBar{
  position:absolute;left:0;right:0;bottom:env(safe-area-inset-bottom);z-index:3;
  min-height:72px;background:#080808;border-top:1px solid #202020;padding:8px 12px
}
#pngeaPostReplyRow{display:flex;gap:8px;align-items:flex-end}
#pngeaPostReplyInput{
  flex:1;min-height:42px;max-height:110px;border:1px solid #303030;border-radius:21px;
  background:#151515;color:#eee;padding:10px 14px;font:16px/1.35 system-ui;resize:none;outline:none
}
.pngeaReplySend{height:40px;border:0;border-radius:999px;background:#eee;color:#050505;font-weight:900;padding:0 16px}
.pngeaReplyTools{display:flex;gap:10px;padding:6px 4px 0}
.pngeaReplyTools button{border:0;background:none;color:#aaa;width:34px;height:30px;display:grid;place-items:center;padding:0}
.pngeaReplyTools svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}

/* Timeline reply page with parent/thread cue. */

/* Voice recorder. */
#pngeaVoiceRecorder{display:none;flex-direction:column;align-items:center;justify-content:center;gap:22px}
#pngeaVoiceRecorder.show{display:flex}
#pngeaVoiceTimer{font-size:38px;font-weight:850;font-variant-numeric:tabular-nums}
#pngeaVoiceStatus{color:#777}
#pngeaVoiceControls{display:flex;gap:12px}
#pngeaVoiceControls button{border:1px solid #333;border-radius:999px;background:#111;color:#eee;padding:12px 18px;font-weight:800}
#pngeaVoiceControls .primary{background:#eee;color:#080808}
#pngeaVoicePreview{width:min(360px,86vw)}


/* Photo review, crop and post interactions use the shared composer. */
#detected{white-space:nowrap!important}#send[data-photo-button="true"]{width:auto!important;min-width:58px!important;padding:0 14px!important;border-radius:999px!important;font-size:14px!important}
#composerLayer[data-post-kind="gallery"][data-photo-step="select"] #postText{display:none!important}#composerLayer[data-photo-step="review"] #attachPreview,#composerLayer[data-photo-step="review"] .capture{display:none!important}
#pngeaPhotoReview[hidden]{display:none}#pngeaPhotoReview{display:block;padding-top:16px}.pngeaPhotoReviewTop{display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:14px;align-items:start}#pngeaPhotoCaptionHost #postText{display:block!important;width:100%!important;font-family:inherit!important;font-size:18px!important;min-height:140px!important;max-height:40svh!important}#pngeaPhotoReviewThumbs{display:grid;gap:8px}#pngeaPhotoReviewThumbs button{border:1px solid #333;background:#000;padding:0;width:90px;height:90px;overflow:hidden}#pngeaPhotoReviewThumbs img,#pngeaPhotoReviewThumbs video{display:block;width:100%;height:100%;object-fit:cover}.pngeaPhotoAudience{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #242424;padding:18px 0;margin-top:18px;font-size:14px}.pngeaPhotoAudience select{border:1px solid #333;border-radius:10px;background:#141414;color:#eee;padding:10px;font-size:14px}#pngeaPhotoReview>small{color:#777;font-size:12px}
#pngeaEditorStage{flex:none;max-height:55svh;position:relative;touch-action:none!important;user-select:none;-webkit-user-select:none}#pngeaEditorStage canvas{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none}.pngeaCropGrid{position:absolute;inset:0;pointer-events:none;border:1px solid #aaa;background:linear-gradient(90deg,transparent 33%,#fff8 33%,#fff8 calc(33% + 1px),transparent calc(33% + 1px),transparent 66%,#fff8 66%,#fff8 calc(66% + 1px),transparent calc(66% + 1px)),linear-gradient(transparent 33%,#fff8 33%,#fff8 calc(33% + 1px),transparent calc(33% + 1px),transparent 66%,#fff8 66%,#fff8 calc(66% + 1px),transparent calc(66% + 1px))}
.pngeaMention{display:inline;border:0;background:none;color:#9cbbde;font:inherit;padding:0;cursor:pointer}.pngeaPhotoActions{justify-content:flex-start!important;gap:4px!important;margin:4px 0!important}.pngeaPhotoActions [data-live-action]{min-width:32px!important;gap:4px!important}.pngeaPhotoActions [data-live-action="save"]{margin-left:auto}.pngeaPhotoActions [data-live-action="save"].activeAction svg{fill:currentColor}.pngeaPhotoActions [data-live-action="share"]{margin-right:0}.pngeaDetailActions[hidden]{display:none!important}.pngeaFormat-gallery .xPostText{font-size:15px!important}#pngeaReplyingTo{min-height:22px;font-size:12px;line-height:16px;color:#777;padding:0 4px 6px}
#pngeaMentionSuggestions{position:fixed;z-index:2147483647;max-height:190px;overflow:auto;background:#111;border:1px solid #333;border-radius:12px;box-shadow:0 10px 30px #0008}#pngeaMentionSuggestions[hidden]{display:none}#pngeaMentionSuggestions button{display:block;width:100%;padding:12px;text-align:left;background:none;color:#eee;border:0;border-bottom:1px solid #242424;font-size:14px}

#dmThread .msgBubble{font-size:15px!important;line-height:20px!important}.pngeaPhotoActions [data-live-action] svg{width:22px!important;height:22px!important}

/* Shared post presentation across every live feed. */
.pngeaPostCard.xPost{display:block!important;margin:12px 14px;padding:14px;border:1px solid #262626;border-radius:20px;background:#080808;position:relative;overflow:hidden}
.pngeaCardHeader{display:flex;align-items:center;gap:10px;margin-bottom:10px}.pngeaCardHeader .xAvatar{flex:none;width:42px;height:42px}.pngeaCardHeader .xPostWho{flex:1;min-width:0;margin:0}.pngeaCardHeader .xPostWho b{display:block;font-size:15px}.pngeaCardHeader .xPostWho span{display:block;font-size:12px;color:#777}.pngeaPostCard .xPostBody{width:100%;min-width:0}.pngeaPostCard .xPostText{font-size:17px;line-height:1.4;white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0}.pngeaPostCard .more,.pngeaDetailMore{border:0;background:none;color:#888;padding:8px;font-size:16px;cursor:pointer}.pngeaDetailPost,.pngeaReplyItem{position:relative}.pngeaDetailMore{position:absolute;right:8px;top:8px}
.pngeaProfileMediaRail.liveMediaRail,.pngeaDetailMedia{display:grid;grid-template-columns:1fr;gap:4px;width:100%;border-radius:14px;overflow:hidden;margin:10px 0}
.pngeaProfileMediaRail.liveMediaRail img,.pngeaDetailMedia img{display:block;width:100%!important;height:auto!important;aspect-ratio:auto!important;max-height:min(430px,62svh)!important;object-fit:cover!important;background:#080808;margin:0!important}
.pngeaProfileMediaRail.liveMediaRail video,.pngeaDetailMedia video{display:block;width:100%;height:auto;aspect-ratio:auto;max-height:none;object-fit:contain;background:#000}
.pngeaPostCard.pngeaFormat-photo,.pngeaPostCard.pngeaFormat-gallery,.pngeaPostCard.pngeaFormat-reel,.pngeaPostCard.pngeaFormat-video,.pngeaPostCard.pngeaFormat-longform{border:0!important;border-radius:0!important;background:transparent!important;padding:0!important}
.pngeaFormat-photo .liveMediaRail,.pngeaFormat-gallery .liveMediaRail,.pngeaFormat-reel .liveMediaRail,.pngeaFormat-video .liveMediaRail{border-radius:0!important}.pngeaFormat-gallery .xPostText,.pngeaFormat-video .xPostText{font-size:15px}
.pngeaFormat-reel .pngeaCardHeader{position:absolute;top:0;left:0;right:0;z-index:2;padding:12px;background:linear-gradient(#000a,transparent);pointer-events:none}.pngeaFormat-reel .pngeaCardHeader [data-profile],.pngeaFormat-reel .pngeaCardHeader button{pointer-events:auto}.pngeaFormat-reel .xPostWho span{color:#ddd}.pngeaFormat-reel .liveMediaRail{margin-top:0}.pngeaFormat-longform .xPostText{border:1px solid #282828;border-radius:14px;padding:16px;font-size:22px;font-weight:750}.pngeaFormat-longform .xPostWho b{font-size:13px}.pngeaFormat-longform .xPostWho span{font-size:11px}.pngeaFormat-longform .xAvatar{width:32px;height:32px}
.pngeaReplyList .pngeaReplyItem{padding:10px 14px}.pngeaReplyItem .pngeaDetailAvatar{width:34px;height:34px;flex:none}.pngeaReplyItem .pngeaDetailName b{font-size:14px}.pngeaReplyItem .pngeaDetailName span{font-size:11px}.pngeaReplyItem .pngeaDetailText{font-size:15px;line-height:1.35;margin:6px 0}.pngeaReplyItem .xPostActions{padding:5px 0}.pngeaLongTitle{font-size:28px;line-height:1.25;overflow-wrap:anywhere}.pngeaDetailText{overflow-wrap:anywhere}
#pngeaLongTitleInput{width:100%;border:0;border-bottom:1px solid #262626;background:none;color:#eee;font:700 27px/1.3 system-ui;padding:10px 0 18px;margin-bottom:18px;outline:none}#pngeaLongTitleInput[hidden]{display:none}#composerLayer[data-post-kind="longform"] .capture{display:none!important}#composerLayer[data-post-kind="longform"] #postText{min-height:260px!important;max-height:none!important;height:55dvh!important;flex:1!important}
#pngeaSendPostPage{display:none;position:fixed;inset:0;margin:auto;width:min(430px,100vw);z-index:2147483646;background:#050505;padding-top:env(safe-area-inset-top);flex-direction:column}#pngeaSendPostPage.show{display:flex}#pngeaSendPostSearch{margin:12px;border:1px solid #292929;border-radius:20px;padding:12px;color:#eee;background:#111;font-size:16px}#pngeaSendPostPeople{overflow:auto;flex:1}.pngeaSendPerson{width:100%;display:grid;grid-template-columns:1fr auto;gap:5px;text-align:left;padding:14px;border:0;border-bottom:1px solid #222;background:none;color:#eee;font-size:15px}.pngeaSendPerson small{grid-column:1;color:#777}.pngeaSendPerson span{grid-column:2;grid-row:1/3;align-self:center;font-size:13px}.pngeaSharedPost{border:0;background:none;color:inherit;font:inherit;padding:0;text-decoration:underline}
.pngeaNavIcon{position:relative;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px}.pngeaNavIcon .pngeaNavBadge{top:-5px!important;right:-7px!important;left:auto!important}
#Communities .xAction{border:0;background:none;color:#eee;font-size:26px;padding:6px;cursor:pointer}
#pngeaPostPage{width:min(430px,100vw);margin:0 auto}#pngeaPostScroll{padding-bottom:0}#pngeaPostReplyBar{position:relative;left:auto;right:auto;bottom:auto;flex:none;min-height:0;padding:8px 12px max(8px,env(safe-area-inset-bottom))}#dmThread .dmMessages{min-height:0;flex:1 1 0;overflow:auto;display:flex;flex-direction:column;justify-content:flex-start;touch-action:pan-y;overscroll-behavior-y:none;-webkit-overflow-scrolling:touch;overflow-anchor:none}#dmThread .dmMessages::before{content:"";flex:1 0 0;min-height:0}#dmThread .dmMessages>*{flex-shrink:0}
html.pngeaThreadViewport,html.pngeaThreadViewport body{height:100%!important;min-height:0!important;overflow:hidden!important;overscroll-behavior:none!important}html.pngeaThreadViewport body{position:fixed!important;inset:0!important;width:100%!important}
#dmThread>.xTop,#dmThread>#pngeaDmAttachments,#dmThread>.dmCompose{flex:none!important}#dmThread>.dmCompose{position:relative!important;inset:auto!important;transform:none!important;width:100%!important;margin:0!important;padding:8px 10px!important}
html.pngeaThreadViewport #pngeaPostPage{top:var(--pn-thread-top,0px)!important;bottom:auto!important;height:var(--pn-thread-height,100dvh)!important;min-height:0!important;overflow:hidden!important;padding-bottom:0!important}
html.pngeaKeyboardOpen #pngeaPostReplyBar{padding-bottom:8px!important}#pngeaPostScroll{flex:1 1 0;display:flex;flex-direction:column;touch-action:pan-y;overscroll-behavior-y:none;-webkit-overflow-scrolling:touch;overflow-anchor:none}#pngeaPostScroll>*{flex-shrink:0}html.pngeaKeyboardOpen #pngeaPostBody{margin-top:auto}html.pngeaKeyboardOpen #pngeaReplyList>.profileEmpty{display:none}

/* Photo comments reuse the locked reply frame without changing the timeline route. */
#pngeaCommentsShade{display:none;position:fixed;inset:0;background:#0009;z-index:2147483644}#pngeaCommentsShade.show{display:block}#pngeaCommentsHandle{display:none}.pngeaPhotoComments{padding-top:0!important;border-radius:22px 22px 0 0;box-shadow:0 -12px 50px #0005}.pngeaPhotoComments[data-comments-expanded="true"],html.pngeaKeyboardOpen .pngeaPhotoComments{padding-top:var(--pn-safe-top)!important}.pngeaPhotoComments #pngeaCommentsHandle{display:flex;flex:none;justify-content:center;align-items:center;height:22px;border:0;background:transparent;touch-action:none}.pngeaPhotoComments #pngeaCommentsHandle span{width:34px;height:4px;background:#666;border-radius:4px}.pngeaPhotoComments .pngeaPostTop{height:44px}.pngeaPhotoComments #pngeaPostBody{display:none}.pngeaPhotoComments .pngeaReplyItem{padding:10px 44px 10px 12px;border:0}.pngeaPhotoComments .pngeaDetailAvatar{width:28px;height:28px;font-size:10px}.pngeaPhotoComments .pngeaDetailWho{gap:8px}.pngeaPhotoComments .pngeaDetailName b{font-size:12px}.pngeaPhotoComments .pngeaDetailName span{font-size:10px}.pngeaPhotoComments .pngeaDetailText{font-size:13px!important;line-height:1.4;margin:4px 0 0 36px!important}.pngeaPhotoComments .pngeaDetailMore{display:none}.pngeaPhotoComments .xPostActions{margin-left:32px;justify-content:flex-start;gap:14px}.pngeaPhotoComments [data-live-action="repost"],.pngeaPhotoComments [data-live-action="share"]{display:none!important}.pngeaPhotoComments [data-live-action="reply"] svg,.pngeaPhotoComments [data-live-action="reply"] .pngeaActionCount{display:none}.pngeaPhotoComments [data-live-action="reply"]::after{content:"Reply";font-size:11px;color:#888}.pngeaPhotoComments [data-live-action="like"]{position:absolute;right:10px;top:30px;font-size:10px}.pngeaPhotoComments [data-live-action="like"] svg{width:17px;height:17px}.pngeaMoreReplies{margin:0 0 8px 48px;padding:6px 0;border:0;background:none;color:#888;font-size:11px}.pngeaCommentChildren{padding-left:28px}.pngeaCommentChildren[hidden]{display:none}.pngeaPhotoComments #pngeaPostReplyInput{font-size:16px}.pngeaPhotoComments #pngeaReplyingTo{font-size:11px}.pngeaPhotoComments #pngeaPostScroll{margin-top:0!important}

/* Reserve real media space before access URLs and image bytes arrive. */
.pngeaMediaSlot{position:relative;width:100%;aspect-ratio:var(--pn-media-ratio,4/5);max-height:min(430px,62svh);overflow:hidden;background:#252525;display:flex;align-items:center;justify-content:center}:is(.liveMediaRail,.pngeaDetailMedia) .pngeaMediaSlot>img,:is(.liveMediaRail,.pngeaDetailMedia) .pngeaMediaSlot>video{display:block;width:100%!important;height:100%!important;max-height:100%!important;object-fit:cover!important;margin:0!important}:is(.liveMediaRail,.pngeaDetailMedia) .pngeaMediaSlot>video{object-fit:contain!important;background:#000}.pngeaMediaSlot.pngeaAudioSlot{aspect-ratio:auto;min-height:70px;background:transparent}[data-live-action] svg{transition:none!important;animation:none!important}

/* One accessible voice-note player for posts, post details and chat media. */
.pngeaVoiceNote{display:flex;align-items:center;gap:9px;width:min(100%,320px);min-width:210px;box-sizing:border-box;padding:10px 12px;border:1px solid #292929;border-radius:22px;background:#131313;color:#eee;overflow:hidden}
.liveMessageMedia.me .pngeaVoiceNote{background:#202020}.pngeaVoiceNote audio{display:none!important}.pngeaVoicePlay{flex:none;display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:50%;padding:0;background:#eee;color:#111;cursor:pointer}.pngeaVoicePlay svg{width:17px;height:17px;fill:currentColor}.pngeaVoicePlay:disabled{opacity:.45}.pngeaVoiceTrack{position:relative;flex:1;min-width:60px;height:38px}.pngeaVoiceBars{display:flex;align-items:center;gap:2px;height:100%;pointer-events:none}.pngeaVoiceBars i{flex:1;min-width:1px;border-radius:3px;background:#555;transition:background-color .1s}.pngeaVoiceBars i.heard{background:#fff}.pngeaVoiceSeek{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer;touch-action:pan-y}.pngeaVoiceTrack:focus-within{outline:1px solid #aaa;outline-offset:3px;border-radius:4px}.pngeaVoiceTime{flex:none;min-width:31px;font-size:10px;line-height:1.5;text-align:right;color:#aaa;font-variant-numeric:tabular-nums}.pngeaVoiceTime span{display:block}.pngeaVoiceNote[data-voice-state="error"]{border-color:#5b3030}.pngeaVoiceStatus{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}

/* Profile controls and connection lists share the real social state. */
.pngeaProfileTools{display:flex;gap:8px;margin-top:10px}.pngeaProfileTools button{width:42px;height:42px;display:grid;place-items:center;border:1px solid #292929;border-radius:50%;background:#080808;color:#eee;padding:10px}.pngeaProfileTools svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.pngeaProfileTools [data-active="true"]{background:#eee;color:#080808}.pngeaProfileActions{display:flex;gap:10px;margin-top:15px}.pngeaProfileActions .profileEdit,.pngeaProfileActions #pngeaProfileMessage{flex:1;min-height:44px;margin:0;border:1px solid #303030;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:750;cursor:pointer}.pngeaProfileActions .profileEdit{background:#eee;color:#080808}.pngeaProfileActions .profileEdit.following{background:#080808;color:#eee}.pngeaProfileActions #pngeaProfileMessage{background:#080808;color:#eee;gap:7px}.pngeaProfileActions #pngeaProfileMessage svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8}.pngeaProfileSocialShade{position:fixed;inset:0;background:#0008;z-index:2147483646;display:none}.pngeaProfileSocialShade.show{display:block}#pngeaProfileSocialSheet{position:absolute;bottom:0;left:0;right:0;border-radius:22px 22px 0 0;background:#101010;border:1px solid #252525;padding:9px 18px calc(18px + env(safe-area-inset-bottom));color:#eee}#pngeaProfileSocialSheet::before{content:"";display:block;width:34px;height:4px;background:#555;border-radius:3px;margin:0 auto 13px}#pngeaProfileSocialSheet h3{text-align:center;margin:0;font-size:17px}#pngeaProfileSocialSheet small{display:block;text-align:center;color:#888;font-size:12px;margin-top:4px;margin-bottom:18px}#pngeaProfileSocialSheet button{display:flex;justify-content:space-between;align-items:center;width:100%;min-height:54px;padding:12px 2px;border:0;background:none;color:#eee;font:600 15px system-ui;text-align:left}#pngeaProfileSocialSheet button i{width:21px;height:21px;border:2px solid #555;border-radius:50%;position:relative}#pngeaProfileSocialSheet button[aria-checked="true"] i::after{content:"";position:absolute;inset:3px;border-radius:50%;background:#3299ec}#pngeaProfileSocialSheet button[aria-checked="true"] i{border-color:#3299ec}#pngeaProfileSocialSheet button[data-danger]{color:#f07878}#pngeaProfileSocialSheet[data-kind="menu"]{left:auto;right:12px;bottom:auto;top:calc(55px + env(safe-area-inset-top));min-width:180px;border-radius:16px;padding:8px 14px}#pngeaProfileSocialSheet[data-kind="menu"]::before{display:none}#pngeaProfileSocialSheet[data-kind="menu"] button{min-height:46px}.pngeaPersonRow [data-connection-follow]{flex:none;min-width:88px;min-height:34px;border-radius:999px;border:1px solid #343434;background:#eee;color:#080808;font-size:12px;font-weight:750;padding:7px 12px}.pngeaPersonRow [data-connection-follow][data-following="true"]{background:transparent;color:#eee}#pngeaClosePeople{overflow-x:auto;overflow-y:hidden;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;scrollbar-width:none}#pngeaClosePeople .pngeaPeopleChip{flex:none;padding:4px 9px 4px 4px;gap:6px;cursor:pointer}#pngeaClosePeople .pngeaPeopleChip .xAvatar{width:24px;height:24px}#pngeaClosePeople .pngeaPeopleChip b{font-size:10px}#Profile .profileCover{background-color:#252525}

#pngeaClosePeople .pngeaPeopleChip{background:#080808;color:#eee;font-family:inherit}
#pngeaProfileActions>.profileEdit,#pngeaProfileActions>#pngeaProfileMessage{flex:1 1 0;min-width:0;padding:8px 12px;box-sizing:border-box}
.profileMeta.pngeaProfileMeta{flex-direction:column;align-items:flex-start;gap:8px;color:#858585;font-size:12px}.pngeaProfileMetaRow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;max-width:100%}.pngeaProfileLocation{display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:5px 9px;border:1px solid #2b2b2b;border-radius:999px;background:#101010;color:#bbb}.pngeaProfileLocation span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pngeaProfileWebsite{display:inline-flex;align-items:center;gap:5px;color:#429ff0;max-width:100%;text-decoration:none}.pngeaProfileWebsite span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pngeaProfileJoined{display:flex;align-items:center;gap:6px}.pngeaProfileMeta svg{width:15px;height:15px;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.pngeaSavedGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px;padding:2px}.pngeaSavedTile{position:relative;aspect-ratio:1;min-width:0;width:100%;border:0;border-radius:0;padding:0;overflow:hidden;background:#242424;color:#eee;cursor:pointer;text-align:left}.pngeaSavedTile img,.pngeaSavedTile video{display:block;pointer-events:none;width:100%;height:100%;object-fit:cover}.pngeaSavedTile video{background:#242424}.pngeaSavedText{position:absolute;inset:0;display:flex;flex-direction:column;gap:7px;justify-content:space-between;padding:10px;background:#131313;font:500 11px/1.4 system-ui}.pngeaSavedText span{overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:6;overflow-wrap:anywhere;white-space:pre-wrap}.pngeaSavedText small{font-size:9px;color:#777;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pngeaSavedVideoBadge{position:absolute;right:7px;top:7px;width:19px;height:19px;display:grid;place-items:center;pointer-events:none;color:#fff;filter:drop-shadow(0 1px 3px #000)}.pngeaSavedVideoBadge svg{width:17px;height:17px;fill:currentColor}.pngeaSavedTile[data-unavailable="true"]::after{position:absolute;inset:0;display:grid;place-items:center;content:"Media unavailable";font:10px system-ui;color:#999;padding:8px}

/* Ticker: prevent encoded garbage from forcing layout. */
.tickerItem>span{white-space:nowrap}

/* Word posts and replies share one composer, counter and native scroll frame. */
#pngeaWordMeta{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:2px 5px 9px;flex:none}#pngeaWordMeta[hidden]{display:none!important}#pngeaWordMeta label{display:flex;align-items:center;gap:8px;font-size:11px;color:#888}#pngeaWordAudience{background:#111;border:1px solid #303030;border-radius:999px;color:#eee;padding:7px 11px;font-size:12px}#pngeaWordCounter{position:relative;flex:none;width:32px;height:32px;color:#fff}#pngeaWordCounter svg{width:32px;height:32px;transform:rotate(-90deg)}#pngeaWordCounter circle{fill:none;stroke:#333;stroke-width:2}#pngeaWordCounter .pngeaWordProgress{stroke:currentColor;stroke-linecap:round}#pngeaWordCounter span{position:absolute;inset:0;display:grid;place-items:center;font-size:10px;font-variant-numeric:tabular-nums}#pngeaWordCounter[data-state=warning]{color:#e4b44b}#pngeaWordCounter[data-state=overflow]{color:#ff606a}
#pngeaWordField{position:relative;flex:0 0 auto;min-width:0;width:100%}#pngeaWordOverflow{display:none;position:absolute;inset:0;overflow:hidden;white-space:pre-wrap;overflow-wrap:break-word;pointer-events:none;color:#f2f2f2}#pngeaWordField.pngeaHasOverflow #pngeaWordOverflow{display:block}#pngeaWordField.pngeaHasOverflow #postText{color:transparent!important;-webkit-text-fill-color:transparent!important;caret-color:#fff}#pngeaWordOverflow mark{color:#fff;background:#8b3038;border-radius:2px}#composerLayer[data-post-kind=longform] #attachPreview{display:none!important}
#pngeaWordReplyPreview[hidden],#pngeaWordReplyIdentity[hidden]{display:none!important}#pngeaWordReplyPreview{flex:none;margin-bottom:24px}.pngeaWordReplyOriginal{display:flex;align-items:flex-start;gap:11px;position:relative;min-height:62px}.pngeaWordReplyOriginal::after{content:"";position:absolute;left:19px;top:44px;bottom:-27px;border-left:2px solid #303030}.pngeaWordReplyOriginal .xAvatar,#pngeaWordReplyIdentity .xAvatar{width:38px;height:38px;flex:none}.pngeaWordReplyOriginalCopy{flex:1;min-width:0}.pngeaWordReplyOriginalCopy b{font-size:14px}.pngeaWordReplyOriginalCopy small{display:block;font-size:11px;color:#888;margin:2px 0 7px}.pngeaWordReplyOriginalCopy p{font-size:15px;line-height:1.4;margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.pngeaWordReplyThumb{flex:none;width:76px!important;height:76px!important;object-fit:cover;border-radius:12px;background:#242424}#pngeaWordReplyIdentity{display:flex;align-items:center;gap:11px;flex:none;min-height:40px;margin-bottom:0}#pngeaWordReplyingTo{color:#888;font-size:12px}.pngeaReplyPreviewLoading{font-size:13px;color:#888;padding:16px 0}
#composerLayer.pngeaWordReply{inset:auto auto auto 50%!important;transform:translateX(-50%);width:min(430px,100vw)!important;top:var(--pn-thread-top,0px)!important;height:var(--pn-thread-height,100dvh)!important;min-height:0!important;overflow:hidden!important;padding-bottom:0!important;box-sizing:border-box;overscroll-behavior:none}#composerLayer.pngeaWordReply .canvas{min-height:0;overflow:auto;touch-action:pan-y;overscroll-behavior:none;overflow-anchor:none}#composerLayer.pngeaWordReply #pngeaWordField,#composerLayer.pngeaWordReply #attachPreview{margin-left:49px;width:calc(100% - 49px)!important}#composerLayer.pngeaWordReply [data-attach=longform]{display:none!important}#composerLayer.pngeaWordReply .capture{flex:none}

/* Explicit draft decisions and one caption editor. */
#pngeaDraftsBtn.hasDrafts{color:#fff;background:#262626;border-radius:999px;height:32px;top:14px}#pngeaDraftsBtn:not(.hasDrafts){opacity:.6}
#pngeaDraftExit{display:none;position:fixed;inset:0;z-index:2147483647;background:#0009;align-items:flex-end;justify-content:center;padding:12px 12px calc(12px + env(safe-area-inset-bottom));box-sizing:border-box}#pngeaDraftExit.show{display:flex}#pngeaDraftExit>div{width:min(100%,430px);background:#171717;border:1px solid #333;border-radius:20px;overflow:hidden;text-align:center}#pngeaDraftExit b{display:block;padding:18px 15px 0;font-size:17px}#pngeaDraftExit p{font-size:12px;color:#999;margin:9px 15px 18px}#pngeaDraftExit button{display:block;width:100%;height:52px;border:0;border-top:1px solid #303030;background:none;color:#eee;font-size:15px;font-weight:700}#pngeaDraftExit [data-draft-exit=discard]{color:#ff7378}#pngeaDraftExit [data-draft-exit=cancel]{color:#aaa}
#pngeaCaptionEditor{display:none;position:fixed;inset:0 0 auto;height:var(--pn-visible-bottom,100dvh);box-sizing:border-box;z-index:2147483647;background:#050505;flex-direction:column;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);overflow:hidden;overscroll-behavior:none}#pngeaCaptionEditor.show{display:flex}#pngeaCaptionText{flex:1;min-height:0;resize:none;border:0;outline:0;background:#050505;color:#eee;padding:20px;font-size:16px;line-height:1.5;font-family:inherit}#pngeaCaptionSave:disabled{opacity:.45}

/* Chat features: compact shares, request gates and incoming typing state. */
#dmThread .pngeaSharedPreview{display:flex;flex-direction:column;gap:9px;width:228px;max-width:100%;padding:0;border:0;background:transparent;color:inherit;text-align:left;text-decoration:none;font:inherit;overflow:hidden}.pngeaSharedPreviewHead{display:flex;gap:8px;align-items:center;min-height:30px}.pngeaSharedPreviewHead b{display:block;font-size:13px}.pngeaSharedPreviewHead small{display:block;font-size:11px;opacity:.65}.pngeaSharedPreviewAvatar{width:30px;height:30px;flex:none;border-radius:50%;overflow:hidden;background:#555;color:#fff;display:grid;place-items:center}.pngeaSharedPreviewAvatar img{width:100%;height:100%;object-fit:cover}.pngeaSharedPreviewMedia{display:block;width:100%;height:148px;background:#4446;border-radius:12px;overflow:hidden}.pngeaSharedPreviewMedia img,.pngeaSharedPreviewMedia video{display:block;width:100%!important;height:100%!important;object-fit:cover;pointer-events:none}.pngeaSharedPreviewCopy{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;font-size:13px;line-height:1.35}.pngeaSharedMessageCopy{margin-bottom:8px}.pngeaSharedUnavailable{font-size:13px;opacity:.7}
#pngeaDmRequestGate{flex:none;padding:16px 18px 18px;border-top:1px solid #252525;background:#080808;font-size:13px;text-align:center;line-height:1.45}#pngeaDmRequestGate[hidden],#dmThread>.dmCompose[hidden],#dmThread>#pngeaDmAttachments[hidden]{display:none!important}#pngeaDmRequestGate p{margin:0 0 12px;color:#aaa}#pngeaDmRequestGate .pngeaRequestWaiting{margin:4px 0;color:#777;font-size:12px}#pngeaDmRequestGate .pngeaRequestActions{display:flex;justify-content:center;gap:10px}#pngeaDmRequestGate button{min-width:105px;border:1px solid #333;border-radius:20px;background:#eee;color:#111;font:600 13px system-ui;padding:10px 16px}#pngeaDmRequestGate button[data-dm-request="close"],#pngeaDmRequestGate button[data-dm-request="decline"]{background:#171717;color:#ccc}
#pngeaDmTyping{display:flex;align-items:center;gap:4px;width:58px;min-height:34px;margin:8px 0;padding:10px 13px;background:#161616;border:1px solid #282828;border-radius:19px;flex:none}#pngeaDmTyping span{width:5px;height:5px;border-radius:50%;background:#999;animation:pngeaTyping 1.1s ease-in-out infinite}#pngeaDmTyping span:nth-child(2){animation-delay:.14s}#pngeaDmTyping span:nth-child(3){animation-delay:.28s}@keyframes pngeaTyping{0%,60%,100%{opacity:.4;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}@media(prefers-reduced-motion:reduce){#pngeaDmTyping span{animation:none}}

/* Floating conversations reuse the one canonical DM frame and outbox. */
#pngeaChatHeads{position:fixed;inset:0;pointer-events:none;z-index:2147483001}.pngeaChatHead{position:absolute;width:52px;height:52px;border:2px solid #444;border-radius:50%;padding:0;background:#151515;color:#eee;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;box-shadow:0 5px 20px #0009;cursor:pointer}.pngeaChatHeadAvatar{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;overflow:hidden;font:700 15px system-ui}.pngeaChatHeadAvatar img{display:block;width:100%;height:100%;object-fit:cover}.pngeaChatHeadUnread{position:absolute;top:-5px;right:-5px;min-width:19px;height:19px;padding:0 4px;border:2px solid #050505;border-radius:20px;background:#eee;color:#111;font:700 10px/15px system-ui}.pngeaChatHeadUnread[hidden]{display:none}.pngeaChatHead[data-open="true"]{border-color:#eee}
#dmThread.pngeaMiniChat{left:auto!important;right:12px!important;transform:none!important;width:min(360px,calc(100vw - 24px))!important;padding-top:0!important;border:1px solid #333;border-radius:18px;box-shadow:0 12px 45px #000b;z-index:2147483000!important}#dmThread.pngeaMiniChat>.xTop{height:54px!important;min-height:54px!important;padding:8px 10px!important;gap:8px}#dmThread.pngeaMiniChat #dmBack,#dmThread.pngeaMiniChat>.xTop>.xAction{display:none}#dmThread.pngeaMiniChat>.xTop>.xAvatar{width:30px;height:30px;flex:none}#dmThread.pngeaMiniChat .xTopTitle{min-width:0;flex:1}#dmThread.pngeaMiniChat #dmTitle{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}#dmThread.pngeaMiniChat #dmHandle{font-size:10px}.pngeaMiniControls{display:none;align-items:center;gap:2px}#dmThread.pngeaMiniChat .pngeaMiniControls{display:flex}.pngeaMiniControls button{width:27px;height:30px;padding:0;border:0;background:transparent;color:#ccc;font-size:20px}#dmThread.pngeaMiniChat .dmCompose{grid-template-columns:30px minmax(0,1fr) 30px 30px!important;gap:5px!important;padding:8px!important}#dmThread.pngeaMiniChat .dmCompose button{width:30px!important;height:32px!important}#dmThread.pngeaMiniChat #dmMessages{padding:10px 4px!important}
#Inbox [data-live-conversation],#dmMessages [data-message-id],#dmMessages [data-message-id] img{user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}

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

  // Authentication and recovery are owned by the shared API boundary and live
  // session controller in index.html, including Safari resume and write retries.
  function ensureSession(force=false){return liveAPI()?.resume?.({validate:force})||Promise.resolve()}

  // Normalize read order once at the API boundary. This prevents reaction refreshes
  // and overlapping requests from making posts visually jump around.
  ['feed','myPosts','userPosts'].forEach(name=>{
    const fn=api?.[name];if(typeof fn!=='function'||fn.__pngea513)return;
    const original=fn.bind(api);
    const wrapped=async(...args)=>{const d=await original(...args);if(d?.items){d.items=stablePosts(d.items);d.items.forEach(ingestPostState)}return d};
    wrapped.__pngea513=true;api[name]=wrapped;
  });
  if(typeof api?.post==='function'&&!api.post.__pngea513){
    const originalPost=api.post.bind(api);
    const wrappedPost=async(...args)=>{const p=await originalPost(...args);rememberPost(p);ingestPostState(p);if(p?.id)postMediaById?.set?.(String(p.id),p.media||[]);return p};
    wrappedPost.__pngea513=true;api.post=wrappedPost;
  }
  if(api?.request&&!api.postReplies){
    api.postReplies=async(id,params={})=>api.request(`/v1/posts/${encodeURIComponent(id)}/replies?${new URLSearchParams(params)}`);
  }

  if(api?.request){
    api.updateMediaEdit ||= (id,body)=>api.request(`/v1/media/${encodeURIComponent(id)}/edit`,{method:'PATCH',body:JSON.stringify(body||{})});
    api.history ||= (params={})=>api.request(`/v1/me/history?${new URLSearchParams(params)}`);
    api.logHistory ||= body=>api.request('/v1/me/history',{method:'POST',body:JSON.stringify(body||{})});
    api.clearHistory ||= ()=>api.request('/v1/me/history',{method:'DELETE'});
    api.unreadCounts ||= ()=>api.request('/v1/me/unread-counts');
  }


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
  const FILE_MIMES={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif',webp:'image/webp',heic:'image/heic',heif:'image/heif',avif:'image/avif',mp4:'video/mp4',m4v:'video/x-m4v',mov:'video/quicktime',webm:'video/webm',ogv:'video/ogg',mp3:'audio/mpeg',m4a:'audio/mp4',aac:'audio/aac',wav:'audio/wav',ogg:'audio/ogg',oga:'audio/ogg',flac:'audio/flac'};
  function validateFiles(files){
    const out=[];
    for(const raw of files){
      const inferred=(!raw.type||raw.type==='application/octet-stream')?FILE_MIMES[String(raw.name||'').split('.').pop().toLowerCase()]:null;
      const f=inferred?new File([raw],raw.name,{type:inferred,lastModified:raw.lastModified}):raw;
      if(!/^(image|video|audio)\//.test(f.type||'')){ui?.toast?.('Choose a photo, video, or voice recording');continue}
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
    const metadata=await inspectUploadFile(file);
    const slot=await api.createMediaUpload({mimeType:file.type||'application/octet-stream',byteSize:file.size,fileName:file.name||'media'});
    await xhrPut(slot.uploadUrl,slot.headers,file,onProgress);
    await api.completeMedia(slot.mediaId,metadata);
    const edit=mediaEdits.get(file);
    if(edit&&api.updateMediaEdit) await api.updateMediaEdit(slot.mediaId,edit).catch(()=>{});
    // Don't block a video post forever while the media worker transcodes it.
    const until=Date.now()+2200;
    while(Date.now()<until){
      try{
        const m=await api.media(slot.mediaId);
        if(m.status==='ready')return slot.mediaId;
        if(m.status==='failed'||m.status==='blocked')throw new Error('Media processing failed');
      }catch(err){if(/failed|blocked/i.test(String(err?.message)))throw err}
      await sleep(250);
    }
    return slot.mediaId;
  }
  const uploadMetadata=new WeakMap();
  async function inspectUploadFile(file){
    if(uploadMetadata.has(file))return uploadMetadata.get(file);
    const pending=(async()=>{
      if(file.type.startsWith('image/')){try{const image=await createImageBitmap(file),result={width:image.width,height:image.height};image.close?.();return result}catch{return {}}}
      if(!/^(video|audio)\//.test(file.type))return {};
      return new Promise(resolve=>{const media=document.createElement(file.type.startsWith('video/')?'video':'audio'),url=URL.createObjectURL(file);let finished=false;
        const done=()=>{if(finished)return;finished=true;clearTimeout(timer);const metadata={};if(media.videoWidth&&media.videoHeight){metadata.width=media.videoWidth;metadata.height=media.videoHeight}if(Number.isFinite(media.duration)&&media.duration>0)metadata.durationMs=Math.round(media.duration*1000);media.removeAttribute('src');media.load();URL.revokeObjectURL(url);resolve(metadata)};
        const timer=setTimeout(done,5000);media.preload='metadata';media.onloadedmetadata=media.onerror=done;media.src=url;
      });
    })();uploadMetadata.set(file,pending);return pending;
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
      await sleep(300);
    }
    throw new Error('Video is still processing');
  }
  function mediaNotReadyError(err){
    return /media|processing|ready|pending|transcod/i.test(String(err?.message||'')) && [400,409,422].includes(Number(err?.status||0));
  }

  /* ---------- Composer + drafts ---------- */
  const composer=$('#composerLayer'), postText=$('#postText'), send=$('#send'), attachPreview=$('#attachPreview');
  let postFiles=[], dmFiles=[], previewURLs=[], currentDraftId=null, posting=false,composerKind='text'; const mediaEdits=new WeakMap();
  if(composer?.parentElement!==document.body)document.body.appendChild(composer);
  let wordReplyParentId=null,wordReplySequence=0,wordReplyCovered=[];
  const wordReplyPreview=document.createElement('section');wordReplyPreview.id='pngeaWordReplyPreview';wordReplyPreview.hidden=true;composer?.querySelector('.canvas')?.prepend(wordReplyPreview);
  const wordReplyIdentity=document.createElement('div');wordReplyIdentity.id='pngeaWordReplyIdentity';wordReplyIdentity.hidden=true;composer?.querySelector('.canvas')?.insertBefore(wordReplyIdentity,postText);
  function closeWordReplyContext(){wordReplySequence++;wordReplyParentId=null;composer.classList.remove('pngeaWordReply');wordReplyPreview.hidden=true;wordReplyIdentity.hidden=true;for(const [element,visibility,inert] of wordReplyCovered){element.style.visibility=visibility;element.inert=inert}wordReplyCovered=[];queueKeyboard()}
  async function showWordReplyContext(id){
    const sequence=++wordReplySequence;wordReplyParentId=String(id);postText.placeholder='Post your reply';composer.classList.add('pngeaWordReply');wordReplyPreview.hidden=false;wordReplyIdentity.hidden=false;wordReplyPreview.innerHTML='<div class="pngeaReplyPreviewLoading">Loading original post…</div>';
    if(!wordReplyCovered.length)for(const element of [$('#pngeaPostPage'),$('#dmThread')])if(element?.classList.contains('show')){wordReplyCovered.push([element,element.style.visibility,element.inert]);element.style.visibility='hidden';element.inert=true}
    const me=liveAPI()?.state?.me||{};wordReplyIdentity.innerHTML=`<div class="xAvatar selfAvatarFallback" data-profile="${escapeHTML(me.handle||'')}">${postInitials(me)}</div><div id="pngeaWordReplyingTo">Replying to the original post</div>`;applyKnownAvatars(wordReplyIdentity).catch(()=>{});
    try{const parent=await api.post(id);if(sequence!==wordReplySequence)return;wordReplyPreview.innerHTML=`<div class="pngeaWordReplyOriginal"><div class="xAvatar" data-profile="${escapeHTML(parent.handle)}">${postInitials(parent)}</div><div class="pngeaWordReplyOriginalCopy"><b>${escapeHTML(parent.display_name||parent.handle)}</b><small>@${escapeHTML(parent.handle)}</small><p>${mentionHTML(parent.text||parent.title||'')}</p></div></div>`;$('#pngeaWordReplyingTo').innerHTML=`Replying to <button type="button" class="pngeaMention" data-profile="${escapeHTML(parent.handle)}">@${escapeHTML(parent.handle)}</button>`;applyKnownAvatars(wordReplyPreview).catch(()=>{});const media=(parent.media||[]).find(item=>String(item.mimeType||item.mime_type||'').startsWith('image/'));if(media){const image=await mediaElement(media);if(sequence!==wordReplySequence)return;image.classList.add('pngeaWordReplyThumb');wordReplyPreview.querySelector('.pngeaWordReplyOriginal').appendChild(image)}}catch(error){if(sequence===wordReplySequence)wordReplyPreview.innerHTML='<div class="pngeaReplyPreviewLoading">Original post unavailable</div>'}queueKeyboard();
  }
  function openWordReply(id,{text='',files=[]}={}){clearComposer();setComposerKind('text');postText.value=text;postFiles=[...files];if(liveAPI()?.state)liveAPI().state.replyToId=id;showWordReplyContext(id);renderComposerMedia();composer.classList.add('show');ROOT.classList.add('pngeaComposerOpen');syncSend();postText.focus();queueKeyboard()}

  const uploadProgress=document.createElement('div');
  uploadProgress.id='pngeaUploadProgress';uploadProgress.innerHTML='<i></i>';
  composer?.querySelector('.canvas')?.prepend(uploadProgress);

  const mediaGrid=document.createElement('div');mediaGrid.id='pngeaComposerMediaGrid';
  attachPreview?.appendChild(mediaGrid);

  const galleryInput=document.createElement('input');
  galleryInput.id='pngeaGalleryInput';galleryInput.type='file';galleryInput.multiple=true;galleryInput.hidden=true;galleryInput.accept='image/*,video/*';
  document.body.appendChild(galleryInput);

  const draftsBtn=document.createElement('button');draftsBtn.id='pngeaDraftsBtn';draftsBtn.type='button';draftsBtn.textContent='Drafts';
  composer?.querySelector('.composerTop')?.appendChild(draftsBtn);

  const captureRow=composer?.querySelector('.captureRow');
  if(captureRow){
    const caps=[...captureRow.querySelectorAll('.cap')];
    if(caps[0]){caps[0].dataset.attach='gallery';caps[0].innerHTML=`<b>${ICONS.gallery}</b><span>Gallery</span>`}
    if(caps[1]){caps[1].dataset.attach='camera';caps[1].innerHTML=`<b>${ICONS.camera}</b><span>Camera</span>`}
    if(caps[2]){caps[2].dataset.attach='voice';caps[2].innerHTML=`<b>${ICONS.mic}</b><span>Voice</span>`}
    const long=document.createElement('div');long.className='cap';long.dataset.attach='longform';long.innerHTML=`<b>${ICONS.longform}</b><span>Long form</span>`;caps.slice(3).forEach(x=>x.remove());captureRow.appendChild(long);
  }

  composer?.querySelector('.captureHint')?.remove();
  const longTitle=document.createElement('input');longTitle.id='pngeaLongTitleInput';longTitle.placeholder='Title';longTitle.maxLength=300;longTitle.hidden=true;composer?.querySelector('.canvas')?.insertBefore(longTitle,postText);
  postText?.removeAttribute('maxlength');
  const wordField=document.createElement('div');wordField.id='pngeaWordField';postText.before(wordField);wordField.appendChild(postText);const wordOverflow=document.createElement('div');wordOverflow.id='pngeaWordOverflow';wordOverflow.setAttribute('aria-hidden','true');wordField.appendChild(wordOverflow);
  const wordMeta=document.createElement('div');wordMeta.id='pngeaWordMeta';wordMeta.innerHTML=`<label>Share with<select id="pngeaWordAudience" aria-label="Post audience"><option value="public">Everyone</option><option value="followers">Followers only</option></select></label><div id="pngeaWordCounter" role="progressbar" aria-label="Characters remaining" aria-valuemin="0" aria-valuemax="280"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13"/><circle class="pngeaWordProgress" cx="16" cy="16" r="13"/></svg><span></span></div>`;captureRow?.before(wordMeta);
  function wordLength(value){return Array.from(String(value||'')).length}
  function wordTooLong(){return composerKind==='text'&&wordLength(postText.value)>280}
  function paintWordLimit(){const limited=composerKind==='text',characters=Array.from(postText.value),remaining=280-characters.length,counter=$('#pngeaWordCounter');wordMeta.hidden=!limited;counter.dataset.state=remaining<=0?'overflow':remaining<=20?'warning':'normal';counter.setAttribute('aria-valuenow',String(Math.min(280,characters.length)));counter.setAttribute('aria-label',`${remaining} characters remaining`);counter.querySelector('span').textContent=limited&&remaining<=20?String(remaining):'';const length=2*Math.PI*13;counter.querySelector('.pngeaWordProgress').style.strokeDasharray=`${Math.min(1,characters.length/280)*length} ${length}`;wordField.classList.toggle('pngeaHasOverflow',limited&&remaining<0);wordOverflow.innerHTML=limited&&remaining<0?escapeHTML(characters.slice(0,280).join(''))+`<mark>${escapeHTML(characters.slice(280).join(''))}</mark>`:'';if(limited&&remaining<0){const computed=getComputedStyle(postText);for(const property of ['font','letterSpacing','lineHeight','padding','boxSizing','textAlign'])wordOverflow.style[property]=computed[property];wordOverflow.scrollTop=postText.scrollTop;wordOverflow.scrollLeft=postText.scrollLeft}}
  postText.addEventListener('scroll',()=>{wordOverflow.scrollTop=postText.scrollTop;wordOverflow.scrollLeft=postText.scrollLeft});
  let photoReviewOpen=false,photoSelectionOpen=false;const photoCropPlans=new WeakMap();
  const photoReview=document.createElement('section');photoReview.id='pngeaPhotoReview';photoReview.hidden=true;photoReview.innerHTML=`<div class="pngeaPhotoReviewTop"><div id="pngeaPhotoCaptionHost"></div><div id="pngeaPhotoReviewThumbs"></div></div><label class="pngeaPhotoAudience">Share with<select id="pngeaPhotoAudience"><option value="public">Everyone</option><option value="followers">Followers only</option></select></label><small>Tap a photo to crop or resize it.</small>`;composer?.querySelector('.canvas')?.appendChild(photoReview);
  function setPhotoReview(open){photoReviewOpen=!!open;photoReview.hidden=!open;composer.dataset.photoStep=open?'review':photoSelectionOpen?'select':'base';if(open){$('#pngeaPhotoCaptionHost').appendChild(wordField);renderPhotoReview()}else if(wordField.parentElement!==composer.querySelector('.canvas'))composer.querySelector('.canvas').insertBefore(wordField,attachPreview);$('#closeComposer').textContent=open||photoSelectionOpen||composerKind==='longform'?'Back':'Cancel';syncSend()}
  function renderPhotoReview(){const host=$('#pngeaPhotoReviewThumbs');host.innerHTML='';postFiles.forEach((file,index)=>{if(!/^(image|video)\//.test(file.type))return;const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',`Crop media ${index+1}`);const media=document.createElement(file.type.startsWith('video/')?'video':'img'),url=URL.createObjectURL(file);previewURLs.push(url);media.src=url;if(media.tagName==='VIDEO'){media.muted=true;media.playsInline=true}button.appendChild(media);button.onclick=()=>openMediaEditor(index);host.appendChild(button)})}
  function setComposerKind(kind){composerKind=kind;photoSelectionOpen=kind==='gallery';setPhotoReview(false);composer.dataset.postKind=kind;longTitle.hidden=kind!=='longform';postText.placeholder=wordReplyParentId?'Post your reply':kind==='gallery'?'Write a caption…':'Put something out there…';if(kind==='longform'){renderComposerMedia();longTitle.focus()}$('#closeComposer').textContent=photoReviewOpen||photoSelectionOpen||kind==='longform'?'Back':'Cancel';syncSend()}
  $('#pngeaWordAudience').onchange=event=>$('#pngeaPhotoAudience').value=event.target.value;$('#pngeaPhotoAudience').onchange=event=>$('#pngeaWordAudience').value=event.target.value;
  window.addEventListener('click',e=>{if(!e.target.closest?.('#closeComposer'))return;e.preventDefault();e.stopImmediatePropagation();if(photoReviewOpen){setPhotoReview(false);return}if(photoSelectionOpen){photoSelectionOpen=false;setPhotoReview(false);return}if(composerKind==='longform'){setComposerKind('text');return}requestComposerClose()},true);
  const cameraInput=document.createElement('input');
  cameraInput.id='pngeaCameraInput';cameraInput.type='file';cameraInput.hidden=true;cameraInput.accept='image/*,video/*';cameraInput.setAttribute('capture','environment');
  document.body.appendChild(cameraInput);
  cameraInput.onchange=()=>{postFiles=validateFiles([...postFiles,...cameraInput.files]);cameraInput.value='';renderComposerMedia()};

  const voiceRecorder=document.createElement('section');voiceRecorder.id='pngeaVoiceRecorder';
  voiceRecorder.innerHTML=`<div id="pngeaVoiceTimer">0:00</div><div id="pngeaVoiceStatus">Voice post · 60 seconds max</div><audio id="pngeaVoicePreview" controls hidden></audio><div id="pngeaVoiceControls"><button id="pngeaVoiceCancel">Cancel</button><button class="primary" id="pngeaVoiceStop">Stop</button><button class="primary" id="pngeaVoiceUse" hidden>Use recording</button></div>`;
  document.body.appendChild(voiceRecorder);
  let voiceStream=null,voiceMediaRecorder=null,voiceChunks=[],voiceTimerId=0,voiceStarted=0,voiceFile=null,voiceTarget='post';
  function voiceMime(){
    const types=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];
    return types.find(t=>window.MediaRecorder?.isTypeSupported?.(t))||'';
  }
  function voiceExt(mime){return mime.includes('mp4')?'m4a':mime.includes('ogg')?'ogg':'webm'}
  function cleanupVoiceStream(){
    clearInterval(voiceTimerId);voiceTimerId=0;
    voiceStream?.getTracks?.().forEach(t=>t.stop());voiceStream=null;voiceMediaRecorder=null;
  }
  function closeVoiceRecorder(){
    cleanupVoiceStream();voiceRecorder.classList.remove('show');voiceFile=null;voiceChunks=[];
    const p=$('#pngeaVoicePreview');if(p){p.pause();p.removeAttribute('src');p.hidden=true}
  }
  async function startVoiceRecorder(target='post'){
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){ui?.toast?.('Voice recording is not available on this browser');return}
    voiceTarget=target;voiceFile=null;voiceChunks=[];
    voiceRecorder.classList.add('show');
    $('#pngeaVoiceUse').hidden=true;$('#pngeaVoiceStop').hidden=false;$('#pngeaVoiceTimer').textContent='0:00';$('#pngeaVoiceStatus').textContent='Recording… 60 seconds max';
    try{
      voiceStream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mime=voiceMime(),opts=mime?{mimeType:mime}:undefined;
      voiceMediaRecorder=new MediaRecorder(voiceStream,opts);
      voiceMediaRecorder.ondataavailable=e=>{if(e.data?.size)voiceChunks.push(e.data)};
      voiceMediaRecorder.onstop=()=>{
        const actual=voiceMediaRecorder?.mimeType||mime||'audio/webm';
        const blob=new Blob(voiceChunks,{type:actual});
        voiceFile=new File([blob],`voice-${Date.now()}.${voiceExt(actual)}`,{type:actual,lastModified:Date.now()});
        cleanupVoiceStream();
        const url=URL.createObjectURL(voiceFile);previewURLs.push(url);
        const p=$('#pngeaVoicePreview');p.src=url;p.hidden=false;
        $('#pngeaVoiceStatus').textContent='Preview your recording';$('#pngeaVoiceStop').hidden=true;$('#pngeaVoiceUse').hidden=false;
      };
      voiceMediaRecorder.start(250);voiceStarted=Date.now();
      voiceTimerId=setInterval(()=>{
        const sec=Math.min(60,Math.floor((Date.now()-voiceStarted)/1000));$('#pngeaVoiceTimer').textContent=fmtDuration(sec);
        if(sec>=60&&voiceMediaRecorder?.state==='recording')voiceMediaRecorder.stop();
      },200);
    }catch(err){closeVoiceRecorder();ui?.toast?.('Microphone permission is required')}
  }
  $('#pngeaVoiceCancel').onclick=()=>{try{if(voiceMediaRecorder?.state==='recording')voiceMediaRecorder.stop()}catch{}closeVoiceRecorder()};
  $('#pngeaVoiceStop').onclick=()=>{if(voiceMediaRecorder?.state==='recording')voiceMediaRecorder.stop()};
  $('#pngeaVoiceUse').onclick=()=>{
    if(!voiceFile)return;
    if(voiceTarget==='detailReply'){detailReplyFiles=validateFiles([...detailReplyFiles,voiceFile]);renderDetailAttachments()}
    else if(voiceTarget==='dm'){dmFiles=validateFiles([...dmFiles,voiceFile]).slice(0,4);renderDmAttachments?.()}
    else{postFiles=validateFiles([...postFiles,voiceFile]);renderComposerMedia()}
    cleanupVoiceStream();voiceRecorder.classList.remove('show');voiceFile=null;
  };

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
      const type=String(file.type||'');
      const isVideo=type.startsWith('video/'),isAudio=type.startsWith('audio/');
      const media=document.createElement(isAudio?'audio':isVideo?'video':'img');media.src=url;
      if(isAudio){media.controls=true;media.preload='metadata';card.classList.add('voice')}
      else if(isVideo){media.controls=true;media.playsInline=true;media.preload='metadata'}
      else media.alt='Selected photo';
      if(!isAudio){
        const edit=document.createElement('button');edit.className='pngeaMediaEdit';edit.type='button';edit.textContent='Edit';
        edit.onclick=e=>{e.preventDefault();e.stopPropagation();openMediaEditor(index)};
        card.appendChild(edit);
      }
      const remove=document.createElement('button');remove.className='pngeaMediaRemove';remove.type='button';remove.textContent='×';
      remove.onclick=e=>{e.preventDefault();e.stopPropagation();postFiles.splice(index,1);renderComposerMedia();syncSend()};
      card.append(media,remove);
      if(isVideo||isAudio){
        const badge=document.createElement('span');badge.className='pngeaMediaBadge';badge.textContent=isAudio?'VOICE':'VIDEO';
        media.addEventListener('loadedmetadata',()=>badge.textContent=fmtDuration(media.duration)||(isAudio?'VOICE':'VIDEO'),{once:true});
        card.appendChild(badge);
      }
      mediaGrid.appendChild(card);
    });
    if(photoReviewOpen)renderPhotoReview();syncSend();
  }
  function syncSend(){if(!send)return;paintWordLimit();send.disabled=posting||wordTooLong()||(!String(postText?.value||'').trim()&&(!postFiles.length||composerKind==='longform'));const next=composerKind==='gallery'&&postFiles.length&&!photoReviewOpen;send.textContent=next?'Next':photoReviewOpen||wordReplyParentId?'Post':'↑';send.dataset.photoButton=next||photoReviewOpen||!!wordReplyParentId?'true':'false';send.setAttribute('aria-label',next?'Next':wordReplyParentId?'Publish reply':'Publish post');$('#detected').textContent=wordReplyParentId?'Reply':'New posts'}
  postText?.addEventListener('input',syncSend);
  galleryInput.onchange=()=>{if(!galleryInput.files.length)return;postFiles=validateFiles([...postFiles,...galleryInput.files]);galleryInput.value='';renderComposerMedia();composer?.classList.add('show');ROOT.classList.add('pngeaComposerOpen')};

  // Main post toolbar: Gallery / Camera / Voice.
  window.addEventListener('click',e=>{
    const cap=e.target.closest?.('.cap[data-attach]');
    if(!cap||!composer?.contains(cap))return;
    const kind=cap.dataset.attach;
    if(!['gallery','camera','voice','longform'].includes(kind))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(kind==='longform'){setComposerKind('longform');return}
    if(kind==='gallery'){if(!wordReplyParentId&&(!postText.value.trim()||composerKind==='gallery'))setComposerKind('gallery');galleryInput.accept='image/*,video/*';galleryInput.click()}
    else if(kind==='camera'){if(!wordReplyParentId&&(!postText.value.trim()||composerKind==='gallery'))setComposerKind('gallery');cameraInput.click()}
    else startVoiceRecorder('post');
  },true);

  /* media editor — actual image crop + non-destructive video trim/crop */
  const editor=document.createElement('section');editor.id='pngeaMediaEditor';
  editor.innerHTML=`<div class="pngeaPageTop"><button id="pngeaMediaEditorCancel">Cancel</button><b>Edit media</b><button id="pngeaMediaEditorDone">Done</button></div><div id="pngeaMediaEditorBody"></div><div id="pngeaMediaEditorTools"></div>`;
  document.body.appendChild(editor);
  let editingIndex=-1,pendingEditedFile=null,editorState=null,externalCrop=null;
  function aspectNumber(a){if(a==='1:1')return 1;if(a==='3:1')return 3;if(a==='4:5')return 4/5;if(a==='16:9')return 16/9;return null}
  function cropRectangle(width,height,state){const ratio=aspectNumber(state.aspect)||width/height,zoom=Math.max(1,Number(state.zoom||1));let sw=width/zoom,sh=height/zoom;if(sw/sh>ratio)sw=sh*ratio;else sh=sw/ratio;const x=Math.max(-1,Math.min(1,Number(state.panX||0))),y=Math.max(-1,Math.min(1,Number(state.panY||0)));return {sw,sh,sx:(width-sw)/2*(1+x),sy:(height-sh)/2*(1+y)}}
  async function cropImageFile(file,state){
    const bmp=await createImageBitmap(file),rot=((state.rotation||0)%360+360)%360,rotated=rot===90||rot===270;
    const tmp=document.createElement('canvas');tmp.width=rotated?bmp.height:bmp.width;tmp.height=rotated?bmp.width:bmp.height;
    const ctx=tmp.getContext('2d');ctx.translate(tmp.width/2,tmp.height/2);ctx.rotate(rot*Math.PI/180);ctx.drawImage(bmp,-bmp.width/2,-bmp.height/2);
    const {sw,sh,sx,sy}=cropRectangle(tmp.width,tmp.height,state),out=document.createElement('canvas'),ratio=aspectNumber(state.aspect);if(ratio){const [rw,rh]=state.aspect.split(':').map(Number),scale=Math.max(1,Math.floor(Math.min(sw/rw,sh/rh)));out.width=rw*scale;out.height=rh*scale}else{out.width=Math.max(1,Math.round(sw));out.height=Math.max(1,Math.round(sh))}
    out.getContext('2d').drawImage(tmp,sx,sy,sw,sh,0,0,out.width,out.height);
    const type=file.type==='image/png'?'image/png':'image/jpeg',blob=await new Promise(r=>out.toBlob(r,type,.92));
    return new File([blob],file.name||`photo-${Date.now()}.${type==='image/png'?'png':'jpg'}`,{type:blob.type,lastModified:Date.now()});
  }
  function editorAspectButtons(state,refresh){
    const row=document.createElement('div');row.className='pngeaEditToolRow';
    if(externalCrop)return row;
    (composerKind==='gallery'?['1:1','4:5','16:9']:['original','1:1','4:5','16:9']).forEach(a=>{const b=document.createElement('button');b.type='button';b.textContent=a==='original'?'Original':a;b.classList.toggle('selected',state.aspect===a);b.onclick=()=>{state.aspect=a;refresh();[...row.children].forEach(x=>x.classList.toggle('selected',x===b))};row.appendChild(b)});return row;
  }
  function openMediaEditor(index){
    const file=externalCrop?.file||postFiles[index];if(!file)return;editingIndex=index;pendingEditedFile=null;
    const body=$('#pngeaMediaEditorBody'),tools=$('#pngeaMediaEditorTools');body.innerHTML='';tools.innerHTML='';
    const url=URL.createObjectURL(file);previewURLs.push(url);const isImage=(file.type||'').startsWith('image/'),isVideo=(file.type||'').startsWith('video/');
    editorState=isVideo?{aspect:(mediaEdits.get(file)?.aspect||'original'),trimStartMs:Number(mediaEdits.get(file)?.trimStartMs||0),trimEndMs:Number(mediaEdits.get(file)?.trimEndMs||0),muted:!!mediaEdits.get(file)?.muted}:{aspect:externalCrop?.aspect||(composerKind==='gallery'?'4:5':'original'),zoom:1,rotation:0,panX:0,panY:0,...photoCropPlans.get(file)};
    $('#pngeaMediaEditorCancel').textContent='Back';$('#pngeaMediaEditorDone').textContent='Save';
    const stage=document.createElement('div');stage.id='pngeaEditorStage';body.appendChild(stage);
    if(isImage){
      const canvas=document.createElement('canvas'),grid=document.createElement('div');grid.className='pngeaCropGrid';stage.append(canvas,grid);let bitmap=null;
      const refresh=()=>{if(!bitmap||!editorState)return;const turn=((editorState.rotation||0)%360+360)%360,rotated=turn===90||turn===270,tmp=document.createElement('canvas');tmp.width=rotated?bitmap.height:bitmap.width;tmp.height=rotated?bitmap.width:bitmap.height;const ctx=tmp.getContext('2d');ctx.translate(tmp.width/2,tmp.height/2);ctx.rotate(turn*Math.PI/180);ctx.drawImage(bitmap,-bitmap.width/2,-bitmap.height/2);const rect=cropRectangle(tmp.width,tmp.height,editorState);canvas.width=600;canvas.height=Math.round(600*rect.sh/rect.sw);canvas.getContext('2d').drawImage(tmp,rect.sx,rect.sy,rect.sw,rect.sh,0,0,canvas.width,canvas.height);stage.style.aspectRatio=String(rect.sw/rect.sh)};
      createImageBitmap(file).then(image=>{bitmap=image;if(editor.classList.contains('show')&&editingIndex===index)refresh()}).catch(()=>ui.toast?.('Could not preview this photo'));
      let dragging=null;stage.onpointerdown=e=>{dragging={x:e.clientX,y:e.clientY,panX:editorState.panX||0,panY:editorState.panY||0};stage.setPointerCapture(e.pointerId);e.preventDefault()};stage.onpointermove=e=>{if(!dragging||!editorState)return;const rect=stage.getBoundingClientRect();editorState.panX=Math.max(-1,Math.min(1,dragging.panX-(e.clientX-dragging.x)/Math.max(1,rect.width)*2));editorState.panY=Math.max(-1,Math.min(1,dragging.panY-(e.clientY-dragging.y)/Math.max(1,rect.height)*2));refresh()};stage.onpointerup=stage.onpointercancel=()=>dragging=null;
      tools.appendChild(editorAspectButtons(editorState,refresh));
      const row=document.createElement('div'),rotate=document.createElement('button');row.className='pngeaEditToolRow';rotate.type='button';rotate.textContent='Rotate 90°';rotate.onclick=()=>{editorState.rotation=(editorState.rotation+90)%360;refresh()};
      const reset=document.createElement('button');reset.type='button';reset.textContent='Reset';reset.onclick=()=>{Object.assign(editorState,{aspect:externalCrop?.aspect||(composerKind==='gallery'?'4:5':'original'),zoom:1,rotation:0,panX:0,panY:0});refresh()};row.append(rotate,reset);tools.appendChild(row);
      const slider=document.createElement('label');slider.className='pngeaEditSlider';slider.innerHTML=`<span>Zoom</span><input type="range" min="1" max="3" step=".05" value="1"><span>1.0×</span>`;
      const range=slider.querySelector('input'),value=slider.lastElementChild;range.oninput=()=>{editorState.zoom=Number(range.value);value.textContent=`${editorState.zoom.toFixed(1)}×`;refresh()};tools.appendChild(slider);refresh();
    }else if(isVideo){
      const frame=document.createElement('div');frame.className='pngeaVideoCropFrame';const v=document.createElement('video');v.src=url;v.controls=true;v.playsInline=true;v.preload='metadata';frame.appendChild(v);stage.appendChild(frame);
      const refresh=()=>{const r=aspectNumber(editorState.aspect);frame.style.aspectRatio=r?String(r):'auto';frame.style.width=r?(r<1?'70%':'100%'):'100%';v.muted=editorState.muted};
      tools.appendChild(editorAspectButtons(editorState,refresh));const label=document.createElement('div');label.className='pngeaEditLabel';label.textContent='Trim video';tools.appendChild(label);
      const a=document.createElement('label');a.className='pngeaEditSlider';a.innerHTML=`<span>Start</span><input type="range" min="0" max="1" step=".1" value="0"><span>0:00</span>`;
      const b=document.createElement('label');b.className='pngeaEditSlider';b.innerHTML=`<span>End</span><input type="range" min="0" max="1" step=".1" value="1"><span>0:00</span>`;tools.append(a,b);
      const ai=a.querySelector('input'),bi=b.querySelector('input'),av=a.lastElementChild,bv=b.lastElementChild;
      const sync=()=>{const dur=Math.max(.1,v.duration||0);let x=Number(ai.value),y=Number(bi.value);if(y-x<.25){if(document.activeElement===ai)x=Math.max(0,y-.25);else y=Math.min(dur,x+.25)}ai.value=x;bi.value=y;editorState.trimStartMs=Math.round(x*1000);editorState.trimEndMs=Math.round(y*1000);av.textContent=fmtDuration(x);bv.textContent=fmtDuration(y);try{v.currentTime=x}catch{}};
      v.addEventListener('loadedmetadata',()=>{const dur=v.duration||0;ai.max=bi.max=String(dur);ai.value=String(Math.min(dur,editorState.trimStartMs/1000));bi.value=String(editorState.trimEndMs?Math.min(dur,editorState.trimEndMs/1000):dur);sync()},{once:true});
      ai.oninput=sync;bi.oninput=sync;v.addEventListener('timeupdate',()=>{const end=(editorState.trimEndMs||((v.duration||0)*1000))/1000;if(v.currentTime>=end){v.pause();try{v.currentTime=(editorState.trimStartMs||0)/1000}catch{}}});
      const row=document.createElement('div'),mute=document.createElement('button');row.className='pngeaEditToolRow';mute.type='button';mute.textContent=editorState.muted?'Unmute':'Mute';mute.onclick=()=>{editorState.muted=!editorState.muted;mute.textContent=editorState.muted?'Unmute':'Mute';refresh()};
      const reset=document.createElement('button');reset.type='button';reset.textContent='Reset';reset.onclick=()=>{mediaEdits.delete(file);openMediaEditor(index)};row.append(mute,reset);tools.appendChild(row);refresh();
    }
    if(!externalCrop){const row=document.createElement('div'),remove=document.createElement('button');row.className='pngeaEditToolRow';remove.className='danger';remove.textContent='Remove';remove.onclick=()=>{postFiles.splice(index,1);closeMediaEditor();renderComposerMedia()};row.appendChild(remove);tools.appendChild(row)}editor.classList.add('show');
  }
  function closeMediaEditor(){editor.classList.remove('show');editingIndex=-1;pendingEditedFile=null;editorState=null;externalCrop=null}
  ui.editProfileImage=(file,{aspect='1:1',onSave}={})=>{externalCrop={file,aspect,onSave};openMediaEditor(-2)};
  $('#pngeaMediaEditorCancel').onclick=closeMediaEditor;
  $('#pngeaMediaEditorDone').onclick=async()=>{if(externalCrop){const current=externalCrop;try{const file=await cropImageFile(current.file,editorState||{});closeMediaEditor();await current.onSave?.(file)}catch{ui.toast?.('Could not resize this image')}return}if(editingIndex<0)return closeMediaEditor();const file=postFiles[editingIndex];try{if((file.type||'').startsWith('image/')){if(composerKind==='gallery')photoCropPlans.set(file,{...editorState});else postFiles[editingIndex]=await cropImageFile(file,editorState||{})}else if((file.type||'').startsWith('video/'))mediaEdits.set(file,{aspect:editorState.aspect,trimStartMs:editorState.trimStartMs||0,trimEndMs:editorState.trimEndMs||0,muted:!!editorState.muted})}catch{ui?.toast?.('Could not apply that edit')}closeMediaEditor();renderComposerMedia()};

  /* top-level media viewer */
  const mediaViewer=document.createElement('section');mediaViewer.id='pngeaMediaViewer';
  mediaViewer.innerHTML=`<div id="pngeaMediaViewerTop"><button id="pngeaMediaViewerClose" type="button">Close</button><b>Media</b><span style="width:52px"></span></div><div id="pngeaMediaViewerBody" class="pngeaZoomSurface"></div>`;
  document.body.appendChild(mediaViewer);
  let reelViewerSource=null,reelViewerLocks=[],reelViewerVersion=0;
  const reelVolumeIcon=muted=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/>${muted?'<path d="m16 9 6 6m0-6-6 6"/>':'<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'}</svg>`;
  const reelPlayIcon=paused=>`<svg viewBox="0 0 24 24" aria-hidden="true">${paused?'<path d="m8 4 12 8-12 8V4Z"/>':'<path d="M8 5v14M16 5v14"/>'}</svg>`;
  function closeMediaViewer({resume=false}={}){
    const host=$('#pngeaMediaViewerBody'),video=host?.querySelector('video'),source=reelViewerSource;if(source&&video){try{source.currentTime=video.currentTime;source.muted=video.muted;source.dispatchEvent(new Event('volumechange'))}catch{}}reelViewerSource=null;reelViewerVersion++;
    host?.querySelectorAll('video').forEach(v=>{try{v.pause()}catch{}});if(host)host.innerHTML='';mediaViewer.classList.remove('show','pngeaReelViewer');delete mediaViewer.dataset.postId;
    for(const [element,inert] of reelViewerLocks)element.inert=inert;reelViewerLocks=[];if(resume&&source?.isConnected&&document.visibilityState==='visible')source.play().catch(()=>{});
  }
  function renderReelViewer(source,p){
    const host=$('#pngeaMediaViewerBody'),id=String(p.id),version=++reelViewerVersion,account=api.getActiveAccountKey?.()||liveAPI()?.state?.me?.id||'',card=source.closest('[data-server-post]'),caption=card?.querySelector('.xPostText,.pngeaDetailText')?.textContent||'';
    mediaViewer.classList.add('pngeaReelViewer');mediaViewer.dataset.postId=id;reelViewerSource=source;
    for(const element of [APP,$('#dmThread'),$('#pngeaPostPage')])if(element&&!reelViewerLocks.some(([locked])=>locked===element)){reelViewerLocks.push([element,element.inert]);element.inert=true}
    const video=document.createElement('video');video.src=source.currentSrc||source.src;video.playsInline=true;video.autoplay=true;video.loop=true;video.muted=source.muted;video.preload='auto';video.className='pngeaFullscreenReel';
    const media=(p.media||[]).find(m=>m.id===source.closest('[data-media-id]')?.dataset.mediaId)||(p.media||[]).find(m=>String(m.mimeType||m.mime_type||'').startsWith('video/')),edit=mediaEditObject(media?.edit||media?.edit_json);applyMediaEdit(video,{...edit,aspect:'original',trimStartMs:0,trimEndMs:0});video.muted=source.muted;
    const overlay=document.createElement('article');overlay.className='pngeaReelOverlay';overlay.innerHTML=`<div class="pngeaReelIdentity"><div class="pngeaReelAuthor"><div class="xAvatar" data-profile="${escapeHTML(p.handle)}">${postInitials(p)}</div><span data-profile="${escapeHTML(p.handle)}">${escapeHTML(p.display_name||p.handle)}</span></div><div class="pngeaReelCaption"></div></div><div class="pngeaReelActions" data-server-post="${escapeHTML(id)}">${['like','reply','repost','share','save'].map(kind=>`<button type="button" data-live-action="${kind}" aria-label="${kind==='share'?'Send post':kind==='save'?'Save post':kind==='reply'?'Comments':kind}">${actionMarkup(kind)}</button>`).join('')}</div><div class="pngeaReelPlayback"><button type="button" class="pngeaReelPlay" aria-label="Pause"></button><div class="pngeaReelSeekWrap"><input class="pngeaReelSeek" type="range" aria-label="Seek video" min="0" max="1000" step="1" value="0" disabled><div class="pngeaReelTime"><span>0:00</span><span>0:00</span></div></div><button type="button" class="pngeaReelSound" aria-label="${video.muted?'Unmute':'Mute'}">${reelVolumeIcon(video.muted)}</button></div><div class="pngeaReelStatus" role="status"></div>`;
    const captionHost=overlay.querySelector('.pngeaReelCaption');captionHost.textContent=caption;
    const seek=overlay.querySelector('.pngeaReelSeek'),play=overlay.querySelector('.pngeaReelPlay'),sound=overlay.querySelector('.pngeaReelSound'),times=overlay.querySelectorAll('.pngeaReelTime span'),status=overlay.querySelector('.pngeaReelStatus');let seeking=false;
    const bounds=()=>{const duration=Number.isFinite(video.duration)&&video.duration>0?video.duration:Number(media?.durationMs||media?.duration_ms||0)/1000,start=Math.max(0,Math.min(duration,Number(edit.trimStartMs||0)/1000)),end=Math.max(start,Math.min(duration,Number(edit.trimEndMs||0)/1000||duration));return {start,end,length:end-start}};
    const paint=()=>{const {start,end,length}=bounds();seek.disabled=!(length>0);if(!seeking)seek.value=String(length?Math.max(0,Math.min(1000,(video.currentTime-start)/length*1000)):0);times[0].textContent=fmtDuration(Math.max(0,video.currentTime-start));times[1].textContent=fmtDuration(length);const playState=video.paused?'paused':'playing';if(play.dataset.playState!==playState){play.dataset.playState=playState;play.innerHTML=reelPlayIcon(video.paused);play.setAttribute('aria-label',video.paused?'Play':'Pause')}const soundState=String(video.muted);if(sound.dataset.muted!==soundState){sound.dataset.muted=soundState;sound.innerHTML=reelVolumeIcon(video.muted);sound.setAttribute('aria-label',video.muted?'Unmute':'Mute')}if(video.currentTime>=end&&length>0&&video.loop){try{video.currentTime=start;video.play().catch(()=>{})}catch{}}};
    const togglePlay=()=>{if(video.paused)video.play().then(()=>status.textContent='').catch(()=>{status.textContent='Tap play to start this video'});else video.pause()};play.onclick=togglePlay;video.onclick=togglePlay;sound.onclick=()=>{video.muted=!video.muted;paint()};
    seek.oninput=()=>{const {start,length}=bounds();if(!length)return;seeking=true;video.currentTime=start+Number(seek.value)/1000*length;times[0].textContent=fmtDuration(Math.max(0,video.currentTime-start))};seek.onchange=()=>{seeking=false;paint()};
    video.addEventListener('loadedmetadata',()=>{const {start,end}=bounds();try{video.currentTime=Math.max(start,Math.min(end,source.currentTime||start))}catch{}paint()},{once:true});for(const event of ['play','pause','timeupdate','durationchange','seeked','volumechange'])video.addEventListener(event,paint);video.addEventListener('playing',()=>status.textContent='');video.addEventListener('error',()=>status.textContent='This video could not play. Try opening it again.');
    host.append(video,overlay);paintPostState(id);applyKnownAvatars(overlay).catch(()=>{});paint();video.play().catch(()=>{status.textContent='Tap play to start this video'});
    if(!caption)api.post(id).then(fresh=>{if(version!==reelViewerVersion||mediaViewer.dataset.postId!==id||account!==(api.getActiveAccountKey?.()||liveAPI()?.state?.me?.id||''))return;captionHost.textContent=fresh.text||''}).catch(()=>{});
  }
  function openMediaViewer(source){
    const host=$('#pngeaMediaViewerBody');if(!host||!source?.src)return;
    closeMediaViewer();const p=postRecords.get(source.closest('[data-server-post]')?.dataset.serverPost);if(source.tagName==='VIDEO'&&p&&(source.dataset.pngeaReel||postFormat(p)==='reel')){source.pause();renderReelViewer(source,p);mediaViewer.classList.add('show');return}
    host.innerHTML='';const isVideo=source.tagName==='VIDEO';const el=document.createElement(isVideo?'video':'img');el.src=source.currentSrc||source.src;
    if(isVideo){el.controls=true;el.playsInline=true;el.autoplay=true;el.muted=source.muted||false;try{el.currentTime=source.currentTime||0}catch{}}
    else el.alt=source.alt||'Post media';
    if(isVideo)source.pause();host.appendChild(el);mediaViewer.classList.add('show');requestAnimationFrame(()=>{if(isVideo)el.play?.().catch(()=>{})});
  }
  $('#pngeaMediaViewerClose').onclick=()=>closeMediaViewer({resume:true});
  mediaViewer.addEventListener('click',e=>{if(e.target===mediaViewer||e.target.id==='pngeaMediaViewerBody')closeMediaViewer()});
  mediaViewer.addEventListener('touchmove',event=>{if(mediaViewer.classList.contains('pngeaReelViewer')&&!event.target.closest('.pngeaReelCaption,input[type="range"]'))event.preventDefault()},{passive:false});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mediaViewer.classList.contains('show'))closeMediaViewer({resume:true})});
  window.addEventListener('pngea:route',()=>{if(mediaViewer.classList.contains('show'))closeMediaViewer()});
  window.addEventListener('click',event=>{if(!mediaViewer.classList.contains('pngeaReelViewer')||!mediaViewer.contains(event.target))return;const action=event.target.closest('[data-live-action]');if(action){event.preventDefault();event.stopImmediatePropagation();const id=mediaViewer.dataset.postId,kind=action.dataset.liveAction;if(kind==='like'||kind==='repost')toggleReaction(id,kind,action);else if(kind==='save')togglePostSave(id);else if(kind==='share'){closeMediaViewer();openSendPost(id)}else if(kind==='reply'){closeMediaViewer();openPostPage(id);$('#pngeaPostReplyInput').focus()}return}if(event.target.closest('[data-profile]'))closeMediaViewer()},true);
  window.addEventListener('click',e=>{
    const media=e.target.closest?.('.liveMediaRail img,.liveMediaRail video,.pngeaProfileMediaRail img,.pngeaProfileMediaRail video,.pngeaMediaTile img,.pngeaMediaTile video,.pngeaDetailMedia img,.pngeaDetailMedia video');
    if(!media||e.target.closest('#pngeaMediaViewer,#pngeaMediaEditor'))return;
    e.preventDefault();e.stopImmediatePropagation();const post=media.closest('[data-server-post]');if(media.tagName==='IMG'&&post&&!postPage.contains(post))openPostPage(post.dataset.serverPost);else openMediaViewer(media);
  },true);

  /* drafts */
  const draftsPage=document.createElement('section');draftsPage.id='pngeaDraftsPage';
  draftsPage.innerHTML=`<div class="pngeaPageTop"><button id="pngeaDraftsClose">Back</button><b>Drafts</b><span></span></div><div id="pngeaDraftList"></div>`;
  document.body.appendChild(draftsPage);
  function draftAccount(){return api.getActiveAccountKey?.()||liveAPI()?.state?.me?.account_key||liveAPI()?.state?.me?.id||''}
  function draftStoreKey(account){return `drafts.v3:${account}`}
  async function getDrafts(account=draftAccount()){
    if(!account)return [];const key=draftStoreKey(account),db=await openDB();let result=[];
    try{await new Promise((resolve,reject)=>{const transaction=db.transaction(STORE,'readwrite'),objects=transaction.objectStore(STORE),stored=objects.get(key);stored.onsuccess=()=>{if(Array.isArray(stored.result)){result=stored.result;return}const owner=objects.get('drafts.v2.owner');owner.onsuccess=()=>{if(owner.result&&owner.result!==account)return;const legacy=objects.get('drafts.v2');legacy.onsuccess=()=>{if(!Array.isArray(legacy.result)||!legacy.result.length)return;result=legacy.result;objects.put(result,key);objects.put(account,'drafts.v2.owner');objects.delete('drafts.v2')}}};transaction.oncomplete=resolve;transaction.onerror=transaction.onabort=()=>reject(transaction.error||new Error('Could not read drafts'))})}finally{db.close()}return result;
  }
  function paintDraftCount(count){draftsBtn.classList.toggle('hasDrafts',count>0);draftsBtn.dataset.draftCount=String(count);draftsBtn.setAttribute('aria-label',count?`Drafts, ${count} saved`:'Drafts, none saved')}
  async function putDrafts(d,account=draftAccount()){if(!account)throw new Error('Sign in to save a draft');const rows=d.slice(0,25),db=await openDB();try{await new Promise((resolve,reject)=>{const transaction=db.transaction(STORE,'readwrite');transaction.objectStore(STORE).put(rows,draftStoreKey(account));transaction.oncomplete=resolve;transaction.onerror=transaction.onabort=()=>reject(transaction.error||new Error('Could not save drafts'))})}finally{db.close()}if(account===draftAccount())paintDraftCount(rows.length)}
  const initialDraftAccount=draftAccount();getDrafts(initialDraftAccount).then(d=>{if(initialDraftAccount===draftAccount())paintDraftCount(d.length)}).catch(()=>{});
  function composerHasContent(){return !!(String(postText?.value||'').trim()||longTitle.value.trim()||postFiles.length)}
  function clearComposer(){closeWordReplyContext();currentDraftId=null;postFiles=[];if(postText)postText.value='';longTitle.value='';$('#pngeaPhotoAudience').value='public';$('#pngeaWordAudience').value='public';if(liveAPI()?.state)liveAPI().state.replyToId=null;clearPreviewURLs();setComposerKind('text');renderComposerMedia()}
  function hideComposer(){composer?.classList.remove('show');ROOT.classList.remove('pngeaComposerOpen');document.activeElement?.blur?.()}
  const draftExit=document.createElement('section');draftExit.id='pngeaDraftExit';draftExit.setAttribute('role','dialog');draftExit.setAttribute('aria-modal','true');draftExit.innerHTML=`<div><b>Save this post?</b><p>Keep it in Drafts or discard it.</p><button data-draft-exit="save">Save draft</button><button data-draft-exit="discard">Discard</button><button data-draft-exit="cancel">Keep editing</button></div>`;document.body.appendChild(draftExit);
  let pendingComposerExit=null;
  function requestComposerClose(afterClose=null){pendingComposerExit=typeof afterClose==='function'?afterClose:null;if(!composerHasContent()){const next=pendingComposerExit;pendingComposerExit=null;clearComposer();hideComposer();next?.();return}document.activeElement?.blur?.();draftExit.classList.add('show')}
  draftExit.addEventListener('click',async event=>{const action=event.target.closest('[data-draft-exit]')?.dataset.draftExit;if(!action)return;event.preventDefault();event.stopPropagation();if(action==='cancel'){pendingComposerExit=null;draftExit.classList.remove('show');return}const buttons=[...draftExit.querySelectorAll('button')];buttons.forEach(button=>button.disabled=true);try{if(action==='save')await saveDraft();else if(currentDraftId)await deleteDraft(currentDraftId);const next=pendingComposerExit;pendingComposerExit=null;clearComposer();hideComposer();draftExit.classList.remove('show');next?.()}catch(error){ui.toast?.('Could not save this draft. Your post is still here.')}finally{buttons.forEach(button=>button.disabled=false)}});
  window.addEventListener('click',event=>{const identity=event.target.closest?.('[data-profile]');if(!identity||!composer.classList.contains('show')||!composer.contains(identity))return;const handle=norm(identity.dataset.profile);if(!handle)return;event.preventDefault();event.stopImmediatePropagation();requestComposerClose(()=>{capturePostProfileReturn();closePostPage();ui.navigate('Profile',handle==='you'?serverHandle():handle)})},true);
  async function saveDraft({forceNew=false,accountKey=draftAccount()}={}){
    const text=String(postText?.value||'');if(!composerHasContent())return;
    const id=forceNew||!currentDraftId?`d_${Date.now()}_${Math.random().toString(36).slice(2,7)}`:currentDraftId;
    currentDraftId=id;
    const record={id,text,contentKind:composerKind,title:$('#pngeaLongTitleInput')?.value||'',visibility:$('#pngeaPhotoAudience').value,photoReview:photoReviewOpen,replyToId:liveAPI()?.state?.replyToId||null,savedAt:Date.now(),files:postFiles.map(f=>({name:f.name,type:f.type,lastModified:f.lastModified,blob:f,crop:photoCropPlans.has(f)?{...photoCropPlans.get(f)}:undefined,edit:mediaEdits.has(f)?{...mediaEdits.get(f)}:undefined}))};
    const drafts=await getDrafts(accountKey);
    await putDrafts([record,...drafts.filter(x=>x.id!==id)],accountKey);
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
    closeWordReplyContext();currentDraftId=d.id;setComposerKind(d.contentKind||'text');$('#pngeaLongTitleInput').value=d.title||'';if(postText)postText.value=d.text||'';
    postFiles=(d.files||[]).map(f=>new File([f.blob],f.name||'media',{type:f.type||f.blob?.type||'',lastModified:f.lastModified||Date.now()}));
    postFiles.forEach((file,i)=>{if(d.files[i]?.crop)photoCropPlans.set(file,d.files[i].crop);if(d.files[i]?.edit)mediaEdits.set(file,d.files[i].edit)});if(liveAPI()?.state)liveAPI().state.replyToId=d.replyToId||null;$('#pngeaPhotoAudience').value=d.visibility==='followers'?'followers':'public';$('#pngeaWordAudience').value=$('#pngeaPhotoAudience').value;if(d.photoReview&&d.contentKind==='gallery')setPhotoReview(true);if(d.replyToId)showWordReplyContext(d.replyToId);else closeWordReplyContext();
    renderComposerMedia();draftsPage.classList.remove('show');composer?.classList.add('show');ROOT.classList.add('pngeaComposerOpen');postText?.focus();
  }
  draftsBtn.onclick=async()=>{await renderDrafts();draftsPage.classList.add('show');document.activeElement?.blur?.()};
  $('#pngeaDraftsClose').onclick=()=>draftsPage.classList.remove('show');
  let composerSessionAccount=draftAccount();
  window.addEventListener('pngea:session-expired',()=>{
    if(!composer.classList.contains('show')&&!draftsPage.classList.contains('show')&&!draftExit.classList.contains('show'))return;
    const account=draftAccount(),saving=composerHasContent()&&account?saveDraft({accountKey:account}):null,snapshot={text:postText.value,title:longTitle.value,kind:composerKind,id:currentDraftId,files:[...postFiles]};
    composerSessionAccount=account;pendingComposerExit=null;draftExit.classList.remove('show');draftsPage.classList.remove('show');hideComposer();closeWordReplyContext();syncKeyboard();
    saving?.then(()=>{if(account===draftAccount()&&!composer.classList.contains('show')&&snapshot.text===postText.value&&snapshot.title===longTitle.value&&snapshot.kind===composerKind&&snapshot.id===currentDraftId&&snapshot.files.length===postFiles.length&&snapshot.files.every((file,index)=>file===postFiles[index]))clearComposer()}).catch(()=>{});
  });
  window.addEventListener('pngea:session-ready',()=>{const account=draftAccount();if(composerSessionAccount&&account!==composerSessionAccount){clearComposer();hideComposer();draftsPage.classList.remove('show');draftExit.classList.remove('show');pendingComposerExit=null}composerSessionAccount=account;getDrafts(account).then(rows=>{if(account===draftAccount())paintDraftCount(rows.length)}).catch(()=>{})});

  document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(draftExit.classList.contains('show')){pendingComposerExit=null;draftExit.classList.remove('show');event.preventDefault()}else if(draftsPage.classList.contains('show')){draftsPage.classList.remove('show');event.preventDefault()}});

  /* Caption edits share the post's canonical records and keep the current page. */
  function canEditCaption(post){return !!post&&post.author_id===liveAPI()?.state?.me?.id&&!post.reply_to_id&&post.content_kind!=='longform'&&(post.content_kind==='gallery'&&(post.media||[]).some(media=>/^(image|video)\//.test(media.mimeType||media.mime_type||''))||(post.media||[]).some(media=>String(media.mimeType||media.mime_type||'').startsWith('video/')))}
  const captionEditor=document.createElement('section');captionEditor.id='pngeaCaptionEditor';captionEditor.setAttribute('role','dialog');captionEditor.setAttribute('aria-modal','true');captionEditor.innerHTML=`<div class="pngeaPageTop"><button id="pngeaCaptionBack" type="button">Back</button><b>Edit caption</b><button id="pngeaCaptionSave" type="button">Save</button></div><textarea id="pngeaCaptionText" aria-label="Caption" placeholder="Write a caption…"></textarea>`;document.body.appendChild(captionEditor);let captionEditId=null,captionEditRequest=0;
  async function openCaptionEditor(id){const request=++captionEditRequest;captionEditId=String(id);$('#pngeaCaptionText').value='';$('#pngeaCaptionSave').disabled=true;captionEditor.classList.add('show');try{const post=await api.post(id);if(request!==captionEditRequest)return;if(!canEditCaption(post))throw new Error('Only photo and video captions can be edited');$('#pngeaCaptionText').value=post.text||'';$('#pngeaCaptionSave').disabled=false;$('#pngeaCaptionText').focus()}catch(error){if(request!==captionEditRequest)return;captionEditor.classList.remove('show');ui.toast?.(error.message||'Could not load caption')}}
  $('#pngeaCaptionBack').onclick=()=>{captionEditRequest++;captionEditId=null;captionEditor.classList.remove('show');document.activeElement?.blur?.()};
  $('#pngeaCaptionSave').onclick=async()=>{const id=captionEditId;if(!id)return;const button=$('#pngeaCaptionSave');button.disabled=true;try{const result=await api.request(`/v1/posts/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({text:$('#pngeaCaptionText').value})}),post=result.post||result;rememberPost(post);for(const card of document.querySelectorAll(`[data-server-post="${CSS.escape(id)}"]`)){const copy=card.querySelector(':scope > .pngeaDetailText,:scope > .xPostBody > .xPostText');if(copy)copy.innerHTML=mentionHTML(post.text||'');if(card.classList.contains('pngeaPostCard'))postNodeKeys.set(card,postRenderKey(post,post))}captionEditor.classList.remove('show');captionEditId=null;document.activeElement?.blur?.();ui.toast?.('Caption updated')}catch(error){ui.toast?.(error.message||'Could not update caption')}finally{button.disabled=false}};

  async function createPostWithMedia(){
    const text=String(postText?.value||'').trim(),live=liveAPI()?.state,replyParent=live?.replyToId||null;
    if(posting||(!text&&!postFiles.length))return;if(wordTooLong()){ui.toast?.('Word posts can contain up to 280 characters');return}if(composerKind==='longform'&&!$('#pngeaLongTitleInput').value.trim()){ui.toast?.('Add a title');return}
    const originalFiles=[...postFiles],publish={text,contentKind:composerKind,title:composerKind==='longform'?$('#pngeaLongTitleInput').value.trim():'',visibility:composerKind==='gallery'||composerKind==='text'?$('#pngeaPhotoAudience').value:'public',replyToId:replyParent,draftId:currentDraftId,files:(composerKind==='longform'?[]:originalFiles).map(file=>{
      const copy=new File([file],file.name,{type:file.type,lastModified:file.lastModified}),edit=mediaEdits.get(file);
      if(edit)mediaEdits.set(copy,{...edit});return {file:copy,crop:{aspect:'4:5',zoom:1,rotation:0,...photoCropPlans.get(file)}};
    })};
    posting=true;if(send)send.disabled=true;
    const bar=uploadProgress.querySelector('i');uploadProgress.classList.toggle('show',!!publish.files.length);
    const label=$('#detected'),oldLabel=label?.textContent||'New post';
    try{
      await liveAPI()?.resume?.();
      const progress=publish.files.map(()=>0),mediaIds=new Array(publish.files.length);
      let nextUpload=0;
      const worker=async()=>{
        for(;;){
          const i=nextUpload++;if(i>=publish.files.length)return;
          const {file,crop}=publish.files[i],uploadFile=publish.contentKind==='gallery'&&file.type.startsWith('image/')?await cropImageFile(file,crop):file;
          mediaIds[i]=await uploadMedia(uploadFile,fraction=>{
            progress[i]=fraction;const pct=(progress.reduce((a,b)=>a+b,0)/Math.max(progress.length,1))*100;
            if(bar)bar.style.width=`${pct}%`;uploadProgress.setAttribute('aria-label',`Uploading ${Math.round(pct)}%`);
          });
          progress[i]=1;
        }
      };
      await Promise.all(Array.from({length:Math.min(2,Math.max(1,publish.files.length))},worker));
      uploadProgress.setAttribute('aria-label','Posting…');
      let created;
      const body={text:publish.text,visibility:publish.visibility,replyToId:publish.replyToId,mediaIds,contentKind:publish.contentKind,title:publish.title};
      try{created=await api.createPost(body)}
      catch(err){
        if(mediaIds.length&&mediaNotReadyError(err)){uploadProgress.setAttribute('aria-label','Processing video…');await waitMedia(mediaIds);created=await api.createPost(body)}
        else throw err;
      }
      const unchanged=currentDraftId===publish.draftId&&composerKind===publish.contentKind&&String(postText?.value||'').trim()===publish.text&&postFiles.length===originalFiles.length&&postFiles.every((file,index)=>file===originalFiles[index])&&(!['text','gallery'].includes(publish.contentKind)||$('#pngeaPhotoAudience').value===publish.visibility)&&(publish.contentKind!=='longform'||$('#pngeaLongTitleInput').value.trim()===publish.title);
      if(publish.draftId)await deleteDraft(publish.draftId);
      if(unchanged){clearComposer();hideComposer()}
      // Home contains followed authors. Show the saved post itself so a new
      // upload remains visible without inserting it into that following feed.
      if(unchanged&&created?.id)openPostPage(publish.replyToId||created.id);
      if(replyParent)bumpReplyCount(replyParent,1);
      // One controlled refresh after posting; do not race Home/Profile renderers.
      await Promise.allSettled([liveAPI()?.loadFeed?.(),enhanceProfile()]);
      setTimeout(()=>{liveAPI()?.loadFeed?.();enhanceProfile()},1200);
      ui?.toast?.('Posted');
    }catch(err){
      try{await saveDraft()}catch{ui.toast?.('Could not save a local draft. Your post is still here.')}ui?.toast?.(err?.message||'Could not post');
    }finally{
      posting=false;if(send)send.disabled=false;if(bar)bar.style.width='0';uploadProgress.classList.remove('show');if(label)label.textContent=oldLabel;syncSend();
    }
  }
  window.addEventListener('click',e=>{
    if(!e.target.closest?.('#send')||!liveAPI()?.state?.active)return;
    e.preventDefault();e.stopImmediatePropagation();if(composerKind==='gallery'&&!photoReviewOpen&&postFiles.length){setPhotoReview(true);return}createPostWithMedia();
  },true);

  document.addEventListener('click',e=>{
    const back=e.target.closest?.('.screen .xBack[data-screen],.screen .back[data-screen]');if(!back)return;e.preventDefault();e.stopImmediatePropagation();ui.navigate(back.dataset.screen||'Home');
  },true);
  const sendPostPage=document.createElement('section');sendPostPage.id='pngeaSendPostPage';sendPostPage.innerHTML=`<div class="pngeaPostTop"><button id="pngeaSendPostBack" aria-label="Back">‹</button><b>Send post</b><span></span></div><input id="pngeaSendPostSearch" placeholder="Search people" aria-label="Search people"><div id="pngeaSendPostPeople"></div>`;document.body.appendChild(sendPostPage);
  let sendPostId=null,sendProfileHandle=null,sendProfileFollowingOnly=false,sendFollowingPeople=null,sendPeopleSeq=0;const postSendPending=new Map();
  $('#pngeaSendPostBack').onclick=()=>{sendPostPage.classList.remove('show');sendPostId=null;sendProfileHandle=null;sendProfileFollowingOnly=false;sendFollowingPeople=null;sendPeopleSeq++};
  async function openSendPost(id){sendPostId=id;sendProfileHandle=null;sendProfileFollowingOnly=false;sendFollowingPeople=null;sendPostPage.querySelector('.pngeaPostTop b').textContent='Send post';sendPostPage.classList.add('show');$('#pngeaSendPostSearch').value='';await renderSendPeople('')}
  async function openSendProfile(handle,{followingOnly=false}={}){sendProfileHandle=norm(handle);sendPostId=null;sendProfileFollowingOnly=followingOnly;sendFollowingPeople=null;sendPostPage.querySelector('.pngeaPostTop b').textContent=followingOnly?'Share profile':'Send account';sendPostPage.classList.add('show');$('#pngeaSendPostSearch').value='';await renderSendPeople('')}
  async function renderSendPeople(query){const seq=++sendPeopleSeq,host=$('#pngeaSendPostPeople'),followingOnly=sendProfileFollowingOnly;host.textContent='Loading…';try{let people;if(followingOnly){sendFollowingPeople ||= api.following(serverHandle());people=((await sendFollowingPeople).items||[]).filter(person=>person.id!==liveAPI()?.state?.me?.id&&norm(person.handle)!==serverHandle());if(query){const match=query.trim().toLowerCase().replace(/^@/,'');people=people.filter(person=>`${person.display_name||''} ${person.handle||''}`.toLowerCase().includes(match))}}else if(query){people=(await api.search(query)).people||[]}else{const d=await api.conversations();people=(d.items||[]).map(c=>({id:c.id,conversationId:c.id,display_name:dmConvName(c),handle:dmConvHandle(c),members:c.members}))}if(seq!==sendPeopleSeq)return;host.innerHTML=people.map(person=>`<button class="pngeaSendPerson" data-recipient="${escapeHTML(person.id)}" ${person.conversationId?'data-conversation="true"':''}><b>${escapeHTML(person.display_name||person.handle)}</b><small>${escapeHTML(person.handle||'')}</small><span>Send</span></button>`).join('')||`<div class="profileEmpty">${followingOnly?(query?'No followed accounts match.':'Follow people to share your profile with them.'):'Search for someone to send this '+(sendProfileHandle?'account':'post')+' to.'}</div>`}catch(err){if(seq===sendPeopleSeq){if(followingOnly)sendFollowingPeople=null;host.textContent=err.message||'Could not load people'}}}
  let sendPeopleTimer;$('#pngeaSendPostSearch').oninput=e=>{clearTimeout(sendPeopleTimer);sendPeopleTimer=setTimeout(()=>renderSendPeople(e.target.value.trim()),180)};
  $('#pngeaSendPostPeople').onclick=async e=>{const button=e.target.closest('[data-recipient]');if(!button||button.disabled||(!sendPostId&&!sendProfileHandle))return;const target=sendProfileHandle||sendPostId,type=sendProfileHandle?'profile':'post',recipient=button.dataset.recipient,key=`${api.getActiveAccountKey?.()}:${type}:${target}:${recipient}`;let pending=postSendPending.get(key);if(!pending){pending={clientId:crypto.randomUUID(),conversationId:button.dataset.conversation?recipient:null};postSendPending.set(key,pending)}button.disabled=true;try{if(!pending.conversationId)pending.conversationId=(await api.createConversation({memberIds:[recipient]})).id;await api.sendMessage(pending.conversationId,{text:`${location.origin}${location.pathname}#/${type}/${encodeURIComponent(target)}`,mediaIds:[],clientId:pending.clientId});postSendPending.delete(key);button.textContent='Sent';ui.toast?.(type==='profile'?'Account sent':'Post sent')}catch(err){button.disabled=false;ui.toast?.(err.message||'Could not send')}};
  const sharedPreviewJobs=new Map();
  function internalShare(text){
    const value=String(text||'').trim();for(const match of value.matchAll(/https?:\/\/[^\s<>]+/g)){try{const url=new URL(match[0]),route=url.hash.match(/^#\/(post|profile)\/([^/?#]+)$/);if(url.origin!==location.origin||url.pathname!==location.pathname||!route)continue;const id=decodeURIComponent(route[2]);if(route[1]==='profile'&&!/^[A-Za-z0-9_]{3,30}$/.test(id))continue;return{kind:route[1],id,raw:match[0],value}}catch{}}return null;
  }
  function renderMessageText(bubble,text){
    const value=String(text||''),share=internalShare(value);if(!share){bubble.textContent=value;return}
    const copy=value.replace(share.raw,'').trim();if(copy){const line=document.createElement('div');line.className='pngeaSharedMessageCopy';line.textContent=copy;bubble.appendChild(line)}
    const card=document.createElement('button');card.type='button';card.className='pngeaSharedPreview pngeaSharedPost';card.dataset.shareKind=share.kind;card.setAttribute('aria-label',share.kind==='post'?'Open shared post':'Open shared profile');card.innerHTML='<span class="pngeaSharedPreviewCopy">Loading preview…</span>';bubble.appendChild(card);
    card.onclick=event=>{event.preventDefault();event.stopPropagation();if(share.kind==='post')openPostPage(share.id);else openDmProfile(share.id)};
    const account=api.getActiveAccountKey?.()||liveAPI()?.state?.me?.id||'',key=`${account}:${share.kind}:${share.id}`;
    let job=sharedPreviewJobs.get(key);if(!job){job=(share.kind==='post'?api.post(share.id):api.getUser(share.id)).finally(()=>sharedPreviewJobs.delete(key));sharedPreviewJobs.set(key,job)}
    job.then(async record=>{
      if(account!==(api.getActiveAccountKey?.()||liveAPI()?.state?.me?.id||'')||!card.isConnected)return;
      card.innerHTML='';const head=document.createElement('span');head.className='pngeaSharedPreviewHead';const avatar=document.createElement('span');avatar.className='pngeaSharedPreviewAvatar';avatar.textContent=(record.display_name||record.handle||'?')[0].toUpperCase();const name=document.createElement('span');name.innerHTML=`<b>${escapeHTML(record.display_name||record.handle||'Post')}</b><small>@${escapeHTML(record.handle||'')}</small>`;head.append(avatar,name);card.appendChild(head);
      ingestAvatarPerson(record);resolvedAvatarUrl(record.handle).then(url=>{if(!url||!card.isConnected)return;const image=document.createElement('img');image.src=url;image.alt='';avatar.replaceChildren(image)}).catch(()=>{});
      if(share.kind==='post'){
        const media=(record.media||[]).find(item=>/^(image|video)\//.test(item.mimeType||item.mime_type||''));
        if(media){const slot=document.createElement('span');slot.className='pngeaSharedPreviewMedia';card.appendChild(slot);try{const element=await mediaElement(media);if(!card.isConnected||account!==(api.getActiveAccountKey?.()||liveAPI()?.state?.me?.id||''))return;element.removeAttribute('controls');element.loading='lazy';element.tabIndex=-1;if(element.tagName==='VIDEO'){element.muted=true;element.preload='metadata'}slot.appendChild(element)}catch{slot.textContent='Media unavailable'}}
      }
      if(!card.isConnected)return;const caption=document.createElement('span');caption.className='pngeaSharedPreviewCopy';caption.textContent=share.kind==='post'?(record.title||record.text||'View post'):(record.bio||'View profile');card.appendChild(caption);
    }).catch(()=>{if(card.isConnected){card.disabled=true;card.classList.add('pngeaSharedUnavailable');card.textContent=share.kind==='post'?'Post unavailable':'Profile unavailable'}});
  }

  /* ---------- Profile social renderer ---------- */
  $('#Profile [data-tab="p-likes"]')?.remove();$('#p-likes')?.remove();
  $('#Profile .profileMeta')?.replaceChildren();
  window.addEventListener('click',e=>{
    if(suppressChatContextClick(e))return;
    const target=e.target.closest?.('[data-profile]');if(!target||target.closest('#dmThread,#youButton,[data-close-friend]'))return;
    const control=e.target.closest('button,input,textarea,select');if(control&&!control.matches('[data-profile],.avatar,.xAvatar,.pngeaDetailAvatar'))return;
    const handle=norm(target.dataset.profile);if(!handle)return;e.preventDefault();e.stopImmediatePropagation();
    capturePostProfileReturn();
    closePostPage();$$('#pngeaConnectionsPage.show,#pngeaCommunityPage.show,#pngeaCloseFriendsPicker.show').forEach(page=>page.classList.remove('show'));
    ui.navigate('Profile',handle==='you'?serverHandle():handle);
  },true);
  function mediaEditObject(v){if(!v)return{};if(typeof v==='string'){try{return JSON.parse(v)}catch{return{}}}return v}
  function applyMediaEdit(el,rawEdit){const edit=mediaEditObject(rawEdit);if(!el)return;const editKey=JSON.stringify(edit);if(el.dataset.appliedEdit===editKey)return;el.dataset.appliedEdit=editKey;if(edit.aspect&&edit.aspect!=='original'){const r=aspectNumber(edit.aspect);if(r){el.style.aspectRatio=String(r);el.style.width='100%';el.style.objectFit='cover'}}if(el.tagName==='VIDEO'){if(!el.dataset.pngeaReel)el.muted=!!edit.muted;const start=Math.max(0,Number(edit.trimStartMs||0))/1000,end=Math.max(0,Number(edit.trimEndMs||0))/1000;if(start)el.addEventListener('loadedmetadata',()=>{try{if(el.currentTime<start)el.currentTime=start}catch{}},{once:true});if(end>start)el.addEventListener('timeupdate',()=>{if(el.currentTime>=end){if(!el.dataset.pngeaReel)el.pause();try{el.currentTime=start;if(el.dataset.pngeaReel)el.play().catch(()=>{})}catch{}}})}}
  const voiceWaveforms=new Map();let voiceDecodeContext=null,activeVoiceAudio=null;
  async function decodeVoiceWaveform(url,key){
    if(voiceWaveforms.has(key))return voiceWaveforms.get(key);
    const job=(async()=>{
      const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return null;
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000),maximum=8*1024*1024;
      try{
        const response=await fetch(url,{mode:'cors',credentials:'omit',cache:'force-cache',signal:controller.signal});
        if(!response.ok||Number(response.headers.get('content-length'))>maximum)return null;
        const chunks=[];let size=0;
        if(response.body?.getReader){const reader=response.body.getReader();while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>maximum){await reader.cancel();return null}chunks.push(part.value)}}
        else{const data=new Uint8Array(await response.arrayBuffer());if(data.byteLength>maximum)return null;chunks.push(data);size=data.byteLength}
        const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
        voiceDecodeContext ||= new AudioContext();
        const buffer=await voiceDecodeContext.decodeAudioData(bytes.buffer),channel=buffer.getChannelData(0),count=40,peaks=[];
        for(let i=0;i<count;i++){const start=Math.floor(i*channel.length/count),end=Math.floor((i+1)*channel.length/count),step=Math.max(1,Math.floor((end-start)/700));let sum=0,samples=0;for(let j=start;j<end;j+=step){sum+=channel[j]*channel[j];samples++}peaks.push(Math.sqrt(sum/Math.max(1,samples)))}
        const largest=Math.max(...peaks,.0001);return peaks.map(value=>Math.max(.12,value/largest));
      }catch{return null}finally{clearTimeout(timer)}
    })();voiceWaveforms.set(key,job);if(voiceWaveforms.size>40)voiceWaveforms.delete(voiceWaveforms.keys().next().value);return job;
  }
  function voiceNoteElement(url,media={}){
    const player=document.createElement('div');player.className='pngeaVoiceNote';player.dataset.voiceState='ready';player.dataset.waveform='uniform';player.setAttribute('role','group');player.setAttribute('aria-label','Voice note');
    const audio=document.createElement('audio');audio.src=url;audio.preload='metadata';audio.hidden=true;
    const play=document.createElement('button');play.type='button';play.className='pngeaVoicePlay';
    const track=document.createElement('div');track.className='pngeaVoiceTrack';const bars=document.createElement('div');bars.className='pngeaVoiceBars';bars.setAttribute('aria-hidden','true');
    for(let i=0;i<40;i++){const bar=document.createElement('i');bar.style.height='12px';bars.appendChild(bar)}
    const seek=document.createElement('input');seek.className='pngeaVoiceSeek';seek.type='range';seek.min='0';seek.max='1000';seek.step='1';seek.value='0';seek.disabled=true;seek.setAttribute('aria-label','Seek voice note');
    const time=document.createElement('div');time.className='pngeaVoiceTime';const elapsed=document.createElement('span'),total=document.createElement('span');time.append(elapsed,total);
    const status=document.createElement('span');status.className='pngeaVoiceStatus';status.setAttribute('role','status');
    track.append(bars,seek);player.append(audio,play,track,time,status);let seeking=false,decoded=false;
    const clock=value=>{const seconds=Math.max(0,Math.floor(Number(value)||0));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`};
    const duration=()=>Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:Math.max(0,Number(media.durationMs||media.duration_ms||0)/1000);
    function paint(){const length=duration(),at=Math.max(0,audio.currentTime||0),fraction=length?Math.min(1,at/length):0;if(!seeking)seek.value=String(Math.round(fraction*1000));seek.disabled=audio.readyState<1||!Number.isFinite(audio.duration)||!audio.duration;seek.setAttribute('aria-valuetext',`${clock(at)} of ${clock(length)}`);elapsed.textContent=clock(at);total.textContent=clock(length);[...bars.children].forEach((bar,index)=>bar.classList.toggle('heard',index/40<fraction));play.setAttribute('aria-label',audio.paused?'Play voice note':'Pause voice note');play.innerHTML=audio.paused?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 4 14 8-14 8Z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zm8 0h4v16h-4Z"/></svg>'}
    function waveform(){if(decoded||duration()>600)return;decoded=true;decodeVoiceWaveform(url,`${media.id||''}:${url}`).then(peaks=>{if(!peaks)return;player.dataset.waveform='decoded';peaks.forEach((peak,index)=>bars.children[index].style.height=`${Math.round(6+peak*28)}px`)})}
    play.onclick=async()=>{if(!audio.paused){audio.pause();return}status.textContent='';player.dataset.voiceState='loading';waveform();try{await audio.play();player.dataset.voiceState='ready'}catch{player.dataset.voiceState='error';status.textContent='Voice note could not play. Try again.'}paint()};
    audio.addEventListener('play',()=>{if(activeVoiceAudio&&activeVoiceAudio!==audio)activeVoiceAudio.pause();activeVoiceAudio=audio;paint()});
    for(const event of ['pause','ended','loadedmetadata','durationchange','timeupdate','seeked'])audio.addEventListener(event,paint);
    audio.addEventListener('error',()=>{player.dataset.voiceState='error';status.textContent='Voice note unavailable. Try again.';paint()});
    seek.addEventListener('input',()=>{if(seek.disabled)return;seeking=true;const length=duration();if(length){audio.currentTime=Number(seek.value)/1000*length;paint()}});seek.addEventListener('change',()=>{seeking=false;paint()});
    player.addEventListener('click',event=>event.stopPropagation());paint();return player;
  }
  const mediaAccessCache=new Map(),mediaAccessJobs=new Map();
  async function cachedMediaAccess(id){
    const key=`${api.getActiveAccountKey?.()||liveAPI()?.state?.me?.id||''}:${id}`,cached=mediaAccessCache.get(key);if(cached&&cached.expires>Date.now())return cached.value;if(mediaAccessJobs.has(key))return mediaAccessJobs.get(key);
    const job=api.mediaAccess(id).then(value=>{mediaAccessCache.set(key,{value,expires:Date.now()+Math.max(1000,Math.min(480000,(Number(value.expiresIn)||900)*1000-60000))});if(mediaAccessCache.size>200)mediaAccessCache.delete(mediaAccessCache.keys().next().value);return value}).finally(()=>mediaAccessJobs.delete(key));mediaAccessJobs.set(key,job);return job;
  }
  async function mediaElement(media,cls=''){
    const a=await cachedMediaAccess(media.id);
    const mime=String(a.mimeType||media.mimeType||media.mime_type||'');
    if(mime.startsWith('audio/')){const player=voiceNoteElement(a.url,media);if(cls)player.classList.add(...cls.split(/\s+/).filter(Boolean));return player}
    const el=document.createElement(mime.startsWith('audio/')?'audio':mime.startsWith('video/')?'video':'img');
    el.className=cls;el.src=a.url;const edit=mediaEditObject(media.edit||media.edit_json);applyMediaEdit(el,el.tagName==='VIDEO'?{...edit,aspect:'original'}:edit);
    if(el.tagName==='VIDEO'){el.controls=true;el.playsInline=true;el.preload='metadata'}
    else if(el.tagName==='AUDIO'){el.controls=true;el.preload='metadata'}
    else el.loading='lazy';
    return el;
  }
  const reelObserver=new IntersectionObserver(entries=>{for(const entry of entries){const video=entry.target;if(entry.isIntersecting&&document.visibilityState==='visible')video.play().catch(()=>{});else video.pause()}},{threshold:.55});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible')document.querySelectorAll('video[data-pngea-reel]').forEach(v=>v.pause())});
  function sizeVideoSlot(slot,media={},video=null){
    if(!slot)return;const width=Number(video?.videoWidth||media.width||0),height=Number(video?.videoHeight||media.height||0),ratio=width>0&&height>0?width/height:16/9;slot.classList.add('pngeaVideoSlot');slot.style.setProperty('--pn-media-ratio',String(ratio));
    const rail=slot.parentElement,card=slot.closest('[data-server-post]');if(card&&slot===rail?.querySelector('.pngeaVideoSlot'))card.style.setProperty('--pn-video-ratio',String(ratio));
  }
  function configurePostMedia(rail){
    const card=rail?.closest('[data-server-post]');if(!card)return;const p=postRecords.get(card.dataset.serverPost);if(!p)return;
    for(const video of rail.querySelectorAll('video')){
      const configure=()=>{let format=postFormat(p);if(format!=='longform'&&Number.isFinite(video.duration)&&video.duration>0&&!(p.media||[]).some(m=>Number(m.durationMs||m.duration_ms)>0))format=video.duration<90?'reel':'video';
        if(card.classList.contains('pngeaPostCard')){for(const kind of ['text','photo','gallery','reel','video','longform'])card.classList.toggle(`pngeaFormat-${kind}`,format===kind);card.dataset.postFormat=format;if(['gallery','reel','video'].includes(format)){const copy=card.querySelector('.xPostText');if(copy&&rail.parentElement===copy.parentElement&&rail.nextElementSibling!==copy)copy.before(rail)}}
        const slot=video.closest('.pngeaMediaSlot'),media=(p.media||[]).find(m=>String(m.id)===slot?.dataset.mediaId)||{};sizeVideoSlot(slot,media,video);slot?.classList.toggle('pngeaReelSlot',format==='reel');video.classList.toggle('pngeaReelVideo',format==='reel');
        if(format==='reel'&&!video.dataset.pngeaReel){video.dataset.pngeaReel='true';video.muted=true;video.autoplay=true;video.loop=true;video.controls=false;video.setAttribute('aria-label','Open reel full screen');reelObserver.observe(video);if(slot){const mute=document.createElement('button');mute.type='button';mute.className='pngeaReelMute';const paint=()=>{mute.setAttribute('aria-label',video.muted?'Unmute video':'Mute video');mute.innerHTML=reelVolumeIcon(video.muted)};mute.onclick=event=>{event.preventDefault();event.stopPropagation();video.muted=!video.muted;paint()};video.addEventListener('volumechange',paint);paint();slot.appendChild(mute)}}
        else if(format!=='reel'&&video.dataset.pngeaReel){delete video.dataset.pngeaReel;video.autoplay=false;video.loop=false;video.controls=true;video.removeAttribute('aria-label');reelObserver.unobserve(video);slot?.querySelector('.pngeaReelMute')?.remove()}
      };configure();if(!video.dataset.formatListener){video.dataset.formatListener='true';video.addEventListener('loadedmetadata',configure)}
    }
  }
  async function hydrateProfileRail(rail,media=[]){
    if(!rail)return;if(!media.length){rail.remove();return}
    const mediaKey=JSON.stringify(media.map(m=>[m.id,m.mimeType||m.mime_type,m.width,m.height,m.durationMs||m.duration_ms,m.edit||m.edit_json]));if(rail.dataset.mediaKey===mediaKey)return;rail.dataset.mediaKey=mediaKey;rail.dataset.loading='1';rail.innerHTML='';
    const slots=media.map(m=>{const slot=document.createElement('div'),mime=String(m.mimeType||m.mime_type||'');slot.className='pngeaMediaSlot'+(mime.startsWith('audio/')?' pngeaAudioSlot':'');slot.dataset.mediaId=m.id;slot.setAttribute('aria-label','Loading media');const ratio=Number(m.width)>0&&Number(m.height)>0?Number(m.width)/Number(m.height):mime.startsWith('video/')?16/9:4/5;slot.style.setProperty('--pn-media-ratio',String(ratio));rail.appendChild(slot);if(mime.startsWith('video/'))sizeVideoSlot(slot,m);return slot});
    await Promise.allSettled(media.map(async(m,index)=>{
      const slot=slots[index];
      let done=false;for(let attempt=0;attempt<2&&!done;attempt++){
        try{const element=await mediaElement(m);if(rail.dataset.mediaKey!==mediaKey)return;slot.appendChild(element);slot.removeAttribute('aria-label');configurePostMedia(rail);done=true}catch{if(!attempt)await sleep(450)}
      }
      if(!done){slot.classList.add('liveMediaPending');slot.textContent='Media unavailable'}
    }));
    rail.dataset.loading='0';rail.dataset.hydrated='1';
  }
  function postFormat(p){
    if(p.content_kind==='longform')return 'longform';
    const video=(p.media||[]).find(m=>String(m.mimeType||m.mime_type||'').startsWith('video/'));
    if(video&&Number(video.durationMs||video.duration_ms)>0){const edit=mediaEditObject(video.edit||video.edit_json),duration=edit.trimEndMs?Math.max(0,edit.trimEndMs-(edit.trimStartMs||0)):Number(video.durationMs||video.duration_ms);return duration<90000?'reel':'video'}
    return p.content_kind==='gallery'&&!(p.media?.length&&p.media.every(m=>String(m.mimeType||m.mime_type||'').startsWith('audio/')))?'gallery':'text';
  }
  function isWordReplyPost(post){const media=post?.media||[];return postFormat(post||{})==='text'&&!(media.length&&media.every(item=>String(item.mimeType||item.mime_type||'').startsWith('audio/')))}
  function mentionHTML(text){
    const value=String(text||''),pattern=/(^|[^A-Za-z0-9_@])@([A-Za-z0-9_]{3,30})\b/g;let html='',offset=0;
    for(const match of value.matchAll(pattern)){const start=match.index+match[1].length;html+=escapeHTML(value.slice(offset,start))+`<button type="button" class="pngeaMention" data-profile="${escapeHTML(match[2].toLowerCase())}">@${escapeHTML(match[2])}</button>`;offset=start+match[2].length+1}
    return html+escapeHTML(value.slice(offset));
  }
  function postActionsHTML(p,photo=false){
    return `<div class="xPostActions${photo?' pngeaPhotoActions':''}">${(photo?['like','reply','repost','share','save']:['reply','repost','like','share']).map(kind=>{const count=kind==='reply'?Number(p.replies||0):kind==='like'?Number(p.likes||0):kind==='repost'?Number(p.reposts||0):0;return `<span role="button" tabindex="0" aria-label="${kind==='share'?'Send post':kind==='save'?'Save post':kind}" data-live-action="${kind}" data-count="${count}">${actionMarkup(kind,count)}</span>`}).join('')}</div>`;
  }
  function profilePostMarkup(p,profile){
    rememberPost(p);ingestPostState(p);const format=postFormat(p),caption=format==='gallery'||format==='reel'||format==='video';
    const text=format==='longform'?p.title:p.text,who=`<div class="xPostWho" data-profile="${escapeHTML(profile.handle)}"><b>${escapeHTML(profile.display_name||profile.handle)}</b><span>@${escapeHTML(displayHandle(profile.handle))} · ${escapeHTML(relativeTime(p.created_at))}</span></div>`;
    const avatar=`<div class="xAvatar" data-profile="${escapeHTML(profile.handle)}">${postInitials(profile)}</div>`;
    const rail=`<div class="pngeaProfileMediaRail liveMediaRail" data-media-rail="${escapeHTML(p.id)}"></div>`,copy=`<div class="xPostText">${format==='longform'?escapeHTML(text||''):mentionHTML(text)}</div>`,actions=postActionsHTML(p,format==='gallery');
    return `<article class="xPost pngeaPostCard pngeaFormat-${format}" data-post-format="${format}" data-pngea-profile-row="515" data-server-post="${escapeHTML(p.id)}"><div class="pngeaCardHeader">${avatar}${who}<button class="more" type="button" aria-label="Post options">•••</button></div><div class="xPostBody">${format==='gallery'?rail+actions+copy:caption?rail+copy+actions:copy+rail+actions}</div></article>`;
  }
  function postRenderKey(p,profile=p){
    return JSON.stringify([p.id,p.content_kind,p.title,p.content_kind==='longform'?'':p.text,p.edited_at,profile.handle,profile.display_name,(p.media||[]).map(m=>[m.id,m.mimeType||m.mime_type,m.width,m.height,m.durationMs||m.duration_ms,m.edit||m.edit_json])]);
  }
  const postNodeKeys=new WeakMap();
  function upsertPostCard(host,p,profile=p,{live=false}={}){
    if(!host||!p?.id)return null;rememberPost(p);ingestPostState(p);postMediaById.set(String(p.id),p.media||[]);
    const key=postRenderKey(p,profile),old=host.querySelector(`:scope > [data-server-post="${CSS.escape(String(p.id))}"]`);let row=old;
    if(!old||postNodeKeys.get(old)!==key){const wrap=document.createElement('div');wrap.innerHTML=profilePostMarkup(p,profile);row=wrap.firstElementChild;postNodeKeys.set(row,key);if(live)row.dataset.liveContent='true';if(old)old.replaceWith(row);else host.insertBefore(row,host.querySelector('.liveDataEmpty,.profileEmpty'));hydrateProfileRail(row.querySelector('.pngeaProfileMediaRail'),p.media||[]).catch(()=>{})}
    if(live)row.dataset.liveContent='true';paintPostState(p.id);return row;
  }
  function syncPostList(host,items=[],profile=null,{live=false}={}){
    if(!host)return [];const posts=stablePosts(items),ids=new Set(posts.map(p=>String(p.id)));
    for(const row of host.querySelectorAll(':scope > [data-server-post]'))if(!ids.has(row.dataset.serverPost))row.remove();
    const rows=posts.map(p=>upsertPostCard(host,p,profile||p,{live})).filter(Boolean);let previous=null;
    for(const row of rows){const target=previous?previous.nextElementSibling:host.querySelector(':scope > [data-server-post]');if(target!==row)host.insertBefore(row,target||host.querySelector('.liveDataEmpty,.profileEmpty'));previous=row}
    if(rows.length)host.querySelectorAll(':scope > .profileEmpty,:scope > .liveDataEmpty').forEach(el=>el.remove());return rows;
  }
  function relativeTime(d){
    if(!d)return 'now';const sec=Math.max(0,(Date.now()-new Date(d).getTime())/1000);
    if(sec<60)return 'now';if(sec<3600)return `${Math.floor(sec/60)}m`;if(sec<86400)return `${Math.floor(sec/3600)}h`;return `${Math.floor(sec/86400)}d`;
  }

  /* alias compatibility until server-side handle migration is hardened */
  function aliasKey(){return `pngea:handleAlias:${api?.getActiveAccountKey?.()||'active'}`}
  function getAlias(){return ''}
  function setAlias(){localStorage.removeItem(aliasKey())}
  function serverHandle(){return norm(liveAPI()?.state?.me?.handle||ui?.state?.user?.handle||'you')}
  function displayHandle(h){const sh=serverHandle(),alias=getAlias();return alias&&norm(h)===sh?alias:norm(h)}

  /* ---------- Avatar consistency: one image pipeline, avatar hosts only ---------- */
  const avatarMediaByHandle=new Map(),avatarDirectByHandle=new Map(),avatarUrlCache=new Map(),avatarUrlRequests=new Map(),postMediaById=new Map();
  const AVATAR_SELECTOR='.avatar,.xAvatar,.sideAvatar,.sideMini,.pngeaDetailAvatar,.selfAvatarFallback';
  function isAvatarElement(el){return !!el?.matches?.(AVATAR_SELECTOR)}
  function avatarIdOf(p){return p?.avatar_media_id||p?.avatarMediaId||p?.avatar_mediaId||null}
  function avatarDirectOf(p){return p?.avatar_url||p?.avatarUrl||p?.actor_avatar_url||p?.actorAvatarUrl||''}
  function ingestAvatarPerson(p){
    if(!p)return;const h=norm(p.handle||p.actor_handle);if(!h)return;
    const id=avatarIdOf(p)||p.actor_avatar_media_id||p.actorAvatarMediaId;
    const direct=avatarDirectOf(p);
    if(id)avatarMediaByHandle.set(h,String(id));
    else if(('avatar_media_id' in p)||('avatarMediaId' in p)||('actor_avatar_media_id' in p))avatarMediaByHandle.delete(h);
    if(direct)avatarDirectByHandle.set(h,String(direct));
    else if(('avatar_url' in p)||('avatarUrl' in p)||('actor_avatar_url' in p))avatarDirectByHandle.delete(h);
  }
  function ingestAvatarPayload(name,d){
    if(!d)return;
    if(name==='me'||name==='getUser')ingestAvatarPerson(d);
    if(['feed','myPosts','userPosts','library','communityFeed','closeFriendsFeed'].includes(name))(d.items||[]).forEach(p=>{ingestAvatarPerson(p);if(p?.id)postMediaById.set(String(p.id),p.media||[])});
    if(['followers','following','closeFriends'].includes(name))(d.items||[]).forEach(ingestAvatarPerson);
    if(name==='search')(d.people||[]).forEach(ingestAvatarPerson);
    if(name==='conversations')(d.items||[]).forEach(c=>(c.members||[]).forEach(ingestAvatarPerson));
    if(name==='notifications')(d.items||[]).forEach(n=>ingestAvatarPerson({handle:n.actor_handle,avatar_media_id:n.actor_avatar_media_id,avatar_url:n.actor_avatar_url}));
  }
  ['me','getUser','feed','myPosts','userPosts','search','conversations','notifications'].forEach(name=>{
    const fn=api?.[name];if(typeof fn!=='function'||fn.__pngeaAvatar515)return;
    const original=fn.bind(api);const wrapped=async(...args)=>{const d=await original(...args);ingestAvatarPayload(name,d);queueMicrotask(()=>applyKnownAvatars().catch(()=>{}));return d};wrapped.__pngeaAvatar515=true;api[name]=wrapped;
  });
  async function avatarUrlFor(mediaId,{force=false}={}){
    if(!mediaId)return'';const key=String(mediaId),cached=avatarUrlCache.get(key);
    if(!force&&cached&&Date.now()<cached.expiresAt)return cached.url;
    if(avatarUrlRequests.has(key))return avatarUrlRequests.get(key);
    const request=(async()=>{try{const a=await api.mediaAccess(mediaId);const ttl=Math.min(480000,Math.max(1000,(Number(a.expiresIn)||900)*1000-60000));avatarUrlCache.set(key,{url:a.url,expiresAt:Date.now()+ttl});return a.url||''}catch{return''}})().finally(()=>avatarUrlRequests.delete(key));
    avatarUrlRequests.set(key,request);return request;
  }
  function clearAvatarElement(el){
    if(!el||!isAvatarElement(el))return;
    el.querySelectorAll?.(':scope > .pngeaAvatarImg').forEach(x=>x.remove());
    el.classList.remove('pngeaAvatarReady','hasProfileImage');
    if(el.dataset.pngeaAvatarFallback!==undefined&& !el.textContent.trim())el.textContent=el.dataset.pngeaAvatarFallback;
  }
  function sanitizeAvatarPaint(root=document){
    root.querySelectorAll?.('[data-profile]').forEach(el=>{
      if(isAvatarElement(el))return;
      el.classList.remove('pngeaAvatarReady','hasProfileImage');
      el.querySelectorAll?.(':scope > .pngeaAvatarImg').forEach(x=>x.remove());
      // 0.51.4 painted avatar URLs directly onto identity wrappers. Remove that legacy damage.
      el.style.removeProperty('background-image');el.style.removeProperty('background-size');el.style.removeProperty('background-position');el.style.removeProperty('background-repeat');
    });
  }
  function paintAvatarElement(el,url){
    if(!el||!url||!isAvatarElement(el))return;
    if(el.dataset.pngeaAvatarFallback===undefined)el.dataset.pngeaAvatarFallback=(el.textContent||'').trim();
    el.classList.add('pngeaAvatarReady');
    el.style.removeProperty('background-image');el.style.removeProperty('background-size');el.style.removeProperty('background-position');el.style.removeProperty('background-repeat');
    let img=el.querySelector(':scope > .pngeaAvatarImg');
    if(!img){img=document.createElement('img');img.className='pngeaAvatarImg';img.alt='';img.setAttribute('aria-hidden','true');el.textContent='';el.appendChild(img)}
    if(img.src!==url){img.onload=()=>el.classList.add('pngeaAvatarReady');img.onerror=()=>{img.remove();el.classList.remove('pngeaAvatarReady');if(!el.textContent)el.textContent=el.dataset.pngeaAvatarFallback||''};img.src=url}
  }
  async function resolvedAvatarUrl(handle){
    const h=norm(handle),id=avatarMediaByHandle.get(h);return id?avatarUrlFor(id):(avatarDirectByHandle.get(h)||'');
  }
  async function applyKnownAvatars(root=document){
    if(!liveAPI()?.state?.active)return;ingestAvatarPerson(liveAPI()?.state?.me);sanitizeAvatarPaint(root);
    const self=serverHandle(),jobs=[];
    const selector='[data-profile].avatar,[data-profile].xAvatar,[data-profile].sideAvatar,[data-profile].sideMini,[data-profile].pngeaDetailAvatar';
    root.querySelectorAll?.(selector).forEach(el=>{
      let h=norm(el.dataset.profile);if(h==='you')h=self;
      jobs.push(resolvedAvatarUrl(h).then(url=>{if(norm(el.dataset.profile||'')!==h&&!(norm(el.dataset.profile)==='you'&&h===serverHandle()))return;if(url)paintAvatarElement(el,url);else clearAvatarElement(el)}));
    });
    const selfUrl=await resolvedAvatarUrl(self);
    const selfTargets=$$('.sideAvatar,.sideMini,#youButton,.selfAvatarFallback:not(#Profile .xAvatar.big)');
    selfTargets.forEach(el=>selfUrl?paintAvatarElement(el,selfUrl):clearAvatarElement(el));
    await Promise.allSettled(jobs);
  }
  function applyLiveMediaEdits(root=document){
    root.querySelectorAll?.('.liveMediaRail[data-media-rail]').forEach(rail=>{
      const media=postMediaById.get(String(rail.dataset.mediaRail))||[];
      [...rail.children].forEach((el,i)=>applyMediaEdit(el,media[i]?.edit||media[i]?.edit_json));
    });
  }
  ingestAvatarPerson(liveAPI()?.state?.me);

  function profileWebsite(value){const raw=String(value||'').trim();if(!raw)return null;try{const url=new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw)?raw:`https://${raw}`);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;return{href:url.href,label:url.host+(url.pathname==='/'?'':url.pathname)}}catch{return null}}
  function renderProfileMeta(person={}){const host=$('#Profile .profileMeta');if(!host)return;const location=String(person.location||'').trim(),website=profileWebsite(person.website),date=new Date(person.joined_at||person.created_at||''),joined=Number.isFinite(date.getTime())?new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(date):'',key=JSON.stringify([location,website?.href||'',joined]);host.classList.add('pngeaProfileMeta');if(host.dataset.profileMetaKey===key)return;host.dataset.profileMetaKey=key;host.innerHTML=`${location||website?`<div class="pngeaProfileMetaRow">${location?`<span class="pngeaProfileLocation"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></svg><span>${escapeHTML(location)}</span></span>`:''}${website?`<a class="pngeaProfileWebsite" href="${escapeHTML(website.href)}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 13 4-4m-7 6-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m4 3 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 0)"/></svg><span>${escapeHTML(website.label)}</span></a>`:''}</div>`:''}${joined?`<div class="pngeaProfileJoined"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/></svg><span>Joined ${escapeHTML(joined)}</span></div>`:''}`}
  function syncSidebarCounts(person=liveAPI()?.state?.me){const live=liveAPI()?.state;if(!live?.active||!person||person.id!==live.me?.id)return;$('#sideFollowing')&&($('#sideFollowing').textContent=Math.max(0,Number(person.following)||0).toLocaleString());$('#sideFollowers')&&($('#sideFollowers').textContent=Math.max(0,Number(person.followers)||0).toLocaleString());if($('#sideStats'))$('#sideStats').hidden=false}
  function renderProfileCounts(person){const stats=$('#Profile .profileStats');if(!stats)return;if(stats.children.length!==2||!stats.children[0].querySelector('b'))stats.innerHTML='<span><b></b>Following</span><span><b></b>Followers</span>';for(const [index,key]of [[0,'following'],[1,'followers']]){const value=Math.max(0,Number(person[key])||0).toLocaleString(),number=stats.children[index].querySelector('b');if(number.textContent!==value)number.textContent=value}}
  function applySocialCounts(data={}){const live=liveAPI()?.state;if(!live?.active)return;for(const count of data.counts||[]){if(!count?.userId)continue;const values={followers:Math.max(0,Number(count.followers)||0),following:Math.max(0,Number(count.following)||0)};if(count.userId===live.me?.id){Object.assign(live.me,values);syncSidebarCounts(live.me)}if(count.userId===profilePerson?.id){Object.assign(profilePerson,values);if(ui.parseRoute()?.screen==='Profile')renderProfileCounts(profilePerson)}}}
  window.addEventListener('pngea:social',event=>applySocialCounts(event.detail));window.addEventListener('pngea:realtime',event=>{if(event.detail?.type==='social.updated')applySocialCounts(event.detail.data)});
  const profileSocialShade=document.createElement('div');profileSocialShade.id='pngeaProfileSocialShade';profileSocialShade.className='pngeaProfileSocialShade';profileSocialShade.innerHTML='<div id="pngeaProfileSocialSheet" role="dialog" aria-modal="true"></div>';document.body.appendChild(profileSocialShade);
  function closeProfileSocialSheet(){profileSocialShade.classList.remove('show');$('#pngeaProfileSocialSheet').replaceChildren()}
  profileSocialShade.onclick=e=>{if(e.target===profileSocialShade)closeProfileSocialSheet()};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&profileSocialShade.classList.contains('show'))closeProfileSocialSheet()});
  function profileActionSheet({title='',handle='',kind='actions',rows=[]}){const host=$('#pngeaProfileSocialSheet');host.dataset.kind=kind;host.innerHTML=`${title?`<h3>${escapeHTML(title)}</h3>`:''}${handle?`<small>@${escapeHTML(handle)}</small>`:''}`;rows.forEach(row=>{const button=document.createElement('button');button.type='button';button.textContent=row.label;if(row.danger)button.dataset.danger='true';if(row.mode){button.setAttribute('role','radio');button.setAttribute('aria-checked',String(row.selected));button.dataset.notificationMode=row.mode;button.appendChild(document.createElement('i'))}button.onclick=async()=>{if(button.disabled)return;button.disabled=true;try{await row.action?.();closeProfileSocialSheet()}catch(err){button.disabled=false;ui.toast?.(err.message||'Could not update account')}};host.appendChild(button)});profileSocialShade.classList.add('show')}
  const profileURL=handle=>`${location.origin}${location.pathname}#/profile/${encodeURIComponent(norm(handle))}`;
  async function shareProfileOutside(person){const url=profileURL(person.handle);if(navigator.share){try{await navigator.share({title:person.display_name||person.handle,url});return}catch(err){if(err.name==='AbortError')return}}await navigator.clipboard.writeText(url);ui.toast?.('Profile link copied')}
  function openAccountNotifications(){const person=profilePerson;if(!person?.id)return;profileActionSheet({title:'Account notifications',handle:person.handle,rows:[['none','None'],['posts','All posts'],['posts_replies','All posts and replies']].map(([mode,label])=>({mode,label,selected:(person.viewer_post_notifications||'none')===mode,action:async()=>{const result=await api.request(`/v1/users/${encodeURIComponent(person.id)}/post-notifications`,{method:'PUT',body:JSON.stringify({mode})});person.viewer_post_notifications=result?.mode||mode;if(profilePerson?.id===person.id)$('#pngeaProfileNotifications').dataset.active=String(person.viewer_post_notifications!=='none')}}))})}
  function openProfileMenu(){const person=profilePerson;if(!person?.id)return;profileActionSheet({kind:'menu',rows:[{label:'Share',action:()=>shareProfileOutside(person)},{label:person.viewer_muted?'Unmute':'Mute',action:async()=>{const muted=!person.viewer_muted;await api.request(`/v1/users/${encodeURIComponent(person.id)}/mute`,{method:muted?'PUT':'DELETE'});person.viewer_muted=muted;await liveAPI()?.loadFeed?.();ui.toast?.(muted?'Account muted':'Account unmuted')}},{label:'Block',danger:true,action:async()=>{await api.request(`/v1/users/${encodeURIComponent(person.id)}/block`,{method:'PUT'});profilePerson=null;ui.navigate('Home');await Promise.allSettled([liveAPI()?.loadFeed?.(),liveAPI()?.loadConversations?.()]);ui.toast?.('Account blocked')}}]})}
  function renderProfileControls(person,self){
    const edit=$('#Profile .profileEdit'),avatarRow=$('#Profile .profileAvatarRow'),stats=$('#Profile .profileStats');if(!edit||!avatarRow||!stats)return;
    let tools=$('#pngeaProfileTools'),actions=$('#pngeaProfileActions');if(!tools){tools=document.createElement('div');tools.id='pngeaProfileTools';tools.className='pngeaProfileTools';tools.innerHTML='<button id="pngeaProfileNotifications" aria-label="Account notifications"><svg viewBox="0 0 24 24"><path d="M16 4a7 7 0 0 0-11 6c0 5-2 6-2 6h15M9 20a3 3 0 0 0 5 0M19 2v8m-4-4h8"/></svg></button><button id="pngeaProfileShare" aria-label="Send account"><svg viewBox="0 0 24 24"><path d="m21 3-7 18-4-8-8-4 19-6Zm0 0L10 13"/></svg></button>';avatarRow.appendChild(tools);$('#pngeaProfileNotifications').onclick=openAccountNotifications;$('#pngeaProfileShare').onclick=()=>openSendProfile(profilePerson?.handle)}
    if(!actions){actions=document.createElement('div');actions.id='pngeaProfileActions';actions.className='pngeaProfileActions';actions.innerHTML='<button id="pngeaProfileMessage" type="button"></button>';stats.after(actions);$('#pngeaProfileMessage').onclick=async()=>{const button=$('#pngeaProfileMessage'),person=profilePerson;if(!person?.id||button.disabled)return;if(button.dataset.profilePurpose==='self-share'){await openSendProfile(person.handle,{followingOnly:true});return}button.disabled=true;try{const conversation=await api.createConversation({memberIds:[person.id]});ui.navigate('Inbox',conversation.id)}catch(err){ui.toast?.(err.message||'Could not open chat')}finally{button.disabled=false}}}
    edit.style.removeProperty('display');edit.dataset.profileAction=self?'edit':'follow';edit.dataset.userId=person.id||person.user_id||'';edit.dataset.viewerFollowing=person.viewer_following?'1':'0';edit.textContent=self?'Edit profile':person.viewer_following?'Following':'Follow';edit.classList.toggle('following',!!person.viewer_following);edit.setAttribute('role','button');edit.tabIndex=0;
    const message=$('#pngeaProfileMessage'),purpose=self?'self-share':'message';if(message.dataset.profilePurpose!==purpose){message.dataset.profilePurpose=purpose;message.innerHTML=self?'Share profile':'<svg viewBox="0 0 24 24"><path d="M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z"/></svg>Message';message.setAttribute('aria-label',self?'Share profile':'Message')}if(self)edit.onclick=openProfileEditor;
    actions.appendChild(edit);tools.hidden=self;actions.hidden=false;if(!self)$('#pngeaProfileNotifications').dataset.active=String((person.viewer_post_notifications||'none')!=='none');
    tools.style.display=self?'none':'';actions.style.removeProperty('display');
  }
  window.addEventListener('click',e=>{if(!e.target.closest?.('#Profile .xTop>.xAction'))return;const route=ui.parseRoute(),handle=norm(route.detail||serverHandle());if(handle===serverHandle()||handle==='you')return;e.preventDefault();e.stopImmediatePropagation();openProfileMenu()},true);
  window.addEventListener('pngea:route',()=>closeProfileSocialSheet());
  let profileRenderSeq=0;
  async function enhanceProfile(handleArg=null){
    const seq=++profileRenderSeq;
    const live=liveAPI()?.state;if(!live?.active||!ui?.parseRoute)return;
    const route=ui.parseRoute();if(route.screen!=='Profile')return;
    const requestedRaw=norm(handleArg||route.detail||live.me?.handle),requested=requestedRaw==='you'?serverHandle():requestedRaw;if(!requested)return;
    try{
      const self=requested===serverHandle()||requested===getAlias();
      const realHandle=self?serverHandle():requested;
      const [profile,posts]=await Promise.all([api.getUser(realHandle),self?api.myPosts():api.userPosts(realHandle)]);
      ingestAvatarPerson(profile);
      if(seq!==profileRenderSeq||ui.parseRoute()?.screen!=='Profile'||(norm(ui.parseRoute().detail||serverHandle())==='you'?serverHandle():norm(ui.parseRoute().detail||serverHandle()))!==requested)return;
      profilePerson=profile;
      if(self&&profile.id===live.me?.id){Object.assign(live.me,profile);syncSidebarCounts(live.me)}
      $('#Profile .profileName').textContent=profile.display_name||profile.handle;$('#Profile .profileHandle').textContent='@'+profile.handle;$('#Profile .profileBio').textContent=profile.bio||'';$('#Profile .xTopTitle b').textContent=profile.display_name||profile.handle;
      const av=$('#Profile .xAvatar.big');if(av){av.classList.remove('selfAvatarFallback');if(norm(av.dataset.profile)!==norm(profile.handle)){clearAvatarElement(av);av.dataset.profile=profile.handle;av.textContent=(profile.display_name||profile.handle||'?')[0].toUpperCase()}}
      renderProfileMeta(profile);renderProfileCounts(profile);
      renderProfileControls(profile,self);
      const items=stablePosts(posts.items||[]);const count=Number(profile.posts_count??items.filter(p=>!p.reply_to_id).length);$('#Profile .xTopTitle small').textContent=`${count.toLocaleString()} ${count===1?'post':'posts'}`;
      items.forEach(p=>{if(p?.id)postMediaById.set(String(p.id),p.media||[])});
      const host=$('#p-posts');
      if(host){
        const mainPosts=items.filter(p=>!p.reply_to_id);host.dataset.pngeaProfileOwner='515';
        if(mainPosts.length)await syncPostList(host,mainPosts,profile);else host.innerHTML='<div class="profileEmpty"><b>No posts yet</b>Your posts will appear here.</div>';
      }
      const replies=$('#p-replies');
      if(replies){
        const reps=items.filter(p=>p.reply_to_id);replies.dataset.pngeaProfileOwner='515';if(reps.length)await syncPostList(replies,reps,profile);else replies.innerHTML='<div class="profileEmpty"><b>No replies yet</b>Your replies will appear here.</div>';
      }
      const mediaHost=$('#p-media');
      const mediaGridKey=JSON.stringify(items.filter(p=>p.media?.length).map(p=>[p.id,p.media.map(m=>[m.id,m.edit||m.edit_json])]));
      if(mediaHost&&mediaHost.dataset.mediaGridKey!==mediaGridKey){
        mediaHost.dataset.mediaGridKey=mediaGridKey;
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
      decorateActions($('#Profile')||document);
      await Promise.allSettled([applyProfileArt(),applyKnownAvatars($('#Profile')||document)]);
    }catch(err){if(seq!==profileRenderSeq||ui.parseRoute()?.screen!=='Profile')return;if(Number(err?.status)===404){profilePerson=null;renderProfileMeta({});$('#Profile .profileName').textContent='Account unavailable';$('#Profile .profileHandle').textContent='';$('#Profile .profileBio').textContent='';$('#Profile .xTopTitle b').textContent='Profile';$('#Profile .xTopTitle small').textContent='';$('#Profile .profileStats').replaceChildren();const avatar=$('#Profile .xAvatar.big');if(avatar){clearAvatarElement(avatar);avatar.removeAttribute('data-profile');avatar.textContent=''}const cover=$('#Profile .profileCover');if(cover){cover.style.backgroundImage='';delete cover.dataset.profileArtKey;cover.dataset.profileArtPending='unavailable'}$('#pngeaProfileActions')?.setAttribute('style','display:none');$('#pngeaProfileTools')?.setAttribute('style','display:none');$('#Profile .profileEdit')?.setAttribute('style','display:none');for(const id of ['p-posts','p-replies','p-media']){const host=$('#'+id);if(host){host.innerHTML='<div class="profileEmpty">This account is unavailable.</div>';delete host.dataset.mediaGridKey}}}else ui.toast?.(err?.message||'Could not load profile')}
  }

  /* ---------- Post detail + reply threads + unified reactions ---------- */
  const reactionLocks=new Set(),reactionVersions=new Map();

  function actionCount(el){
    const d=Number(el?.dataset?.count);
    if(Number.isFinite(d))return d;
    const m=String(el?.textContent||'').match(/([0-9][0-9,]*)\s*$/);return m?Number(m[1].replace(/,/g,'')):0;
  }
  function actionMarkup(kind,count=0,on=false){
    const icon=ICONS[kind]||'';
    const n=Math.max(0,Number(count||0));
    return `${icon}${kind==='share'||kind==='save'?'':`<span class="pngeaActionCount">${n.toLocaleString()}</span>`}`;
  }
  function paintAction(el,kind,on,count){
    if(!el)return;
    const n=Math.max(0,Number(count||0));
    el.classList.toggle('activeAction',!!on);el.dataset.count=String(n);
    const key=`${kind}:${n}:${!!on}`;if(!el.querySelector('svg'))el.innerHTML=actionMarkup(kind,n,on);else{const count=el.querySelector('.pngeaActionCount');if(count&&count.textContent!==n.toLocaleString())count.textContent=n.toLocaleString()}el.dataset.renderedAction=key;
  }
  function stateFor(id){
    const k=String(id),cur=reactionState.get(k);
    if(cur)return cur;
    const post=document.querySelector(`[data-server-post="${CSS.escape(k)}"]`);
    const grab=kind=>post?.querySelector(`[data-live-action="${kind}"]`);
    const st={liked:!!grab('like')?.classList.contains('activeAction'),reposted:!!grab('repost')?.classList.contains('activeAction'),
      likes:actionCount(grab('like')),reposts:actionCount(grab('repost')),replies:actionCount(grab('reply'))};
    reactionState.set(k,st);return st;
  }
  function matchingActions(id,kind){
    return [...document.querySelectorAll(`[data-server-post="${CSS.escape(String(id))}"] [data-live-action="${kind}"]`)];
  }
  function paintPostState(id){
    const st=stateFor(id);
    matchingActions(id,'reply').forEach(el=>paintAction(el,'reply',false,st.replies));
    matchingActions(id,'repost').forEach(el=>paintAction(el,'repost',st.reposted,st.reposts));
    matchingActions(id,'like').forEach(el=>paintAction(el,'like',st.liked,st.likes));
    matchingActions(id,'share').forEach(el=>paintAction(el,'share',false,0));
    matchingActions(id,'save').forEach(el=>{paintAction(el,'save',savedPosts.get(String(id))||false,0);el.setAttribute('aria-pressed',String(savedPosts.get(String(id))||false))});
  }
  function decorateActions(root=document){
    root.querySelectorAll?.('[data-server-post]').forEach(post=>{
      const id=post.dataset.serverPost;if(!id)return;
      const existing=reactionState.get(String(id));
      if(!existing){
        const q=k=>post.querySelector(`[data-live-action="${k}"]`);
        reactionState.set(String(id),{
          liked:!!q('like')?.classList.contains('activeAction'),reposted:!!q('repost')?.classList.contains('activeAction'),
          likes:actionCount(q('like')),reposts:actionCount(q('repost')),replies:actionCount(q('reply'))
        });
      }
      paintPostState(id);
    });
  }
  async function reconcilePostState(id){
    const version=reactionVersions.get(String(id))||0;
    try{const p=await api.post(id);if(version!==(reactionVersions.get(String(id))||0)||reactionLocks.has(`like:${id}`)||reactionLocks.has(`repost:${id}`))return;ingestPostState(p,{force:true});paintPostState(id);if($('#pngeaPostPage').classList.contains('show')&&$('#pngeaPostPage').dataset.postId===String(id))updateDetailHeaderCounts(p)}catch{}
  }
  function bumpReplyCount(id,delta){
    const st=stateFor(id);st.replies=Math.max(0,st.replies+delta);reactionState.set(String(id),st);paintPostState(id);
  }

  async function renderMediaInto(host,media=[]){
    return hydrateProfileRail(host,media);
  }
  function postInitials(p){return escapeHTML(String(p?.display_name||p?.handle||'?').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase())}
  function detailPostHTML(p,{reply=false}={}){
    rememberPost(p);ingestPostState(p);const format=postFormat(p),photo=format==='gallery',caption=['gallery','reel','video'].includes(format),copy=`<div class="pngeaDetailText">${mentionHTML(p.text)}</div>`,rail=`<div class="pngeaDetailMedia" data-post-media="${escapeHTML(p.id)}"></div>`;
    return `<article class="${reply?'pngeaReplyItem':'pngeaDetailPost'}" data-server-post="${escapeHTML(p.id)}">
      <div class="pngeaDetailWho"><div class="pngeaDetailAvatar" data-profile="${escapeHTML(p.handle)}">${postInitials(p)}</div>
      <div class="pngeaDetailName" data-profile="${escapeHTML(p.handle)}"><b>${escapeHTML(p.display_name||p.handle)}</b><span>@${escapeHTML(displayHandle(p.handle))} · ${escapeHTML(relativeTime(p.created_at))}</span></div></div>
      <button class="more pngeaDetailMore" aria-label="Post options" type="button">•••</button>${p.title?`<h1 class="pngeaLongTitle">${escapeHTML(p.title)}</h1>`:''}${photo?rail+postActionsHTML(p,true)+copy:caption?rail+copy:copy+rail}
      ${reply?'':`<div class="pngeaDetailMeta">${p.created_at&&Number.isFinite(Date.parse(p.created_at))?new Date(p.created_at).toLocaleString():''}</div>`}
      <div class="${reply?'xPostActions':'pngeaDetailActions'}"${photo?' hidden':''}>
        <span data-live-action="reply"></span><span data-live-action="repost"></span><span data-live-action="like"></span><span data-live-action="share"></span>
      </div>
    </article>`;
  }

  const postPage=document.createElement('section');postPage.id='pngeaPostPage';
  postPage.innerHTML=`<div class="pngeaPostTop"><button id="pngeaPostBack" aria-label="Back">‹</button><b>Post</b><span></span></div>
    <div id="pngeaPostScroll"><div id="pngeaPostBody"></div><div class="pngeaReplyList" id="pngeaReplyList"></div></div>
    <div id="pngeaPostReplyBar"><div id="pngeaReplyingTo"></div><div id="pngeaPostReplyRow"><textarea id="pngeaPostReplyInput" rows="1" placeholder="Post your reply"></textarea><button class="pngeaReplySend" id="pngeaPostReplySend">Reply</button></div>
    <div class="pngeaReplyTools"><button data-detail-pick="gallery" aria-label="Gallery">${ICONS.gallery}</button><button data-detail-pick="camera" aria-label="Camera">${ICONS.camera}</button><button data-detail-pick="voice" aria-label="Voice">${ICONS.mic}</button></div><div id="pngeaDetailAttachments"></div></div>`;
  document.body.appendChild(postPage);

  const photoCommentsShade=document.createElement('div');photoCommentsShade.id='pngeaCommentsShade';document.body.appendChild(photoCommentsShade);
  const commentsHandle=document.createElement('button');commentsHandle.id='pngeaCommentsHandle';commentsHandle.type='button';commentsHandle.setAttribute('aria-label','Expand comments');commentsHandle.innerHTML='<span></span>';postPage.prepend(commentsHandle);
  let photoCommentLocks=[],photoCommentsReturn=null,detailReplyParentId=null;
  function releasePhotoComments(){
    for(const [element,inert] of photoCommentLocks)element.inert=inert;photoCommentLocks=[];photoCommentsShade.classList.remove('show');postPage.classList.remove('pngeaPhotoComments');delete postPage.dataset.commentsExpanded;postPage.style.removeProperty('transform');postPage.querySelector('.pngeaPostTop b').textContent='Post';detailReplyParentId=null;
  }
  function closePhotoComments(){const restore=photoCommentsReturn;photoCommentsReturn=null;if(restore){releasePhotoComments();loadPostPage(restore)}else closePostPage();queueKeyboard()}
  function openPhotoComments(id){
    photoCommentsReturn=postPage.classList.contains('show')&&!postPage.classList.contains('pngeaPhotoComments')?postPage.dataset.postId:null;
    if(!photoCommentLocks.length)for(const element of [APP,$('#dmThread')])if(element){photoCommentLocks.push([element,element.inert]);element.inert=true}
    postPage.classList.add('pngeaPhotoComments');postPage.dataset.commentsExpanded='false';photoCommentsShade.classList.add('show');postPage.querySelector('.pngeaPostTop b').textContent='Comments';detailReplyParentId=null;loadPostPage(id);queueKeyboard();
  }
  function photoCommentHTML(p){return `<div class="pngeaCommentThread" data-comment-thread="${escapeHTML(p.id)}">${detailPostHTML(p,{reply:true})}${Number(p.replies)>0?`<button type="button" class="pngeaMoreReplies" data-comment-expand="${escapeHTML(p.id)}" aria-expanded="false">View ${Number(p.replies)} more ${Number(p.replies)===1?'reply':'replies'}</button><div class="pngeaCommentChildren" hidden></div>`:''}</div>`}
  photoCommentsShade.onclick=closePhotoComments;
  let commentsDrag=null;
  commentsHandle.onpointerdown=event=>{commentsDrag={y:event.clientY};commentsHandle.setPointerCapture(event.pointerId);event.preventDefault()};
  commentsHandle.onpointermove=event=>{if(!commentsDrag)return;const delta=event.clientY-commentsDrag.y;if(delta>0)postPage.style.transform=`translateY(${Math.min(180,delta)}px)`};
  commentsHandle.onpointerup=event=>{if(!commentsDrag)return;const delta=event.clientY-commentsDrag.y;commentsDrag=null;postPage.style.removeProperty('transform');if(delta>85){if(postPage.dataset.commentsExpanded==='true'){postPage.dataset.commentsExpanded='false';queueKeyboard()}else closePhotoComments()}else if(delta<-35||Math.abs(delta)<8){postPage.dataset.commentsExpanded=String(postPage.dataset.commentsExpanded!=='true');queueKeyboard()}};
  commentsHandle.onpointercancel=()=>{commentsDrag=null;postPage.style.removeProperty('transform')};
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&postPage.classList.contains('pngeaPhotoComments'))closePhotoComments()});
  postPage.addEventListener('click',async event=>{const button=event.target.closest('[data-comment-expand]');if(!button)return;const host=button.nextElementSibling;if(!host.hidden){host.hidden=true;button.setAttribute('aria-expanded','false');return}button.disabled=true;try{const data=await api.postReplies(button.dataset.commentExpand,{limit:100});if(!button.isConnected)return;host.innerHTML=(data.items||[]).map(photoCommentHTML).join('');host.hidden=false;button.setAttribute('aria-expanded','true');decorateActions(host);for(const item of data.items||[])renderMediaInto(host.querySelector(`[data-server-post="${CSS.escape(String(item.id))}"] [data-post-media]`),item.media||[])}catch(error){ui.toast?.(error.message||'Could not load replies')}finally{button.disabled=false}});

  let detailReplyFiles=[];
  function renderDetailAttachments(){
    const host=$('#pngeaDetailAttachments');if(!host)return;host.innerHTML='';
    detailReplyFiles.forEach(f=>{const u=URL.createObjectURL(f);previewURLs.push(u);const e=document.createElement(f.type.startsWith('audio/')?'audio':f.type.startsWith('video/')?'video':'img');e.src=u;if(e.tagName==='AUDIO'||e.tagName==='VIDEO')e.controls=true;host.appendChild(e)});
  }
  function updateDetailHeaderCounts(p){if(p)ingestPostState(p);paintPostState(postPage.dataset.postId)}
  async function loadPostPage(id){
    if(!id)return;recordHistory({kind:'post_view',objectType:'post',objectId:id,label:'Viewed a post'});postPage.dataset.postId=String(id);postPage.classList.add('show');ROOT.classList.add('pngeaPostOpen');
    $('#pngeaPostBody').innerHTML='<div class="profileEmpty">Loading post…</div>';$('#pngeaReplyList').innerHTML='';
    try{
      const p=await api.post(id);if(postPage.dataset.postId!==String(id))return;ingestPostState(p);postPage.dataset.wordReply=String(isWordReplyPost(p)&&!postPage.classList.contains('pngeaPhotoComments'));$('#pngeaPostReplyInput').readOnly=postPage.dataset.wordReply==='true';
      $('#pngeaReplyingTo').innerHTML=`Replying to <button type="button" class="pngeaMention" data-profile="${escapeHTML(p.handle)}">@${escapeHTML(p.handle)}</button>`;
      $('#pngeaPostBody').innerHTML=detailPostHTML(p);
      if(!postPage.classList.contains('pngeaPhotoComments'))await renderMediaInto($('#pngeaPostBody [data-post-media]'),p.media||[]);
      let replies=[];
      try{const d=await api.postReplies(id,{limit:100});replies=d.items||[];replies.forEach(ingestPostState)}catch{}
      if(postPage.dataset.postId!==String(id))return;const list=$('#pngeaReplyList');list.innerHTML=replies.length?replies.map(x=>postPage.classList.contains('pngeaPhotoComments')?photoCommentHTML(x):detailPostHTML(x,{reply:true})).join(''):'<div class="profileEmpty"><b>No replies yet</b>Start the conversation.</div>';
      for(const r of replies)await renderMediaInto(list.querySelector(`[data-server-post="${CSS.escape(String(r.id))}"] [data-post-media]`),r.media||[]);
      decorateActions(postPage);
    }catch(err){$('#pngeaPostBody').innerHTML=`<div class="profileEmpty"><b>Could not load post</b>${escapeHTML(err?.message||'Try again.')}</div>`}
  }
  let postReturnContext=null;
  function openPostPage(id){
    releasePhotoComments();
    const route=ui?.parseRoute?.(),account=api.getActiveAccountKey?.()||liveAPI()?.state?.me?.id||'';
    if(!location.hash.startsWith('#/post/')){const mini=activeMiniChat();postReturnContext=route?{account,screen:route.screen,detail:route.detail,...(mini?{miniId:mini.id}:{})}:null;if(mini){closeMiniChat({restoreMain:false});ui.renderThreadRoute?.(route)}else if(route?.screen==='Inbox'&&route.detail){saveDmDraft();clearOutgoingTyping();if(dmThread514?.contains(document.activeElement))document.activeElement.blur()}}
    const hash=`#/post/${encodeURIComponent(id)}`;
    if(location.hash!==hash)history.pushState(null,'',hash);
    return loadPostPage(id);
  }
  function closePostPage(){
    releasePhotoComments();
    postPage.classList.remove('show');ROOT.classList.remove('pngeaPostOpen');postPage.dataset.postId='';detailReplyFiles=[];renderDetailAttachments();
  }
  function syncPostRoute(){
    const m=(location.hash||'').match(/^#\/post\/([^/?#]+)/);
    if(m)loadPostPage(decodeURIComponent(m[1]));else closePostPage();
  }
  $('#pngeaPostBack').onclick=()=>{if(postPage.classList.contains('pngeaPhotoComments')){closePhotoComments();return}const previous=postReturnContext;postReturnContext=null;closePostPage();if((location.hash||'').startsWith('#/post/')){const account=api.getActiveAccountKey?.()||liveAPI()?.state?.me?.id||'';if(previous?.account===account){ui.navigate(previous.screen,previous.detail);if(previous.miniId)openMiniChat(previous.miniId)}else ui.navigate('Home')}};
  window.addEventListener('popstate',syncPostRoute);window.addEventListener('hashchange',syncPostRoute);
  setTimeout(syncPostRoute,100);

  function chooseReplyMedia(camera=false){const input=document.createElement('input');input.type='file';input.accept='image/*,video/*';input.multiple=!camera;if(camera)input.setAttribute('capture','environment');input.onchange=()=>{detailReplyFiles=validateFiles([...detailReplyFiles,...input.files]);renderDetailAttachments();input.remove()};document.body.appendChild(input);input.click()}
  document.addEventListener('click',e=>{const button=e.target.closest?.('[data-detail-pick]');if(!button)return;e.preventDefault();const kind=button.dataset.detailPick;if(postPage.dataset.wordReply==='true'&&!postPage.classList.contains('pngeaPhotoComments')){openWordReply(postPage.dataset.postId,{text:$('#pngeaPostReplyInput').value,files:detailReplyFiles});if(kind==='voice')startVoiceRecorder('post');else(kind==='camera'?cameraInput:galleryInput).click();return}if(kind==='voice')startVoiceRecorder('detailReply');else chooseReplyMedia(kind==='camera')},true);
  document.addEventListener('focusin',event=>{if(event.target?.id==='pngeaPostReplyInput'&&event.target.readOnly&&postPage.dataset.wordReply==='true')openWordReply(postPage.dataset.postId,{text:event.target.value,files:detailReplyFiles})});

  async function uploadReplyFiles(files=[]){
    const ids=[];for(const f of files)ids.push(await uploadMedia(f));return ids;
  }
  async function submitReply(parentId,text,files=[]){
    text=String(text||'').trim();if(!text&&!files.length)return null;
    if(wordLength(text)>280)throw new Error('Replies can contain up to 280 characters');
    await ensureSession(false);const mediaIds=await uploadReplyFiles(files);
    let created;
    try{created=await api.createPost({text,visibility:'public',replyToId:parentId,mediaIds})}
    catch(err){if(mediaIds.length&&mediaNotReadyError(err)){await waitMedia(mediaIds);created=await api.createPost({text,visibility:'public',replyToId:parentId,mediaIds})}else throw err}
    bumpReplyCount(parentId,1);return created;
  }
  $('#pngeaPostReplySend').onclick=async()=>{
    const id=postPage.dataset.postId;if(!id)return;if(postPage.dataset.wordReply==='true'&&!postPage.classList.contains('pngeaPhotoComments')){openWordReply(id,{text:$('#pngeaPostReplyInput').value,files:detailReplyFiles});return}const b=$('#pngeaPostReplySend');b.disabled=true;
    try{await submitReply(detailReplyParentId||id,$('#pngeaPostReplyInput').value,detailReplyFiles);detailReplyParentId=null;$('#pngeaPostReplyInput').value='';detailReplyFiles=[];renderDetailAttachments();await loadPostPage(id);await Promise.allSettled([liveAPI()?.loadFeed?.(),enhanceProfile()])}
    catch(err){ui?.toast?.(err?.message||'Could not reply')}finally{b.disabled=false}
  };

  const mentionSuggestions=document.createElement('div');mentionSuggestions.id='pngeaMentionSuggestions';mentionSuggestions.hidden=true;mentionSuggestions.setAttribute('role','listbox');document.body.appendChild(mentionSuggestions);let mentionTimer=0,mentionSequence=0,mentionTarget=null;
  function mentionToken(input){const before=input.value.slice(0,input.selectionStart),match=before.match(/(?:^|[\s(])@([A-Za-z0-9_]{0,30})$/);return match?{query:match[1],start:before.length-match[1].length-1,end:before.length}:null}
  document.addEventListener('input',e=>{if(!['postText','pngeaPostReplyInput'].includes(e.target?.id))return;clearTimeout(mentionTimer);const input=e.target,token=mentionToken(input),sequence=++mentionSequence;mentionSuggestions.hidden=true;if(!token?.query)return;mentionTimer=setTimeout(async()=>{try{const result=await api.search(token.query);if(sequence!==mentionSequence||document.activeElement!==input)return;const people=(result.people||[]).filter(p=>p.handle).slice(0,6);mentionTarget={input,...token};mentionSuggestions.innerHTML=people.map(p=>`<button type="button" role="option" data-mention-handle="${escapeHTML(p.handle)}">@${escapeHTML(p.handle)} · ${escapeHTML(p.display_name||p.handle)}</button>`).join('');const rect=input.getBoundingClientRect(),height=Math.min(190,people.length*42),bottom=(visualViewport?.offsetTop||0)+(visualViewport?.height||innerHeight);mentionSuggestions.style.left=`${Math.max(8,rect.left)}px`;mentionSuggestions.style.width=`${Math.min(360,innerWidth-16,Math.max(240,rect.width))}px`;mentionSuggestions.style.top=`${rect.bottom+height<bottom?rect.bottom:Math.max(8,rect.top-height)}px`;mentionSuggestions.hidden=!people.length}catch{}},180)});
  mentionSuggestions.addEventListener('pointerdown',e=>e.preventDefault());mentionSuggestions.onclick=e=>{const option=e.target.closest('[data-mention-handle]');if(!option||!mentionTarget)return;const {input,start,end}=mentionTarget,insert=`@${option.dataset.mentionHandle} `;input.value=input.value.slice(0,start)+insert+input.value.slice(end);input.setSelectionRange(start+insert.length,start+insert.length);input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();mentionSuggestions.hidden=true};
  window.addEventListener('click',e=>{if(!mentionSuggestions.contains(e.target)&&e.target!==mentionTarget?.input)mentionSuggestions.hidden=true});

  async function toggleReaction(id,kind,action){
    const lock=`${kind}:${id}`;if(reactionLocks.has(lock))return;reactionLocks.add(lock);const version=(reactionVersions.get(String(id))||0)+1;reactionVersions.set(String(id),version);
    const st=stateFor(id),prev={...st},nextOn=kind==='like'?!st.liked:!st.reposted;
    if(kind==='like'){st.liked=nextOn;st.likes=Math.max(0,st.likes+(nextOn?1:-1))}
    else{st.reposted=nextOn;st.reposts=Math.max(0,st.reposts+(nextOn?1:-1))}
    reactionState.set(String(id),st);reactionDirtyUntil.set(String(id),Date.now()+3000);paintPostState(id);matchingActions(id,kind).forEach(x=>x.classList.add('pngeaPending'));
    try{
      await ensureSession(false);
      if(kind==='like')nextOn?await api.likePost(id):await api.unlikePost(id);
      else nextOn?await api.repost(id):await api.unrepost(id);
      setTimeout(()=>{if(reactionVersions.get(String(id))===version)reconcilePostState(id)},650);
    }catch(err){reactionDirtyUntil.delete(String(id));reactionState.set(String(id),prev);paintPostState(id);ui?.toast?.(err?.message||'Could not update post')}
    finally{matchingActions(id,kind).forEach(x=>x.classList.remove('pngeaPending'));reactionLocks.delete(lock)}
  }

  async function togglePostSave(id){
    const key=String(id);if(saveLocks.has(key))return;saveLocks.add(key);const previous=savedPosts.get(key)||false;savedPosts.set(key,!previous);paintPostState(key);
    try{if(previous)await api.unbookmarkPost(key);else await api.bookmarkPost(key)}catch(err){savedPosts.set(key,previous);paintPostState(key);ui.toast?.(err.message||'Could not save post')}finally{saveLocks.delete(key)}
  }

  window.addEventListener('click',async e=>{
    const action=e.target.closest?.('[data-live-action]');if(!action||!liveAPI()?.state?.active)return;
    const post=action.closest('[data-server-post]');if(!post)return;
    e.preventDefault();e.stopImmediatePropagation();
    const id=post.dataset.serverPost,kind=action.dataset.liveAction;
    if(kind==='reply'){if(postPage.classList.contains('pngeaPhotoComments')&&postPage.contains(action)){detailReplyParentId=id;const parent=postRecords.get(String(id));$('#pngeaReplyingTo').innerHTML=`Replying to <button type="button" class="pngeaMention" data-profile="${escapeHTML(parent?.handle||'')}">@${escapeHTML(parent?.handle||'')}</button>`;$('#pngeaPostReplyInput').focus()}else if(postFormat(postRecords.get(String(id))||{})==='gallery')openPhotoComments(id);else if(isWordReplyPost(postRecords.get(String(id))||{}))openWordReply(id);else{openPostPage(id);$('#pngeaPostReplyInput').focus()}return}
    if(kind==='share'){openSendPost(id);return}
    if(kind==='save'){togglePostSave(id);return}
    if(kind==='like'||kind==='repost')toggleReaction(id,kind,action);
  },true);

  // Clicking the body of a post opens a dedicated post page. Author, media, menus and actions keep their own behavior.
  window.addEventListener('click',e=>{
    const post=e.target.closest?.('[data-server-post]');if(!post||(postPage.contains(post)&&!post.classList.contains('pngeaReplyItem')))return;
    if(e.target.closest?.('[data-live-action],.liveMediaRail,.pngeaProfileMediaRail,.pngeaMediaTile,.pngeaVoiceNote,[data-profile],.authorRow,.xPostWho,.more,.kebab,.menuButton,button,a'))return;
    e.preventDefault();openPostPage(post.dataset.serverPost);
  },true);

  // Re-decorate only when children are replaced; no attribute observer loops.
  let decorateQueued=false;
  const actionObserver=new MutationObserver(muts=>{
    for(const mutation of muts)for(const removed of mutation.removedNodes||[]){if(removed.nodeType===1){if(removed.matches?.('video[data-pngea-reel]'))reelObserver.unobserve(removed);removed.querySelectorAll?.('video[data-pngea-reel]').forEach(video=>reelObserver.unobserve(video))}}
    if(decorateQueued)return;
    if(!muts.some(m=>m.addedNodes?.length))return;
    decorateQueued=true;requestAnimationFrame(()=>{decorateQueued=false;sanitizeAvatarPaint(document);decorateActions(document);applyLiveMediaEdits(document);applyKnownAvatars().catch(()=>{})});
  });
  actionObserver.observe(APP,{childList:true,subtree:true});
  setTimeout(()=>{decorateActions(document);applyLiveMediaEdits(document);applyKnownAvatars().catch(()=>{})},250);

  /* ---------- Profile save + username recovery ---------- */
  function openProfileEditor(){if(!liveAPI()?.state?.active||$('#Profile .profileEdit')?.dataset.profileAction!=='edit')return;const person=liveAPI().state.me;for(const [selector,value]of [['#peName',person.display_name||person.displayName||''],['#peHandle',getAlias()||person.handle||''],['#peBio',person.bio||''],['#peLocation',person.location||''],['#peWebsite',person.website||'']]){const input=$(selector);if(input)input.value=value}$('#profileEditLayer')?.classList.add('show')}
  function syncSelfIdentity(person,requestedHandle){
    const live=liveAPI()?.state;if(!live)return;
    const old=serverHandle(),fresh=norm(person?.handle||old);
    live.me={...(live.me||{}),...(person||{}),handle:fresh,display_name:person?.display_name||person?.displayName||live.me?.display_name};
    if(fresh===norm(requestedHandle))setAlias('');
    else if(requestedHandle)setAlias(requestedHandle);
    const shown=getAlias()||fresh,name=live.me.display_name||'You';
    if(ui?.state?.user){ui.state.user.name=name;ui.state.user.handle='@'+shown;ui.state.user.bio=live.me.bio||'';ui.state.user.location=live.me.location||'';ui.state.user.website=live.me.website||'';ui.save?.()}
    $('.sideName')&&($('.sideName').textContent=name);$('.sideHandle')&&($('.sideHandle').textContent='@'+shown);
    $('#sideFootHandle')&&($('#sideFootHandle').textContent='@'+shown);$('#Profile .profileName')&&($('#Profile .profileName').textContent=name);
    $('#Profile .profileHandle')&&($('#Profile .profileHandle').textContent='@'+shown);$('#Profile .profileBio')&&($('#Profile .profileBio').textContent=live.me.bio||'');
    renderProfileMeta(live.me);syncSidebarCounts(live.me);
    try{api.rememberAccount?.(live.me)}catch{}
  }
  window.addEventListener('click',async e=>{
    const save=e.target.closest?.('#profileEditSave');if(!save||!liveAPI()?.state?.active)return;
    e.preventDefault();e.stopImmediatePropagation();
    const name=$('#peName')?.value.trim()||'You',requested=norm($('#peHandle')?.value||serverHandle()),bio=$('#peBio')?.value.trim()||'',location=$('#peLocation')?.value.trim()||'',website=$('#peWebsite')?.value.trim()||'';
    if(!/^[a-z0-9_]{3,30}$/i.test(requested)){ui?.toast?.('Username: 3–30 letters, numbers, or underscores');return}
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
    }catch(err){ui?.toast?.(err?.message||'Could not update profile');
    }finally{save.disabled=false;save.textContent=oldLabel||'Save'}
  },true);

  /* ---------- Profile picture + banner ---------- */
  const artKey=()=>`pngea:profileArt:${api?.getActiveAccountKey?.()||'active'}`;
  function getArt(){try{return JSON.parse(localStorage.getItem(artKey())||'{}')}catch{return{}}}
  function putArt(v){localStorage.setItem(artKey(),JSON.stringify(v))}
  const avatarInput=document.createElement('input'),bannerInput=document.createElement('input');
  avatarInput.type=bannerInput.type='file';avatarInput.accept=bannerInput.accept='image/*';avatarInput.hidden=bannerInput.hidden=true;document.body.append(avatarInput,bannerInput);

  async function mediaURL(id){if(!id)return'';try{return (await api.mediaAccess(id)).url||''}catch{return''}}
  let profilePerson=null,artSequence=0;
  async function paintProfileBackground(element,url,identity){
    if(!element)return;const key=`${identity}:${url||''}`;if(element.dataset.profileArtKey===key)return;element.dataset.profileArtPending=key;
    if(url){const image=new Image();image.src=url;try{if(image.decode)await image.decode();else await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject})}catch{return}if(element.dataset.profileArtPending!==key)return}
    element.style.backgroundImage=url?`url("${url}")`:'';element.style.backgroundSize=url?'cover':'';element.style.backgroundPosition=url?'center':'';element.dataset.profileArtKey=key;
  }
  async function applyProfileArt(){
    const live=liveAPI()?.state;if(!live?.active||!live.me)return;
    const seq=++artSequence,me=live.me,route=ui?.parseRoute?.();
    ingestAvatarPerson(me);await applyKnownAvatars();
    const ownHandle=serverHandle(),viewHandle=norm(route?.detail||ownHandle);
    const person=viewHandle===ownHandle||viewHandle==='you'||viewHandle===getAlias()?me:profilePerson;
    const avatar=await resolvedAvatarUrl(ownHandle);
    const ownBanner=me.banner_media_id?await avatarUrlFor(me.banner_media_id):(me.banner_url||'');
    if(seq!==artSequence)return;
    const ap=$('#pngeaAvatarPreview'),bp=$('#pngeaBannerPreview');
    await Promise.allSettled([paintProfileBackground(ap,avatar,ownHandle),paintProfileBackground(bp,ownBanner,ownHandle)]);
    if(route?.screen!=='Profile'||!person||norm(person.handle)!==norm(viewHandle==='you'?ownHandle:viewHandle))return;
    const banner=person.banner_media_id?await avatarUrlFor(person.banner_media_id):(person.banner_url||'');
    const profileAvatar=await resolvedAvatarUrl(person.handle);
    if(seq!==artSequence||ui?.parseRoute?.()?.screen!=='Profile'||norm(ui.parseRoute().detail||ownHandle)!==viewHandle)return;
    const av=$('#Profile .xAvatar.big');if(av){av.classList.remove('selfAvatarFallback');av.dataset.profile=person.handle;profileAvatar?paintAvatarElement(av,profileAvatar):clearAvatarElement(av)}
    await paintProfileBackground($('#Profile .profileCover'),banner,person.handle);
  }

  function installArtEditor(){
    const form=$('#profileEditLayer .pnForm');if(!form||$('#pngeaProfileArtEditor'))return;
    const box=document.createElement('div');box.className='pngeaProfileArtEditor';box.id='pngeaProfileArtEditor';
    box.innerHTML=`<div class="pngeaArtRow"><div class="pngeaArtPreview" id="pngeaAvatarPreview"></div><div><b>Profile photo</b><div class="pngeaArtButtons"><button id="pngeaChangeAvatar" type="button">Change</button><button class="remove" id="pngeaRemoveAvatar" type="button">Remove</button></div></div></div><div class="pngeaArtRow"><div class="pngeaArtPreview banner" id="pngeaBannerPreview"></div><div><b>Banner</b><div class="pngeaArtButtons"><button id="pngeaChangeBanner" type="button">Change</button><button class="remove" id="pngeaRemoveBanner" type="button">Remove</button></div></div></div>`;
    form.prepend(box);
    $('#pngeaChangeAvatar').onclick=()=>avatarInput.click();$('#pngeaChangeBanner').onclick=()=>bannerInput.click();
    $('#pngeaRemoveAvatar').onclick=async()=>{const a=getArt();delete a.avatarMediaId;putArt(a);try{await api.updateProfile({avatarMediaId:null,avatarUrl:null});const fresh=await api.me();liveAPI().state.me={...liveAPI().state.me,...fresh};avatarMediaByHandle.delete(serverHandle());avatarDirectByHandle.delete(serverHandle());ingestAvatarPerson(fresh)}catch{}await Promise.allSettled([applyProfileArt(),applyKnownAvatars()])};
    $('#pngeaRemoveBanner').onclick=async()=>{const a=getArt();delete a.bannerMediaId;putArt(a);try{await api.updateProfile({bannerMediaId:null,bannerUrl:null});const fresh=await api.me();liveAPI().state.me={...liveAPI().state.me,...fresh}}catch{}await applyProfileArt()};
    applyProfileArt();
  }
  async function uploadArt(file,kind){
    try{
      const id=await uploadMedia(file);const a=getArt();a[kind==='avatar'?'avatarMediaId':'bannerMediaId']=id;putArt(a);
      await waitMedia([id],15000).catch(()=>{});
      await api.updateProfile(kind==='avatar'?{avatarMediaId:id,avatarUrl:null}:{bannerMediaId:id,bannerUrl:null});
      const fresh=await api.me();liveAPI().state.me={...liveAPI().state.me,...fresh};ingestAvatarPerson(fresh);
      avatarUrlCache.delete(String(id));await Promise.allSettled([applyProfileArt(),applyKnownAvatars()]);
      if(kind==='avatar'){setTimeout(()=>{liveAPI()?.loadFeed?.();enhanceProfile();applyKnownAvatars().catch(()=>{})},250)}else setTimeout(enhanceProfile,250);
      ui?.toast?.(kind==='avatar'?'Profile photo updated':'Banner updated');
    }catch(err){ui?.toast?.(err?.message||'Could not update image')}
  }
  avatarInput.onchange=()=>{const f=avatarInput.files?.[0];avatarInput.value='';if(f)ui.editProfileImage?.(f,{aspect:'1:1',onSave:cropped=>uploadArt(cropped,'avatar')})};
  bannerInput.onchange=()=>{const f=bannerInput.files?.[0];bannerInput.value='';if(f)ui.editProfileImage?.(f,{aspect:'3:1',onSave:cropped=>uploadArt(cropped,'banner')})};
  async function migrateLocalProfileArt(){
    const live=liveAPI()?.state;if(!live?.active||!live.me)return;const art=getArt(),body={};
    const hasServerAvatar=('avatar_media_id' in live.me)||('avatarMediaId' in live.me),hasServerBanner=('banner_media_id' in live.me)||('bannerMediaId' in live.me);
    if(!hasServerAvatar&&art.avatarMediaId)body.avatarMediaId=art.avatarMediaId;
    if(!hasServerBanner&&art.bannerMediaId)body.bannerMediaId=art.bannerMediaId;
    if(!Object.keys(body).length)return;
    try{await api.updateProfile(body);const fresh=await api.me();live.me={...live.me,...fresh};ingestAvatarPerson(fresh);await Promise.allSettled([applyProfileArt(),applyKnownAvatars()])}catch{}
  }
  setTimeout(migrateLocalProfileArt,1400);
  const profileEditLayer=$('#profileEditLayer');
  if(profileEditLayer&&profileEditLayer.parentElement!==document.body)document.body.appendChild(profileEditLayer);
  installArtEditor();
  setTimeout(installArtEditor,400);

  /* ---------- Full-page new message ---------- */
  const newDm=$('#newDmSheet');
  if(newDm){
    document.body.appendChild(newDm);
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


  /* ---------- Message composer + voice/media ---------- */
  const dmThread514=$('#dmThread'),dmMessages514=$('#dmMessages'),dmCompose514=dmThread514?.querySelector('.dmCompose');
  // One viewport frame, independent of the app shell's safe areas and navigation.
  if(dmThread514)document.body.appendChild(dmThread514);
  const dmMediaInput=document.createElement('input');dmMediaInput.type='file';dmMediaInput.multiple=true;dmMediaInput.accept='image/*,video/*';dmMediaInput.hidden=true;document.body.appendChild(dmMediaInput);
  let dmConversationId=null,dmSendBusy=false;
  if(dmCompose514){
    let attach=$('#pngeaDmAttachments');if(!attach){attach=document.createElement('div');attach.id='pngeaDmAttachments';dmCompose514.before(attach)}
    dmCompose514.innerHTML=`<button id="pngeaDmPlus" type="button" aria-label="Add media">+</button><input id="dmInput" placeholder="Message" autocomplete="off"><button id="pngeaDmMic" type="button" aria-label="Voice message">${ICONS.mic}</button><button id="dmSend" type="button" aria-label="Send">↑</button>`;
  }
  const dmRequestGate=document.createElement('div');dmRequestGate.id='pngeaDmRequestGate';dmRequestGate.hidden=true;dmCompose514?.after(dmRequestGate);
  const chatHeadHost=document.createElement('div');chatHeadHost.id='pngeaChatHeads';document.body.appendChild(chatHeadHost);
  const miniControls=document.createElement('div');miniControls.className='pngeaMiniControls';miniControls.innerHTML='<button type="button" data-mini-chat="full" aria-label="Open full chat">↗</button><button type="button" data-mini-chat="minimize" aria-label="Minimize chat">−</button><button type="button" data-mini-chat="remove" aria-label="Remove chathead">×</button>';dmThread514?.querySelector('.xTop')?.appendChild(miniControls);
  let miniChat=null,chatHeadOwner='',chatHeadRecords=[];
  function renderDmAttachments(){
    const host=$('#pngeaDmAttachments');if(!host)return;(dmPreviewURLs||[]).forEach(u=>URL.revokeObjectURL(u));dmPreviewURLs=[];host.innerHTML='';host.classList.toggle('show',dmFiles.length>0);
    dmFiles.forEach((file,i)=>{const box=document.createElement('div');box.className='dmAttach';const u=URL.createObjectURL(file);dmPreviewURLs.push(u);const el=document.createElement(file.type.startsWith('audio/')?'audio':file.type.startsWith('video/')?'video':'img');el.src=u;if(el.tagName==='AUDIO'||el.tagName==='VIDEO'){el.controls=true;el.playsInline=true}box.appendChild(el);const x=document.createElement('button');x.type='button';x.textContent='×';x.onclick=()=>{dmFiles.splice(i,1);renderDmAttachments()};box.appendChild(x);host.appendChild(box)});
  }
  dmMediaInput.onchange=()=>{dmFiles=validateFiles([...dmFiles,...dmMediaInput.files]).slice(0,4);dmMediaInput.value='';renderDmAttachments()};
  $('#pngeaDmPlus')?.addEventListener('click',()=>dmMediaInput.click());
  $('#pngeaDmMic')?.addEventListener('click',()=>startVoiceRecorder('dm'));
  function dmConvName(c){if(c?.title)return c.title;const m=c?.members?.[0];return m?.displayName||m?.display_name||m?.handle||'Conversation'}
  function dmConvHandle(c){const m=c?.members?.[0];return m?.handle?`@${m.handle}`:(c?.members?.length>1?`${c.members.length+1} people`:'')}
  const threadRequests=new Map(),dmDrafts=new Map(),pendingSends=new Map(),threadHistory=new Map(),dmScrollPositions=new Map(),dmAccess=new Map(),dmTypingPeers=new Map();
  let threadSignature='',dmPreviewURLs=[],dmConversationKey=null,dmRestoreScroll=null;
  function dmKey(id){return `${api.getActiveAccountKey?.()||liveAPI()?.state?.me?.id}:${id}`}
  const chatAccount=()=>api.getActiveAccountKey?.()||liveAPI()?.state?.me?.id||'';
  function activeMiniChat(){return miniChat&&miniChat.account===chatAccount()&&liveAPI()?.state?.active?miniChat:null}
  function activeDmId(){const mini=activeMiniChat();if(mini)return mini.id;const route=ui?.parseRoute?.();return route?.screen==='Inbox'?route.detail:null}
  function currentThread(id){return !!liveAPI()?.state?.active&&activeDmId()===id}
  function storeChatHeads(){if(chatHeadOwner)try{localStorage.setItem(`pngea:chatHeads:${chatHeadOwner}`,JSON.stringify(chatHeadRecords))}catch{}}
  function placeChatHead(button,record){const width=52,left=Math.max(8,Math.min(innerWidth-width-8,Number(record.left)||innerWidth-width-12)),top=Math.max(64,Math.min(innerHeight-width-82,Number(record.top)||128));button.style.left=`${left}px`;button.style.top=`${top}px`;return {left,top}}
  function renderChatHeads({authoritative=false,conversations=null}={}){
    const account=liveAPI()?.state?.active?chatAccount():'';
    if(account!==chatHeadOwner){if(miniChat){miniChat=null;dmThread514?.classList.remove('pngeaMiniChat','show');ROOT.classList.remove('pngeaDmThreadOpen');queueKeyboard()}chatHeadOwner=account;chatHeadHost.replaceChildren();chatHeadRecords=[];if(account)try{const saved=JSON.parse(localStorage.getItem(`pngea:chatHeads:${account}`)||'[]');if(Array.isArray(saved))chatHeadRecords=saved.filter(item=>typeof item?.id==='string').slice(0,5)}catch{}}
    if(!account){chatHeadHost.replaceChildren();return}
    const items=conversations||liveAPI()?.state?.conversations||[],available=new Map(items.map(item=>[item.id,item]));
    if(authoritative){chatHeadRecords=chatHeadRecords.filter(record=>available.has(record.id));storeChatHeads();if(miniChat&&!available.has(miniChat.id))closeMiniChat()}
    const ids=new Set(chatHeadRecords.map(record=>record.id));for(const button of [...chatHeadHost.children])if(!ids.has(button.dataset.conversationId))button.remove();
    for(const record of chatHeadRecords){const conversation=available.get(record.id);let button=[...chatHeadHost.children].find(item=>item.dataset.conversationId===record.id);if(!conversation){if(button)button.hidden=true;continue}
      if(!button){button=document.createElement('button');button.type='button';button.className='pngeaChatHead';button.dataset.conversationId=record.id;button.innerHTML='<span class="pngeaChatHeadAvatar"></span><span class="pngeaChatHeadUnread" hidden></span>';chatHeadHost.appendChild(button);installChatHeadDrag(button,record);button.onclick=event=>{event.preventDefault();event.stopPropagation();if(Date.now()<Number(button.dataset.suppressClickUntil||0))return;openMiniChat(record.id)};button.oncontextmenu=event=>event.preventDefault()}
      button.hidden=false;button.setAttribute('aria-label',`Chat with ${dmConvName(conversation)}`);button.dataset.open=String(activeMiniChat()?.id===record.id);placeChatHead(button,record);
      const badge=button.querySelector('.pngeaChatHeadUnread'),unread=Math.max(0,Number(conversation.unread)||0);badge.hidden=!unread;badge.textContent=unread>99?'99+':String(unread);badge.setAttribute('aria-label',`${unread} unread messages`);
      const avatar=button.querySelector('.pngeaChatHeadAvatar'),person=conversation.members?.length===1?conversation.members[0]:null;if(!avatar.querySelector('img'))avatar.textContent=(dmConvName(conversation).split(/\s+/).slice(0,2).map(part=>part[0]).join('')||'?').toUpperCase();
      if(person?.handle){ingestAvatarPerson(person);resolvedAvatarUrl(person.handle).then(url=>{if(!url||!button.isConnected||chatHeadOwner!==account)return;let image=avatar.querySelector('img');if(!image){image=document.createElement('img');image.alt='';avatar.replaceChildren(image)}if(image.getAttribute('src')!==url)image.src=url}).catch(()=>{})}
    }
  }
  function installChatHeadDrag(button,record){
    let drag=null;button.onpointerdown=event=>{if(event.button!==0)return;const position=placeChatHead(button,record);drag={x:event.clientX,y:event.clientY,...position,moved:false};try{button.setPointerCapture(event.pointerId)}catch{}};
    button.onpointermove=event=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(dx,dy)>6)drag.moved=true;if(!drag.moved)return;placeChatHead(button,{left:drag.left+dx,top:drag.top+dy});if(event.cancelable)event.preventDefault()};
    const finish=event=>{if(!drag)return;if(drag.moved){record.left=parseFloat(button.style.left)+26<innerWidth/2?8:innerWidth-60;record.top=parseFloat(button.style.top);placeChatHead(button,record);button.dataset.suppressClickUntil=String(Date.now()+700);storeChatHeads();if(event.cancelable)event.preventDefault()}drag=null};button.onpointerup=finish;button.onpointercancel=finish;
  }
  function createChatHead(id){
    renderChatHeads();if(!(liveAPI()?.state?.conversations||[]).some(conversation=>conversation.id===id)){ui.toast?.('Conversation unavailable');return}
    if(!chatHeadRecords.some(record=>record.id===id)){if(chatHeadRecords.length>=5)chatHeadRecords.shift();chatHeadRecords.push({id,left:innerWidth-64,top:110+chatHeadRecords.length*64});storeChatHeads()}renderChatHeads();
  }
  function openMiniChat(id){
    renderChatHeads();if(!chatHeadRecords.some(record=>record.id===id))return;saveDmDraft();clearOutgoingTyping();if(dmThread514?.contains(document.activeElement))document.activeElement.blur();miniChat={id,account:chatAccount()};dmThread514.classList.add('pngeaMiniChat');loadThread514(id).catch(error=>ui.toast?.(error.message));renderChatHeads();queueKeyboard();
  }
  function closeMiniChat({restoreMain=true}={}){
    if(!miniChat)return;saveDmDraft();clearOutgoingTyping();if(dmThread514?.contains(document.activeElement))document.activeElement.blur();miniChat=null;dmThread514.classList.remove('pngeaMiniChat');renderChatHeads();if(restoreMain)ui.renderThreadRoute?.(ui.parseRoute());queueKeyboard();
  }
  function openFullChat(id){closeMiniChat({restoreMain:false});ui.navigate('Inbox',id)}
  function dismissActiveChat(id,{removeHead=false}={}){
    if(removeHead){chatHeadRecords=chatHeadRecords.filter(record=>record.id!==id);storeChatHeads()}
    if(activeMiniChat()){closeMiniChat({restoreMain:false});const route=ui.parseRoute();if(route.screen==='Inbox'&&route.detail===id)ui.navigate('Inbox');else ui.renderThreadRoute?.(route)}else ui.navigate('Inbox');renderChatHeads();queueKeyboard();
  }
  miniControls.onclick=event=>{const button=event.target.closest('[data-mini-chat]'),mini=activeMiniChat();if(!button||!mini)return;event.preventDefault();event.stopPropagation();if(button.dataset.miniChat==='full')openFullChat(mini.id);else{if(button.dataset.miniChat==='remove'){chatHeadRecords=chatHeadRecords.filter(record=>record.id!==mini.id);storeChatHeads()}closeMiniChat()}};
  window.addEventListener('pngea:conversations',event=>renderChatHeads({authoritative:true,conversations:event.detail}));window.addEventListener('pngea:route',()=>renderChatHeads());window.addEventListener('resize',()=>renderChatHeads());setTimeout(()=>renderChatHeads(),0);
  let chatHold=null,chatHoldTimer=0,chatContext=null,chatGhostClick=null;
  function chatContextTarget(target){const row=target.closest?.('#Inbox [data-live-conversation]');if(row)return {kind:'conversation',id:row.dataset.liveConversation,element:row};const message=target.closest?.('#dmMessages [data-message-id]');return message?{kind:'message',id:message.dataset.messageId,element:message}:null}
  function clearChatHold(){clearTimeout(chatHoldTimer);chatHoldTimer=0;chatHold=null}
  function openChatContext(context){
    if(!context||!liveAPI()?.state?.active)return;const sheet=$('#pnActionSheet');if(chatContext?.kind===context.kind&&chatContext.id===context.id&&sheet?.classList.contains('show'))return;
    window.PNGEA_OBJECT_ACTIONS?.close?.();chatContext={...context,account:chatAccount()};chatGhostClick={kind:context.kind,id:context.id,until:Date.now()+900};
    if(context.kind==='message'){window.PNGEA_OBJECT_ACTIONS?.openElement?.(context.element);return}
    const conversation=(liveAPI()?.state?.conversations||[]).find(item=>item.id===context.id);if(!conversation)return;
    $('#pnActionTitle').textContent=dmConvName(conversation);$('#pnActionSubtitle').textContent='Conversation';$('#pnSheetActions').innerHTML='<div class="pnActionRow" role="button" tabindex="0" data-chat-action="open"><span class="pnActionGlyph">↗</span><div><b>Open chat</b></div></div><div class="pnActionRow" role="button" tabindex="0" data-chat-action="head"><span class="pnActionGlyph">◉</span><div><b>Create chathead</b></div></div>';$('#pnSheetShade').classList.add('show');sheet.classList.add('show');
  }
  window.addEventListener('touchstart',event=>{const context=chatContextTarget(event.target),touch=event.touches?.[0];clearChatHold();if(!context||event.touches.length!==1)return;chatHold={...context,x:touch.clientX,y:touch.clientY};chatHoldTimer=setTimeout(()=>{const held=chatHold;chatHold=null;chatHoldTimer=0;if(held?.element.isConnected)openChatContext(held)},580)},{passive:true,capture:true});
  window.addEventListener('touchmove',event=>{const touch=event.touches?.[0];if(chatHold&&(!touch||Math.hypot(touch.clientX-chatHold.x,touch.clientY-chatHold.y)>8))clearChatHold()},{passive:true,capture:true});
  for(const type of ['touchend','touchcancel'])window.addEventListener(type,clearChatHold,{passive:true,capture:true});
  window.addEventListener('contextmenu',event=>{const context=chatContextTarget(event.target);if(!context)return;event.preventDefault();event.stopImmediatePropagation();clearChatHold();openChatContext(context)},{capture:true});
  function suppressChatContextClick(event){const context=chatContextTarget(event.target);if(context&&chatGhostClick&&Date.now()<chatGhostClick.until&&context.kind===chatGhostClick.kind&&context.id===chatGhostClick.id){event.preventDefault();event.stopImmediatePropagation();return true}return false}
  window.addEventListener('click',suppressChatContextClick,true);
  $('#pnSheetActions')?.addEventListener('click',event=>{const row=event.target.closest('[data-chat-action]'),context=chatContext;if(!row||context?.kind!=='conversation')return;event.preventDefault();event.stopImmediatePropagation();window.PNGEA_OBJECT_ACTIONS?.close?.();chatContext=null;if(context.account!==chatAccount())return;if(row.dataset.chatAction==='open')openFullChat(context.id);else createChatHead(context.id)},true);
  function updateDmAccess(id,...sources){
    const key=dmKey(id),previous=dmAccess.get(key)||{request_status:'accepted',viewer_can_message:true,requester_id:null},state={...previous};
    for(const source of sources)for(const name of ['request_status','viewer_can_message','requester_id'])if(source?.[name]!==undefined)state[name]=source[name];
    if(state.request_status!=='accepted')state.viewer_can_message=false;dmAccess.set(key,state);const conversation=(liveAPI()?.state?.conversations||[]).find(item=>item.id===id);if(conversation)Object.assign(conversation,state);return state;
  }
  function paintDmGate(id){
    if(!currentThread(id))return;const state=dmAccess.get(dmKey(id))||{request_status:'accepted',viewer_can_message:true};
    if(state.request_status==='declined'){dismissActiveChat(id,{removeHead:true});return}
    const accepted=state.viewer_can_message!==false&&state.request_status==='accepted';dmCompose514.hidden=!accepted;const attachments=$('#pngeaDmAttachments');if(attachments)attachments.hidden=!accepted;dmRequestGate.hidden=accepted;
    if(accepted){dmRequestGate.innerHTML='';return}
    dmMessages514?.querySelector('.uiState')?.remove();
    clearOutgoingTyping();clearDmTyping(id);if(dmThread514?.contains(document.activeElement))document.activeElement.blur();
    const incoming=state.request_status==='pending'&&state.requester_id!==liveAPI()?.state?.me?.id;
    if(state.request_status==='pending'&&!incoming)dmRequestGate.innerHTML='<p class="pngeaRequestWaiting">Waiting for your message request to be accepted.</p>';
    else dmRequestGate.innerHTML=`<p>${incoming?'This account wants to message you. Accept to start the conversation.':'You need to request to message this account because you do not follow each other.'}</p><div class="pngeaRequestActions">${incoming?'<button type="button" data-dm-request="accept">Accept</button><button type="button" data-dm-request="decline">Decline</button>':'<button type="button" data-dm-request="request">Request</button><button type="button" data-dm-request="close">Close</button>'}</div>`;
  }
  dmRequestGate.onclick=async event=>{
    const button=event.target.closest('[data-dm-request]'),id=dmConversationId;if(!button||button.disabled||!id)return;const action=button.dataset.dmRequest;if(action==='close'){dismissActiveChat(id);return}
    const key=dmKey(id);dmRequestGate.querySelectorAll('button').forEach(item=>item.disabled=true);
    try{const state=action==='request'?await api.requestConversation(id):await api.respondConversationRequest(id,{accept:action==='accept'});if(!currentThread(id)||dmKey(id)!==key)return;updateDmAccess(id,state);if(action==='decline'){dismissActiveChat(id,{removeHead:true});liveAPI()?.loadConversations?.();return}paintDmGate(id);await Promise.allSettled([liveAPI()?.loadConversations?.(),loadThread514(id)])}
    catch(error){ui.toast?.(error.message||'Could not update message request');if(currentThread(id)&&dmKey(id)===key)paintDmGate(id)}
  };
  let outgoingTyping=null,outgoingTypingIdle=0,outgoingTypingBeat=0;
  function clearOutgoingTyping(){
    clearTimeout(outgoingTypingIdle);clearInterval(outgoingTypingBeat);outgoingTypingIdle=0;outgoingTypingBeat=0;const previous=outgoingTyping;outgoingTyping=null;
    if(previous&&previous.account===(api.getActiveAccountKey?.()||liveAPI()?.state?.me?.id||''))api.setConversationTyping(previous.id,{typing:false}).catch(()=>{});
  }
  function signalOutgoingTyping(){
    const id=dmConversationId;if(!id||!currentThread(id)||!$('#dmInput')?.value.trim()||dmAccess.get(dmKey(id))?.viewer_can_message===false){clearOutgoingTyping();return}
    const account=api.getActiveAccountKey?.()||liveAPI()?.state?.me?.id||'';
    if(!outgoingTyping||outgoingTyping.id!==id||outgoingTyping.account!==account){clearOutgoingTyping();outgoingTyping={id,account};api.setConversationTyping(id,{typing:true}).catch(()=>{});outgoingTypingBeat=setInterval(()=>{if(!outgoingTyping||document.activeElement!==$('#dmInput')||!currentThread(id)){clearOutgoingTyping();return}api.setConversationTyping(id,{typing:true}).catch(()=>{})},2500)}
    clearTimeout(outgoingTypingIdle);outgoingTypingIdle=setTimeout(clearOutgoingTyping,4000);
  }
  $('#dmInput')?.addEventListener('input',signalOutgoingTyping);$('#dmInput')?.addEventListener('blur',clearOutgoingTyping);
  function paintDmTyping(id){
    if(!currentThread(id)||!dmMessages514)return;const peers=dmTypingPeers.get(dmKey(id)),now=Date.now();if(peers)for(const [userId,expires] of peers)if(expires<=now)peers.delete(userId);
    const visible=peers?.size&&dmAccess.get(dmKey(id))?.viewer_can_message!==false;let bubble=$('#pngeaDmTyping');if(!visible){bubble?.remove();return}if(bubble)return;
    const nearBottom=dmMessages514.scrollHeight-dmMessages514.scrollTop-dmMessages514.clientHeight<80;bubble=document.createElement('div');bubble.id='pngeaDmTyping';bubble.setAttribute('role','status');bubble.setAttribute('aria-label','Typing');bubble.innerHTML='<span></span><span></span><span></span>';dmMessages514.appendChild(bubble);if(nearBottom)dmMessages514.scrollTop=dmMessages514.scrollHeight;
  }
  function clearDmTyping(id,userId=null){const peers=dmTypingPeers.get(dmKey(id));if(userId)peers?.delete(userId);else dmTypingPeers.delete(dmKey(id));paintDmTyping(id)}
  function ingestDmTyping(id,people=[]){
    const key=dmKey(id);let peers=dmTypingPeers.get(key);if(!peers){peers=new Map();dmTypingPeers.set(key,peers)}
    for(const person of people){if(person.userId===liveAPI()?.state?.me?.id)continue;const expires=Date.parse(person.expiresAt);if(Number.isFinite(expires)&&expires>Date.now())peers.set(person.userId,Math.min(expires,Date.now()+6500))}paintDmTyping(id);
  }
  setInterval(()=>{if(dmConversationId)paintDmTyping(dmConversationId)},750);
  function saveDmDraft(){if(dmConversationId&&dmConversationKey){dmDrafts.set(dmConversationKey,{text:$('#dmInput')?.value||'',files:[...dmFiles]});if(dmMessages514)dmScrollPositions.set(dmConversationKey,{top:dmMessages514.scrollTop,atBottom:dmMessages514.scrollHeight-dmMessages514.scrollTop-dmMessages514.clientHeight<80})}}
  function selectDmThread(id){
    if(dmConversationId===id&&dmConversationKey===dmKey(id))return;saveDmDraft();clearOutgoingTyping();dmConversationId=id;dmConversationKey=dmKey(id);dmRestoreScroll=dmScrollPositions.get(dmConversationKey)||null;threadSignature='';
    const draft=dmDrafts.get(dmKey(id));if($('#dmInput'))$('#dmInput').value=draft?.text||'';dmFiles=[...(draft?.files||[])];renderDmAttachments();
    if(dmMessages514)dmMessages514.innerHTML='<div class="msgDay">Loading messages…</div>';
  }
  async function loadThread514(id){
    if(!currentThread(id))return;selectDmThread(id);
    if(threadRequests.has(dmKey(id)))return threadRequests.get(dmKey(id));
    const account=dmKey(id),live=liveAPI().state;const cached=threadHistory.get(account);if(cached)cached.lastPoll=Date.now();
    const work=(async()=>{
      let conv=(live.conversations||[]).find(c=>c.id===id);
      if(!conv){liveAPI().loadConversations().catch(()=>{});conv={id,members:[]}}
      if(!conv||!currentThread(id)||dmKey(id)!==account)return;
      dmThread514?.classList.add('show');dmThread514.dataset.conversationId=id;ROOT.classList.toggle('pngeaDmThreadOpen',!activeMiniChat());
      $('#dmTitle').textContent=dmConvName(conv);$('#dmHandle').textContent=dmConvHandle(conv);
      const av=dmThread514?.querySelector('.xAvatar'),person=conv.members?.length===1?conv.members[0]:null;
      if(av){clearAvatarElement(av);delete av.dataset.profile;delete av.dataset.pngeaDmProfile;av.textContent=(dmConvName(conv).split(/\s+/).slice(0,2).map(x=>x[0]).join('')||'?').toUpperCase();if(person?.handle){av.dataset.profile=person.handle;av.dataset.pngeaDmProfile=person.handle}}
      updateDmAccess(id,conv);paintDmGate(id);
      const d=await api.messages(id,{limit:50});
      if(!currentThread(id)||dmKey(id)!==account||!dmMessages514||dmSendBusy)return;
      const access=updateDmAccess(id,conv,d);paintDmGate(id);if(access.request_status==='declined')return;
      let history=threadHistory.get(account);if(!history){history={older:[],loaded:[],cursor:d.nextCursor||null};threadHistory.set(account,history)}
      const messages=new Map([...history.older,...history.loaded,...(d.items||[])].map(m=>[m.id,m]));const items=[...messages.values()],signature=JSON.stringify([items.map(m=>({...m,read_by:(m.read_by||[]).map(x=>x.userId)})),history.cursor]);history.loaded=items;
      if(signature!==threadSignature){
        const nearBottom=dmMessages514.scrollHeight-dmMessages514.scrollTop-dmMessages514.clientHeight<80;
        const firstRender=!threadSignature;threadSignature=signature;
        const fragment=document.createDocumentFragment(),latestSentId=items.filter(m=>m.sender_id===live.me.id).at(-1)?.id;
        for(const m of items){
          const wrap=document.createElement('div');wrap.dataset.messageId=m.id;wrap.dataset.messageText=String(m.text||'');wrap.className='pngeaMessageRow '+(m.sender_id===live.me.id?'me':'them');
          if(m.text){const bubble=document.createElement('div');bubble.className='msgBubble '+(m.sender_id===live.me.id?'me':'them');renderMessageText(bubble,m.text);wrap.appendChild(bubble)}
          if(m.media?.length){
            const rail=document.createElement('div');rail.className='liveMessageMedia '+(m.sender_id===live.me.id?'me':'them');wrap.appendChild(rail);
            Promise.allSettled(m.media.map(async med=>{const element=await mediaElement(med);if(currentThread(id)&&wrap.isConnected)rail.appendChild(element)}));
          }
          if(m.id===latestSentId&&m.read_by?.length){const receipt=document.createElement('div');receipt.className='pngeaReadReceipt';receipt.textContent='Seen';wrap.appendChild(receipt)}
          fragment.appendChild(wrap);
        }
        if(history.cursor){const earlier=document.createElement('button');earlier.id='pngeaLoadEarlier';earlier.type='button';earlier.textContent='Load earlier messages';earlier.onclick=()=>loadEarlierMessages(id,earlier);fragment.insertBefore(earlier,fragment.firstChild)}
        dmMessages514.replaceChildren(fragment);
        if(!items.length)dmMessages514.innerHTML=access.viewer_can_message?'<div class="uiState"><div><b>No messages yet</b><small>Start the conversation.</small></div></div>':'';
        if(firstRender&&dmRestoreScroll){dmMessages514.scrollTop=dmRestoreScroll.atBottom?dmMessages514.scrollHeight:dmRestoreScroll.top;dmRestoreScroll=null}else if(firstRender||nearBottom)dmMessages514.scrollTop=dmMessages514.scrollHeight;
        const newestIncoming=items.filter(m=>m.sender_id!==live.me.id).at(-1)?.id;if(access.viewer_can_message&&document.visibilityState==='visible'&&newestIncoming&&history.lastReadId!==newestIncoming){await api.markConversationRead(id,{messageId:newestIncoming}).then(()=>{history.lastReadId=newestIncoming}).catch(()=>{})}
        refreshUnreadCounts();
      }
      if(Array.isArray(d.typing))dmTypingPeers.delete(account);ingestDmTyping(id,d.typing||[]);paintDmTyping(id);
      applyKnownAvatars(dmThread514).catch(()=>{});
    })().catch(error=>{if(error.status===404&&currentThread(id)&&dmKey(id)===account){threadHistory.delete(account);dmAccess.delete(account);dmTypingPeers.delete(account);dismissActiveChat(id,{removeHead:true});return}throw error}).finally(()=>threadRequests.delete(account));
    threadRequests.set(account,work);return work;
  }
  async function loadEarlierMessages(id,button){
    const key=dmKey(id),history=threadHistory.get(key);if(!history?.cursor||button.disabled)return;
    button.disabled=true;const height=dmMessages514.scrollHeight,top=dmMessages514.scrollTop;
    try{const d=await api.messages(id,{before:history.cursor});if(!currentThread(id)||dmKey(id)!==key)return;history.older=[...(d.items||[]),...history.older];history.cursor=d.nextCursor||null;threadSignature='';await loadThread514(id);dmMessages514.scrollTop=top+dmMessages514.scrollHeight-height}
    catch(err){ui?.toast?.(err.message||'Could not load earlier messages')}
    finally{if(button.isConnected)button.disabled=false}
  }
  async function sendDm514(){
    const id=activeDmId(),input=$('#dmInput');
    const text=input?.value.trim()||'',files=[...dmFiles];if(!liveAPI()?.state?.active||!id||(!text&&!files.length)||dmSendBusy)return;
    if(dmAccess.get(dmKey(id))?.viewer_can_message===false){paintDmGate(id);return}clearOutgoingTyping();
    const key=dmKey(id);let pending=pendingSends.get(key);
    if(!pending||pending.text!==text||pending.files.length!==files.length||pending.files.some((f,i)=>f!==files[i])){
      pending={clientId:crypto.randomUUID?.()||`msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,text,files,mediaIds:[]};pendingSends.set(key,pending);
    }
    dmMessages514?.querySelectorAll('.pngeaReadReceipt').forEach(receipt=>receipt.remove());threadSignature='';dmSendBusy=true;const button=$('#dmSend');if(button)button.disabled=true;
    const optimistic=document.createElement('div');optimistic.className='msgBubble me pngeaPending';optimistic.dataset.clientId=pending.clientId;optimistic.dataset.messageText=text;optimistic.textContent=text||'Sending attachment…';dmMessages514?.appendChild(optimistic);if(dmMessages514)dmMessages514.scrollTop=dmMessages514.scrollHeight;
    try{
      for(let i=pending.mediaIds.length;i<files.length;i++)pending.mediaIds.push(await uploadMedia(files[i]));
      if(pending.mediaIds.length)await waitMedia(pending.mediaIds);
      let acknowledgement;
      for(let attempt=0;attempt<4;attempt++){
        try{acknowledgement=await api.sendMessage(id,{text,mediaIds:pending.mediaIds,clientId:pending.clientId});break}
        catch(err){const transient=[408,429,500,502,503,504].includes(err.status)||err.name==='TypeError'||err.name==='AbortError';if(!transient||attempt===3)throw err;await new Promise(resolve=>setTimeout(resolve,Math.min(30000,Math.max(err.retryAfter||0,500*2**attempt))))}
      }
      // Keep the acknowledged bubble visible until the next canonical thread refresh.
      if(acknowledgement?.id){optimistic.dataset.messageId=acknowledgement.id;optimistic.classList.remove('pngeaPending');optimistic.dataset.acknowledged='true'}
      pendingSends.delete(key);dmDrafts.delete(key);
      if(currentThread(id)&&dmKey(id)===key){
        if(input.value.trim()===text)input.value='';dmFiles=dmFiles.filter(f=>!files.includes(f));renderDmAttachments();threadSignature='';
      }
    }catch(err){ui?.toast?.(err?.message||'Could not send message');saveDmDraft()}
    finally{if(!optimistic.dataset.acknowledged)optimistic.remove();dmSendBusy=false;if(button)button.disabled=false;if(currentThread(id)&&dmKey(id)===key)loadThread514(id).catch(()=>{})}
  }
  window.addEventListener('click',e=>{if(e.target.closest?.('#dmSend')){e.preventDefault();e.stopImmediatePropagation();sendDm514()}},true);
  window.addEventListener('keydown',e=>{if(e.target?.id==='dmInput'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();e.stopImmediatePropagation();sendDm514()}},true);
  if(ui)ui.renderThreadRoute=route=>{
    if(liveAPI()?.state?.active&&route.screen==='Inbox'&&route.detail){if(miniChat){saveDmDraft();clearOutgoingTyping();miniChat=null;dmThread514.classList.remove('pngeaMiniChat');renderChatHeads()}loadThread514(route.detail).catch(err=>ui.toast?.(err.message));return}
    const mini=activeMiniChat();if(mini){loadThread514(mini.id).catch(err=>ui.toast?.(err.message));return}
    saveDmDraft();clearOutgoingTyping();if(dmConversationId)clearDmTyping(dmConversationId);if(dmThread514?.contains(document.activeElement))document.activeElement.blur();dmConversationId=null;dmConversationKey=null;dmRestoreScroll=null;threadSignature='';dmFiles=[];renderDmAttachments();dmRequestGate.hidden=true;dmThread514?.classList.remove('show');ROOT.classList.remove('pngeaDmThreadOpen');
  };
  setInterval(()=>{const id=activeDmId();if(document.visibilityState==='visible'&&id&&!dmSendBusy&&(!liveAPI()?.state?.realtimeReady||Date.now()-(threadHistory.get(dmKey(id))?.lastPoll||0)>30000))loadThread514(id).catch(()=>{});if(chatHeadOwner!==chatAccount()||!liveAPI()?.state?.active)renderChatHeads()},3000);
  let dmProfileReturn=null;
  const dmAccount=()=>api.getActiveAccountKey?.()||liveAPI()?.state?.me?.id||'';
  function capturePostProfileReturn(){
    if(!postPage.classList.contains('show')||postPage.classList.contains('pngeaPhotoComments')||!postReturnContext||(!postReturnContext.miniId&&(postReturnContext.screen!=='Inbox'||!postReturnContext.detail)))return;
    dmProfileReturn={account:dmAccount(),conversationId:postReturnContext.miniId||postReturnContext.detail,postId:postPage.dataset.postId,postOrigin:{...postReturnContext},postScroll:$('#pngeaPostScroll').scrollTop,replyText:$('#pngeaPostReplyInput').value,replyFiles:[...detailReplyFiles]};
  }
  function openDmProfile(handle){const route=ui?.parseRoute?.(),mini=activeMiniChat();if(mini){saveDmDraft();dmProfileReturn={account:dmAccount(),conversationId:mini.id,miniId:mini.id,origin:{screen:route.screen,detail:route.detail}};closeMiniChat({restoreMain:false})}else if(route?.screen==='Inbox'&&route.detail){saveDmDraft();dmProfileReturn={account:dmAccount(),conversationId:route.detail}}ui.navigate('Profile',handle)}
  window.addEventListener('click',e=>{
    const route=ui?.parseRoute?.(),back=e.target.closest?.('#Profile .xTop .xBack,#Profile .simpleTop .back');
    if(back&&route?.screen==='Profile'&&dmProfileReturn){
      if(dmProfileReturn.account!==dmAccount()){dmProfileReturn=null;return}
      e.preventDefault();e.stopImmediatePropagation();const previous=dmProfileReturn;dmProfileReturn=null;
      if(previous.postId){const loading=openPostPage(previous.postId);postReturnContext=previous.postOrigin;$('#pngeaPostReplyInput').value=previous.replyText||'';detailReplyFiles=previous.replyFiles||[];renderDetailAttachments();Promise.resolve(loading).then(()=>{if(postPage.dataset.postId===previous.postId)$('#pngeaPostScroll').scrollTop=previous.postScroll||0});queueKeyboard()}
      else if(previous.miniId){ui.navigate(previous.origin.screen,previous.origin.detail);openMiniChat(previous.miniId)}else ui.navigate('Inbox',previous.conversationId);return;
    }
    const conversationId=activeDmId();if(!conversationId||!e.target.closest?.('#dmThread'))return;
    const identity=e.target.closest('[data-profile],[data-pngea-dm-profile],#dmTitle,#dmHandle');if(!identity||e.target.closest('button,input,textarea'))return;
    const conversation=(liveAPI()?.state?.conversations||[]).find(c=>c.id===conversationId);
    const handle=identity.dataset.pngeaDmProfile||identity.dataset.profile||(conversation?.members?.length===1?conversation.members[0].handle:null);if(!handle)return;
    e.preventDefault();e.stopImmediatePropagation();openDmProfile(handle);
  },true);
  window.addEventListener('pngea:route',e=>{const route=e.detail||ui?.parseRoute?.();if(dmProfileReturn&&(dmProfileReturn.account!==dmAccount()||route?.screen!=='Profile'))dmProfileReturn=null});
  window.addEventListener('pngea:realtime',event=>{
    const message=event.detail||{},data=message.data||{},id=data.conversationId;if(!id)return;
    if(message.type==='conversation.typing'){
      if(!currentThread(id)||data.userId===liveAPI()?.state?.me?.id)return;if(data.typing)ingestDmTyping(id,[data]);else clearDmTyping(id,data.userId);
    }else if(message.type==='message.created'){
      if(currentThread(id)){clearDmTyping(id,data.senderId||data.sender_id||null);loadThread514(id).catch(()=>{})}
    }else if(message.type==='conversation.request'){
      const conversation=(liveAPI()?.state?.conversations||[]).find(item=>item.id===id);if(conversation)Object.assign(conversation,data);updateDmAccess(id,data);if(currentThread(id)){paintDmGate(id);if(data.request_status!=='declined')loadThread514(id).catch(()=>{})}liveAPI()?.loadConversations?.();
    }
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible')clearOutgoingTyping()});

  // A single viewport-sized frame owns the header, native message scroller and
  // in-flow composer. Safari may pan its visual viewport during focus; moving
  // the whole frame keeps its parts together instead of positioning each piece.
  let keyboardRestHeight=Math.max(innerHeight,window.visualViewport?.height||0),keyboardFrame=0,keyboardWasOpen=false,keyboardMode=null,keyboardGeometry='',keyboardFocusAnchor=null;
  const keyboardChanged=new Map(),keyboardNav=$('.bottom'),keyboardApp=$('.app');
  const editable=el=>el?.matches?.('textarea,input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]),[contenteditable="true"]');
  function keyboardStyle(el,name,value,priority=''){if(!el)return;let original=keyboardChanged.get(el);if(!original){original=new Map();keyboardChanged.set(el,original)}if(!original.has(name))original.set(name,{value:el.style.getPropertyValue(name),priority:el.style.getPropertyPriority(name)});if(el.style.getPropertyValue(name)!==value||el.style.getPropertyPriority(name)!==priority)el.style.setProperty(name,value,priority)}
  function resetKeyboardLayout(){for(const [el,properties] of keyboardChanged){for(const [name,original] of properties){if(original.value)el.style.setProperty(name,original.value,original.priority);else el.style.removeProperty(name)}}keyboardChanged.clear()}
  function keyboardScrollSnapshot(scroll){return scroll?{el:scroll,top:scroll.scrollTop,atBottom:scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight<80}:null}
  function activeThreadViewport(){if(composer?.classList.contains('show')&&composer.classList.contains('pngeaWordReply'))return {mode:'wordReply',frame:composer,scroll:composer.querySelector('.canvas'),bar:composer.querySelector('.capture')};if(postPage.classList.contains('show'))return {mode:'reply',frame:postPage,scroll:$('#pngeaPostScroll'),bar:$('#pngeaPostReplyBar')};if(dmThread514?.classList.contains('show'))return {mode:dmThread514.classList.contains('pngeaMiniChat')?'dmMini':'dm',frame:dmThread514,scroll:dmMessages514,bar:dmCompose514};return null}
  function syncKeyboard(){
    const viewport=window.visualViewport,height=viewport?.height||innerHeight,top=viewport?.offsetTop||0,bottom=top+height,active=document.activeElement;
    const open=(editable(active)||keyboardWasOpen)&&keyboardRestHeight-height>100,thread=activeThreadViewport(),mode=thread?.mode||(composer?.classList.contains('show')?'composer':'editor'),snapshot=keyboardScrollSnapshot(thread?.scroll);
    if(keyboardMode!==mode||!open)resetKeyboardLayout();
    ROOT.classList.toggle('pngeaKeyboardOpen',open);ROOT.classList.toggle('pngeaThreadViewport',!!thread&&(thread.mode!=='dmMini'||open));ROOT.style.setProperty('--pn-visible-bottom',`${bottom}px`);
    if(open){
      // Navigation remains in the full-height app underneath the native keyboard.
      // It never becomes an independently positioned part of the chat layout.
      keyboardStyle(keyboardApp,'height',`${keyboardRestHeight}px`,'important');keyboardStyle(keyboardApp,'min-height',`${keyboardRestHeight}px`,'important');
    }
    if(thread){
      const mini=thread.mode==='dmMini',collapsed=thread.mode==='reply'&&postPage.classList.contains('pngeaPhotoComments')&&postPage.dataset.commentsExpanded!=='true'&&!open,miniGap=open?0:Math.max(82,keyboardNav?.offsetHeight||0),frameHeight=Math.max(0,mini?Math.min(420,height-(open?0:100)):collapsed?height*.66:height-(!open&&thread.mode==='dm'?(keyboardNav?.offsetHeight||70):0));
      ROOT.style.setProperty('--pn-thread-top',`${top+(mini?height-miniGap-frameHeight:collapsed?height-frameHeight:0)}px`);ROOT.style.setProperty('--pn-thread-height',`${frameHeight}px`);
      const geometry=`${mode}:${top}:${frameHeight}:${thread.bar?.offsetHeight||0}:${$('#pngeaDmAttachments')?.offsetHeight||0}`;
      if(geometry!==keyboardGeometry){const anchor=open&&!keyboardWasOpen&&keyboardFocusAnchor?.el===thread.scroll?keyboardFocusAnchor:snapshot;if(anchor?.atBottom)thread.scroll.scrollTop=thread.scroll.scrollHeight;else if(anchor)thread.scroll.scrollTop=anchor.top;keyboardGeometry=geometry}
      if((!mini||open)&&(window.scrollX||window.scrollY))window.scrollTo(0,0);
    }else{
      ROOT.style.removeProperty('--pn-thread-top');ROOT.style.removeProperty('--pn-thread-height');keyboardGeometry='';
      if(open&&composer?.classList.contains('show')){keyboardStyle(composer,'height',`${Math.max(160,bottom-composer.getBoundingClientRect().top)}px`,'important');keyboardStyle(composer,'bottom','auto','important')}
      else if(open){const section=active?.closest('section,.profileEditLayer,.connectionsLayer,#pngeaLiveAuth');const editorScroll=section?.querySelector('.pngeaOverlayScroll,.xScroll,.pnLayerBody,.scroller,#pngeaSendPostPeople,#pngeaNewDmResults');if(editorScroll)keyboardStyle(editorScroll,'max-height',`${Math.max(80,bottom-editorScroll.getBoundingClientRect().top)}px`);if(editable(active)&&active.getBoundingClientRect().bottom>bottom-8){if(editorScroll?.contains(active))editorScroll.scrollTop+=active.getBoundingClientRect().bottom-bottom+12;else active.scrollIntoView({block:'nearest'})}}
    }
    if(!open){keyboardFocusAnchor=null;if(!editable(active))keyboardRestHeight=Math.max(innerHeight,height)}
    keyboardWasOpen=open;keyboardMode=mode;
  }
  function queueKeyboard(){if(keyboardFrame)return;keyboardFrame=requestAnimationFrame(()=>{keyboardFrame=0;syncKeyboard()})}
  window.visualViewport?.addEventListener('resize',queueKeyboard);window.visualViewport?.addEventListener('scroll',queueKeyboard);window.addEventListener('resize',queueKeyboard);window.addEventListener('scroll',queueKeyboard,{passive:true});
  document.addEventListener('focusin',()=>{if(!keyboardWasOpen){keyboardRestHeight=Math.max(keyboardRestHeight,innerHeight,window.visualViewport?.height||0);keyboardFocusAnchor=keyboardScrollSnapshot(activeThreadViewport()?.scroll)}queueKeyboard()});document.addEventListener('focusout',queueKeyboard);
  window.addEventListener('orientationchange',()=>{if(!keyboardWasOpen)keyboardRestHeight=innerHeight;queueKeyboard()});window.addEventListener('pngea:route',queueKeyboard);
  const keyboardBarObserver=new ResizeObserver(queueKeyboard);for(const element of [$('#pngeaPostReplyBar'),dmCompose514,$('#pngeaDmAttachments')])if(element)keyboardBarObserver.observe(element);syncKeyboard();

  // iOS rubber-band gestures can pan the visual viewport even with overflow:hidden.
  // Keep native scrolling inside the thread, containing gestures at its boundaries.
  let threadTouch=null;
  document.addEventListener('touchstart',event=>{const touch=event.touches?.[0],thread=activeThreadViewport();threadTouch=thread&&event.touches.length===1&&(thread.mode!=='dmMini'||thread.frame.contains(event.target))?{x:touch.clientX,y:touch.clientY}:null},{passive:true,capture:true});
  document.addEventListener('touchmove',event=>{
    const thread=activeThreadViewport(),touch=event.touches?.[0];if(!thread||!threadTouch||event.touches.length!==1)return;
    if(thread.mode==='dmMini'&&!thread.frame.contains(event.target))return;
    if(event.target.closest?.('#pngeaMediaViewer.show,#pngeaMediaEditor.show,#pngeaVoiceRecorder.show,#pngeaCaptionEditor.show,#pngeaMentionSuggestions,input[type="range"],video,audio'))return;
    const dx=touch.clientX-threadTouch.x,dy=touch.clientY-threadTouch.y;threadTouch={x:touch.clientX,y:touch.clientY};
    if(Math.abs(dx)>Math.abs(dy)&&event.target.closest?.('#pngeaDmAttachments'))return;
    let scroll=thread.scroll.contains(event.target)?thread.scroll:null;
    const field=event.target.closest?.('textarea');if(field&&thread.frame.contains(field)&&field.scrollHeight>field.clientHeight+1)scroll=field;
    if(scroll&&Math.abs(dy)>=Math.abs(dx)){const max=scroll.scrollHeight-scroll.clientHeight;if(max>1&&((dy>0&&scroll.scrollTop>0)||(dy<0&&scroll.scrollTop<max-1)))return}
    if(event.cancelable)event.preventDefault();
  },{passive:false,capture:true});
  for(const type of ['touchend','touchcancel'])document.addEventListener(type,()=>threadTouch=null,{passive:true,capture:true});

  /* ---------- Fast numeric unread badges ---------- */
  const inboxBadge=document.createElement('span'),notifBadge=document.createElement('span');inboxBadge.className=notifBadge.className='pngeaNavBadge';inboxBadge.id='pngeaInboxBadge';notifBadge.id='pngeaNotifBadge';
  for(const [screen,badge] of [['Inbox',inboxBadge],['Notifications',notifBadge]]){const nav=$(`.nav[data-screen="${screen}"]`),icon=nav?.querySelector('svg');if(icon){const anchor=document.createElement('span');anchor.className='pngeaNavIcon';icon.before(anchor);anchor.append(icon,badge)}else nav?.appendChild(badge)}
  function setBadge(el,n){n=Math.max(0,Number(n||0));el.textContent=n>99?'99+':String(n);el.classList.toggle('show',n>0)}
  let unreadBusy=false;
  async function refreshUnreadCounts(){
    if(unreadBusy||!liveAPI()?.state?.active||!api.unreadCounts)return;unreadBusy=true;
    try{const d=await api.unreadCounts();setBadge(notifBadge,d.notifications);setBadge(inboxBadge,d.messages)}
    catch{}finally{unreadBusy=false}
  }
  setInterval(()=>{if(document.visibilityState==='visible')refreshUnreadCounts()},30000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshUnreadCounts()});
  window.addEventListener('focus',refreshUnreadCounts);
  window.addEventListener('pngea:realtime',e=>{if(['notification.created','message.created','conversation.read'].includes(e.detail?.type))refreshUnreadCounts()});
  setTimeout(refreshUnreadCounts,900);

  /* ---------- Real History ---------- */
  let historyTimer=0;const historyRecentKeys=new Map();
  function historyGlyph(kind=''){if(kind.includes('post'))return'▤';if(kind.includes('profile'))return'○';if(kind.includes('search'))return'⌕';if(kind.includes('message'))return'◌';if(kind.includes('media'))return'▣';return'↺'}
  async function renderHistory(){
    const historyHost=$('#pngeaActivityHistory');if(!historyHost||!api.history)return;
    try{const d=await api.history({limit:100}),items=d.items||[];historyHost.innerHTML=items.length?items.map(x=>`<div class="historyRow" data-history-kind="${escapeHTML(x.kind)}" data-history-object="${escapeHTML(x.object_id||'')}"><div class="historyThumb">${historyGlyph(x.kind)}</div><div class="historyCopy"><b>${escapeHTML(x.label||String(x.kind||'Activity').replaceAll('_',' '))}</b><p>${escapeHTML(relativeTime(x.created_at))}</p></div></div>`).join(''):'<div class="historyEmpty"><b>No history yet</b>Things you view and search for will appear here.</div>'}catch{historyHost.innerHTML='<div class="historyEmpty"><b>History unavailable</b>Try again in a moment.</div>'}
  }
  function recordHistory(body){
    if(!liveAPI()?.state?.active||!api.logHistory)return;const key=`${body.kind}:${body.objectType||''}:${body.objectId||body.label||''}`,now=Date.now();if(now-(historyRecentKeys.get(key)||0)<30000)return;historyRecentKeys.set(key,now);api.logHistory(body).catch(()=>historyRecentKeys.delete(key));
  }
  window.addEventListener('pngea:route',e=>{
    const r=e.detail||ui?.parseRoute?.();
    if(r?.screen==='Profile'&&r.detail)recordHistory({kind:'profile_view',objectType:'user',objectId:r.detail,label:`Viewed @${r.detail}`});
    if(r?.screen==='Inbox'&&r.detail)recordHistory({kind:'message_open',objectType:'conversation',objectId:r.detail,label:'Opened a conversation'});
  });
  window.addEventListener('click',e=>{const p=e.target.closest?.('[data-server-post]');if(p&&!e.target.closest('[data-live-action]')){const who=p.querySelector('[data-profile]')?.dataset.profile||'';recordHistory({kind:'post_view',objectType:'post',objectId:p.dataset.serverPost,label:who?`Viewed a post by @${who}`:'Viewed a post'})}},true);
  const searchInput=$('#globalSearchInput');let searchHistoryTimer=0;searchInput?.addEventListener('input',()=>{clearTimeout(searchHistoryTimer);const q=searchInput.value.trim();if(q.length<3)return;searchHistoryTimer=setTimeout(()=>recordHistory({kind:'search',objectType:'search',objectId:q.toLowerCase(),label:`Search: “${q.slice(0,120)}”`}),900)});
  $('#History')?.addEventListener('click',e=>{const row=e.target.closest('[data-history-kind]');if(!row)return;if(row.dataset.historyKind==='post_view'&&row.dataset.historyObject)openPostPage(row.dataset.historyObject);else if(row.dataset.historyKind==='profile_view'&&row.dataset.historyObject)ui.navigate('Profile',row.dataset.historyObject)});
  $('#History .xAction')?.addEventListener('click',async()=>{if(confirm('Clear your history?')){await api.clearHistory?.().catch(()=>{});renderHistory()}});

  /* ---------- Ticker: persistent, cleaned, sourced, non-repetitive ---------- */
  function decodeTickerText(v=''){
    const ta=document.createElement('textarea');ta.innerHTML=String(v);return ta.value;
  }
  function cleanTickerText(v=''){
    let x=decodeTickerText(v).replace(/<[^>]*>/g,' ').replace(/&(?:#34|quot);?/gi,'"').replace(/\s+/g,' ').trim();
    x=x.replace(/^\s*(?:\d{1,3}\s*[:.)-]\s*)+/,'').replace(/^\s*[|•·–—-]+\s*/,'');
    return x.trim();
  }
  function cleanTickerSource(v=''){return cleanTickerText(v).replace(/\s+(news|media)$/i,' $1').trim()}
  function category(item){
    const topics=(item?.topics||[]).join(' ');
    const s=`${item?.kind||''} ${item?.label||''} ${topics} ${item?.source||''}`.toLowerCase();
    if(/you|notif|mention|reply|follow/.test(s))return'you';
    if(/sport|nfl|nba|mlb|nhl|soccer|football|basketball|baseball|tennis|fifa|ncaa/.test(s))return'sports';
    if(/stock|market|equity|nasdaq|dow|s&p|markets/.test(s))return'stocks';
    if(/internet|viral|social media|technology|tech|culture|creator|streaming|gaming/.test(s))return'internet';
    return'news';
  }
  /* ---------- Feed order + gesture stability ---------- */
  const feedEl=$('#feed');let feedSortQueued=false;
  function stabilizeFeedDom(){
    feedSortQueued=false;if(!feedEl)return;
    const nodes=[...feedEl.querySelectorAll('[data-live-content="true"][data-server-post]')];if(nodes.length<2)return;
    const current=nodes.map(n=>n.dataset.serverPost);
    const sorted=[...nodes].sort((a,b)=>(postOrder.get(b.dataset.serverPost)||0)-(postOrder.get(a.dataset.serverPost)||0)||String(b.dataset.serverPost).localeCompare(String(a.dataset.serverPost)));
    const desired=sorted.map(n=>n.dataset.serverPost);if(current.every((id,i)=>id===desired[i]))return;
    const frag=document.createDocumentFragment();sorted.forEach(n=>frag.appendChild(n));
    const empty=feedEl.querySelector('.liveDataEmpty');feedEl.insertBefore(frag,empty||null);
  }
  const feedObserver=feedEl?new MutationObserver(()=>{if(feedSortQueued)return;feedSortQueued=true;requestAnimationFrame(stabilizeFeedDom)}):null;
  feedObserver?.observe(feedEl,{childList:true});

  // Safari fires gesture events for page pinch. Keep the shell fixed; allow pinch only
  // inside explicit media viewing/editing surfaces.
  ['gesturestart','gesturechange','gestureend'].forEach(type=>document.addEventListener(type,e=>{
    if(!e.target?.closest?.('.pngeaZoomSurface,#pngeaMediaViewerBody,#pngeaMediaEditorBody'))e.preventDefault();
  },{passive:false,capture:true}));

  /* ---------- Route / mutation maintenance ---------- */
  window.addEventListener('pngea:route',()=>{installArtEditor();applyProfileArt().catch(()=>{})});
  let profileRepairTimer=0,profileRepairBusy=false;
  async function repairProfileSurface(){
    if(profileRepairBusy||!$('#Profile')?.classList.contains('active'))return;profileRepairBusy=true;
    try{
      sanitizeAvatarPaint($('#Profile')||document);await Promise.allSettled([applyProfileArt(),applyKnownAvatars($('#Profile')||document)]);
      const host=$('#p-posts');
      const stale=!!host?.querySelector('[data-server-post]:not([data-pngea-profile-row="515"])');
      const missingRail=[...(host?.querySelectorAll('[data-pngea-profile-row="515"][data-server-post]')||[])].some(row=>{
        const media=postMediaById.get(String(row.dataset.serverPost))||[],rail=row.querySelector('.pngeaProfileMediaRail');return media.length&&(!rail||!rail.children.length);
      });
      if(stale){await enhanceProfile()}
      else if(missingRail){for(const row of host.querySelectorAll('[data-pngea-profile-row="515"][data-server-post]')){const media=postMediaById.get(String(row.dataset.serverPost))||[],rail=row.querySelector('.pngeaProfileMediaRail');if(media.length&&rail&&!rail.children.length)await hydrateProfileRail(rail,media)}}
      decorateActions($('#Profile')||document);
    }finally{profileRepairBusy=false}
  }
  const maintenance=new MutationObserver(muts=>{
    if(!muts.some(m=>m.addedNodes?.length||m.removedNodes?.length))return;
    installArtEditor();sanitizeAvatarPaint(document);
    if($('#Profile')?.classList.contains('active')){clearTimeout(profileRepairTimer);profileRepairTimer=setTimeout(()=>repairProfileSurface().catch(()=>{}),90)}
  });
  maintenance.observe(APP,{childList:true,subtree:true});

  // Private runtime health probe: no UI, useful for future regression checks.
  window.PNGEA_STABILITY={version:'0.53.2',check(){
    const badAvatarPaint=[...document.querySelectorAll('[data-profile].pngeaAvatarReady')].filter(el=>!isAvatarElement(el)).length;
    const duplicatePostIds=[...document.querySelectorAll('[data-server-post]')].map(x=>x.dataset.serverPost).filter((x,i,a)=>x&&a.indexOf(x)!==i).length;
    const profileRows=[...document.querySelectorAll('#p-posts [data-server-post]')];
    const profileLegacyRows=profileRows.filter(x=>!x.matches('[data-pngea-profile-row="515"]')).length;
    return {badAvatarPaint,duplicatePostIds,profileLegacyRows,profileRows:profileRows.length,dmComposer:!!document.querySelector('#dmThread .dmCompose #dmInput'),build:document.querySelector('meta[name="pngea-build"]')?.content||''};
  }};

  setTimeout(()=>{sanitizeAvatarPaint(document);enhanceProfile();applyProfileArt();applyKnownAvatars().catch(()=>{});renderComposerMedia();syncSend();refreshUnreadCounts();const r=ui?.parseRoute?.();if(r?.screen==='Inbox'&&r.detail)loadThread514(r.detail).catch(()=>{});api?.feed?.({limit:50}).then(()=>{applyLiveMediaEdits(document);applyKnownAvatars().catch(()=>{})}).catch(()=>{})},900);


  /* ========================================================================
     PNGEA v0.51.6 — CORE RELIABILITY
     Messaging first. One source of truth for social lists, library, communities,
     close friends, ticker continuity, and interaction surfaces.
     ======================================================================== */
  if(!window.__PNGEA_516_CORE__){
    window.__PNGEA_516_CORE__=true;

    const style516=document.createElement('style');style516.id='pngea516Style';style516.textContent=`
      /* Mobile-app feel: selectable only where text entry/copy is intentional. */
      .app *:not(input):not(textarea):not([contenteditable="true"]):not(.articleBody){-webkit-user-select:none!important;user-select:none!important}
      input,textarea,[contenteditable="true"]{-webkit-user-select:text!important;user-select:text!important}
      #pnActionSheet,.pnActionRow,.pnActionClose,.xAction,.sideItem,.nav{ -webkit-user-select:none!important;user-select:none!important }

      /* Absolutely no fake notification residue in live mode. */
      html[data-data-mode="live"] #Notifications .notifRow:not([data-live-notification]),
      html[data-data-mode="live"] #Notifications .xScroll>.notifCopy{display:none!important}

      /* Keep nav glyphs stationary. */
      .notificationBeacon,.notificationBeacon *,.nav,.nav *{animation:none!important;transition:none!important}
      .nav.active .notificationBeacon .beaconCore,.nav.hasNotifications .notificationBeacon .beaconCore{transform:none!important}
      .notificationBeacon::before,.notificationBeacon::after{display:none!important}

      /* Stable ticker uses an epoch-derived negative delay, not page-entry time. */
      #tickerTrack[data-pngea-ticker="516"]{animation-name:ticker!important;animation-duration:108s!important;animation-timing-function:linear!important;animation-iteration-count:infinite!important}

      /* DMs stay anchored to the safe bottom and never disappear. */
      #dmThread{z-index:2147481900!important;background:#050505!important}
      #dmThread .dmMessages{padding-bottom:16px!important}
      #dmThread .dmCompose{display:grid!important;visibility:visible!important;opacity:1!important;z-index:5!important;border-top:1px solid #191919!important}
      #dmThread #pngeaDmAttachments{flex:none!important}
      .msgBubble{width:fit-content!important;max-width:min(78%,330px)!important;min-width:0!important;white-space:pre-wrap!important;word-break:break-word!important;padding:9px 12px!important;border-radius:18px!important;margin:4px 12px!important;line-height:18px!important}
      .msgBubble.me{margin-left:auto!important}
      .msgBubble.them{margin-right:auto!important}
      .pngeaReadReceipt{font-size:9px;color:#666;text-align:right;margin:-1px 16px 5px auto;max-width:78%}
      #dmThread .xAvatar,[data-pngea-dm-profile]{cursor:pointer}

      /* Real History / library tabs. */
      #History .xTopTitle{position:absolute!important;left:50%!important;transform:translateX(-50%)!important;text-align:center!important}
      #History .xTabs{flex:none!important}
      #History .xScroll{padding-bottom:calc(30px + var(--pn-safe-bottom))!important}
      #History .pngeaLibraryList .xPost{border-bottom:1px solid #181818}

      /* Communities baseline. */
      #Communities .xTop{position:relative}
      #Communities .xTopTitle{position:absolute;left:50%;transform:translateX(-50%);text-align:center}
      #Communities .xTop .xAction[data-pngea-community-search]{margin-left:auto}
      #Communities .communityCard{cursor:pointer}
      #Communities .communityJoin{cursor:pointer}
      .pngeaCommunityEmpty{padding:50px 24px;text-align:center;color:#666}.pngeaCommunityEmpty b{display:block;color:#ddd;font-size:18px;margin-bottom:7px}
      .pngeaCommunityCreate{margin:14px;border:1px solid #303030;background:#111;color:#eee;border-radius:999px;padding:10px 14px;font-weight:850}
      #pngeaCommunityPage,#pngeaConnectionsPage,#pngeaCloseFriendsPicker{position:fixed;inset:0;z-index:2147483100;background:#050505;display:none;flex-direction:column;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}
      #pngeaCommunityPage.show,#pngeaConnectionsPage.show,#pngeaCloseFriendsPicker.show{display:flex}
      .pngeaOverlayTop{height:58px;display:grid;grid-template-columns:72px 1fr 72px;align-items:center;border-bottom:1px solid #1b1b1b;padding:0 12px;flex:none}.pngeaOverlayTop b{text-align:center}.pngeaOverlayTop button{background:none;border:0;color:#ddd;font-weight:850;font-size:13px}.pngeaOverlayTop button:first-child{justify-self:start}.pngeaOverlayTop button:last-child{justify-self:end}
      .pngeaOverlayScroll{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch}
      .pngeaCommunityHero{padding:16px;border-bottom:1px solid #191919}.pngeaCommunityHero h2{margin:0 0 6px}.pngeaCommunityHero p{color:#777;font-size:12px;line-height:17px;margin:0}.pngeaCommunityCompose{display:flex;gap:8px;padding:10px 12px;border-bottom:1px solid #191919}.pngeaCommunityCompose input{flex:1;min-width:0;height:42px;background:#111;border:1px solid #292929;border-radius:999px;color:#eee;padding:0 14px;font-size:16px}.pngeaCommunityCompose button{border:0;background:#eee;color:#080808;border-radius:999px;padding:0 15px;font-weight:900}

      /* Close Friends live surface. */
      #CloseFriends{overflow:hidden}
      #CloseFriends .simpleTop{position:relative}.pngeaCloseTitle{position:absolute;left:50%;transform:translateX(-50%);font-weight:900}.pngeaCloseAction{margin-left:auto;border:0;background:none;color:#ddd;font-weight:800}
      #pngeaCloseFriendsBody{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch}
      .pngeaPeopleStrip{display:flex;gap:9px;overflow:auto;padding:10px 12px;border-bottom:1px solid #181818}.pngeaPeopleChip{display:flex;align-items:center;gap:7px;border:1px solid #262626;border-radius:999px;padding:6px 10px 6px 6px;white-space:nowrap}.pngeaPeopleChip .xAvatar{width:28px;height:28px}.pngeaPeopleChip b{font-size:11px}

      /* Connections lists. */
      .pngeaPersonRow{display:flex;align-items:center;gap:11px;padding:12px 14px;border-bottom:1px solid #181818}.pngeaPersonRow .xAvatar{flex:none;width:42px;height:42px}.pngeaPersonCopy{min-width:0;flex:1}.pngeaPersonCopy b{display:block;font-size:13px}.pngeaPersonCopy small{display:block;color:#666;font-size:10px;margin-top:2px}.pngeaPersonRow button{border:1px solid #333;background:#111;color:#ddd;border-radius:999px;padding:7px 11px;font-weight:850}
      #Profile .profileStats span{cursor:pointer;padding:6px 6px 6px 0}

      /* Sidebar globe icon. */
      .pngeaGlobeIcon{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;display:block}
    `;document.head.appendChild(style516);

    /* ---------- API surface ---------- */
    if(api?.request){
      api.bookmarkPost ||= id=>api.request(`/v1/posts/${encodeURIComponent(id)}/bookmark`,{method:'PUT'});
      api.unbookmarkPost ||= id=>api.request(`/v1/posts/${encodeURIComponent(id)}/bookmark`,{method:'DELETE'});
      api.library ||= tab=>api.request(`/v1/me/library?tab=${encodeURIComponent(tab)}`);
      api.followers ||= h=>api.request(`/v1/users/${encodeURIComponent(norm(h))}/followers`);
      api.following ||= h=>api.request(`/v1/users/${encodeURIComponent(norm(h))}/following`);
      api.closeFriends ||= ()=>api.request('/v1/me/close-friends');
      api.addCloseFriend ||= id=>api.request(`/v1/me/close-friends/${encodeURIComponent(id)}`,{method:'PUT'});
      api.removeCloseFriend ||= id=>api.request(`/v1/me/close-friends/${encodeURIComponent(id)}`,{method:'DELETE'});
      api.closeFriendsFeed ||= ()=>api.request('/v1/feed/close-friends');
      api.communities ||= (params={})=>api.request(`/v1/communities?${new URLSearchParams(params)}`);
      api.createCommunity ||= body=>api.request('/v1/communities',{method:'POST',body:JSON.stringify(body||{})});
      api.joinCommunity ||= id=>api.request(`/v1/communities/${encodeURIComponent(id)}/join`,{method:'PUT'});
      api.leaveCommunity ||= id=>api.request(`/v1/communities/${encodeURIComponent(id)}/join`,{method:'DELETE'});
      api.communityFeed ||= id=>api.request(`/v1/communities/${encodeURIComponent(id)}/feed`);
      api.communityPost ||= (id,body)=>api.request(`/v1/communities/${encodeURIComponent(id)}/posts`,{method:'POST',body:JSON.stringify(body||{})});
    }

    if(typeof api?.getUser==='function'){
      const base=api.getUser.bind(api);api.getUser=handle=>{const h=norm(handle);return !h||h==='you'||h===serverHandle()?api.me():base(h)};
    }
    ['followers','following','closeFriends','library','communityFeed','closeFriendsFeed'].forEach(name=>{
      const original=api[name]?.bind(api);if(!original)return;
      api[name]=async(...args)=>{const d=await original(...args);ingestAvatarPayload(name,d);(d?.items||[]).forEach(p=>{if(p.author_id)ingestPostState(p)});return d};
    });

    /* ---------- Kill demo notification state ---------- */
    function scrubFakeNotifications(){
      if(!liveAPI()?.state?.active)return;
      try{if(Array.isArray(ui?.state?.notifications)&&ui.state.notifications.length){ui.state.notifications=[];ui.save?.()}}catch{}
      document.querySelectorAll('#Notifications .notifRow:not([data-live-notification]),#Notifications .xScroll>.notifCopy').forEach(x=>x.remove());
    }
    scrubFakeNotifications();
    window.addEventListener('pngea:route',e=>{if((e.detail||ui?.parseRoute?.())?.screen==='Notifications'){scrubFakeNotifications();setTimeout(()=>liveAPI()?.loadNotifications?.(),30)}});

    /* ---------- Ticker continuity ---------- */
    let tickerOwner='',ticker516Pool=[],tickerPromise=null,tickerExpiryTimer=null;
    function tickerStoreKey(){return `pngea:ticker:pool:${api?.getActiveAccountKey?.()||liveAPI()?.state?.me?.id||'signed-out'}`}
    function tickerAccount(){const owner=tickerStoreKey();if(owner===tickerOwner)return; tickerOwner=owner;ticker516Pool=[];const track=$('#tickerTrack');if(track){track.innerHTML='';delete track.dataset.contentKey}try{const cached=JSON.parse(sessionStorage.getItem(owner)||'{}');if(Date.now()-cached.at<300000)ticker516Pool=cached.items||[]}catch{}}
    function mergeTicker516(items=[]){
      const map=new Map();for(const raw of items){if(!raw?.text)continue;const source=cleanTickerSource(raw.source||'');if(/benzinga/i.test(source))continue;const text=cleanTickerText(raw.text);if(!text)continue;const key=raw.key||`${raw.kind||'news'}:${source}:${text}`.toLowerCase();map.set(key,{...raw,text,source,key})}
      ticker516Pool=[...map.values()].slice(0,50);try{sessionStorage.setItem(tickerOwner,JSON.stringify({at:Date.now(),items:ticker516Pool}))}catch{}
    }
    function renderTicker516(){
      const track=$('#tickerTrack'),ticker=$('.ticker');if(!track||!ticker)return;
      const rows=ticker516Pool.filter(item=>!item.expiresAt||Date.parse(item.expiresAt)>Date.now());
      clearTimeout(tickerExpiryTimer);const nextExpiry=Math.min(...rows.map(item=>Date.parse(item.expiresAt)).filter(Number.isFinite));if(Number.isFinite(nextExpiry))tickerExpiryTimer=setTimeout(renderTicker516,Math.max(20,nextExpiry-Date.now()+20));
      let clockItems=0;const clockItem=()=>`<span class="tickerItem pngeaTimeItem"><b class="tickerLabel">TIME</b><span class="tickerTime" data-clock-index="${clockItems++}"></span></span>`;
      let html=rows.map((x,index)=>{const source=(x.kind==='news'||x.kind==='sports')&&x.source?` — ${x.source}`:'';const sym=category(x)==='stocks'&&x.query?String(x.query).trim().toUpperCase():'';let target='';try{const url=new URL(sym?`https://finance.yahoo.com/quote/${encodeURIComponent(sym)}`:x.url);if(url.protocol==='https:'&&!url.username&&!url.password)target=url.href}catch{}const tag=target?'a':'span';const attrs=[target?`href="${escapeHTML(target)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none"`:'',!target&&x.route?`data-screen="${escapeHTML(x.route)}"`:'',!target&&x.query?`data-ticker-query="${escapeHTML(x.query)}"`:''].filter(Boolean).join(' ');return `<${tag} class="tickerItem ${x.kind==='you'?'you':''}" ${attrs} title="${escapeHTML(x.asOf||'')}"><b class="tickerLabel">${escapeHTML(x.label||String(x.kind||'').toUpperCase())}</b><span>${escapeHTML(x.text+source)}</span></${tag}>`+(index%4===3&&clockItems<3?clockItem():'')}).join('');if(rows.length&&!clockItems)html+=clockItem();
      if(track.dataset.contentKey===html)return;
      const animation=track.getAnimations?.()[0],elapsed=animation?.currentTime||0;
      track.dataset.contentKey=html;track.dataset.pngeaTicker='516';track.innerHTML=html?html+html:'<span class="tickerItem"><b class="tickerLabel">PNGEA</b><span>No current updates</span></span>';
      window.PNGEA_CLOCK?.paint?.();
      ticker.classList.add('liveTickerReady');track.style.animationDelay=`-${(elapsed%108000)/1000}s`;
    }
    async function refreshTicker516(){
      if(!liveAPI()?.state?.active)return;tickerAccount();if(tickerPromise)return tickerPromise;const owner=tickerOwner;
      tickerPromise=(async()=>{try{const started=performance.now(),d=await api.ticker();if(d.generatedAt)window.PNGEA_CLOCK?.sync(d.generatedAt,performance.now()-started);if(owner===tickerStoreKey())mergeTicker516(d.items||[])}catch{}if(owner===tickerStoreKey())renderTicker516()})().finally(()=>tickerPromise=null);return tickerPromise;
    }
    setInterval(()=>{if(document.visibilityState==='visible')refreshTicker516()},60000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshTicker516()});
    window.PNGEA_CORE={loadThread:loadThread514,loadProfile:enhanceProfile,refreshTicker:refreshTicker516,renderPost:profilePostMarkup,hydratePostMedia:hydrateProfileRail,postFormat,syncPostList,upsertPostCard};
    window.dispatchEvent(new Event('pngea:core-ready'));
    queueMicrotask(()=>{if(liveAPI()?.state?.active)refreshTicker516()});

    /* ---------- Save / action sheet: only 3-dot or long hold ---------- */
    let heldPost516=null,hold516=null;
    function openPostActions516(id){
      const sheet=$('#pnActionSheet'),shade=$('#pnSheetShade'),actions=$('#pnSheetActions');if(!sheet||!shade||!actions||!id)return;heldPost516=id;
      $('#pnActionTitle')&&($('#pnActionTitle').textContent='Post');$('#pnActionSubtitle')&&($('#pnActionSubtitle').textContent='POST · actions');
      const owned=postRecords.get(String(id))?.author_id===liveAPI()?.state?.me?.id;
      actions.innerHTML=`<div class="pnActionRow" data-pngea516-action="send"><span class="pnActionGlyph">↗</span><div><b>Send post</b><small>Send in a PNGEA conversation</small></div></div><div class="pnActionRow" data-pngea516-action="save"><span class="pnActionGlyph">⌑</span><div><b>Save</b><small>Add to History → Saved</small></div></div>${canEditCaption(postRecords.get(String(id)))?'<div class="pnActionRow" data-pngea516-action="edit"><span class="pnActionGlyph">✎</span><div><b>Edit caption</b><small>Update your photo or video caption</small></div></div>':''}${owned?'<div class="pnActionRow" data-pngea516-action="delete"><span class="pnActionGlyph">×</span><div><b>Delete post</b><small>Remove your post</small></div></div>':''}`;
      shade.classList.add('show');sheet.classList.add('show');
    }
    for(const layer of [$('#pnSheetShade'),$('#pnActionSheet')])if(layer&&layer.parentElement!==document.body)document.body.appendChild(layer);
    window.addEventListener('click',e=>{const more=e.target.closest?.('[data-server-post] .more,[data-server-post] .kebab,[data-server-post] .menuButton');if(!more)return;e.preventDefault();e.stopImmediatePropagation();openPostActions516(more.closest('[data-server-post]').dataset.serverPost)},true);
    window.addEventListener('touchstart',e=>{if(e.target.closest?.('[data-live-action]')){clearTimeout(hold516);return}const p=e.target.closest?.('[data-server-post]');if(!p)return;e.stopPropagation();heldPost516=p.dataset.serverPost;hold516=setTimeout(()=>openPostActions516(heldPost516),620)},{passive:true,capture:true});
    ['touchend','touchmove','touchcancel'].forEach(t=>document.addEventListener(t,()=>{clearTimeout(hold516);hold516=null},{passive:true,capture:true}));
    document.addEventListener('touchstart',e=>{if(e.target.closest?.('[data-live-action]'))e.stopPropagation()},{capture:true,passive:true});
    $('#pnSheetActions')?.addEventListener('click',async e=>{const row=e.target.closest('[data-pngea516-action]');if(!row||!heldPost516)return;e.preventDefault();e.stopImmediatePropagation();const id=heldPost516;$('#pnSheetShade')?.classList.remove('show');$('#pnActionSheet')?.classList.remove('show');const action=row.dataset.pngea516Action;if(action==='send'){openSendPost(id);return}if(action==='edit'){openCaptionEditor(id);return}try{if(action==='delete'){await api.deletePost(id);document.querySelectorAll(`[data-server-post="${CSS.escape(id)}"]`).forEach(p=>p.remove());postRecords.delete(String(id));if(postPage.dataset.postId===id){closePostPage();ui.navigate('Home')}await enhanceProfile();ui.toast?.('Post deleted')}else{await api.bookmarkPost(id);ui.toast?.('Saved')}}catch(err){ui?.toast?.(err?.message||'Could not update post')}},true);

    /* ---------- History becomes live library ---------- */
    const historyScreen=$('#History'),historyScroll=historyScreen?.querySelector('.xScroll');let libraryTab516='saved',librarySeq=0;
    if(historyScreen){
      const top=historyScreen.querySelector('.xTop');if(top)top.innerHTML=`<span class="xBack" data-screen="Home">‹</span><div class="xTopTitle"><b>History</b></div><span style="width:34px"></span>`;
      let tabs=historyScreen.querySelector('.xTabs');if(!tabs){tabs=document.createElement('div');tabs.className='xTabs';top?.after(tabs)}tabs.innerHTML=`<div class="xTab active" data-library-tab="saved">Saved</div><div class="xTab" data-library-tab="videos">Videos</div><div class="xTab" data-library-tab="articles">Articles</div><div class="xTab" data-library-tab="likes">Likes</div><div class="xTab" data-library-tab="activity">Activity</div>`;
      if(historyScroll)historyScroll.innerHTML='<div class="pngeaLibraryList"></div>';
    }
    async function renderSavedGallery(host,items,isCurrent){
      host.classList.add('pngeaSavedGrid');host.replaceChildren();
      const pending=[];
      for(const post of items){
        rememberPost(post);ingestPostState(post);const format=postFormat(post),visual=['gallery','reel','video'].includes(format),media=visual?(post.media||[]).find(item=>/^(image|video)\//.test(String(item.mimeType||item.mime_type||''))):null;
        const tile=document.createElement('button');tile.type='button';tile.className='pngeaSavedTile';tile.dataset.savedPost=post.id;tile.dataset.savedFormat=format;tile.setAttribute('aria-label',`Open saved post by ${post.display_name||post.handle||'user'}${post.title||post.text?': '+String(post.title||post.text).slice(0,90):''}`);tile.onclick=()=>openPostPage(post.id);host.appendChild(tile);
        if(!media){const copy=document.createElement('div');copy.className='pngeaSavedText';const preview=document.createElement('span');preview.textContent=String(format==='longform'?post.title||post.text:post.text||((post.media||[]).some(item=>String(item.mimeType||item.mime_type||'').startsWith('audio/'))?'Voice post':'Post'));const who=document.createElement('small');who.textContent=post.handle?'@'+post.handle:'';copy.append(preview,who);tile.appendChild(copy);continue}
        const video=String(media.mimeType||media.mime_type||'').startsWith('video/');if(video){const badge=document.createElement('span');badge.className='pngeaSavedVideoBadge';badge.setAttribute('aria-hidden','true');badge.innerHTML='<svg viewBox="0 0 24 24"><path d="m7 4 14 8-14 8Z"/></svg>';tile.appendChild(badge)}
        pending.push((async()=>{try{const access=await cachedMediaAccess(media.id);if(!isCurrent()||!tile.isConnected)return;const element=document.createElement(video?'video':'img');if(video){element.muted=true;element.playsInline=true;element.preload='metadata';element.controls=false;element.tabIndex=-1;element.addEventListener('loadedmetadata',()=>{const start=Math.max(.001,Number(mediaEditObject(media.edit||media.edit_json).trimStartMs||0)/1000);try{element.currentTime=Number.isFinite(element.duration)?Math.min(start,Math.max(0,element.duration-.001)):start}catch{}},{once:true})}else{element.loading='lazy';element.decoding='async';element.alt=post.text||'Saved photo'}element.addEventListener('error',()=>{tile.dataset.unavailable='true'},{once:true});element.src=access.url;tile.prepend(element)}catch{if(isCurrent()&&tile.isConnected)tile.dataset.unavailable='true'}})());
      }
      await Promise.allSettled(pending);
    }
    async function renderLibrary516(tab=libraryTab516){
      if(!historyScroll||!api.library)return;const seq=++librarySeq;libraryTab516=tab;historyScreen?.querySelectorAll('[data-library-tab]').forEach(x=>x.classList.toggle('active',x.dataset.libraryTab===tab));const host=historyScroll.querySelector('.pngeaLibraryList')||historyScroll;
      host.classList.remove('pngeaSavedGrid');
      if(tab==='activity'){host.innerHTML='<div id="pngeaActivityHistory"></div>';await renderHistory();return}
      host.innerHTML='<div class="historyEmpty"><b>Loading…</b></div>';
      try{const d=await api.library(tab);if(seq!==librarySeq)return;const items=d.items||[];if(!items.length){host.innerHTML=`<div class="historyEmpty"><b>No ${escapeHTML(tab)} yet</b>This section updates from your real activity.</div>`;return}if(tab==='saved'){await renderSavedGallery(host,items,()=>seq===librarySeq);return}host.innerHTML=items.map(p=>profilePostMarkup(p,{handle:p.handle,display_name:p.display_name})).join('');const rows=[...host.querySelectorAll('[data-server-post]')];await Promise.allSettled(rows.map((r,i)=>hydrateProfileRail(r.querySelector('.pngeaProfileMediaRail'),items[i]?.media||[])));decorateActions(host);applyKnownAvatars(host).catch(()=>{})}catch{host.classList.remove('pngeaSavedGrid');host.innerHTML='<div class="historyEmpty"><b>Could not load</b>Try again in a moment.</div>'}
    }
    historyScreen?.addEventListener('click',e=>{const t=e.target.closest('[data-library-tab]');if(t)renderLibrary516(t.dataset.libraryTab)});
    window.addEventListener('pngea:route',e=>{if((e.detail||ui?.parseRoute?.())?.screen==='History')renderLibrary516(libraryTab516)});

    /* ---------- Followers / Following ---------- */
    const connectionsPage=document.createElement('section');connectionsPage.id='pngeaConnectionsPage';connectionsPage.innerHTML=`<div class="pngeaOverlayTop"><button id="pngeaConnectionsBack">‹</button><b id="pngeaConnectionsTitle">People</b><span></span></div><div class="pngeaOverlayScroll" id="pngeaConnectionsList"></div>`;document.body.appendChild(connectionsPage);$('#pngeaConnectionsBack').onclick=()=>connectionsPage.classList.remove('show');
    function personRow516(p,{closeFriend=false}={}){return `<div class="pngeaPersonRow" data-profile="${escapeHTML(p.handle)}"><div class="xAvatar" data-profile="${escapeHTML(p.handle)}">${escapeHTML((p.display_name||p.handle||'?').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase())}</div><div class="pngeaPersonCopy"><b>${escapeHTML(p.display_name||p.handle)}</b><small>@${escapeHTML(p.handle)}</small></div>${closeFriend?`<button data-remove-close="${escapeHTML(p.id)}">Remove</button>`:p.id!==liveAPI()?.state?.me?.id&&norm(p.handle)!==serverHandle()?`<button data-connection-follow="${escapeHTML(p.id)}" data-following="${!!p.viewer_following}">${p.viewer_following?'Following':'Follow'}</button>`:''}</div>`}
    async function openConnections516(kind){const handle=ui?.parseRoute?.()?.detail||serverHandle();connectionsPage.classList.add('show');$('#pngeaConnectionsTitle').textContent=kind==='followers'?'Followers':'Following';const host=$('#pngeaConnectionsList');host.innerHTML='<div class="historyEmpty"><b>Loading…</b></div>';try{const d=await (kind==='followers'?api.followers(handle):api.following(handle));host.innerHTML=(d.items||[]).map(p=>personRow516(p)).join('')||'<div class="historyEmpty"><b>No people yet</b></div>';applyKnownAvatars(host).catch(()=>{})}catch{host.innerHTML='<div class="historyEmpty"><b>Could not load</b></div>'}}
    $('#Profile .profileStats')?.addEventListener('click',e=>{const spans=[...e.currentTarget.children],s=e.target.closest('span');if(!s)return;openConnections516(spans.indexOf(s)===0?'following':'followers')});
    connectionsPage.addEventListener('click',async e=>{const follow=e.target.closest('[data-connection-follow]');if(follow){e.preventDefault();e.stopPropagation();if(follow.disabled)return;follow.disabled=true;const wasFollowing=follow.dataset.following==='true';try{await (wasFollowing?api.unfollow(follow.dataset.connectionFollow):api.follow(follow.dataset.connectionFollow));follow.dataset.following=String(!wasFollowing);follow.textContent=wasFollowing?'Follow':'Following';liveAPI()?.loadFeed?.().catch(()=>{})}catch(err){ui.toast?.(err.message||'Could not update follow')}finally{follow.disabled=false}return}const row=e.target.closest('[data-profile]');if(row&&!e.target.closest('button')){connectionsPage.classList.remove('show');ui.navigate('Profile',row.dataset.profile)}});

    /* ---------- Communities ---------- */
    const commScreen=$('#Communities');
    if(commScreen){const top=commScreen.querySelector('.xTop');if(top)top.innerHTML=`<span class="xBack" data-screen="Home">‹</span><div class="xTopTitle"><b>Communities</b></div><button class="xAction" data-pngea-community-search aria-label="Search">⌕</button><button class="xAction" id="pngeaCommunityCreate" aria-label="Create community">+</button>`;const tabs=commScreen.querySelector('.xTabs');if(tabs)tabs.innerHTML=`<div class="xTab active" data-community-tab="home">Home</div><div class="xTab" data-community-tab="discover">Discover</div>`;const scroll=commScreen.querySelector('.xScroll');if(scroll)scroll.innerHTML=`<div class="xPanel active" id="pngeaCommunitiesList"></div>`}
    const globe=$('.sideItem[data-side-screen="Communities"] .sideIcon');if(globe)globe.innerHTML=`<svg class="pngeaGlobeIcon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c3 3.2 4.2 6.2 4.2 9S15 17.8 12 21M12 3C9 6.2 7.8 9.2 7.8 12S9 17.8 12 21"></path></svg>`;
    let communityTab516='home',communitySearch516='';
    function communityCard516(c){return `<div class="communityCard" data-community-id="${escapeHTML(c.id)}"><div class="communityBanner"></div><div class="communityInner"><div class="communityTitle">${escapeHTML(c.name)}</div><div class="communityMeta">${Number(c.members||0).toLocaleString()} members</div><div class="communityDesc">${escapeHTML(c.description||'')}</div>${communityTab516==='discover'&&!c.viewer_member?`<div class="communityJoin" data-community-join="${escapeHTML(c.id)}">Join</div>`:''}</div></div>`}
    async function renderCommunities516(){const host=$('#pngeaCommunitiesList');if(!host)return;host.innerHTML='<div class="historyEmpty"><b>Loading…</b></div>';try{const d=await api.communities({scope:communityTab516,q:communitySearch516}),items=d.items||[];host.innerHTML=(items.map(communityCard516).join('')||`<div class="pngeaCommunityEmpty"><b>${communityTab516==='home'?'No communities yet':'Nothing found'}</b>${communityTab516==='home'?'Create one or discover communities to join.':'Try another search.'}</div>`)}catch{host.innerHTML='<div class="pngeaCommunityEmpty"><b>Communities unavailable</b>Try again shortly.</div>'}}
    const communityTool=document.createElement('section');communityTool.id='pngeaCommunityToolPage';communityTool.style.cssText='position:fixed;inset:0;z-index:2147483150;background:#050505;display:none;flex-direction:column;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';communityTool.innerHTML=`<div class="pngeaOverlayTop"><button id="pngeaCommunityToolBack">‹</button><b id="pngeaCommunityToolTitle">Communities</b><button id="pngeaCommunityToolSave" style="display:none">Create</button></div><div style="padding:12px 14px;display:grid;gap:10px"><input id="pngeaCommunityToolName" placeholder="Community name" style="height:46px;border:1px solid #292929;background:#111;border-radius:14px;color:#eee;padding:0 12px;font-size:16px"><textarea id="pngeaCommunityToolDesc" placeholder="Description" style="min-height:100px;border:1px solid #292929;background:#111;border-radius:14px;color:#eee;padding:12px;font-size:16px;resize:none"></textarea><input id="pngeaCommunityToolSearch" placeholder="Search communities" style="display:none;height:46px;border:1px solid #292929;background:#111;border-radius:14px;color:#eee;padding:0 12px;font-size:16px"></div><div class="pngeaOverlayScroll" id="pngeaCommunityToolResults"></div>`;document.body.appendChild(communityTool);let communityToolMode='create';
    function openCommunityTool516(mode){communityToolMode=mode;communityTool.style.display='flex';$('#pngeaCommunityToolTitle').textContent=mode==='create'?'Create community':'Search communities';$('#pngeaCommunityToolSave').style.display=mode==='create'?'block':'none';$('#pngeaCommunityToolName').style.display=mode==='create'?'block':'none';$('#pngeaCommunityToolDesc').style.display=mode==='create'?'block':'none';$('#pngeaCommunityToolSearch').style.display=mode==='search'?'block':'none';$('#pngeaCommunityToolResults').innerHTML='';setTimeout(()=>$(mode==='create'?'#pngeaCommunityToolName':'#pngeaCommunityToolSearch')?.focus(),60)}
    $('#pngeaCommunityToolBack').onclick=()=>communityTool.style.display='none';$('#pngeaCommunityToolSave').onclick=async()=>{const name=$('#pngeaCommunityToolName').value.trim(),description=$('#pngeaCommunityToolDesc').value.trim();if(!name)return;try{await api.createCommunity({name,description});communityTool.style.display='none';$('#pngeaCommunityToolName').value='';$('#pngeaCommunityToolDesc').value='';communityTab516='home';renderCommunities516()}catch(err){ui.toast?.(err.message||'Could not create community')}};
    let communityToolSearchTimer=0;$('#pngeaCommunityToolSearch').addEventListener('input',()=>{clearTimeout(communityToolSearchTimer);communityToolSearchTimer=setTimeout(async()=>{const q=$('#pngeaCommunityToolSearch').value.trim(),host=$('#pngeaCommunityToolResults');if(!q){host.innerHTML='';return}try{const d=await api.communities({scope:'discover',q});host.innerHTML=(d.items||[]).map(communityCard516).join('')||'<div class="pngeaCommunityEmpty"><b>Nothing found</b></div>'}catch{}},180)});communityTool.addEventListener('click',async e=>{const join=e.target.closest('[data-community-join]');if(join){e.stopPropagation();try{await api.joinCommunity(join.dataset.communityJoin);join.textContent='Joined'}catch(err){ui.toast?.(err.message||'Could not join community')};return}const card=e.target.closest('[data-community-id]');if(card){communityTool.style.display='none';openCommunity516(card.dataset.communityId)}});
    commScreen?.addEventListener('click',async e=>{const tab=e.target.closest('[data-community-tab]');if(tab){communityTab516=tab.dataset.communityTab;commScreen.querySelectorAll('[data-community-tab]').forEach(x=>x.classList.toggle('active',x===tab));renderCommunities516();return}const join=e.target.closest('[data-community-join]');if(join){e.stopPropagation();try{await api.joinCommunity(join.dataset.communityJoin);renderCommunities516()}catch(err){ui.toast?.(err.message||'Could not join community')};return}if(e.target.closest('#pngeaCommunityCreate')){openCommunityTool516('create');return}const card=e.target.closest('[data-community-id]');if(card)openCommunity516(card.dataset.communityId)});
    commScreen?.querySelector('[data-pngea-community-search]')?.addEventListener('click',()=>openCommunityTool516('search'));
    window.addEventListener('pngea:route',e=>{if((e.detail||ui?.parseRoute?.())?.screen==='Communities')renderCommunities516()});

    const communityPage=document.createElement('section');communityPage.id='pngeaCommunityPage';communityPage.innerHTML=`<div class="pngeaOverlayTop"><button id="pngeaCommunityBack">‹</button><b id="pngeaCommunityName">Community</b><span></span></div><div class="pngeaOverlayScroll"><div class="pngeaCommunityHero"><h2 id="pngeaCommunityHeroName"></h2><p id="pngeaCommunityHeroDesc"></p></div><div class="pngeaCommunityCompose"><input id="pngeaCommunityPostInput" placeholder="Post to community"><button id="pngeaCommunityPostSend">Post</button></div><div id="pngeaCommunityFeed"></div></div>`;document.body.appendChild(communityPage);$('#pngeaCommunityBack').onclick=()=>communityPage.classList.remove('show');let activeCommunity516=null;
    async function openCommunity516(id){activeCommunity516=id;communityPage.classList.add('show');const source=(await api.communities({scope:'discover'})).items?.find(x=>x.id===id);$('#pngeaCommunityName').textContent=source?.name||'Community';$('#pngeaCommunityHeroName').textContent=source?.name||'Community';$('#pngeaCommunityHeroDesc').textContent=source?.description||'';await renderCommunityFeed516()}
    async function renderCommunityFeed516(){const host=$('#pngeaCommunityFeed');if(!host||!activeCommunity516)return;host.innerHTML='<div class="historyEmpty"><b>Loading…</b></div>';try{const d=await api.communityFeed(activeCommunity516),items=d.items||[];host.innerHTML=items.map(p=>profilePostMarkup(p,{handle:p.handle,display_name:p.display_name})).join('')||'<div class="historyEmpty"><b>No posts yet</b>Start the conversation.</div>';const rows=[...host.querySelectorAll('[data-server-post]')];await Promise.allSettled(rows.map((r,i)=>hydrateProfileRail(r.querySelector('.pngeaProfileMediaRail'),items[i]?.media||[])));decorateActions(host);applyKnownAvatars(host).catch(()=>{})}catch(err){host.innerHTML=`<div class="historyEmpty"><b>${escapeHTML(err?.message||'Could not load')}</b></div>`}}
    $('#pngeaCommunityPostSend').onclick=async()=>{const input=$('#pngeaCommunityPostInput'),text=input.value.trim();if(!text||!activeCommunity516)return;try{await api.communityPost(activeCommunity516,{text,mediaIds:[]});input.value='';await renderCommunityFeed516()}catch(err){ui.toast?.(err.message||'Could not post')}};

    /* ---------- Close Friends ---------- */
    const cfScreen=$('#CloseFriends');if(cfScreen){cfScreen.innerHTML=`<div class="simpleTop"><span class="back" data-screen="Home">‹</span><span class="pngeaCloseTitle">Close Friends</span><button class="pngeaCloseAction" id="pngeaCloseAdd">Add</button></div><div id="pngeaCloseFriendsBody"><div class="pngeaPeopleStrip" id="pngeaClosePeople"></div><div id="pngeaCloseFeed"></div></div>`}
    async function renderCloseFriends516(){const people=$('#pngeaClosePeople'),feedHost=$('#pngeaCloseFeed');if(!people||!feedHost)return;try{const [friends,feed]=await Promise.all([api.closeFriends(),api.closeFriendsFeed()]);people.innerHTML=(friends.items||[]).map(p=>`<button type="button" class="pngeaPeopleChip" data-close-friend="${escapeHTML(p.id)}" aria-label="Manage ${escapeHTML(p.display_name||p.handle)}"><div class="xAvatar" data-profile="${escapeHTML(p.handle)}">${escapeHTML((p.display_name||p.handle||'?')[0].toUpperCase())}</div><b>${escapeHTML(p.display_name||p.handle)}</b></button>`).join('')||'<span style="color:#666;font-size:11px">Add people to build this feed.</span>';const items=feed.items||[];if(items.length)await syncPostList(feedHost,items);else feedHost.innerHTML='<div class="historyEmpty"><b>No Close Friends posts yet</b>Add people or wait for them to post.</div>';decorateActions(feedHost);applyKnownAvatars(cfScreen).catch(()=>{})}catch{feedHost.innerHTML='<div class="historyEmpty"><b>Could not load Close Friends</b></div>'}}
    window.addEventListener('click',e=>{const chip=e.target.closest?.('#pngeaClosePeople [data-close-friend]');if(!chip)return;e.preventDefault();e.stopImmediatePropagation();const id=chip.dataset.closeFriend;profileActionSheet({rows:[{label:'Remove',danger:true,action:async()=>{await api.removeCloseFriend(id);await renderCloseFriends516()}},{label:'Close'}]})},true);
    const cfPicker=document.createElement('section');cfPicker.id='pngeaCloseFriendsPicker';cfPicker.innerHTML=`<div class="pngeaOverlayTop"><button id="pngeaClosePickerBack">‹</button><b>Add Close Friends</b><span></span></div><div style="padding:10px 14px"><input id="pngeaCloseSearch" placeholder="Search people" style="width:100%;height:46px;border:1px solid #292929;background:#111;border-radius:14px;color:#eee;padding:0 12px;font-size:16px"></div><div class="pngeaOverlayScroll" id="pngeaCloseResults"></div>`;document.body.appendChild(cfPicker);$('#pngeaClosePickerBack').onclick=()=>cfPicker.classList.remove('show');$('#pngeaCloseAdd')?.addEventListener('click',()=>{cfPicker.classList.add('show');$('#pngeaCloseSearch').focus()});let cfSearchTimer=0;$('#pngeaCloseSearch').addEventListener('input',()=>{clearTimeout(cfSearchTimer);cfSearchTimer=setTimeout(async()=>{const q=$('#pngeaCloseSearch').value.trim(),host=$('#pngeaCloseResults');if(!q){host.innerHTML='';return}try{const d=await api.search(q);host.innerHTML=(d.people||[]).filter(p=>p.id!==liveAPI()?.state?.me?.id).map(p=>`<div class="pngeaPersonRow" data-profile="${escapeHTML(p.handle)}"><div class="xAvatar" data-profile="${escapeHTML(p.handle)}">${escapeHTML((p.display_name||p.handle||'?')[0].toUpperCase())}</div><div class="pngeaPersonCopy"><b>${escapeHTML(p.display_name||p.handle)}</b><small>@${escapeHTML(p.handle)}</small></div><button data-add-close="${escapeHTML(p.id)}">Add</button></div>`).join('');applyKnownAvatars(host).catch(()=>{})}catch{}},180)});cfPicker.addEventListener('click',async e=>{const b=e.target.closest('[data-add-close]');if(!b)return;e.preventDefault();e.stopPropagation();try{await api.addCloseFriend(b.dataset.addClose)}catch(err){ui.toast?.(err.message||'Could not add Close Friend');return}b.textContent='Added';setTimeout(()=>{cfPicker.classList.remove('show');renderCloseFriends516()},250)});window.addEventListener('pngea:route',e=>{if((e.detail||ui?.parseRoute?.())?.screen==='CloseFriends')renderCloseFriends516()});

    /* Preserve banner/avatar after route swaps. */
    setInterval(()=>{if(document.visibilityState==='visible'){applyKnownAvatars().catch(()=>{});if($('#Profile')?.classList.contains('active'))applyProfileArt().catch(()=>{})}},4000);

    window.PNGEA_STABILITY.version='0.53.2';
  }

})();
