/* PNGEA v0.51.3 — POSTS + VOICE + TICKER
   Replaces pngea-v0.50.0-alpha-core.js.
   Requires index.html core + v0.40.8 + v0.40.9 first.
*/
(() => {
  'use strict';
  if (window.__PNGEA_V0513_SOCIAL_CORE__) return;
  window.__PNGEA_V0513_SOCIAL_CORE__ = true;

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
    repost:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10l-2.6-2.6M17 17H7l2.6 2.6M19 7l-2.6 2.6M5 17l2.6-2.6"/></svg>`,
    like:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.6 4.4 13.4C.1 9.3 2.7 3.2 7.5 3.2c2 0 3.6 1.1 4.5 2.5.9-1.4 2.5-2.5 4.5-2.5 4.8 0 7.4 6.1 3.1 10.2L12 20.6Z"/></svg>`,
    share:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m0 0L8 7m4-4 4 4M5 12v7h14v-7"/></svg>`,
    gallery:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m5 18 5-5 3 3 2-2 4 4"/></svg>`,
    camera:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6.5 9.5 4h5L16 6.5h3.2A1.8 1.8 0 0 1 21 8.3v9.9a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 18.2V8.3a1.8 1.8 0 0 1 1.8-1.8H8Z"/><circle cx="12" cy="13" r="4"/></svg>`,
    mic:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/></svg>`
  };
  const reactionState=new Map();
  function ingestPostState(p){
    if(!p?.id)return;
    reactionState.set(String(p.id),{
      liked:!!p.viewer_liked,reposted:!!p.viewer_reposted,
      likes:Number(p.likes||0),reposts:Number(p.reposts||0),replies:Number(p.replies||0)
    });
  }

  const postOrder=new Map();
  function postTime(p){const t=Date.parse(p?.created_at||'');return Number.isFinite(t)?t:0}
  function rememberPost(p){if(p?.id)postOrder.set(String(p.id),postTime(p))}
  function stablePosts(items=[]){
    const unique=new Map();
    for(const p of items||[]){if(p?.id&&!unique.has(String(p.id))){unique.set(String(p.id),p);rememberPost(p)}}
    return [...unique.values()].sort((a,b)=>postTime(b)-postTime(a)||String(b.id).localeCompare(String(a.id)));
  }

  const build = $('meta[name="pngea-build"]');
  if (build) build.setAttribute('content','0.51.3-posts-voice-ticker');

  /* ---------- CSS ---------- */
  const style = document.createElement('style');
  style.id = 'pngeaV0513Style';
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



/* v0.51.2 — iPhone safe areas, fixed viewport, media-first posts. */
:root{--pn-safe-top:env(safe-area-inset-top,0px);--pn-safe-bottom:env(safe-area-inset-bottom,0px)}
.status{height:calc(28px + var(--pn-safe-top))!important;padding-top:var(--pn-safe-top)!important}
.bottom{
  height:calc(70px + var(--pn-safe-bottom))!important;
  padding:8px 18px calc(10px + var(--pn-safe-bottom))!important;
  align-items:flex-start!important
}
.compose{bottom:calc(88px + var(--pn-safe-bottom))!important}
.profileEditLayer,.composerLayer,.connectionsLayer,.dmThread,#pngeaLiveAuth{
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

/* Reaction bar: immediate tactile feedback, larger hit areas, no layout jump. */
[data-live-action]{min-width:36px;min-height:32px;display:inline-flex;align-items:center;gap:4px;justify-content:center;
  border-radius:999px;user-select:none;-webkit-user-select:none;transition:transform .08s ease,color .12s ease,background .12s ease}
[data-live-action]:active{transform:scale(.92);background:rgba(255,255,255,.055)}
[data-live-action].pngeaPending{opacity:.72}

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
#composerLayer .captureRow{grid-template-columns:repeat(3,1fr)!important}
#composerLayer .captureRow .cap{min-width:0}
#composerLayer .captureRow .cap b{display:grid;place-items:center}
#composerLayer .captureRow .cap:nth-child(n+4){display:none!important}

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
#pngeaPostPage,#pngeaReplyPage,#pngeaVoiceRecorder{
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
#pngeaReplyPage{display:none;flex-direction:column}
#pngeaReplyPage.show{display:flex}
#pngeaReplyParent{padding:14px 16px 0;display:grid;grid-template-columns:52px 1fr;gap:8px}
#pngeaReplyParentAvatar{width:44px;height:44px;border:1px solid #333;border-radius:50%;display:grid;place-items:center;font-weight:850;position:relative}
#pngeaReplyParentAvatar::after{content:"";position:absolute;width:2px;background:#303030;top:48px;bottom:-70px;left:21px}
#pngeaReplyParentText{font-size:15px;line-height:1.38}
#pngeaReplyTo{color:#666;font-size:13px;margin-top:9px}
#pngeaReplyComposeArea{display:grid;grid-template-columns:52px 1fr;gap:8px;padding:12px 16px;flex:1}
#pngeaReplySelfAvatar{width:44px;height:44px;border-radius:50%;border:1px solid #333;display:grid;place-items:center;font-weight:850}
#pngeaReplyText{width:100%;min-height:110px;border:0;background:transparent;color:#eee;outline:0;resize:none;font:20px/1.35 system-ui;padding:5px 0}
#pngeaReplyToolbar{height:62px;border-top:1px solid #1b1b1b;display:flex;align-items:center;gap:16px;padding:0 16px calc(env(safe-area-inset-bottom) + 6px)}
#pngeaReplyToolbar button{border:0;background:none;color:#ddd;width:38px;height:38px;padding:0;display:grid;place-items:center}
#pngeaReplyToolbar svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8}
#pngeaReplyAttachments{display:flex;gap:6px;overflow:auto;padding:0 16px}
#pngeaReplyAttachments img,#pngeaReplyAttachments video{height:95px;max-width:160px;border-radius:10px;object-fit:cover}
#pngeaReplyAttachments audio{width:260px}

/* Voice recorder. */
#pngeaVoiceRecorder{display:none;flex-direction:column;align-items:center;justify-content:center;gap:22px}
#pngeaVoiceRecorder.show{display:flex}
#pngeaVoiceTimer{font-size:38px;font-weight:850;font-variant-numeric:tabular-nums}
#pngeaVoiceStatus{color:#777}
#pngeaVoiceControls{display:flex;gap:12px}
#pngeaVoiceControls button{border:1px solid #333;border-radius:999px;background:#111;color:#eee;padding:12px 18px;font-weight:800}
#pngeaVoiceControls .primary{background:#eee;color:#080808}
#pngeaVoicePreview{width:min(360px,86vw)}

/* Ticker: prevent encoded garbage from forcing layout. */
.tickerItem>span{white-space:nowrap}

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
    const wrappedPost=async(...args)=>{const p=await originalPost(...args);rememberPost(p);ingestPostState(p);return p};
    wrappedPost.__pngea513=true;api.post=wrappedPost;
  }
  if(api?.request&&!api.postReplies){
    api.postReplies=async(id,params={})=>api.request(`/v1/posts/${encodeURIComponent(id)}/replies?${new URLSearchParams(params)}`);
  }

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
    const slot=await api.createMediaUpload({mimeType:file.type||'application/octet-stream',byteSize:file.size,fileName:file.name||'media'});
    await xhrPut(slot.uploadUrl,slot.headers,file,onProgress);
    await api.completeMedia(slot.mediaId,{});
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

  const captureRow=composer?.querySelector('.captureRow');
  if(captureRow){
    const caps=[...captureRow.querySelectorAll('.cap')];
    if(caps[0]){caps[0].dataset.attach='gallery';caps[0].innerHTML=`<b>${ICONS.gallery}</b><span>Gallery</span>`}
    if(caps[1]){caps[1].dataset.attach='camera';caps[1].innerHTML=`<b>${ICONS.camera}</b><span>Camera</span>`}
    if(caps[2]){caps[2].dataset.attach='voice';caps[2].innerHTML=`<b>${ICONS.mic}</b><span>Voice</span>`}
    caps.slice(3).forEach(x=>x.remove());
  }

  const cameraInput=document.createElement('input');
  cameraInput.type='file';cameraInput.hidden=true;cameraInput.accept='image/*,video/*';cameraInput.setAttribute('capture','environment');
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
    if(voiceTarget==='reply'){replyFiles=validateFiles([...replyFiles,voiceFile]);renderReplyAttachments()}
    else if(voiceTarget==='detailReply'){detailReplyFiles=validateFiles([...detailReplyFiles,voiceFile]);renderDetailAttachments()}
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
    syncSend();
  }
  function syncSend(){if(send)send.disabled=!String(postText?.value||'').trim()&&!postFiles.length}
  postText?.addEventListener('input',syncSend);
  galleryInput.onchange=()=>{postFiles=validateFiles([...postFiles,...galleryInput.files]);galleryInput.value='';renderComposerMedia()};

  // Main post toolbar: Gallery / Camera / Voice.
  window.addEventListener('click',e=>{
    const cap=e.target.closest?.('.cap[data-attach]');
    if(!cap||!composer?.contains(cap))return;
    const kind=cap.dataset.attach;
    if(!['gallery','camera','voice'].includes(kind))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(kind==='gallery'){galleryInput.accept='image/*,video/*';galleryInput.click()}
    else if(kind==='camera')cameraInput.click();
    else startVoiceRecorder('post');
  },true);

  /* media editor */
  const editor=document.createElement('section');editor.id='pngeaMediaEditor';
  editor.innerHTML=`<div class="pngeaPageTop"><button id="pngeaMediaEditorCancel">Cancel</button><b>Preview</b><button id="pngeaMediaEditorDone">Done</button></div><div id="pngeaMediaEditorBody"></div><div id="pngeaMediaEditorTools"></div>`;
  document.body.appendChild(editor);
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

  /* top-level media viewer */
  const mediaViewer=document.createElement('section');mediaViewer.id='pngeaMediaViewer';
  mediaViewer.innerHTML=`<div id="pngeaMediaViewerTop"><button id="pngeaMediaViewerClose" type="button">Close</button><b>Media</b><span style="width:52px"></span></div><div id="pngeaMediaViewerBody" class="pngeaZoomSurface"></div>`;
  document.body.appendChild(mediaViewer);
  function closeMediaViewer(){
    const host=$('#pngeaMediaViewerBody');host?.querySelectorAll('video').forEach(v=>{try{v.pause()}catch{}});if(host)host.innerHTML='';mediaViewer.classList.remove('show');
  }
  function openMediaViewer(source){
    const host=$('#pngeaMediaViewerBody');if(!host||!source?.src)return;
    host.innerHTML='';const isVideo=source.tagName==='VIDEO';const el=document.createElement(isVideo?'video':'img');el.src=source.currentSrc||source.src;
    if(isVideo){el.controls=true;el.playsInline=true;el.autoplay=true;el.muted=source.muted||false;try{el.currentTime=source.currentTime||0}catch{}}
    else el.alt=source.alt||'Post media';
    host.appendChild(el);mediaViewer.classList.add('show');requestAnimationFrame(()=>{if(isVideo)el.play?.().catch(()=>{})});
  }
  $('#pngeaMediaViewerClose').onclick=closeMediaViewer;
  mediaViewer.addEventListener('click',e=>{if(e.target===mediaViewer||e.target.id==='pngeaMediaViewerBody')closeMediaViewer()});
  window.addEventListener('click',e=>{
    const media=e.target.closest?.('.liveMediaRail img,.liveMediaRail video,.pngeaProfileMediaRail img,.pngeaProfileMediaRail video,.pngeaMediaTile img,.pngeaMediaTile video');
    if(!media||e.target.closest('#pngeaMediaViewer,#pngeaMediaEditor'))return;
    e.preventDefault();e.stopImmediatePropagation();openMediaViewer(media);
  },true);

  /* drafts */
  const draftsPage=document.createElement('section');draftsPage.id='pngeaDraftsPage';
  draftsPage.innerHTML=`<div class="pngeaPageTop"><button id="pngeaDraftsClose">Close</button><b>Drafts</b><span></span></div><div id="pngeaDraftList"></div>`;
  document.body.appendChild(draftsPage);
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
    const text=String(postText?.value||'').trim(),live=liveAPI()?.state,replyParent=live?.replyToId||null;
    if(!text&&!postFiles.length)return;
    posting=true;if(send)send.disabled=true;
    const bar=uploadProgress.querySelector('i');uploadProgress.classList.toggle('show',!!postFiles.length);
    const label=$('#detected'),oldLabel=label?.textContent||'New post';
    try{
      await ensureSession(false);
      const progress=postFiles.map(()=>0),mediaIds=new Array(postFiles.length);
      let nextUpload=0;
      const worker=async()=>{
        for(;;){
          const i=nextUpload++;if(i>=postFiles.length)return;
          mediaIds[i]=await uploadMedia(postFiles[i],fraction=>{
            progress[i]=fraction;const pct=(progress.reduce((a,b)=>a+b,0)/Math.max(progress.length,1))*100;
            if(bar)bar.style.width=`${pct}%`;if(label)label.textContent=`Uploading ${Math.round(pct)}%`;
          });
          progress[i]=1;
        }
      };
      await Promise.all(Array.from({length:Math.min(2,Math.max(1,postFiles.length))},worker));
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
      if(replyParent)bumpReplyCount(replyParent,1);
      // One controlled refresh after posting; do not race Home/Profile renderers.
      await Promise.allSettled([liveAPI()?.loadFeed?.(),enhanceProfile()]);
      setTimeout(()=>{liveAPI()?.loadFeed?.();enhanceProfile()},1200);
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
    const el=document.createElement(mime.startsWith('audio/')?'audio':mime.startsWith('video/')?'video':'img');
    el.className=cls;el.src=a.url;
    if(el.tagName==='VIDEO'){el.controls=true;el.playsInline=true;el.preload='metadata'}
    else if(el.tagName==='AUDIO'){el.controls=true;el.preload='metadata'}
    else el.loading='lazy';
    return el;
  }
  async function hydrateProfileRail(rail,media=[]){
    if(!media.length){rail.remove();return}
    for(const m of media){try{rail.appendChild(await mediaElement(m))}catch{}}
  }
  function profilePostMarkup(p,profile){
    ingestPostState(p);
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

  let profileRenderSeq=0;
  async function enhanceProfile(){
    const seq=++profileRenderSeq;
    const live=liveAPI()?.state;if(!live?.active||!ui?.parseRoute)return;
    const route=ui.parseRoute();if(route.screen!=='Profile')return;
    const requested=norm(route.detail||live.me?.handle);if(!requested)return;
    try{
      const self=requested===serverHandle()||requested===getAlias();
      const realHandle=self?serverHandle():requested;
      const [profile,posts]=await Promise.all([api.getUser(realHandle),self?api.myPosts():api.userPosts(realHandle)]);
      if(seq!==profileRenderSeq||ui.parseRoute()?.screen!=='Profile')return;
      const items=stablePosts(posts.items||[]);
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

  /* ---------- Post detail + reply threads + unified reactions ---------- */
  const reactionLocks=new Set();

  function actionCount(el){
    const d=Number(el?.dataset?.count);
    if(Number.isFinite(d))return d;
    const m=String(el?.textContent||'').match(/([0-9][0-9,]*)\s*$/);return m?Number(m[1].replace(/,/g,'')):0;
  }
  function actionMarkup(kind,count=0,on=false){
    const icon=ICONS[kind]||'';
    const n=Math.max(0,Number(count||0));
    return `${icon}${kind==='share'?'':`<span class="pngeaActionCount">${n.toLocaleString()}</span>`}`;
  }
  function paintAction(el,kind,on,count){
    if(!el)return;
    const n=Math.max(0,Number(count||0));
    el.classList.toggle('activeAction',!!on);el.dataset.count=String(n);
    el.innerHTML=actionMarkup(kind,n,on);
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
    try{const p=await api.post(id);ingestPostState(p);paintPostState(id);if($('#pngeaPostPage').classList.contains('show')&&$('#pngeaPostPage').dataset.postId===String(id))updateDetailHeaderCounts(p)}catch{}
  }
  function bumpReplyCount(id,delta){
    const st=stateFor(id);st.replies=Math.max(0,st.replies+delta);reactionState.set(String(id),st);paintPostState(id);
  }

  async function renderMediaInto(host,media=[]){
    if(!host)return;host.innerHTML='';
    for(const m of media||[]){
      try{
        const a=await api.mediaAccess(m.id),mime=String(a.mimeType||m.mimeType||'');
        const el=document.createElement(mime.startsWith('audio/')?'audio':mime.startsWith('video/')?'video':'img');
        el.src=a.url;
        if(el.tagName==='VIDEO'){el.controls=true;el.playsInline=true;el.preload='metadata'}
        else if(el.tagName==='AUDIO'){el.controls=true;el.preload='metadata'}
        else{el.loading='lazy';el.alt='Post media'}
        host.appendChild(el);
      }catch{}
    }
  }
  function postInitials(p){return escapeHTML(String(p?.display_name||p?.handle||'?').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase())}
  function detailPostHTML(p,{reply=false}={}){
    ingestPostState(p);
    return `<article class="${reply?'pngeaReplyItem':'pngeaDetailPost'}" data-server-post="${escapeHTML(p.id)}">
      <div class="pngeaDetailWho"><div class="pngeaDetailAvatar" data-profile="${escapeHTML(p.handle)}">${postInitials(p)}</div>
      <div class="pngeaDetailName" data-profile="${escapeHTML(p.handle)}"><b>${escapeHTML(p.display_name||p.handle)}</b><span>@${escapeHTML(displayHandle(p.handle))} · ${escapeHTML(relativeTime(p.created_at))}</span></div></div>
      <div class="pngeaDetailText">${escapeHTML(p.text||'')}</div>
      <div class="pngeaDetailMedia" data-post-media="${escapeHTML(p.id)}"></div>
      ${reply?'':`<div class="pngeaDetailMeta">${new Date(p.created_at).toLocaleString()}</div>`}
      <div class="${reply?'xPostActions':'pngeaDetailActions'}">
        <span data-live-action="reply"></span><span data-live-action="repost"></span><span data-live-action="like"></span><span data-live-action="share"></span>
      </div>
    </article>`;
  }

  const postPage=document.createElement('section');postPage.id='pngeaPostPage';
  postPage.innerHTML=`<div class="pngeaPostTop"><button id="pngeaPostBack" aria-label="Back">‹</button><b>Post</b><span></span></div>
    <div id="pngeaPostScroll"><div id="pngeaPostBody"></div><div class="pngeaReplyList" id="pngeaReplyList"></div></div>
    <div id="pngeaPostReplyBar"><div id="pngeaPostReplyRow"><textarea id="pngeaPostReplyInput" rows="1" placeholder="Post your reply"></textarea><button class="pngeaReplySend" id="pngeaPostReplySend">Reply</button></div>
    <div class="pngeaReplyTools"><button data-detail-pick="gallery" aria-label="Gallery">${ICONS.gallery}</button><button data-detail-pick="camera" aria-label="Camera">${ICONS.camera}</button><button data-detail-pick="voice" aria-label="Voice">${ICONS.mic}</button></div><div id="pngeaDetailAttachments"></div></div>`;
  document.body.appendChild(postPage);

  let detailReplyFiles=[];
  function renderDetailAttachments(){
    const host=$('#pngeaDetailAttachments');if(!host)return;host.innerHTML='';
    detailReplyFiles.forEach(f=>{const u=URL.createObjectURL(f);previewURLs.push(u);const e=document.createElement(f.type.startsWith('audio/')?'audio':f.type.startsWith('video/')?'video':'img');e.src=u;if(e.tagName==='AUDIO'||e.tagName==='VIDEO')e.controls=true;host.appendChild(e)});
  }
  function updateDetailHeaderCounts(p){if(p)ingestPostState(p);paintPostState(postPage.dataset.postId)}
  async function loadPostPage(id){
    if(!id)return;postPage.dataset.postId=String(id);postPage.classList.add('show');ROOT.classList.add('pngeaPostOpen');
    $('#pngeaPostBody').innerHTML='<div class="profileEmpty">Loading post…</div>';$('#pngeaReplyList').innerHTML='';
    try{
      const p=await api.post(id);ingestPostState(p);
      $('#pngeaPostBody').innerHTML=detailPostHTML(p);
      await renderMediaInto($('#pngeaPostBody [data-post-media]'),p.media||[]);
      let replies=[];
      try{const d=await api.postReplies(id,{limit:100});replies=d.items||[];replies.forEach(ingestPostState)}catch{}
      const list=$('#pngeaReplyList');list.innerHTML=replies.length?replies.map(x=>detailPostHTML(x,{reply:true})).join(''):'<div class="profileEmpty"><b>No replies yet</b>Start the conversation.</div>';
      for(const r of replies)await renderMediaInto(list.querySelector(`[data-server-post="${CSS.escape(String(r.id))}"] [data-post-media]`),r.media||[]);
      decorateActions(postPage);
    }catch(err){$('#pngeaPostBody').innerHTML=`<div class="profileEmpty"><b>Could not load post</b>${escapeHTML(err?.message||'Try again.')}</div>`}
  }
  function openPostPage(id){
    const hash=`#/post/${encodeURIComponent(id)}`;
    if(location.hash!==hash)history.pushState(null,'',hash);
    loadPostPage(id);
  }
  function closePostPage(){
    postPage.classList.remove('show');ROOT.classList.remove('pngeaPostOpen');postPage.dataset.postId='';detailReplyFiles=[];renderDetailAttachments();
  }
  function syncPostRoute(){
    const m=(location.hash||'').match(/^#\/post\/([^/?#]+)/);
    if(m)loadPostPage(decodeURIComponent(m[1]));else closePostPage();
  }
  $('#pngeaPostBack').onclick=()=>{if((location.hash||'').startsWith('#/post/'))history.back();else closePostPage()};
  window.addEventListener('popstate',syncPostRoute);window.addEventListener('hashchange',syncPostRoute);
  setTimeout(syncPostRoute,100);

  const replyPage=document.createElement('section');replyPage.id='pngeaReplyPage';
  replyPage.innerHTML=`<div class="pngeaPostTop"><button id="pngeaReplyCancel">Cancel</button><b>Reply</b><button class="pngeaReplySend" id="pngeaReplySend">Reply</button></div>
    <div id="pngeaReplyParent"><div id="pngeaReplyParentAvatar"></div><div><div id="pngeaReplyParentText"></div><div id="pngeaReplyTo"></div></div></div>
    <div id="pngeaReplyComposeArea"><div id="pngeaReplySelfAvatar"></div><textarea id="pngeaReplyText" placeholder="Post your reply"></textarea></div>
    <div id="pngeaReplyAttachments"></div>
    <div id="pngeaReplyToolbar"><button data-reply-pick="gallery">${ICONS.gallery}</button><button data-reply-pick="camera">${ICONS.camera}</button><button data-reply-pick="voice">${ICONS.mic}</button></div>`;
  document.body.appendChild(replyPage);
  let replyParent=null,replyFiles=[];
  function renderReplyAttachments(){
    const host=$('#pngeaReplyAttachments');if(!host)return;host.innerHTML='';
    replyFiles.forEach(f=>{const u=URL.createObjectURL(f);previewURLs.push(u);const e=document.createElement(f.type.startsWith('audio/')?'audio':f.type.startsWith('video/')?'video':'img');e.src=u;if(e.tagName==='AUDIO'||e.tagName==='VIDEO')e.controls=true;host.appendChild(e)});
  }
  async function openReplyComposer(id){
    replyFiles=[];renderReplyAttachments();$('#pngeaReplyText').value='';
    try{
      replyParent=await api.post(id);ingestPostState(replyParent);
      $('#pngeaReplyParentAvatar').textContent=postInitials(replyParent);
      $('#pngeaReplyParentText').innerHTML=`<b>${escapeHTML(replyParent.display_name||replyParent.handle)}</b> <span style="color:#666">@${escapeHTML(displayHandle(replyParent.handle))} · ${escapeHTML(relativeTime(replyParent.created_at))}</span><div style="margin-top:5px">${escapeHTML(replyParent.text||'')}</div>`;
      $('#pngeaReplyTo').innerHTML=`Replying to <span style="color:#aaa">@${escapeHTML(displayHandle(replyParent.handle))}</span>`;
      $('#pngeaReplySelfAvatar').textContent=String(liveAPI()?.state?.me?.display_name||'You').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
      replyPage.classList.add('show');requestAnimationFrame(()=>$('#pngeaReplyText').focus());
    }catch(err){ui?.toast?.(err?.message||'Could not open reply')}
  }
  function closeReplyComposer(){replyPage.classList.remove('show');replyParent=null;replyFiles=[];renderReplyAttachments()}
  $('#pngeaReplyCancel').onclick=closeReplyComposer;

  function chooseReplyMedia(target,camera=false){
    const input=document.createElement('input');input.type='file';input.accept='image/*,video/*';input.multiple=!camera;if(camera)input.setAttribute('capture','environment');
    input.onchange=()=>{const files=validateFiles([...input.files]);if(target==='detail'){detailReplyFiles=validateFiles([...detailReplyFiles,...files]);renderDetailAttachments()}else{replyFiles=validateFiles([...replyFiles,...files]);renderReplyAttachments()}input.remove()};
    document.body.appendChild(input);input.click();
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-reply-pick]');if(b){e.preventDefault();const k=b.dataset.replyPick;if(k==='voice')startVoiceRecorder('reply');else chooseReplyMedia('reply',k==='camera');return}
    const d=e.target.closest?.('[data-detail-pick]');if(d){e.preventDefault();const k=d.dataset.detailPick;if(k==='voice')startVoiceRecorder('detailReply');else chooseReplyMedia('detail',k==='camera')}
  },true);

  async function uploadReplyFiles(files=[]){
    const ids=[];for(const f of files)ids.push(await uploadMedia(f));return ids;
  }
  async function submitReply(parentId,text,files=[]){
    text=String(text||'').trim();if(!text&&!files.length)return null;
    await ensureSession(false);const mediaIds=await uploadReplyFiles(files);
    let created;
    try{created=await api.createPost({text,visibility:'public',replyToId:parentId,mediaIds})}
    catch(err){if(mediaIds.length&&mediaNotReadyError(err)){await waitMedia(mediaIds);created=await api.createPost({text,visibility:'public',replyToId:parentId,mediaIds})}else throw err}
    bumpReplyCount(parentId,1);return created;
  }
  $('#pngeaReplySend').onclick=async()=>{
    if(!replyParent)return;const b=$('#pngeaReplySend');b.disabled=true;
    try{await submitReply(replyParent.id,$('#pngeaReplyText').value,replyFiles);const id=replyParent.id;closeReplyComposer();await Promise.allSettled([liveAPI()?.loadFeed?.(),enhanceProfile(),reconcilePostState(id)]);ui?.toast?.('Reply posted')}
    catch(err){ui?.toast?.(err?.message||'Could not reply')}finally{b.disabled=false}
  };
  $('#pngeaPostReplySend').onclick=async()=>{
    const id=postPage.dataset.postId;if(!id)return;const b=$('#pngeaPostReplySend');b.disabled=true;
    try{await submitReply(id,$('#pngeaPostReplyInput').value,detailReplyFiles);$('#pngeaPostReplyInput').value='';detailReplyFiles=[];renderDetailAttachments();await loadPostPage(id);await Promise.allSettled([liveAPI()?.loadFeed?.(),enhanceProfile()])}
    catch(err){ui?.toast?.(err?.message||'Could not reply')}finally{b.disabled=false}
  };

  async function toggleReaction(id,kind,action){
    const lock=`${kind}:${id}`;if(reactionLocks.has(lock))return;reactionLocks.add(lock);
    const st=stateFor(id),prev={...st},nextOn=kind==='like'?!st.liked:!st.reposted;
    if(kind==='like'){st.liked=nextOn;st.likes=Math.max(0,st.likes+(nextOn?1:-1))}
    else{st.reposted=nextOn;st.reposts=Math.max(0,st.reposts+(nextOn?1:-1))}
    reactionState.set(String(id),st);paintPostState(id);matchingActions(id,kind).forEach(x=>x.classList.add('pngeaPending'));
    try{
      await ensureSession(false);
      if(kind==='like')nextOn?await api.likePost(id):await api.unlikePost(id);
      else nextOn?await api.repost(id):await api.unrepost(id);
      setTimeout(()=>reconcilePostState(id),650);
    }catch(err){reactionState.set(String(id),prev);paintPostState(id);ui?.toast?.(err?.message||'Could not update post')}
    finally{matchingActions(id,kind).forEach(x=>x.classList.remove('pngeaPending'));reactionLocks.delete(lock)}
  }

  window.addEventListener('click',async e=>{
    const action=e.target.closest?.('[data-live-action]');if(!action||!liveAPI()?.state?.active)return;
    const post=action.closest('[data-server-post]');if(!post)return;
    e.preventDefault();e.stopImmediatePropagation();
    const id=post.dataset.serverPost,kind=action.dataset.liveAction;
    if(kind==='reply'){openReplyComposer(id);return}
    if(kind==='share'){
      const url=`${location.origin}${location.pathname}#/post/${encodeURIComponent(id)}`;
      try{if(navigator.share)await navigator.share({title:'PNGEA post',url});else{await navigator.clipboard.writeText(url);ui?.toast?.('Link copied')}}catch{}return;
    }
    if(kind==='like'||kind==='repost')toggleReaction(id,kind,action);
  },true);

  // Clicking the body of a post opens a dedicated post page. Author, media, menus and actions keep their own behavior.
  window.addEventListener('click',e=>{
    const post=e.target.closest?.('[data-server-post]');if(!post||postPage.contains(post)||replyPage.contains(post))return;
    if(e.target.closest?.('[data-live-action],.liveMediaRail,.pngeaProfileMediaRail,.pngeaMediaTile,[data-profile],.authorRow,.xPostWho,.kebab,.menuButton,button,a'))return;
    e.preventDefault();openPostPage(post.dataset.serverPost);
  },true);

  // Re-decorate only when children are replaced; no attribute observer loops.
  let decorateQueued=false;
  const actionObserver=new MutationObserver(muts=>{
    if(decorateQueued)return;
    if(!muts.some(m=>m.addedNodes?.length))return;
    decorateQueued=true;requestAnimationFrame(()=>{decorateQueued=false;decorateActions(document)});
  });
  actionObserver.observe(APP,{childList:true,subtree:true});
  setTimeout(()=>decorateActions(document),250);

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

  /* ---------- Ticker: persistent, cleaned, sourced, non-repetitive ---------- */
  const tickerPool=new Map();let tickerOffset=0;
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
  function addTickerItems(items=[]){
    const now=Date.now();
    for(const raw of items){
      if(!raw?.text)continue;
      const source=cleanTickerSource(raw.source||'');
      if(/benzinga/i.test(source))continue;
      const text=cleanTickerText(raw.text);if(!text)continue;
      const key=raw.key||`${raw.kind||'news'}:${source}:${text}`.toLowerCase();
      tickerPool.set(key,{...raw,text,source,_seen:now});
    }
    // Keep a broad same-day pool, but cap memory.
    const rows=[...tickerPool.entries()].sort((a,b)=>(new Date(b[1].asOf||0)-new Date(a[1].asOf||0))||(b[1]._seen-a[1]._seen));
    tickerPool.clear();rows.slice(0,60).forEach(([k,v])=>tickerPool.set(k,v));
  }
  function balancedWindow(items=[]){
    const quotas={news:2,internet:2,stocks:1,sports:2,you:1},groups={news:[],internet:[],stocks:[],sports:[],you:[]};
    items.forEach(x=>groups[category(x)].push(x));
    const out=[];
    for(const k of ['news','internet','sports','stocks','you'])out.push(...groups[k].slice(0,quotas[k]));
    const used=new Set(out);for(const x of items)if(!used.has(x)&&out.length<8){out.push(x);used.add(x)}
    return out.slice(0,8);
  }
  function tickerCandidates(){
    const all=[...tickerPool.values()].sort((a,b)=>new Date(b.asOf||b._seen)-new Date(a.asOf||a._seen));
    if(all.length<=8)return all;
    const rotated=all.map((_,i)=>all[(i+tickerOffset)%all.length]);tickerOffset=(tickerOffset+8)%all.length;
    return rotated;
  }
  function renderTickerWindow(){
    const ticker=$('.ticker'),track=$('#tickerTrack');if(!ticker||!track)return;
    const rows=balancedWindow(tickerCandidates());
    if(!rows.length)rows.push({kind:'news',label:'PNGEA',text:navigator.onLine?'Headlines updating':'Offline · reconnecting'});
    rows.push({kind:'time',label:'TIME',text:new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})});
    const html=rows.map(x=>{
      const source=x.kind==='news'&&x.source?` — ${cleanTickerSource(x.source)}`:'';
      const text=`${cleanTickerText(x.text)}${source}`;
      const cls=x.kind==='you'?'tickerItem you':'tickerItem';
      const attrs=[x.route?`data-screen="${escapeHTML(x.route)}"`:'',x.url?`data-ticker-url="${escapeHTML(x.url)}"`:'',x.query?`data-ticker-query="${escapeHTML(x.query)}"`:''].filter(Boolean).join(' ');
      return `<span class="${cls}" ${attrs}><b class="tickerLabel">${escapeHTML(x.label||String(x.kind||'').toUpperCase())}</b><span>${escapeHTML(text)}</span></span>`;
    }).join('');
    track.innerHTML=html+html;ticker.classList.add('liveTickerReady');
  }
  async function updateTicker510(){
    try{const d=await api.ticker();addTickerItems(d.items||[]);renderTickerWindow()}catch{renderTickerWindow()}
  }
  if(!localStorage.getItem('pngea:ticker:max20')){
    api?.updateTickerPreferences?.({maxItems:20}).then(()=>localStorage.setItem('pngea:ticker:max20','1')).catch(()=>{});
  }
  setTimeout(updateTicker510,700);
  setInterval(()=>{if(document.visibilityState==='visible')updateTicker510()},60000);
  setInterval(()=>{if(document.visibilityState==='visible')renderTickerWindow()},12000);

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
  window.addEventListener('hashchange',()=>setTimeout(()=>{enhanceProfile();installArtEditor();applyProfileArt()},220));
  let profileRepairTimer=0;
  const maintenance=new MutationObserver(()=>{
    installArtEditor();
    if($('#Profile')?.classList.contains('active')){
      applyProfileArt();
      const host=$('#p-posts');
      if(host?.querySelector('[data-server-post]')&&!host.querySelector('.pngeaProfileMediaRail')){
        clearTimeout(profileRepairTimer);profileRepairTimer=setTimeout(enhanceProfile,60);
      }
    }
  });
  maintenance.observe(APP,{childList:true,subtree:true});

  setTimeout(()=>{enhanceProfile();applyProfileArt();renderComposerMedia();syncSend()},900);
})();
