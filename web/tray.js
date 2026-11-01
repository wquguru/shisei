/* The pairing tray (docs/DESIGN.md, 服装与搭配, design A of 2026-11-01): a pose and a costume picked on two different
   pages stay together in a bar at the bottom right (a full-width bar on phones). The pose is always the first slot:
   the library is a pose library and costumes, later props and scenes, attach to a pose. Each slot leads back to its
   page to change it; "Done" opens the pair, its combined prompt and the two images. The pair lives in localStorage
   so it survives moving between the gallery and the costume page; × ends it. */
(() => {
  'use strict';
  const KEY = 'shisei.combo';
  const loc = document.documentElement.dataset.loc || 'zh';
  const TC = window.I18N_COSTUME[loc];
  const TP = window.I18N_PAGES[loc];
  const BASE = (window.SHISEI && window.SHISEI.base) || '';
  const PREFIX = { zh: '', ja: 'ja/', en: 'en/', ko: 'ko/' };
  const POSE_VIEWS = ['front', 'diag', 'side', 'above', 'below'];
  const C_VIEWS = ['front', 'diag', 'side', 'back'];
  const NAME = { zh: 'cn', ja: 'jp', en: 'en', ko: 'kr' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const home = BASE + PREFIX[loc];
  const costumePage = home + 'costume/';
  const poseImg = (tier, f) => BASE + 'images/line/' + tier + '/' + f;
  const costumeImg = (tier, f) => BASE + 'images/costume/grey/' + tier + '/' + f;
  // Costumes have no view from above or below: those pose angles pair with the costume's front.
  const cView = (c, poseV) => {
    const want = poseV <= 2 ? poseV : 0;
    return c.files[want] ? want : c.files.findIndex(Boolean);
  };
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode: this page only */ } }
  };
  let state = store.get();
  let open = false;
  let page = 'pose';  // which slot this page fills: 'pose' or 'costume'
  const ALBUM = matchMedia('(pointer: coarse)').matches;
  const SHARE = ALBUM && !!navigator.canShare && (() => {
    try { return navigator.canShare({ files: [new File([''], 'a.webp', { type: 'image/webp' })] }); } catch (e) { return false; }
  })();
  const files = new Map();

  const el = document.createElement('div');
  el.className = 'tray';
  el.id = 'tray';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', TC.tray);
  el.hidden = true;
  document.body.appendChild(el);

  function pair() {
    const p = state.pose, c = state.costume;
    if (!p || !c) return null;
    const cv = cView(c, p.v);
    return { p, c, cv, prompt: p.desc + (c.keep ? ', wearing ' + c.keep : '') };
  }
  const poseHref = (p) => home + '#' + p.id + '-' + POSE_VIEWS[p.v];
  const costumeHref = (c, v) => costumePage + '#' + c.id + '-' + C_VIEWS[v];

  function slotHtml(kind) {
    const isPose = kind === 'pose';
    const x = state[kind];
    const cur = page === kind ? ' cur' : '';
    const label = isPose ? TC.slotPose : TC.slotCostume;
    if (!x) {
      return '<a class="tray-slot empty' + cur + '" href="' + esc(isPose ? home + '#all' : costumePage) + '" data-slot="' + kind + '">' +
        '<span class="tray-plus" aria-hidden="true">+</span><span class="tray-st"><small>' + esc(label) + '</small><b>' + esc(isPose ? TC.pickPose : TC.pickCostume) + '</b></span></a>';
    }
    const v = isPose ? x.v : cView(x, state.pose ? state.pose.v : 0);
    const img = isPose ? poseImg('w300', x.file) : costumeImg('w300', x.files[v]);
    const name = (x.names && x.names[loc]) || x.id;
    return '<a class="tray-slot ' + kind + cur + '" href="' + esc(isPose ? poseHref(x) : costumeHref(x, v)) + '" data-slot="' + kind + '"' +
      (isPose ? ' style="--tint:' + esc(x.tint || 'var(--tile)') + '"' : '') + ' aria-label="' + esc(label + ' ' + x.id + ' ' + name) + '">' +
      '<span class="tray-th"><img src="' + esc(img) + '" alt=""></span><span class="tray-st"><small>' + esc(label) + (cur ? '<span class="tray-pk"> · ' + esc(TC.picking) + '</span>' : '') + '</small><b class="mono">' + esc(x.id) + '</b></span></a>';
  }

  function render() {
    const p = state.pose, c = state.costume;
    const on = !!(p || c);
    el.hidden = !on;
    document.body.classList.toggle('has-tray', on);
    if (!on) { el.innerHTML = ''; open = false; return; }
    const P = pair();
    if (!P) open = false;
    const chev = '<svg class="tray-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
    let panel = '';
    if (P && open) {
      const pv = TP.views[P.p.v];
      const pf = poseImg('w900', P.p.file), cf = costumeImg('w900', P.c.files[P.cv]);
      const pn = 'shisei_' + P.p.id + '_' + POSE_VIEWS[P.p.v] + '.webp', cn = 'shisei_' + P.c.id + '_' + C_VIEWS[P.cv] + '.webp';
      const acts = SHARE
        ? '<button type="button" class="pill dark tp-save" data-tray="save">' + esc(TC.saveGroup) + '</button>'
        : '<a class="pill light" href="' + esc(pf) + '" download="' + pn + '">' + esc(TC.dlPose) + '</a><a class="pill dark" href="' + esc(cf) + '" download="' + cn + '">' + esc(TC.dlCostume) + '</a>';
      panel = '<section class="tray-panel" id="trayPanel" aria-label="' + esc(TC.group) + '">' +
        '<div class="tp-h"><b>' + esc(TC.group) + '</b><span class="mono">' + esc(P.p.id + ' + ' + P.c.id) + '</span></div>' +
        '<div class="tp-imgs"><a class="tp-img pose" href="' + esc(poseHref(P.p)) + '" data-slot="pose" style="--tint:' + esc(P.p.tint || 'var(--tile)') + '"><img src="' + esc(poseImg('w600', P.p.file)) + '" alt="' + esc(P.p.id + ' ' + ((P.p.names && P.p.names[loc]) || '') + ' · ' + pv) + '"></a>' +
        '<a class="tp-img costume" href="' + esc(costumeHref(P.c, P.cv)) + '" data-slot="costume"><img src="' + esc(costumeImg('w600', P.c.files[P.cv])) + '" alt="' + esc(P.c.id + ' ' + ((P.c.names && P.c.names[loc]) || '') + ' · ' + TC.views[P.cv]) + '"></a></div>' +
        '<p class="tp-note">' + esc(TC.viewNote(pv + ' → ' + TC.views[P.cv])) + '</p>' +
        '<div class="tp-prompt"><div class="tp-ph"><span>' + esc(TC.prompt) + '</span><button type="button" class="pill light tiny" data-tray="copy">' + esc(TP.copy) + '</button></div><p class="mono">' + esc(P.prompt) + '</p></div>' +
        '<div class="tp-acts">' + acts + '</div><p class="tp-tip" id="trayTip" role="status" hidden></p></section>';
      if (SHARE) [[pf, pn], [cf, cn]].forEach(([u, n]) => prefetch(u, n));
    }
    el.innerHTML = panel + '<div class="tray-bar"><span class="tray-l">' + esc(TC.tray) + '</span>' + slotHtml('pose') + chev + slotHtml('costume') +
      '<span class="tray-soon" title="' + esc(TC.soon) + '"><span aria-hidden="true">+</span><span class="sr">' + esc(TC.soon) + '</span></span>' +
      (P ? '<button type="button" class="tray-done" data-tray="toggle" aria-expanded="' + open + '" aria-controls="trayPanel">' + esc(open ? TC.hide : TC.done) + '</button>' : '') +
      '<button type="button" class="tray-x" data-tray="end" aria-label="' + esc(TC.end) + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
  }

  // share() must run inside the tap, so both files are fetched as soon as the panel shows them.
  function prefetch(url, name) {
    if (files.has(url)) return;
    const entry = { file: null };
    files.set(url, entry);
    fetch(url).then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
      .then((b) => { entry.file = new File([b], name, { type: 'image/webp' }); }).catch(() => files.delete(url));
  }
  function tip(msg) {
    const t = document.getElementById('trayTip');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
  }

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tray]');
    const slot = e.target.closest('[data-slot]');
    if (slot && api.onSlot && api.onSlot(slot.dataset.slot, state) === true) { e.preventDefault(); return; }
    if (!b) return;
    const a = b.dataset.tray;
    if (a === 'toggle') { open = !open; render(); if (open) el.querySelector('.tray-panel').scrollTop = 0; }
    else if (a === 'end') { state = {}; store.set(state); open = false; render(); changed(); }
    else if (a === 'copy') { const P = pair(); if (P) window.ShiseiShare.copy(P.prompt); }
    else if (a === 'save') {
      const P = pair();
      const got = [poseImg('w900', P.p.file), costumeImg('w900', P.c.files[P.cv])].map((u) => files.get(u));
      if (got.every((x) => x && x.file)) navigator.share({ files: got.map((x) => x.file) }).catch((err) => { if (err.name !== 'AbortError') tip(TC.holdGroup); });
      else tip((window.I18N[loc] || {}).preparing || TC.holdGroup);
    }
  });
  // Escape folds the panel first.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open && !document.querySelector('dialog[open]')) { open = false; render(); el.querySelector('.tray-done').focus(); }
  });
  // Another tab changed the pair.
  window.addEventListener('storage', (e) => { if (e.key === KEY) { state = store.get(); render(); changed(); } });
  function changed() { window.dispatchEvent(new CustomEvent('shisei:combo', { detail: state })); }

  const api = {
    get: () => state,
    // Called by the gallery with a pose, by the costume page with a costume; the panel opens once both are there.
    set(kind, value) {
      state = Object.assign({}, state, { [kind]: value });
      store.set(state);
      open = !!pair();
      render();
      changed();
    },
    setPage(k) { page = k; render(); },
    names: (o, key) => Object.fromEntries(Object.entries(NAME).map(([l, s]) => [l, o[key === 'pose' ? 'name_' + s : 'name_' + l]])),
    onSlot: null,
    views: C_VIEWS
  };
  window.ShiseiTray = api;
  render();
})();
