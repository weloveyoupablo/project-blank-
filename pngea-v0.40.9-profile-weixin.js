/* PNGEA v0.40.9 — PROFILE + WEIXIN REFINEMENT
   Layers on top of v0.40.8.
   - closer dual gears, no settings bubble
   - narrower bell lip
   - live profile editing + identity sync
   - Weixin-inspired press / long-press / sheet interactions
*/
(() => {
  'use strict';
  if (window.__PNGEA_V0409_PROFILE_WEIXIN__) return;
  window.__PNGEA_V0409_PROFILE_WEIXIN__ = true;

  const ROOT = document.documentElement;
  const APP = document.querySelector('.app') || document.body;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ui = window.PNGEA;
  const api = window.PNGEA_API;

  const buildMeta = $('meta[name="pngea-build"]');
  if (buildMeta) buildMeta.setAttribute('content', '0.40.9-profile-weixin');

  // ---------- VISUAL REFINEMENTS ----------
  const style = document.createElement('style');
  style.id = 'pngeaV0409Style';
  style.textContent = `
:root{--pnwx:cubic-bezier(.2,.78,.2,1)}

/* Settings gears sit directly on the black UI. */
.notificationSettingsButton{
  width:36px!important;height:36px!important;
  border:0!important;border-radius:0!important;
  background:transparent!important;box-shadow:none!important;
  color:#bdbdbd!important;padding:0!important;
}
.notificationSettingsButton:active{background:transparent!important}
.notificationSettingsButton svg{width:29px!important;height:29px!important}
.sideSettings .simpleGearIcon{width:20px!important;height:20px!important}
[data-dm-action="settings"] .dmMenuGlyph,
[data-dm-action="settings"] .dmMenuGlyph svg{
  background:transparent!important;border:0!important;box-shadow:none!important;
}

/* Keep profile metadata clean when only one or two fields exist. */
#Profile .profileMeta:empty{display:none}
#Profile .profileMeta a{color:#777;text-decoration:none}
#Profile .profileMeta a:active{color:#ddd}

/* Weixin-like physical press response: quick, quiet, not bouncy. */
.pnwxPress{
  opacity:.68!important;
  transform:scale(.985)!important;
  transition:transform .075s ease,opacity .075s ease!important;
}
.nav,.compose,.sideItem,.dmRow,.notifRow,.bubble,.xPost,.profileEdit,
.dmFilterButton,.dmFilterItem,.pnPrimary,.pnSecondary,.result,.story,
.notificationSettingsButton{
  touch-action:manipulation;
}

/* Weixin-inspired long-press action sheet. */
.pnwxShade{
  position:fixed;inset:0;z-index:2147483200;
  background:rgba(0,0,0,.54);
  opacity:0;pointer-events:none;
  transition:opacity .18s ease;
  backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);
}
.pnwxShade.show{opacity:1;pointer-events:auto}
.pnwxSheet{
  position:fixed;z-index:2147483201;
  left:9px;right:9px;bottom:calc(8px + env(safe-area-inset-bottom));
  overflow:hidden;background:#171717;border:1px solid #2b2b2b;
  border-radius:22px;box-shadow:0 22px 70px rgba(0,0,0,.58);
  transform:translateY(calc(100% + 28px));
  transition:transform .23s var(--pnwx);
}
.pnwxSheet.show{transform:translateY(0)}
.pnwxGrab{width:34px;height:4px;border-radius:999px;background:#414141;margin:7px auto 5px}
.pnwxHead{padding:8px 17px 11px;border-bottom:1px solid #282828}
.pnwxHead b{display:block;font-size:12px;color:#e7e7e7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pnwxHead small{display:block;margin-top:3px;color:#686868;font-size:9px;letter-spacing:.35px}
.pnwxAction{
  display:block;width:100%;height:51px;border:0;border-bottom:1px solid #292929;
  background:#171717;color:#ededed;text-align:left;padding:0 17px;
  font:720 14px/1 ui-sans-serif,system-ui,-apple-system,sans-serif;
}
.pnwxAction:active{background:#202020}
.pnwxCancel{
  margin-top:7px;border-top:1px solid #292929;border-bottom:0!important;
  text-align:center;color:#aaa;
}

/* Existing PNGEA sheets get the same motion language. */
.pnSheet,.accountSheet{
  transition-duration:.23s!important;
  transition-timing-function:var(--pnwx)!important;
}
.pnSheetShade,.accountShade{
  backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);
}
.uiToast{
  background:rgba(28,28,28,.96)!important;
  color:#ececec!important;border:1px solid #383838!important;
  border-radius:11px!important;padding:8px 12px!important;
  font-size:11px!important;box-shadow:0 10px 30px rgba(0,0,0,.4)!important;
}

/* Save-state affordance in profile editor. */
#profileEditSave[disabled]{opacity:.42!important;pointer-events:none!important}

@media (prefers-reduced-motion:reduce){
  .pnwxShade,.pnwxSheet,.pnwxPress{transition:none!important}
}
`;
  document.head.appendChild(style);

  // ---------- GEARS: MOVE THEM CLOSE ENOUGH TO MESH ----------
  const GEAR24 = `
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/>
    <circle cx="12" cy="12" r="3"/>
  `;

  const DUAL_GEAR_409 = `
    <g transform="translate(1.5 25.5) scale(1.40)">${GEAR24}</g>
    <g transform="translate(27.2 7.8) scale(1.08)">${GEAR24}</g>
  `;

  function patchGear409(svg) {
    if (!svg) return;
    svg.setAttribute('viewBox', '0 0 64 64');
    svg.innerHTML = DUAL_GEAR_409;
    // v0.40.8 checks this exact flag; leave it satisfied so it does not restore the old spacing.
    svg.dataset.pngeaDualGear = '1';
    svg.dataset.pngeaGear409 = '1';
  }

  // ---------- BELL: NARROWER LIP, STILL A LITTLE WIDER THAN BODY ----------
  function patchBell409() {
    const svg = $('.notificationBellSvg');
    if (!svg) return;
    svg.setAttribute('viewBox', '0 0 64 64');
    const body = svg.querySelector('.bellBody');
    const clapper = svg.querySelector('.bellClapper');
    if (body) {
      body.setAttribute(
        'd',
        'M13.5 42.4c4.5-3.3 6.2-7.5 6.2-13.9 0-8.9 5-14.5 12.3-14.5s12.3 5.6 12.3 14.5c0 6.4 1.7 10.6 6.2 13.9 2.3 1.7 1.6 5.1-1.2 6-11.2 3.6-23.4 3.6-34.6 0-2.8-.9-3.5-4.3-1.2-6Z'
      );
    }
    if (clapper) {
      clapper.setAttribute('d','M25.6 51.1c1.2 3.2 3.4 4.9 6.4 4.9s5.2-1.7 6.4-4.9');
    }
  }

  function patchIcons409() {
    patchBell409();
    $$('.simpleGearIcon, .notificationSettingsButton svg, .sideSettings svg, [data-dm-action="settings"] .dmMenuGlyph svg')
      .forEach(svg => {
        if (svg.dataset.pngeaGear409 !== '1') patchGear409(svg);
      });
  }

  patchIcons409();

  // v0.40.8 also watches the DOM. Run after its animation-frame repair so 0.40.9 wins.
  let iconFrame = 0;
  new MutationObserver(() => {
    cancelAnimationFrame(iconFrame);
    iconFrame = requestAnimationFrame(patchIcons409);
  }).observe(document.body, {childList:true, subtree:true});

  // ---------- PROFILE: REAL LIVE SAVES + APP-WIDE IDENTITY SYNC ----------
  const normalizeHandle = v => String(v || '').trim().replace(/^@/, '').toLowerCase();
  const escReg = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function renderProfileMeta(person) {
    const host = $('#Profile .profileMeta');
    if (!host) return;
    host.innerHTML = '';

    const location = String(person?.location || '').trim();
    const website = String(person?.website || '').trim();
    const joinedRaw = person?.joined || person?.created_at || person?.createdAt || '';
    let joined = '';
    if (joinedRaw) {
      try {
        const d = new Date(joinedRaw);
        joined = Number.isNaN(d.getTime()) ? String(joinedRaw) :
          d.toLocaleDateString(undefined, {month:'short', year:'numeric'});
      } catch { joined = String(joinedRaw); }
    }

    if (location) {
      const s = document.createElement('span');
      s.textContent = '◎ ' + location;
      host.appendChild(s);
    }
    if (website) {
      const a = document.createElement('a');
      const href = /^https?:\/\//i.test(website) ? website : 'https://' + website;
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = '⌁ ' + website.replace(/^https?:\/\//i,'');
      host.appendChild(a);
    }
    if (joined) {
      const s = document.createElement('span');
      s.textContent = '◷ Joined ' + joined;
      host.appendChild(s);
    }
  }

  function syncIdentityEverywhere(oldHandle, person) {
    const oldH = normalizeHandle(oldHandle);
    const newH = normalizeHandle(person?.handle);
    const name = person?.display_name || person?.displayName || person?.name || 'You';
    const bio = person?.bio || '';

    const state = ui?.state;
    if (state?.user) {
      Object.assign(state.user, {
        name,
        handle: '@' + newH,
        bio,
        location: person?.location || '',
        website: person?.website || ''
      });
      ui.save?.();
    }

    const live = window.PNGEA_LIVE?.state;
    if (live) live.me = {...(live.me || {}), ...person, display_name:name, handle:newH};

    $('.sideName') && ($('.sideName').textContent = name);
    $('.sideHandle') && ($('.sideHandle').textContent = '@' + newH);
    $('#sideFootHandle') && ($('#sideFootHandle').textContent = '@' + newH);
    $('#Profile .profileName') && ($('#Profile .profileName').textContent = name);
    $('#Profile .profileHandle') && ($('#Profile .profileHandle').textContent = '@' + newH);
    $('#Profile .profileBio') && ($('#Profile .profileBio').textContent = bio);

    const route = ui?.parseRoute?.();
    if (route?.screen === 'Profile') {
      $('#Profile .xTopTitle b') && ($('#Profile .xTopTitle b').textContent = name);
      renderProfileMeta(person);
    }

    // Update every currently-rendered self identity immediately instead of waiting for a reload.
    $$('.authorRow, .xPostWho').forEach(row => {
      const text = row.textContent || '';
      const isSelf =
        (oldH && text.toLowerCase().includes('@' + oldH)) ||
        (newH && text.toLowerCase().includes('@' + newH));
      if (!isSelf) return;
      const nameNode = row.querySelector('.authorName, b');
      const metaNode = row.querySelector('.meta, span');
      if (nameNode) nameNode.textContent = name;
      if (metaNode) {
        let t = metaNode.textContent || '';
        if (oldH) t = t.replace(new RegExp('@' + escReg(oldH), 'ig'), '@' + newH);
        if (!t.includes('@' + newH) && t.startsWith('@')) {
          t = '@' + newH + t.slice(t.indexOf(' ') >= 0 ? t.indexOf(' ') : t.length);
        }
        metaNode.textContent = t;
      }
    });

    $$('[data-profile]').forEach(el => {
      const h = normalizeHandle(el.dataset.profile);
      if ((oldH && h === oldH) || h === newH || h === 'you') el.dataset.profile = newH;
    });

    // Account switcher cache uses this object too.
    try { api?.rememberAccount?.(window.PNGEA_LIVE?.state?.me || person); } catch {}
  }

  async function hydrateProfileExtras() {
    const live = window.PNGEA_LIVE?.state;
    if (!live?.active || !api?.getUser || !ui?.parseRoute) return;
    const r = ui.parseRoute();
    if (r.screen !== 'Profile') return;
    const handle = normalizeHandle(r.detail || live.me?.handle);
    if (!handle) return;
    try {
      const p = await api.getUser(handle);
      renderProfileMeta(p);
    } catch {}
  }

  function installProfileSave() {
    const layer = $('#profileEditLayer');
    const save = $('#profileEditSave');
    if (!layer || !save || save.dataset.pngea409 === '1') return;
    save.dataset.pngea409 = '1';

    // Replace the original local-only onclick with a live-aware one.
    save.onclick = async e => {
      e?.preventDefault?.();

      const name = ($('#peName')?.value || '').trim() || 'You';
      const handle = normalizeHandle($('#peHandle')?.value || 'you');
      const bio = ($('#peBio')?.value || '').trim();
      const location = ($('#peLocation')?.value || '').trim();
      const website = ($('#peWebsite')?.value || '').trim();

      if (!/^[a-z0-9_]{2,30}$/i.test(handle)) {
        ui?.toast?.('Username: 2–30 letters, numbers, or underscores');
        return;
      }

      const liveApi = window.PNGEA_LIVE;
      const live = liveApi?.state;
      const oldHandle = normalizeHandle(live?.me?.handle || ui?.state?.user?.handle || 'you');

      save.disabled = true;
      const previousLabel = save.textContent;
      save.textContent = 'Saving…';

      try {
        if (live?.active && api?.updateProfile) {
          // The backend already exposes PATCH /v1/me/profile; v0.40.9 actually uses it.
          const result = await api.updateProfile({
            displayName: name,
            handle,
            bio,
            location,
            website
          });

          // Re-read /me so handle normalization / uniqueness results from the server are canonical.
          let fresh;
          try { fresh = await api.me(); } catch {
            fresh = result?.user || result?.profile || result || {};
          }

          const person = {
            ...(live.me || {}),
            ...(fresh || {}),
            display_name: fresh?.display_name || fresh?.displayName || name,
            handle: normalizeHandle(fresh?.handle || handle),
            bio: fresh?.bio ?? bio,
            location: fresh?.location ?? location,
            website: fresh?.website ?? website
          };

          syncIdentityEverywhere(oldHandle, person);
          layer.classList.remove('show');

          const newHandle = normalizeHandle(person.handle);
          const current = ui?.parseRoute?.();
          if (current?.screen === 'Profile' && oldHandle !== newHandle) {
            ui.navigate?.('Profile', newHandle);
          }

          // Refresh rendered surfaces so author data, ticker, messages and profile all use the new identity.
          await Promise.allSettled([
            liveApi.loadFeed?.(),
            liveApi.loadConversations?.(),
            liveApi.loadNotifications?.(),
            liveApi.loadNow?.(),
            liveApi.loadTicker?.(),
            liveApi.loadProfile?.(newHandle)
          ]);

          renderProfileMeta(person);
          ui?.toast?.('Profile updated');
        } else {
          // Preserve prototype/offline behavior.
          const person = {
            name,
            display_name:name,
            handle,
            bio,
            location,
            website
          };
          syncIdentityEverywhere(oldHandle, person);
          layer.classList.remove('show');
          ui?.toast?.('Profile updated');
        }
      } catch (err) {
        ui?.toast?.(err?.message || 'Could not update profile');
      } finally {
        save.disabled = false;
        save.textContent = previousLabel || 'Save';
      }
    };
  }

  installProfileSave();
  setTimeout(installProfileSave, 250);
  setTimeout(installProfileSave, 1000);

  window.addEventListener('hashchange', () => setTimeout(hydrateProfileExtras, 140));
  window.addEventListener('popstate', () => setTimeout(hydrateProfileExtras, 140));
  window.addEventListener('pngea:backend', () => setTimeout(hydrateProfileExtras, 450));
  setTimeout(hydrateProfileExtras, 900);

  // ---------- WEIXIN-INSPIRED INTERACTION LAYER ----------
  const shade = document.createElement('div');
  shade.className = 'pnwxShade';

  const sheet = document.createElement('section');
  sheet.className = 'pnwxSheet';
  sheet.setAttribute('aria-modal','true');
  sheet.setAttribute('role','dialog');
  sheet.innerHTML = `
    <div class="pnwxGrab"></div>
    <div class="pnwxHead"><b id="pnwxTitle">Actions</b><small>PNGEA</small></div>
    <div id="pnwxActions"></div>
  `;

  APP.append(shade, sheet);

  const sheetTitle = $('#pnwxTitle');
  const sheetActions = $('#pnwxActions');
  let contextTarget = null;

  function haptic(ms = 7) {
    try { navigator.vibrate?.(ms); } catch {}
  }

  function closeSheet() {
    sheet.classList.remove('show');
    shade.classList.remove('show');
    sheet.style.transform = '';
    contextTarget = null;
  }

  function action(label, fn, extra = '') {
    const b = document.createElement('button');
    b.className = 'pnwxAction ' + extra;
    b.textContent = label;
    b.addEventListener('click', async () => {
      haptic(4);
      closeSheet();
      try { await fn?.(); } catch (err) { ui?.toast?.(err?.message || 'Could not complete action'); }
    });
    return b;
  }

  async function copyText(text) {
    const value = String(text || '').trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      ui?.toast?.('Copied');
    } catch {}
  }

  async function shareTarget(target) {
    const body = target?.querySelector?.('.body,.xPostText,.dmPreview,.notifText')?.textContent?.trim() || '';
    const payload = {title:'PNGEA', text:body || undefined, url:location.href};
    try {
      if (navigator.share) await navigator.share(payload);
      else await copyText(body || location.href);
    } catch {}
  }

  function titleFor(target) {
    return (
      target?.querySelector?.('.authorName,.xPostWho b,.dmLine b,.notifText b,.communityTitle,.storyCopy b')?.textContent ||
      target?.getAttribute?.('aria-label') ||
      'Actions'
    ).trim().slice(0,70);
  }

  function openSheet(target) {
    if (!target || ROOT.classList.contains('pngeaComposerOpen')) return;
    contextTarget = target;
    sheetTitle.textContent = titleFor(target);
    sheetActions.innerHTML = '';

    const isPost = target.matches('.bubble,.livePost,.xPost,.profileLocalPost') || !!target.closest?.('[data-server-post]');
    const isDm = target.matches('.dmRow') || !!target.closest?.('.dmRow');
    const isNotif = target.matches('.notifRow') || !!target.closest?.('.notifRow');

    if (isPost) {
      const post = target.closest?.('[data-server-post],.bubble,.xPost,.profileLocalPost') || target;
      const reply = post.querySelector?.('[data-live-action="reply"]');
      const repost = post.querySelector?.('[data-live-action="repost"]');
      const like = post.querySelector?.('[data-live-action="like"]');
      if (reply) sheetActions.appendChild(action('Reply', () => reply.click()));
      if (repost) sheetActions.appendChild(action(repost.classList.contains('activeAction') ? 'Undo repost' : 'Repost', () => repost.click()));
      if (like) sheetActions.appendChild(action(like.classList.contains('activeAction') ? 'Unlike' : 'Like', () => like.click()));
      const text = post.querySelector?.('.body,.xPostText')?.textContent;
      if (text) sheetActions.appendChild(action('Copy text', () => copyText(text)));
      sheetActions.appendChild(action('Share', () => shareTarget(post)));
    } else if (isDm) {
      const row = target.closest?.('.dmRow') || target;
      sheetActions.appendChild(action('Open conversation', () => row.click()));
      const preview = row.querySelector?.('.dmPreview')?.textContent;
      if (preview) sheetActions.appendChild(action('Copy preview', () => copyText(preview)));
    } else if (isNotif) {
      const row = target.closest?.('.notifRow') || target;
      sheetActions.appendChild(action('Open', () => row.click()));
      const text = row.textContent;
      if (text) sheetActions.appendChild(action('Copy', () => copyText(text)));
    } else {
      const text = target.textContent;
      if (text?.trim()) sheetActions.appendChild(action('Copy', () => copyText(text)));
      sheetActions.appendChild(action('Share', () => shareTarget(target)));
    }

    sheetActions.appendChild(action('Cancel', () => {}, 'pnwxCancel'));

    shade.classList.add('show');
    requestAnimationFrame(() => sheet.classList.add('show'));
    haptic(8);
  }

  shade.addEventListener('click', closeSheet);

  // Swipe down to dismiss the action sheet.
  let sheetY = null;
  sheet.addEventListener('touchstart', e => {
    sheetY = e.touches?.[0]?.clientY ?? null;
  }, {passive:true});
  sheet.addEventListener('touchmove', e => {
    if (sheetY == null) return;
    const y = e.touches?.[0]?.clientY ?? sheetY;
    const dy = Math.max(0, y - sheetY);
    if (dy) sheet.style.transform = `translateY(${dy}px)`;
  }, {passive:true});
  sheet.addEventListener('touchend', e => {
    if (sheetY == null) return;
    const y = e.changedTouches?.[0]?.clientY ?? sheetY;
    const dy = Math.max(0, y - sheetY);
    sheetY = null;
    if (dy > 70) closeSheet();
    else sheet.style.transform = '';
  }, {passive:true});

  // Long press targets.
  const CONTEXT_SELECTOR = '.bubble,.livePost,.xPost,.profileLocalPost,.dmRow,.notifRow';
  let longTimer = null, downX = 0, downY = 0, longTarget = null;

  document.addEventListener('pointerdown', e => {
    const target = e.target.closest?.(CONTEXT_SELECTOR);
    if (!target || e.button > 0) return;
    longTarget = target;
    downX = e.clientX; downY = e.clientY;
    clearTimeout(longTimer);
    longTimer = setTimeout(() => {
      if (longTarget) openSheet(longTarget);
      longTarget = null;
    }, 470);
  }, true);

  document.addEventListener('pointermove', e => {
    if (!longTarget) return;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 9) {
      clearTimeout(longTimer);
      longTarget = null;
    }
  }, true);

  ['pointerup','pointercancel'].forEach(type => document.addEventListener(type, () => {
    clearTimeout(longTimer);
    longTarget = null;
  }, true));

  document.addEventListener('contextmenu', e => {
    const target = e.target.closest?.(CONTEXT_SELECTOR);
    if (!target) return;
    e.preventDefault();
    openSheet(target);
  }, true);

  // Quick tactile press-state across common controls.
  const PRESS_SELECTOR = '.nav,.compose,.sideItem,.dmRow,.notifRow,.profileEdit,.dmFilterButton,.dmFilterItem,.pnPrimary,.pnSecondary,.result,.story,.notificationSettingsButton';
  let pressed = null;
  document.addEventListener('pointerdown', e => {
    const target = e.target.closest?.(PRESS_SELECTOR);
    if (!target) return;
    pressed = target;
    target.classList.add('pnwxPress');
  }, true);
  const releasePress = () => {
    pressed?.classList.remove('pnwxPress');
    pressed = null;
  };
  document.addEventListener('pointerup', releasePress, true);
  document.addEventListener('pointercancel', releasePress, true);
  document.addEventListener('pointerleave', releasePress, true);

  // Escape closes temporary interaction surfaces on hardware keyboards.
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSheet();
  });

  // Run once more after all current app mutations settle.
  setTimeout(patchIcons409, 300);
})();
