/* PNGEA v0.40.7 — Weixin interaction + UI correction fixpack
   Superset of v0.40.6 interaction direction.
   Designed to layer safely over PNGEA v0.40.5 without touching backend contracts. */
(() => {
  'use strict';
  if (window.__PNGEA_V0407_FIXPACK__) return;
  window.__PNGEA_V0407_FIXPACK__ = true;

  const ROOT = document.documentElement;
  const APP = document.querySelector('.app') || document.body;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const BUILD = '0.40.7-weixin-ui-fixpack';

  const buildMeta = $('meta[name="pngea-build"]');
  if (buildMeta) buildMeta.setAttribute('content', BUILD);

  // ---------- CSS ----------
  const style = document.createElement('style');
  style.id = 'pngeaV0407FixpackStyle';
  style.textContent = `
/* v0.40.7 — drawer geometry */
.sidebarShade{z-index:90!important;backdrop-filter:blur(1.5px);-webkit-backdrop-filter:blur(1.5px)}
.sidebar{z-index:91!important}
html.pngeaDrawerOpen #Home>.top,
html.pngeaDrawerOpen #Search .searchHero,
html.pngeaDrawerOpen .searchBox,
html.pngeaDrawerOpen .dmSearch{visibility:hidden!important;pointer-events:none!important}

/* v0.40.7 — chubby bell: preserve icon footprint, change silhouette instead of scaling it down */
.notificationBell{width:36px!important;height:36px!important;aspect-ratio:1/1!important}
.notificationBellSvg{width:36px!important;height:36px!important;display:block!important;overflow:visible!important}
.bellBody{stroke-width:2.55!important;stroke-linecap:round!important;stroke-linejoin:round!important}
.bellClapper{stroke-width:2.25!important;stroke-linecap:round!important;stroke-linejoin:round!important}
.nav.active .bellBody{fill:currentColor!important;stroke:currentColor!important}

/* v0.40.7 — one real gear language everywhere */
.simpleGearIcon,
.notificationSettingsButton svg,
.sideSettings svg,
[data-dm-action="settings"] .dmMenuGlyph svg{fill:none!important;stroke:currentColor!important;stroke-width:1.9!important;stroke-linecap:round!important;stroke-linejoin:round!important}
.simpleGearIcon{width:23px!important;height:23px!important}
.sideSettings .simpleGearIcon{width:18px!important;height:18px!important}
.notificationSettingsButton svg{width:23px!important;height:23px!important}
[data-dm-action="settings"] .dmMenuGlyph svg{width:23px!important;height:23px!important}

/* v0.40.7 — composer is a true page, not a panel floating above the app */
#composerLayer.composerLayer{
  position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;
  z-index:180!important;background:#050505!important;display:none!important;
  padding-top:env(safe-area-inset-top)!important;padding-bottom:env(safe-area-inset-bottom)!important;
}
#composerLayer.composerLayer.show{display:flex!important}
#composerLayer>.status{display:none!important}
#composerLayer .composerTop{height:58px!important;padding:0 16px!important;border-bottom:1px solid #171717!important;position:relative!important}
#composerLayer #closeComposer{
  width:auto!important;min-width:58px!important;font-size:15px!important;line-height:1!important;
  font-weight:780!important;letter-spacing:-.1px!important;color:#efefef!important;cursor:pointer!important;
}
#composerLayer .detected{position:absolute!important;left:50%!important;transform:translateX(-50%)!important;white-space:nowrap!important}
html.pngeaComposerOpen .bottom,
html.pngeaComposerOpen .compose,
html.pngeaComposerOpen .sidebar,
html.pngeaComposerOpen .sidebarShade,
html.pngeaComposerOpen .pnNowDock{visibility:hidden!important;pointer-events:none!important}
html.pngeaComposerOpen{overflow:hidden!important}

/* v0.40.6 interaction language, consolidated */
:root{--pnWeixinEase:cubic-bezier(.2,.78,.2,1)}
.pnPressing{opacity:.72!important;transform:scale(.985)!important;transition:transform .09s ease,opacity .09s ease!important}
.pnContextShade{
  position:fixed;inset:0;z-index:210;background:rgba(0,0,0,.54);opacity:0;pointer-events:none;
  transition:opacity .2s ease;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)
}
.pnContextShade.show{opacity:1;pointer-events:auto}
.pnContextSheet{
  position:fixed;left:9px;right:9px;bottom:calc(8px + env(safe-area-inset-bottom));z-index:211;
  background:#151515;border:1px solid #292929;border-radius:22px;overflow:hidden;
  transform:translateY(calc(100% + 24px));opacity:.98;
  transition:transform .24s var(--pnWeixinEase);box-shadow:0 22px 70px rgba(0,0,0,.58)
}
.pnContextSheet.show{transform:translateY(0)}
.pnContextGrab{width:34px;height:4px;border-radius:999px;background:#414141;margin:7px auto 5px}
.pnContextHead{padding:8px 17px 11px;border-bottom:1px solid #242424}
.pnContextHead b{display:block;font-size:12px;color:#e5e5e5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pnContextHead small{display:block;margin-top:3px;font-size:9px;color:#666;letter-spacing:.4px}
.pnContextAction{width:100%;height:51px;border:0;border-bottom:1px solid #252525;background:#151515;color:#ececec;text-align:left;padding:0 17px;font:720 14px/1 ui-sans-serif,system-ui,-apple-system,sans-serif;cursor:pointer}
.pnContextAction:active{background:#1d1d1d}
.pnContextCancel{margin-top:7px;border-top:1px solid #242424;border-bottom:0;text-align:center;color:#aaa}
.pnV0407Toast{
  position:fixed;z-index:230;left:50%;bottom:calc(78px + env(safe-area-inset-bottom));
  transform:translate(-50%,9px);max-width:min(88vw,340px);padding:8px 12px;border-radius:11px;
  background:rgba(28,28,28,.96);border:1px solid #363636;color:#e9e9e9;
  font:760 11px/1.25 ui-sans-serif,system-ui,-apple-system,sans-serif;box-shadow:0 10px 32px rgba(0,0,0,.42);
  opacity:0;pointer-events:none;transition:opacity .17s ease,transform .17s ease
}
.pnV0407Toast.show{opacity:1;transform:translate(-50%,0)}
.uiToast{background:rgba(28,28,28,.96)!important;color:#ececec!important;border:1px solid #383838!important;border-radius:11px!important;padding:8px 12px!important;font-size:11px!important;box-shadow:0 10px 30px rgba(0,0,0,.4)!important}
.pnSheet,.accountSheet{transition-duration:.24s!important;transition-timing-function:var(--pnWeixinEase)!important}
.pnSheetShade,.accountShade{backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
@media (prefers-reduced-motion:reduce){.pnContextShade,.pnContextSheet,.pnV0407Toast,.pnPressing{transition:none!important}}
`;
  document.head.appendChild(style);

  // ---------- ICON REPAIRS ----------
  const GEAR = `
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/>
    <circle cx="12" cy="12" r="3"/>
  `;
  const patchGear = (svg) => {
    if (!svg || svg.dataset.pnGearPatched === '1') return;
    svg.dataset.pnGearPatched = '1';
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = GEAR;
  };
  const patchAllGears = () => {
    $$('.simpleGearIcon, .notificationSettingsButton svg, .sideSettings svg, [data-dm-action="settings"] .dmMenuGlyph svg').forEach(patchGear);
  };

  const patchBell = () => {
    const body = $('.notificationBellSvg .bellBody');
    const clapper = $('.notificationBellSvg .bellClapper');
    if (body) body.setAttribute('d', 'M15.5 39.7c4.8-2.8 6.3-5.9 6.3-10.6 0-5.8 4.2-9.1 10.2-9.1s10.2 3.3 10.2 9.1c0 4.7 1.5 7.8 6.3 10.6 1.6.9 1.1 3.3-.7 4-10.3 3.7-21.3 3.7-31.6 0-1.8-.7-2.3-3.1-.7-4Z');
    if (clapper) clapper.setAttribute('d', 'M27.2 46.2c.9 2.6 2.5 3.9 4.8 3.9s3.9-1.3 4.8-3.9');
  };

  patchAllGears();
  patchBell();

  const iconObserver = new MutationObserver(() => {
    patchAllGears();
    patchBell();
  });
  iconObserver.observe(document.body, { childList: true, subtree: true });

  // ---------- DRAWER FIX ----------
  const sidebar = $('#sidebar');
  const syncDrawer = () => ROOT.classList.toggle('pngeaDrawerOpen', !!sidebar?.classList.contains('show'));
  if (sidebar) {
    new MutationObserver(syncDrawer).observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    syncDrawer();
  }

  // ---------- TRUE FULL-PAGE COMPOSER ----------
  const composer = $('#composerLayer');
  const cancelComposer = $('#closeComposer');
  const syncComposer = () => ROOT.classList.toggle('pngeaComposerOpen', !!composer?.classList.contains('show'));
  const closeComposer = () => {
    if (!composer) return;
    composer.classList.remove('show');
    ROOT.classList.remove('pngeaComposerOpen');
    composer.dispatchEvent(new CustomEvent('pngea:composerclose', { bubbles: true }));
  };
  if (cancelComposer) {
    cancelComposer.textContent = 'Cancel';
    cancelComposer.setAttribute('aria-label', 'Cancel post');
    cancelComposer.addEventListener('click', () => setTimeout(syncComposer, 0), true);
  }
  if (composer) {
    new MutationObserver(syncComposer).observe(composer, { attributes: true, attributeFilter: ['class'] });
    syncComposer();
  }
  window.addEventListener('hashchange', closeComposer);
  window.addEventListener('popstate', closeComposer);
  document.addEventListener('pngea:navigate', closeComposer);

  // Wrap PNGEA.navigate when available so programmatic navigation can never leave composer stranded.
  const wrapNavigate = () => {
    const ui = window.PNGEA;
    if (!ui || typeof ui.navigate !== 'function' || ui.navigate.__pnV0407Wrapped) return;
    const original = ui.navigate.bind(ui);
    const wrapped = (...args) => { closeComposer(); return original(...args); };
    wrapped.__pnV0407Wrapped = true;
    ui.navigate = wrapped;
  };
  wrapNavigate();
  setTimeout(wrapNavigate, 250);
  setTimeout(wrapNavigate, 1200);

  // ---------- WEIXIN-STYLE CONTEXT SHEET ----------
  const shade = document.createElement('div');
  shade.className = 'pnContextShade';
  shade.id = 'pnV0407ContextShade';
  const sheet = document.createElement('div');
  sheet.className = 'pnContextSheet';
  sheet.id = 'pnV0407ContextSheet';
  sheet.innerHTML = `<div class="pnContextGrab"></div><div class="pnContextHead"><b id="pnContextTitle">Actions</b><small>PNGEA</small></div><div id="pnContextActions"></div>`;
  APP.append(shade, sheet);

  const contextTitle = $('#pnContextTitle');
  const contextActions = $('#pnContextActions');
  let contextTarget = null;

  const haptic = (ms = 7) => {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch {}
  };

  let toastTimer = null;
  const toast = (text) => {
    let el = $('#pnV0407Toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pnV0407Toast';
      el.className = 'pnV0407Toast';
      APP.appendChild(el);
    }
    el.textContent = text;
    clearTimeout(toastTimer);
    requestAnimationFrame(() => el.classList.add('show'));
    toastTimer = setTimeout(() => el.classList.remove('show'), 1450);
  };

  const closeContext = () => {
    sheet.classList.remove('show');
    shade.classList.remove('show');
    contextTarget = null;
    sheet.style.transform = '';
  };
  shade.addEventListener('click', closeContext);

  const targetLabel = (target) => {
    const who = target.querySelector?.('.authorName,.xPostWho b,.dmLine b,.communityTitle,.historyCopy b,.trendTitle,.storyCopy b,.videoTitle');
    const text = who?.textContent || target.getAttribute?.('aria-label') || 'Actions';
    return String(text).trim().slice(0, 72) || 'Actions';
  };

  const shareCurrent = async () => {
    const payload = { title: 'PNGEA', url: location.href };
    try {
      if (navigator.share) await navigator.share(payload);
      else if (navigator.clipboard) { await navigator.clipboard.writeText(location.href); toast('Link copied'); }
    } catch {}
  };
  const copyCurrent = async () => {
    try {
      await navigator.clipboard?.writeText(location.href);
      toast('Link copied');
    } catch { toast('Copy unavailable'); }
  };

  const showContext = (target) => {
    if (!target || composer?.classList.contains('show')) return;
    contextTarget = target;
    contextTitle.textContent = targetLabel(target);
    contextActions.innerHTML = '';
    const actions = [
      ['Open', () => target.click?.()],
      ['Share', shareCurrent],
      ['Copy link', copyCurrent],
      ['Cancel', () => {}, true]
    ];
    actions.forEach(([label, fn, cancel]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `pnContextAction${cancel ? ' pnContextCancel' : ''}`;
      b.textContent = label;
      b.addEventListener('click', async () => {
        closeContext();
        haptic(4);
        if (!cancel) await fn();
      });
      contextActions.appendChild(b);
    });
    haptic(9);
    shade.classList.add('show');
    requestAnimationFrame(() => sheet.classList.add('show'));
  };

  const LONGPRESS_TARGETS = [
    '[data-profile]', '.xPost', 'article.bubble', 'article.edgePost', 'article.breaking',
    '.longVideo', '.dmRow', '.communityCard', '.historyRow', '.story', '.result',
    '[data-search-term]', '.pulseChip', '.pnAdaptiveCard'
  ].join(',');

  let press = null;
  const cancelPress = () => {
    if (!press) return;
    clearTimeout(press.timer);
    press.target?.classList.remove('pnPressing');
    press = null;
  };

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.pointerType === 'mouse' && e.buttons !== 1) return;
    if (e.target.closest('input,textarea,button,a,[contenteditable="true"],#composerLayer,.pnContextSheet')) return;
    const target = e.target.closest(LONGPRESS_TARGETS);
    if (!target) return;
    const x = e.clientX, y = e.clientY;
    target.classList.add('pnPressing');
    press = {
      target, x, y,
      timer: setTimeout(() => {
        if (!press || press.target !== target) return;
        target.classList.remove('pnPressing');
        showContext(target);
        press = null;
      }, 280)
    };
  }, true);

  document.addEventListener('pointermove', (e) => {
    if (!press) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 11) cancelPress();
  }, true);
  document.addEventListener('pointerup', cancelPress, true);
  document.addEventListener('pointercancel', cancelPress, true);

  document.addEventListener('contextmenu', (e) => {
    const target = e.target.closest(LONGPRESS_TARGETS);
    if (!target || e.target.closest('input,textarea,[contenteditable="true"]')) return;
    e.preventDefault();
    showContext(target);
  }, true);

  // Subtle tap feedback/haptics without changing primary click behavior.
  const TAP_TARGETS = 'button,.nav,.compose,.sideItem,.xTab,.xAction,.searchBtn,.pulseChip,.followBtn,.communityJoin,[role="button"]';
  document.addEventListener('pointerdown', (e) => {
    const target = e.target.closest(TAP_TARGETS);
    if (!target || target.closest('.pnContextSheet')) return;
    target.classList.add('pnPressing');
  }, true);
  const releaseTap = (e) => {
    const target = e.target.closest?.(TAP_TARGETS);
    if (!target) return;
    target.classList.remove('pnPressing');
  };
  document.addEventListener('pointerup', releaseTap, true);
  document.addEventListener('pointercancel', releaseTap, true);
  document.addEventListener('click', (e) => {
    const target = e.target.closest(TAP_TARGETS);
    if (target) haptic(3);
  }, true);

  // ---------- SWIPE-DOWN DISMISSAL ----------
  const wireSwipeDismiss = (node, closer) => {
    if (!node || node.dataset.pnSwipeDismiss === '1') return;
    node.dataset.pnSwipeDismiss = '1';
    let sy = null, dy = 0;
    node.addEventListener('touchstart', (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      sy = t.clientY; dy = 0;
    }, { passive: true });
    node.addEventListener('touchmove', (e) => {
      if (sy === null) return;
      const t = e.touches?.[0];
      if (!t) return;
      dy = Math.max(0, t.clientY - sy);
      if (dy > 6) node.style.transform = `translateY(${Math.min(dy, 150)}px)`;
    }, { passive: true });
    node.addEventListener('touchend', () => {
      if (sy === null) return;
      node.style.transform = '';
      if (dy > 64) { haptic(5); closer(); }
      sy = null; dy = 0;
    }, { passive: true });
  };

  wireSwipeDismiss(sheet, closeContext);
  wireSwipeDismiss($('#accountSheet'), () => {
    $('#accountSheet')?.classList.remove('show');
    $('#accountShade')?.classList.remove('show');
  });
  wireSwipeDismiss($('#pnActionSheet'), () => {
    $('#pnActionSheet')?.classList.remove('show');
    $('#pnSheetShade')?.classList.remove('show');
  });

  // Escape closes temporary surfaces on desktop.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (sheet.classList.contains('show')) closeContext();
    else if (composer?.classList.contains('show')) closeComposer();
  });

  window.PNGEA_V0407 = Object.freeze({
    build: BUILD,
    closeComposer,
    closeContext,
    showContext,
    toast
  });
})();
