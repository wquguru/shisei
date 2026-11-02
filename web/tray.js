/* The tray (docs/DESIGN.md, 素材库与搭配): a pose and what goes with it, picked across the gallery and the library
   pages, stays together in a bar at the bottom right (full width on phones). The pose is always the first slot: the
   site is a pose library, and costumes, props, furniture, animals, scenes and light attach to a pose. Each library
   gets a slot once something is picked from it; "+" lists the others. "Done" opens the set: every image, a combined
   prompt and the downloads. The set lives in localStorage so it survives moving between pages; × ends it. */
(() => {
  'use strict';
  const KEY = 'shisei.combo';
  const loc = document.documentElement.dataset.loc || 'zh';
  const T = window.I18N[loc], TC = window.I18N_LIB[loc];
  const NAV = window.SHISEI_NAV || { root: '', media: '', libs: [] };
  const ROOT = NAV.root, MEDIA = NAV.media;
  const PREFIX = { zh: '', ja: 'ja/', en: 'en/', ko: 'ko/' };
  const POSE_VIEWS = ['front', 'diag', 'side', 'above', 'below'];
  const NAME = { zh: 'cn', ja: 'jp', en: 'en', ko: 'kr' };
  const LIBS = new Map(NAV.libs.map((l) => [l.key, l]));
  const ORDER = NAV.libs.map((l) => l.key);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const home = ROOT + PREFIX[loc];
  const libPage = (lib) => home + lib + '/';
  const poseImg = (tier, f) => ROOT + 'images/line/' + tier + '/' + f;
  const libImg = (lib, tier, f) => MEDIA + 'images/' + LIBS.get(lib).dir + '/' + tier + '/' + f;
  const ICON_X = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const ICON_DL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>';

  const store = {
    get() {
      let s;
      try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { s = {}; }
      // The first tray (2026-11-01) held one costume beside the pose.
      if (s.costume) { s.items = Object.assign({ costume: Object.assign({ clause: 'wearing ' + (s.costume.keep || '') }, s.costume) }, s.items); delete s.costume; }
      s.items = s.items || {};
      for (const k of Object.keys(s.items)) if (!LIBS.has(k)) delete s.items[k];
      return s;
    },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode: this page only */ } }
  };
  let state = store.get();
  let open = false, adding = false;
  let page = 'pose';  // the slot this page fills: 'pose' or a library key
  // Saving the set to the photo album goes through common.js (ShiseiAlbum), the same cache the lightboxes use.
  const SHARE = window.ShiseiAlbum.canShare;

  // A library's view for the pose's angle: the same angle when the library has it; scenes put the three level angles
  // at eye level; anything else falls back to the front, then to the first view that exists.
  function viewFor(lib, fs) {
    const views = LIBS.get(lib).views;
    const pv = POSE_VIEWS[state.pose ? state.pose.v : 0];
    let want = views.indexOf(pv);
    if (want < 0) want = views.indexOf(views.includes('eye') && ['front', 'diag', 'side'].includes(pv) ? 'eye' : 'front');
    return want >= 0 && fs[want] ? want : fs.findIndex(Boolean);
  }
  const picked = () => ORDER.filter((k) => state.items[k]);
  const poseHref = (p) => home + '#' + p.id + '-' + POSE_VIEWS[p.v];
  const itemHref = (lib, x, v) => libPage(lib) + '#' + x.id + '-' + LIBS.get(lib).views[v];
  const libName = (lib) => T.libs[lib].name;
  const nameOf = (x) => (x.names && x.names[loc]) || x.id;
  function prompt() {
    const p = state.pose;
    return [p ? p.desc : ''].concat(picked().map((k) => state.items[k].clause)).filter(Boolean).join(', ');
  }
  // Every image of the set at the pose's angle.
  function members() {
    const out = [];
    const p = state.pose;
    if (p) out.push({ lib: 'pose', x: p, v: p.v, href: poseHref(p), src: (t) => poseImg(t, p.file), file: 'shisei_' + p.id + '_' + POSE_VIEWS[p.v] + '.webp' });
    for (const k of picked()) {
      const x = state.items[k], v = viewFor(k, x.files);
      if (v < 0) continue;
      out.push({ lib: k, x, v, href: itemHref(k, x, v), src: (t) => libImg(k, t, x.files[v]), file: 'shisei_' + x.id + '_' + LIBS.get(k).views[v] + '.webp' });
    }
    return out;
  }

  const el = document.createElement('div');
  el.className = 'tray';
  el.id = 'tray';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', TC.tray);
  el.hidden = true;
  document.body.appendChild(el);

  const isLine = (lib) => lib === 'pose' || LIBS.get(lib).kind === 'line';
  function thumb(m) {
    return '<span class="tray-th' + (isLine(m.lib) ? ' line' : '') + '"' + (m.lib === 'pose' ? ' style="--tint:' + esc(m.x.tint || 'var(--tile)') + '"' : '') + '><img src="' + esc(m.src('w300')) + '" alt=""></span>';
  }
  function slotHtml(m) {
    const label = m.lib === 'pose' ? TC.slotPose : libName(m.lib);
    const cur = page === m.lib ? ' cur' : '';
    return '<a class="tray-slot' + cur + '" href="' + esc(m.href) + '" data-slot="' + m.lib + '" aria-label="' + esc(label + ' ' + m.x.id + ' ' + nameOf(m.x)) + '">' + thumb(m) +
      '<span class="tray-st"><small>' + esc(label) + (cur ? '<span class="tray-pk"> · ' + esc(TC.picking) + '</span>' : '') + '</small><b class="mono">' + esc(m.x.id) + '</b></span></a>';
  }
  function emptySlot(kind) {
    const isPose = kind === 'pose';
    return '<a class="tray-slot empty' + (page === kind ? ' cur' : '') + '" href="' + esc(isPose ? home + '#all' : libPage(kind)) + '" data-slot="' + kind + '">' +
      '<span class="tray-plus" aria-hidden="true">+</span><span class="tray-st"><small>' + esc(isPose ? TC.slotPose : libName(kind)) + '</small><b>' + esc(isPose ? TC.pickPose : libName(kind)) + '</b></span></a>';
  }
  function cardHtml(m) {
    const lab = m.lib === 'pose' ? TC.slotPose : libName(m.lib);
    const views = m.lib === 'pose' ? POSE_VIEWS : LIBS.get(m.lib).views;
    return '<div class="tp-card' + (m.lib === 'pose' ? ' pose' : '') + '"><a class="tp-img' + (isLine(m.lib) ? ' line' : '') + '" href="' + esc(m.href) + '" data-slot="' + m.lib + '"' +
      (m.lib === 'pose' ? ' style="--tint:' + esc(m.x.tint || 'var(--tile)') + '"' : '') + '><img src="' + esc(m.src('w600')) + '" alt="' + esc(m.x.id + ' ' + nameOf(m.x)) + '" loading="lazy"></a>' +
      '<span class="tp-meta"><small>' + esc(lab + ' · ' + TC.views[views[m.v]]) + '</small><b>' + esc(nameOf(m.x)) + '</b><span class="mono">' + esc(m.x.id) + '</span></span>' +
      '<span class="tp-acts">' + (SHARE ? '' : '<a class="tp-ic" href="' + esc(m.src('w900')) + '" download="' + m.file + '" aria-label="' + esc(TC.dl + ' ' + m.x.id) + '">' + ICON_DL + '</a>') +
      '<a class="tp-ic tp-change" href="' + esc(m.lib === 'pose' ? home + '#all' : libPage(m.lib)) + '">' + esc(TC.change) + '</a>' +
      (m.lib === 'pose' ? '' : '<button type="button" class="tp-ic" data-tray="remove:' + m.lib + '" aria-label="' + esc(TC.remove(lab)) + '">' + ICON_X + '</button>') + '</span></div>';
  }

  function render() {
    const ms = members();
    const p = state.pose, items = ms.filter((m) => m.lib !== 'pose');
    const on = !!(p || items.length);
    el.hidden = !on;
    document.body.classList.toggle('has-tray', on);
    if (!on) { el.innerHTML = ''; open = adding = false; return; }
    const ready = !!p && items.length > 0;
    if (!ready) open = false;
    const rest = ORDER.filter((k) => !state.items[k]);
    const chev = '<svg class="tray-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
    let html = '';
    if (open) {
      html += '<section class="tray-panel" id="trayPanel" aria-label="' + esc(TC.group(ms.length)) + '">' +
        '<div class="tp-h"><b>' + esc(TC.group(ms.length)) + '</b><span class="mono">' + esc(ms.map((m) => m.x.id).join(' + ')) + '</span></div>' +
        '<div class="tp-cards">' + ms.map(cardHtml).join('') + '</div>' +
        (rest.length ? '<div class="tp-more"><span>' + esc(TC.add) + '</span>' + rest.map((k) => '<a href="' + esc(libPage(k)) + '">+ ' + esc(libName(k)) + '</a>').join('') + '</div>' : '') +
        '<div class="tp-prompt"><div class="tp-ph"><span>' + esc(TC.prompt) + '</span><button type="button" class="pill light tiny" data-tray="copy">' + esc(T.copy) + '</button></div><p class="mono">' + esc(prompt()) + '</p></div>' +
        (SHARE ? '<button type="button" class="pill dark tp-save" data-tray="save">' + esc(TC.saveGroup(ms.length)) + '</button>' : '') +
        '<p class="tp-tip" id="trayTip" role="status" hidden></p></section>';
      if (SHARE) ms.forEach((m) => prefetch(m.src('w900'), m.file));
    }
    if (adding && rest.length) {
      html += '<div class="tray-add" id="trayAdd"><span class="tray-add-h">' + esc(p ? TC.addFor(p.id) : TC.add) + '</span>' +
        rest.map((k) => { const L = LIBS.get(k); return '<a href="' + esc(libPage(k)) + '"><span class="tray-th' + (L.kind === 'line' ? ' line' : '') + '">' + (L.thumb ? '<img src="' + esc(libImg(k, 'w300', L.thumb)) + '" alt="">' : '') + '</span><span class="tray-add-n">' + esc(libName(k)) + '</span><span class="mono">' + L.n + '</span></a>'; }).join('') + '</div>';
    }
    // The current library gets an empty slot to fill even before anything is picked from it.
    const here = page !== 'pose' && !state.items[page] ? emptySlot(page) : '';
    const curItem = items.find((m) => m.lib === page);
    const stack = items.slice(0, 3).map((m) => '<span class="tray-th' + (isLine(m.lib) ? ' line' : '') + '"><img src="' + esc(m.src('w300')) + '" alt=""></span>').join('');
    html += '<div class="tray-bar' + (items.length ? '' : ' solo') + '"><span class="tray-l">' + esc(TC.tray) + '</span>' + (p ? slotHtml(ms[0]) : emptySlot('pose')) + chev +
      '<span class="tray-items">' + items.map(slotHtml).join('') + here + '</span>' +
      // Phones: the picked items fold into one slot of stacked thumbnails that opens the set.
      (items.length ? '<button type="button" class="tray-stack' + (curItem ? ' cur' : '') + '" data-tray="' + (ready ? 'toggle' : 'add') + '" aria-label="' + esc(items.map((m) => libName(m.lib) + ' ' + m.x.id).join(', ')) + '"><span class="tray-stack-th">' + stack + '</span><span class="tray-st"><small>' + esc(curItem ? libName(curItem.lib) : TC.tray) + '</small><b class="mono">' + (curItem ? esc(curItem.x.id) : '+' + items.length) + '</b></span></button>' : '<span class="tray-here">' + here + '</span>') +
      (rest.length ? '<button type="button" class="tray-soon" data-tray="add" aria-expanded="' + adding + '" aria-controls="trayAdd" aria-label="' + esc(TC.add) + '">+</button>' : '') +
      (ready ? '<button type="button" class="tray-done" data-tray="toggle" aria-expanded="' + open + '" aria-controls="trayPanel">' + esc(open ? TC.hide : TC.done + ' · ' + ms.length) + '</button>' : '') +
      '<button type="button" class="tray-x" data-tray="end" aria-label="' + esc(TC.end) + '">' + ICON_X + '</button></div>';
    el.innerHTML = html;
  }

  // share() must run inside the tap, so the files are fetched as soon as the panel shows them.
  const prefetch = window.ShiseiAlbum.prefetch;
  function tip(msg) {
    const t = document.getElementById('trayTip');
    if (t) { t.textContent = msg; t.hidden = false; }
  }
  function save() { store.set(state); render(); changed(); }

  el.addEventListener('click', (e) => {
    const slot = e.target.closest('[data-slot]');
    if (slot && api.onSlot && api.onSlot(slot.dataset.slot, state) === true) { e.preventDefault(); return; }
    const b = e.target.closest('[data-tray]');
    if (!b) return;
    const [a, arg] = b.dataset.tray.split(':');
    if (a === 'toggle') { open = !open; adding = false; render(); }
    else if (a === 'add') { adding = !adding; open = false; render(); }
    else if (a === 'remove') { delete state.items[arg]; save(); }
    else if (a === 'end') { state = { items: {} }; open = adding = false; save(); }
    else if (a === 'copy') window.ShiseiShare.copy(prompt());
    else if (a === 'save') {
      window.ShiseiAlbum.save(members().map((m) => ({ url: m.src('w900'), name: m.file })),
        (why) => tip(why === 'preparing' ? (T.preparing || TC.holdGroup) : TC.holdGroup));
    }
  });
  // Escape folds the panel or the add list; a click outside the tray folds the add list.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || document.querySelector('dialog[open]') || !(open || adding)) return;
    open = adding = false;
    render();
  });
  document.addEventListener('click', (e) => { if (adding && !e.target.closest('#tray')) { adding = false; render(); } });
  window.addEventListener('storage', (e) => { if (e.key === KEY) { state = store.get(); render(); changed(); } });
  function changed() { window.dispatchEvent(new CustomEvent('shisei:combo', { detail: state })); }

  const api = {
    get: () => state,
    pose: () => state.pose || null,
    count: () => picked().length,
    // The gallery sets the pose, a library page an item; the panel opens once there is a pose and an item.
    set(kind, value) {
      if (kind === 'pose') state.pose = value; else state.items[kind] = value;
      open = !!state.pose && picked().length > 0;
      adding = false;
      save();
    },
    // After setting a pose with nothing picked yet: show where to go next.
    // Deferred: the tap that called this would otherwise reach the outside-click handler and fold it again.
    showAdd() { setTimeout(() => { adding = true; open = false; render(); }, 0); },
    setPage(k) { page = k; render(); },
    viewFor,
    names: (o) => Object.fromEntries(Object.entries(NAME).map(([l, s]) => [l, o['name_' + s]])),
    onSlot: null
  };
  window.ShiseiTray = api;
  render();
})();
