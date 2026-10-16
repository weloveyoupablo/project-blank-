/* PNGEA v0.40.8 — BASIC UI FIX
   Scope: bell size, dual-gear icon, drawer bleed, true full-page composer.
   Weixin-style extras intentionally deferred until core UI is stable. */
(() => {
  'use strict';
  if (window.__PNGEA_V0408_BASIC_FIX__) return;
  window.__PNGEA_V0408_BASIC_FIX__ = true;

  const ROOT = document.documentElement;
  const APP = document.querySelector('.app');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const meta = $('meta[name="pngea-build"]');
  if (meta) meta.setAttribute('content', '0.40.8-basic-ui-fix');

  // ---------- HARD CSS OVERRIDES ----------
  const style = document.createElement('style');
  style.id = 'pngeaV0408BasicFixStyle';
  style.textContent = `
/* Bell: keep the full nav footprint and use a physically wider/taller silhouette. */
.notificationBell{
  width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;
  transform:translateY(-1px)!important;display:grid!important;place-items:center!important;
}
.notificationBellSvg{
  width:40px!important;height:40px!important;display:block!important;overflow:visible!important;
}
.notificationBellSvg .bellBody{
  fill:none!important;stroke:currentColor!important;stroke-width:2.7!important;
  stroke-linecap:round!important;stroke-linejoin:round!important;
}
.notificationBellSvg .bellClapper{
  fill:none!important;stroke:currentColor!important;stroke-width:2.55!important;
  stroke-linecap:round!important;stroke-linejoin:round!important;
}
.nav.active .notificationBellSvg .bellBody{
  fill:currentColor!important;stroke:currentColor!important;
}
.nav.active .notificationBellSvg .bellClapper{
  stroke:currentColor!important;
}

/* Dual-gear settings icon, matching the supplied "two meshing gears" reference. */
.simpleGearIcon,
.notificationSettingsButton svg,
.sideSettings svg,
[data-dm-action="settings"] .dmMenuGlyph svg{
  fill:none!important;stroke:currentColor!important;stroke-width:2!important;
  stroke-linecap:round!important;stroke-linejoin:round!important;
}
.notificationSettingsButton svg,.simpleGearIcon{
  width:27px!important;height:27px!important;
}
.sideSettings .simpleGearIcon{
  width:20px!important;height:20px!important;
}
[data-dm-action="settings"] .dmMenuGlyph svg{
  width:24px!important;height:24px!important;
}

/* Drawer owns the foreground. Home controls are not allowed to paint through it. */
.sidebarShade{
  z-index:50000!important;
  background:rgba(0,0,0,.70)!important;
}
.sidebar{
  z-index:50001!important;
}
html.pngeaDrawerOpen #Home>.top,
html.pngeaDrawerOpen #youButton,
html.pngeaDrawerOpen #Home .searchBtn,
html.pngeaDrawerOpen .pnNowDock{
  visibility:hidden!important;
  opacity:0!important;
  pointer-events:none!important;
}
html.pngeaDrawerOpen .sidebar,
html.pngeaDrawerOpen .sidebar *,
html.pngeaDrawerOpen .sidebarShade{
  visibility:visible!important;
  opacity:1;
}

/* Composer is a real page. Nothing under it remains visible or clickable. */
#composerLayer.composerLayer{
  position:fixed!important;
  inset:0!important;
  width:100vw!important;
  height:100dvh!important;
  min-height:0!important;
  z-index:2147483000!important;
  background:#050505!important;
  flex-direction:column!important;
  isolation:isolate!important;
  padding-top:env(safe-area-inset-top)!important;
  padding-bottom:env(safe-area-inset-bottom)!important;
}
#composerLayer.composerLayer.show{
  display:flex!important;
}
html.pngeaComposerOpen body{
  overflow:hidden!important;
}
html.pngeaComposerOpen .app > *:not(#composerLayer):not(#pngeaLiveAuth){
  visibility:hidden!important;
  pointer-events:none!important;
}
html.pngeaComposerOpen #composerLayer,
html.pngeaComposerOpen #composerLayer *{
  visibility:visible!important;
}
html.pngeaComposerOpen #composerLayer{
  pointer-events:auto!important;
}
html.pngeaComposerOpen #composerLayer .bottom,
html.pngeaComposerOpen #composerLayer .nav,
html.pngeaComposerOpen #composerLayer .compose,
html.pngeaComposerOpen #composerLayer .searchBtn{
  display:none!important;
}
#composerLayer>.status{
  display:none!important;
}
#composerLayer .composerTop{
  height:60px!important;
  min-height:60px!important;
  display:grid!important;
  grid-template-columns:88px 1fr 88px!important;
  align-items:center!important;
  padding:0 16px!important;
  border-bottom:1px solid #171717!important;
  background:#050505!important;
}
#composerLayer #closeComposer{
  grid-column:1!important;
  justify-self:start!important;
  width:auto!important;
  min-width:0!important;
  height:44px!important;
  display:flex!important;
  align-items:center!important;
  font-size:15px!important;
  line-height:1!important;
  font-weight:700!important;
  color:#efefef!important;
  cursor:pointer!important;
}
#composerLayer .detected{
  grid-column:2!important;
  justify-self:center!important;
  position:static!important;
  transform:none!important;
  font-size:12px!important;
  letter-spacing:0!important;
  color:#bcbcbc!important;
  font-weight:800!important;
  text-transform:none!important;
  white-space:nowrap!important;
}
#composerLayer #send{
  grid-column:3!important;
  justify-self:end!important;
}
#composerLayer .canvas{
  flex:1!important;
  min-height:0!important;
  padding:24px 18px!important;
}
#composerLayer .canvas textarea{
  min-height:220px!important;
}
#composerLayer .capture{
  flex:none!important;
  background:#050505!important;
}
`;
  document.head.appendChild(style);

  // ---------- ICONS ----------
  // Wider, chubbier bell. It fills the 64x64 viewBox instead of sitting in the middle of it.
  function patchBell() {
    const svg = $('.notificationBellSvg');
    if (!svg) return;
    svg.setAttribute('viewBox', '0 0 64 64');

    const body = svg.querySelector('.bellBody');
    const clapper = svg.querySelector('.bellClapper');

    if (body) {
      body.setAttribute(
        'd',
        'M9.5 42.2c5.7-3.4 7.7-7.5 7.7-13.8 0-8.9 6-14.5 14.8-14.5s14.8 5.6 14.8 14.5c0 6.3 2 10.4 7.7 13.8 2.7 1.6 1.8 5.4-1.3 6.4-13.7 4.3-28.7 4.3-42.4 0-3.1-1-4-4.8-1.3-6.4Z'
      );
    }
    if (clapper) {
      clapper.setAttribute(
        'd',
        'M24.8 51.2c1.3 3.4 3.8 5.2 7.2 5.2s5.9-1.8 7.2-5.2'
      );
    }
  }

  const GEAR24 = `
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/>
    <circle cx="12" cy="12" r="3"/>
  `;

  const DUAL_GEAR = `
    <g transform="translate(1 25) scale(1.42)">${GEAR24}</g>
    <g transform="translate(31 3) scale(1.08)">${GEAR24}</g>
  `;

  function patchGear(svg) {
    if (!svg) return;
    svg.setAttribute('viewBox', '0 0 64 64');
    svg.innerHTML = DUAL_GEAR;
    svg.dataset.pngeaDualGear = '1';
  }

  function patchAllIcons() {
    patchBell();
    $$('.simpleGearIcon, .notificationSettingsButton svg, .sideSettings svg, [data-dm-action="settings"] .dmMenuGlyph svg')
      .forEach(svg => {
        if (svg.dataset.pngeaDualGear !== '1') patchGear(svg);
      });
  }

  patchAllIcons();

  // Repatch if live rendering swaps any of these icons.
  let iconQueued = false;
  const iconObserver = new MutationObserver(() => {
    if (iconQueued) return;
    iconQueued = true;
    requestAnimationFrame(() => {
      iconQueued = false;
      patchAllIcons();
    });
  });
  iconObserver.observe(document.body, { childList: true, subtree: true });

  // ---------- DRAWER ----------
  const sidebar = $('#sidebar');
  const sidebarShade = $('#sidebarShade');

  function syncDrawer() {
    const open = !!sidebar?.classList.contains('show');
    ROOT.classList.toggle('pngeaDrawerOpen', open);
  }

  if (sidebar) {
    new MutationObserver(syncDrawer).observe(sidebar, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  if (sidebarShade) {
    new MutationObserver(syncDrawer).observe(sidebarShade, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  syncDrawer();

  // ---------- FULL-PAGE COMPOSER ----------
  const composer = $('#composerLayer');
  const cancel = $('#closeComposer');
  const detected = $('#detected');

  function closeDrawerForComposer() {
    sidebar?.classList.remove('show');
    sidebarShade?.classList.remove('show');
    ROOT.classList.remove('pngeaDrawerOpen');
  }

  function syncComposer() {
    const open = !!composer?.classList.contains('show');
    ROOT.classList.toggle('pngeaComposerOpen', open);

    if (open) {
      closeDrawerForComposer();
      composer.setAttribute('role', 'dialog');
      composer.setAttribute('aria-modal', 'true');
      if (detected && /anything/i.test(detected.textContent || '')) {
        detected.textContent = 'New post';
      }
    } else if (composer) {
      composer.removeAttribute('aria-modal');
    }
  }

  function hardCloseComposer() {
    if (!composer) return;
    composer.classList.remove('show');
    ROOT.classList.remove('pngeaComposerOpen');
  }

  if (cancel) {
    cancel.textContent = 'Cancel';
    cancel.setAttribute('aria-label', 'Cancel post');
    // Existing PNGEA close handler can still run; this guarantees the page closes first.
    cancel.addEventListener('click', hardCloseComposer, true);
  }

  if (composer) {
    new MutationObserver(syncComposer).observe(composer, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  // Catch the existing floating compose button opening the layer.
  document.addEventListener('click', e => {
    if (e.target.closest('.compose')) {
      requestAnimationFrame(() => requestAnimationFrame(syncComposer));
    }
  }, true);

  // Any actual navigation kills the composer page.
  const wrapNavigate = () => {
    const ui = window.PNGEA;
    if (!ui || typeof ui.navigate !== 'function' || ui.navigate.__pngea0408) return;
    const original = ui.navigate.bind(ui);
    const wrapped = (...args) => {
      hardCloseComposer();
      return original(...args);
    };
    wrapped.__pngea0408 = true;
    ui.navigate = wrapped;
  };

  wrapNavigate();
  setTimeout(wrapNavigate, 250);
  setTimeout(wrapNavigate, 1200);

  window.addEventListener('hashchange', hardCloseComposer);
  window.addEventListener('popstate', hardCloseComposer);

  syncComposer();
})();
