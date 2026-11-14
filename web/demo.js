// The home page's live plugin demo, moving real runs and the series section (docs/DESIGN.md, 首页：可交互演示).
// The plugin's two screens are redrawn in HTML rather than shown as a screenshot: real text in the page's language,
// working controls (segments, takes, @, circling the frame, the confirm-before-GPU dialog) and only small real frames
// and clips from the author's runs. Videos are muted loops that load when they come into view; one sound at a time.
(() => {
  'use strict';
  const L = (window.SHISEI || {}).lang || 'zh';
  const T = (window.I18N || {})[L];
  if (!T || !T.demo || !document.getElementById('demoHost')) return;
  const D = T.demo;
  const BASE = (window.SHISEI.base || '') + 'demo/';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);

  /* ---- videos: load near the viewport, muted loops, one sound at a time ---- */
  let soundOn = null;  // the <video> or <audio> currently allowed to make sound
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      if (!reduced || v === soundOn) v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: '200px 0px' }) : null;
  function watch(root) {
    root.querySelectorAll('video[data-src]').forEach((v) => {
      v.muted = v !== soundOn;
      if (io) io.observe(v); else { v.src = v.dataset.src; if (!reduced) v.play().catch(() => {}); }
    });
  }
  function setSound(el) {
    document.querySelectorAll('video[data-src]').forEach((v) => { v.muted = true; });
    if (soundOn && soundOn.tagName === 'AUDIO') soundOn.pause();
    soundOn = el;
    if (el) {
      if (el.tagName === 'VIDEO') { if (!el.src) el.src = el.dataset.src; el.muted = false; el.currentTime = 0; }
      el.play().catch(() => {});
    }
    document.querySelectorAll('[data-sound]').forEach((b) => {
      const on = !!el && b.dataset.sound === el.dataset.key;
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? T.soundOff : T.soundOn);
    });
  }
  const speaker = (key) => '<button type="button" class="k-sound" data-sound="' + key + '" aria-pressed="false" aria-label="' + esc(T.soundOn) + '">' +
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path class="k-on" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/><path class="k-off" d="M17 9l5 6M22 9l-5 6"/></svg></button>';
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sound]');
    if (!b) return;
    const v = document.querySelector('[data-key="' + b.dataset.sound + '"]');
    setSound(soundOn === v ? null : v);
  });

  /* ---- the plugin window, drawn at 1200 × 760 and scaled to its frame ---- */
  const host = $('demoHost'), stage = $('demoScale');
  const fit = () => {
    const s = host.clientWidth / 1200;
    stage.style.transform = 'scale(' + s + ')';
    host.style.height = Math.round(760 * s) + 'px';
  };
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(host); else addEventListener('resize', fit);
  fit();

  const SEG_TIME = { A: '0:00–0:08', B: '0:08–0:18', C: '0:18–0:29', D: '0:29–0:39' };
  const IDS = ['A', 'B', 'C', 'D'];
  const still = (id, n) => BASE + 'seg-' + id + '-' + n + '.webp';
  const W = {
    line: 'drama', seg: 'B', takes: { A: 2, B: 2, C: 2, D: 1 }, seriesOpen: false, circleMode: false, circles: [],
    chips: [{ label: D.segChip, dash: true }], draft: '', mention: false, confirm: false, typing: false, shooting: false, playing: false,
    thread: [{ me: true, text: D.msgUser }, { me: false, text: D.msgDir, quote: true }],
    view: 'both', take: 2, rconfirm: false, full: false
  };
  const icon = { home: 'M3 11l9-7 9 7v9H3z', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9c1-4 4-6 7-6s6 2 7 6', img: 'M4 5h16v14H4zM4 15l5-4 4 3 3-2 4 3', box: 'M12 3l8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10', bar: 'M5 20V10M10 20V4M15 20v-7M20 20v-4', server: 'M4 5h16v6H4zM4 13h16v6H4z' };
  const navIcons = [icon.home, icon.user, icon.img, icon.box, icon.bar, icon.server];
  const svg = (d) => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';

  function drama() {
    const nav = '<nav class="dm-nav" aria-label="Shisei"><div class="dm-brand"><span class="dm-logo" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C0D04" stroke-width="2.2" stroke-linecap="round"><circle cx="13" cy="4.5" r="2"/><path d="M12 8l-2 6 4 3 1 5M10 14l-3 4M12 9l4 2"/></svg></span><span><b>Shisei</b><small>' + esc(D.brandSub) + '</small></span></div>' +
      '<span class="dm-new">＋ ' + esc(D.newProject) + '</span>' +
      D.nav.map((n, i) => '<span class="dm-navi">' + svg(navIcons[i]) + esc(n) + '</span>').join('') +
      '<span class="dm-label">' + esc(D.series) + '<span aria-hidden="true">＋</span></span>' +
      '<button type="button" class="dm-series' + (W.seriesOpen ? ' on' : '') + '" data-act="series" aria-expanded="' + W.seriesOpen + '"><i></i><b>' + esc(D.seriesName) + '</b><small>' + esc(D.seriesCount) + '</small></button>' +
      (W.seriesOpen ? [['cut', 1], ['cut', 2], ['assets', 3]].map(([st, n]) => '<span class="dm-ep">' + esc(fill(D.ep, { n })) + '<small>' + esc(D.stage[st]) + '</small></span>').join('') : '') +
      '<span class="dm-label">' + esc(D.recents) + '</span>' +
      D.projects.map((p, i) => '<span class="dm-proj' + (i === 1 ? ' on' : '') + '">' + esc(p) + '<small>' + esc(D.stage[i === 0 ? 'kf' : 'cut']) + '</small></span>').join('') +
      '<span class="dm-grow"></span><span class="dm-machine"><i class="' + (W.shooting ? 'on' : '') + '"></i>' + esc(W.shooting ? D.busy : D.idle) + '</span></nav>';

    const segs = IDS.map((id, i) => {
      const open = W.seg === id;
      const takes = open ? '<div class="dm-takes">' + [1, 2].map((n) => '<button type="button" class="dm-take' + (W.takes[id] === n ? ' on' : '') + '" data-act="take" data-seg="' + id + '" data-n="' + n + '" aria-pressed="' + (W.takes[id] === n) + '"><img src="' + still(id, n) + '" alt=""><span>' + esc(fill(D.take, { n })) + (W.takes[id] === n ? ' <em>· ' + esc(D.picked) + '</em>' : '') + '</span></button>').join('') + '</div>' : '';
      return '<div class="dm-seg' + (open ? ' on' : '') + '"><button type="button" class="dm-seg-h" data-act="seg" data-seg="' + id + '" aria-expanded="' + open + '"><b>' + id + '</b><img src="' + still(id, W.takes[id]) + '" alt=""><span class="dm-mono">' + SEG_TIME[id] + '</span><span class="dm-seg-t">' + esc(D.segs[i]) + '</span><span class="dm-use"><i></i>' + esc(fill(D.useTake, { n: W.takes[id] })) + '</span></button>' + takes + '</div>';
    }).join('');

    const frame = W.playing
      ? '<video class="dm-frame-img" data-src="' + BASE + 'case-clothesline.mp4" data-key="dm-cut" poster="' + BASE + 'case-clothesline.webp" muted loop playsinline></video>'
      : '<img class="dm-frame-img" src="' + still(W.seg, W.takes[W.seg]) + '" alt="">';
    const cut = '<div class="dm-cut"><div class="dm-cut-l"><button type="button" class="dm-frame' + (W.circleMode ? ' aim' : '') + '" data-act="frame" aria-label="' + esc(W.circleMode ? D.pointHint : D.cut) + '">' + frame +
      '<span class="dm-ai">' + esc(D.ai) + '</span>' + W.circles.map((c) => '<span class="dm-ring" style="left:' + c.x + '%;top:' + c.y + '%"></span>').join('') +
      (W.circleMode ? '<span class="dm-hint">' + esc(D.pointHint) + '</span>' : '') + '</button>' +
      '<div class="dm-row"><button type="button" class="dm-btn sq" data-act="play" aria-label="' + esc(W.playing ? D.pause : D.play) + '">' + (W.playing ? '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1" width="3" height="10"/><rect x="7" y="1" width="3" height="10"/></svg>' : '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z"/></svg>') + '</button>' +
      '<button type="button" class="dm-btn' + (W.circleMode ? ' aim' : '') + '" data-act="circle" aria-pressed="' + W.circleMode + '">' + esc(D.point) + '</button></div></div>' +
      '<div class="dm-cut-r"><div class="dm-cut-h"><b>' + esc(D.cut) + '</b><span class="dm-chip">' + esc(D.ai) + '</span><span class="dm-mono">' + esc(D.cutMeta) + '</span><span class="dm-grow"></span><span class="dm-btn sm">' + esc(D.dlMp4) + ' ↓</span><span class="dm-btn sm">' + esc(D.subs) + ' ↓</span></div>' +
      '<p>' + esc(D.cutNote) + '</p><div class="dm-strip">' + IDS.map((id) => '<button type="button" data-act="seg" data-seg="' + id + '" class="' + (W.seg === id ? 'on' : '') + '"><img src="' + still(id, W.takes[id]) + '" alt=""><span>' + esc(fill(D.strip, { id, n: W.takes[id] })) + '</span></button>').join('') + '</div>' +
      '<span class="dm-muted">▸ ' + esc(D.details) + '</span></div></div>';

    const main = '<main class="dm-main"><div class="dm-title"><b>' + esc(D.title) + '</b><span>' + esc(D.meta) + '</span><span class="dm-grow"></span><span class="dm-ok">' + esc(D.stage.cut) + '</span></div>' + segs + cut + '</main>';

    const msgs = W.thread.map((m) => '<div class="dm-msg' + (m.me ? ' me' : '') + '"><small>' + (m.me ? esc(D.you) : 'dsh') + '</small><div>' + esc(m.text) + '</div>' +
      (m.quote ? '<div class="dm-quote"><b>' + esc(D.quoteTitle) + '</b><span>' + esc(D.quoteSub) + '</span><button type="button" class="dm-btn acc" data-act="confirm">' + esc(D.quoteBtn) + '</button></div>' : '') + '</div>').join('') +
      (W.typing ? '<span class="dm-typing" aria-hidden="true"><i>·</i><i>·</i><i>·</i></span>' : '');
    const chips = W.chips.map((c, i) => '<button type="button" class="dm-tag' + (c.dash ? ' dash' : '') + '" data-act="unchip" data-i="' + i + '">' + esc(c.label) + ' ×</button>').join('');
    const mentions = W.mention ? '<div class="dm-mentions" role="listbox" aria-label="' + esc(D.mention) + '">' + D.mentions.map(([n, k], i) => '<button type="button" role="option" data-act="pick" data-i="' + i + '">' + esc(n) + '<small>' + esc(k) + '</small></button>').join('') + '</div>' : '';
    const aside = '<aside class="dm-dir" aria-label="' + esc(D.tabs[0]) + '"><div class="dm-tabs">' + D.tabs.map((t, i) => '<span class="' + (i ? '' : 'on') + '">' + esc(t) + '</span>').join('') + '</div>' +
      '<div class="dm-thread" id="dmThread">' + msgs + '</div><div class="dm-compose"><div class="dm-chips">' + esc(D.editing) + chips + '</div>' +
      '<label class="dm-sr" for="dmDraft">' + esc(D.placeholder) + '</label><textarea id="dmDraft" rows="2" placeholder="' + esc(D.placeholder) + '">' + esc(W.draft) + '</textarea>' +
      '<div class="dm-row"><button type="button" class="dm-btn sq at' + (W.mention ? ' aim' : '') + '" data-act="mention" aria-expanded="' + W.mention + '" aria-label="' + esc(D.mention) + '">@</button><span class="dm-muted">' + esc(D.sendHint) + '</span><span class="dm-grow"></span><button type="button" class="dm-btn dark" data-act="send">' + esc(D.send) + '</button></div>' + mentions + '</div></aside>';

    const dialog = W.confirm ? '<div class="dm-veil"><div class="dm-dialog" role="dialog" aria-label="' + esc(D.cTitle) + '"><b>' + esc(D.cTitle) + '</b><dl>' +
      [[D.cGpu, D.cGpuV], [D.cPrice, D.cPriceV], [D.cCap, D.cCapV]].map(([k, v]) => '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>').join('') + '</dl><p>' + esc(D.cNote) + '</p>' +
      '<div class="dm-row end"><button type="button" class="dm-btn" data-act="cancel">' + esc(D.cancel) + '</button><button type="button" class="dm-btn acc" data-act="shoot">' + esc(D.ok) + '</button></div></div></div>' : '';
    return '<div class="dm dm-drama">' + nav + main + aside + dialog + '</div>';
  }

  function remake() {
    const steps = D.rSteps.map((n, i) => '<span><i></i>' + esc(n) + ' <em>' + ['0:26', '1:24', '1:55', '15:02', '0:03'][i] + '</em></span>').join('') +
      (W.full ? '<span class="busy"><i></i>' + esc(D.rFull) + ' <em>' + esc(D.rShooting) + '</em></span>' : '');
    const views = ['both', 'clay', 'char'].map((k, i) => '<button type="button" role="tab" class="' + (W.view === k ? 'on' : '') + '" data-act="view" data-v="' + k + '" aria-selected="' + (W.view === k) + '">' + esc(D.views[i]) + '</button>').join('');
    const panel = (src, poster, cap, key, ai) => '<figure><span class="dm-pane"><video data-src="' + src + '" data-key="' + key + '" poster="' + poster + '" muted loop playsinline aria-label="' + esc(cap) + '"></video>' + (ai ? '<span class="dm-ai">' + esc(D.ai) + '</span>' : '') + '</span><figcaption><i class="' + (ai ? 'acc' : '') + '"></i>' + esc(cap) + '</figcaption></figure>';
    const panes = (W.view !== 'char' ? panel(BASE + 'remake-clay.mp4', BASE + 'remake-clay.webp', D.clay, 'dm-clay', false) : '') +
      (W.view !== 'clay' ? panel(BASE + 'remake-take-' + W.take + '.mp4', BASE + 'remake-take-' + W.take + '.webp', fill(D.charCap, { n: W.take }), 'dm-take', true) : '');
    const takes = [1, 2, 3].map((n) => '<button type="button" class="dm-rtake' + (W.take === n ? ' on' : '') + '" data-act="rtake" data-n="' + n + '" aria-pressed="' + (W.take === n) + '"><img src="' + BASE + 'remake-take-' + n + '.webp" alt="">' + (W.take === n ? '<i></i>' + esc(fill(D.using, { n })) : esc(fill(D.take, { n }))) + '</button>').join('');
    const dialog = W.rconfirm ? '<div class="dm-veil"><div class="dm-dialog" role="dialog" aria-label="' + esc(fill(D.rcTitle, { n: W.take })) + '"><b>' + esc(fill(D.rcTitle, { n: W.take })) + '</b><dl>' +
      [[D.rcHow, D.rcHowV], [D.cGpu, D.cGpuV], [D.cPrice, D.cPriceV], [D.rcSpent, fill(D.rcSpentV, { v: '¥1.82' })]].map(([k, v]) => '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>').join('') + '</dl><p>' + esc(fill(D.rcNote, { n: W.take })) + '</p>' +
      '<div class="dm-row end"><button type="button" class="dm-btn" data-act="rcancel">' + esc(D.cancel) + '</button><button type="button" class="dm-btn acc" data-act="rshoot">' + esc(D.ok) + '</button></div></div></div>' : '';
    return '<div class="dm dm-remake"><header class="dm-rhead"><div class="dm-row"><b>' + esc(D.rTitle) + '</b><span class="dm-chip">' + esc(D.ai) + '</span><span class="dm-mono">' + esc(D.rMeta) + '</span><span class="dm-grow"></span><span class="dm-mono">' + esc(D.spent) + ' ¥1.82 / ¥5</span><span class="dm-meter"><i></i></span></div><div class="dm-steps">' + steps + '</div></header>' +
      '<div class="dm-rbody"><main class="dm-rmain"><div class="dm-row"><div class="dm-seg3" role="tablist">' + views + '</div><span class="dm-grow"></span><span class="dm-mono dm-muted">SAM 3D Body · Blender · MiniMax H3</span></div>' +
      '<div class="dm-panes">' + panes + '</div><div class="dm-scrub"><i></i></div><div class="dm-pick"><b>' + esc(D.pick) + '</b><span>' + esc(D.pickNote) + '</span></div><div class="dm-rtakes">' + takes + '</div></main>' +
      '<aside class="dm-raside"><div class="dm-tabs"><span class="on">' + esc(D.dlTab) + '</span><span>' + esc(D.costTab) + '</span></div>' + D.downloads.map((d) => '<span class="dm-dl">' + esc(fill(d, { n: W.take })) + '<span aria-hidden="true">↓</span></span>').join('') +
      '<span class="dm-grow"></span><p class="dm-muted">' + esc(D.fullNote) + '</p><button type="button" class="dm-btn acc" data-act="rconfirm">' + esc(fill(D.fullBtn, { n: W.take })) + '</button></aside></div>' + dialog + '</div>';
  }

  function render() {
    stage.innerHTML = W.line === 'drama' ? drama() : remake();
    watch(stage);
    const th = $('dmThread');
    if (th) th.scrollTop = th.scrollHeight;
  }
  let timer = 0;
  function reply(text, quote) {
    W.typing = true; render();
    clearTimeout(timer);
    timer = setTimeout(() => { W.typing = false; W.thread.push({ me: false, text, quote: !!quote }); render(); }, 1100);
  }
  stage.addEventListener('input', (e) => { if (e.target.id === 'dmDraft') W.draft = e.target.value; });
  stage.addEventListener('keydown', (e) => {
    if (e.target.id === 'dmDraft' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); stage.querySelector('[data-act="send"]').click(); }
  });
  stage.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'seg') { W.seg = b.dataset.seg; W.circles = []; }
    else if (a === 'take') W.takes[b.dataset.seg] = +b.dataset.n;
    else if (a === 'series') W.seriesOpen = !W.seriesOpen;
    else if (a === 'play') { W.playing = !W.playing; W.circleMode = false; }
    else if (a === 'circle') { W.circleMode = !W.circleMode; W.playing = false; }
    else if (a === 'frame') {
      if (!W.circleMode) return;
      const r = b.getBoundingClientRect();
      W.circles.push({ x: ((e.clientX - r.left) / r.width * 100).toFixed(1), y: ((e.clientY - r.top) / r.height * 100).toFixed(1) });
      W.chips.push({ label: fill(D.circleChip, { n: W.circles.length }) });
      W.circleMode = false;
    } else if (a === 'mention') W.mention = !W.mention;
    else if (a === 'pick') { W.chips.push({ label: '@' + D.mentions[+b.dataset.i][0] }); W.mention = false; }
    else if (a === 'unchip') W.chips.splice(+b.dataset.i, 1);
    else if (a === 'send') {
      const text = W.draft.trim() || D.defaultSend;
      const att = W.chips.map((c) => c.label).join(' · ');
      W.thread.push({ me: true, text: att ? text + '\n' + fill(D.attach, { list: att }) : text });
      W.draft = ''; W.mention = false;
      reply(D.replySend, true);
      return;
    } else if (a === 'confirm') W.confirm = true;
    else if (a === 'cancel') W.confirm = false;
    else if (a === 'shoot') { W.confirm = false; W.shooting = true; reply(D.replyShoot); return; }
    else if (a === 'view') W.view = b.dataset.v;
    else if (a === 'rtake') W.take = +b.dataset.n;
    else if (a === 'rconfirm') W.rconfirm = true;
    else if (a === 'rcancel') W.rconfirm = false;
    else if (a === 'rshoot') { W.rconfirm = false; W.full = true; }
    render();
  });
  // The hero's two line buttons (app.js) call this to switch the window.
  window.ShiseiDemo = { show(line) { if (W.line !== line) { W.line = line; render(); } } };
  render();

  /* ---- real runs: three moving cards ---- */
  const casesMount = $('casesMount');
  if (casesMount && T.cases) {
    const GAP = 1.2;
    const C = [
      { key: 'k-bus', src: 'case-last-bus', steps: T.pDramaSteps, paid: [0, 1, 0, 0, 1, 0], sound: true },
      { key: 'k-line', src: 'case-clothesline', steps: T.pDramaSteps, paid: [0, 1, 0, 0, 1, 0], sound: true },
      { key: 'k-remake', src: 'case-remake', steps: T.pRemakeSteps, paid: [0, 1, 1, 1, 0], sound: false }
    ];
    casesMount.innerHTML = C.map((c, i) => {
      const t = T.cases[i];
      const dur = c.paid.length * GAP;
      return '<article class="k-card rv"><div class="k-media"><video data-src="' + BASE + c.src + '.mp4" data-key="' + c.key + '" poster="' + BASE + c.src + '.webp" muted loop playsinline aria-label="' + esc(t.alt) + '"></video>' +
        '<span class="k-line">' + esc(t.line) + '</span>' + (c.sound ? speaker(c.key) : '') + '</div>' +
        '<div class="k-body"><div class="k-head"><b>' + esc(t.title) + '</b><span>' + esc(t.meta) + '</span></div>' +
        '<div class="p-legend"><span><i class="free"></i>' + esc(T.pFree) + '</span><span><i class="gpu"></i>' + esc(T.pGpu) + '</span></div>' +
        '<div class="p-track" aria-hidden="true"><i class="p-dot" style="animation-duration:' + dur + 's"></i></div>' +
        '<ol class="p-steps k-steps">' + c.steps.map((s, j) => '<li style="animation-duration:' + dur + 's;animation-delay:' + (j * GAP) + 's"><span><i class="' + (c.paid[j] ? 'gpu' : 'free') + '" title="' + esc(c.paid[j] ? T.pGpu : T.pFree) + '"></i>' + esc(s) + '</span></li>').join('') + '</ol>' +
        '<div class="p-facts">' + t.facts.map((f) => '<span>' + esc(f) + '</span>').join('') + '</div></div></article>';
    }).join('');
    watch(casesMount);
  }

  /* ---- series: the series page redrawn, fixed voices, the same character in two episodes ---- */
  const sm = $('seriesMount');
  if (sm && T.series) {
    const S = T.series;
    const SV = { tab: 0 };
    const VOICE = [BASE + 'voice-shenmo.m4a', BASE + 'voice-xianling.m4a', null];
    const FACE = [BASE + 'face-shenmo.webp', BASE + 'face-xianling.webp', null];
    const AGE = [34, 52, 45];
    const audio = new Audio();
    audio.preload = 'none';
    audio.dataset.key = '';
    audio.addEventListener('ended', () => { setSound(null); drawSeries(); });
    const tabBody = () => {
      if (SV.tab === 0) {
        return '<div class="s-eps">' + [[1, 'stCut', 'series-ep1', [0, 1]], [2, 'stCut', 'series-ep2', [0, 1]], [3, 'stAssets', null, [2, 0]]].map(([n, st, img, cast]) =>
          '<div class="s-ep"><span class="s-thumb">' + (img ? '<img src="' + BASE + img + '.webp" alt="" loading="lazy">' : '') + '</span><span class="s-ep-t"><b>' + esc(fill(S.ep, { n })) + '</b><small class="' + (st === 'stCut' ? 'ok' : '') + '">' + esc(S[st]) + '</small></span>' +
          cast.map((c) => '<span class="s-name">' + esc(S.cast[c]) + '</span>').join('') + '</div>').join('') + '<div class="s-pull">' + esc(S.pullIn) + '</div></div>';
      }
      if (SV.tab === 1) {
        return '<div class="s-cast">' + S.cast.map((name, i) => {
          const playing = audio.dataset.key === 'v' + i && soundOn === audio;
          return '<div class="s-person"><span class="s-face">' + (FACE[i] ? '<img src="' + FACE[i] + '" alt="' + esc(name) + '" loading="lazy">' : esc(name[0])) + '</span><span class="s-who"><b>' + esc(name) + '</b><small>' + esc(fill(S.age, { n: AGE[i] })) + '</small></span>' +
            (VOICE[i] ? '<button type="button" class="s-voice' + (playing ? ' on' : '') + '" data-voice="' + i + '" aria-pressed="' + playing + '">' + (playing ? '<span class="s-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' : '') + esc(playing ? S.playing : S.listen) + '</button>' : '<span class="s-novoice">' + esc(S.noVoice) + '</span>') + '</div>';
        }).join('') + '</div>';
      }
      return '<div class="s-story"><div><small>' + esc(S.logLabel) + '</small><p>' + esc(S.logline) + '</p></div><div><small>' + esc(S.rulesLabel) + '</small><p>' + esc(S.rules) + '</p></div><div><small>' + esc(S.ep1Label) + '</small><p>' + esc(S.ep1) + '</p></div><span class="s-read">' + esc(S.readNote) + '</span></div>';
    };
    const drawSeries = () => {
      const panel = sm.querySelector('.s-panel');
      panel.innerHTML = tabBody();
      sm.querySelectorAll('.s-tabs button').forEach((b, i) => b.setAttribute('aria-selected', String(i === SV.tab)));
    };
    sm.innerHTML = '<div class="p-head rv"><span class="p-kicker acc">' + esc(S.kicker) + '</span><h2 id="seriesT">' + esc(S.title) + '</h2><p class="s-lead">' + esc(S.lead) + '</p></div>' +
      '<div class="s-grid"><div class="s-card rv"><div class="s-top"><div><small>' + esc(S.label) + '</small><b>' + esc(S.name) + '</b></div><span>' + esc(S.meta) + '</span><span class="dm-grow"></span><span class="s-new">' + esc(S.newEp) + '</span></div>' +
      '<div class="s-tabs" role="tablist">' + S.tabs.map((t, i) => '<button type="button" role="tab" data-tab="' + i + '" aria-selected="' + (i === 0) + '">' + esc(t) + '</button>').join('') + '</div><div class="s-panel"></div></div>' +
      '<div class="s-clips">' + [['series-ep1', S.clip1, S.alt1, 's-e1', 1], ['series-ep2', S.clip2, S.alt2, 's-e2', 2]].map(([src, cap, alt, key, n]) =>
        '<figure class="rv"><span class="s-clip"><video data-src="' + BASE + src + '.mp4" data-key="' + key + '" poster="' + BASE + src + '.webp" muted loop playsinline aria-label="' + esc(alt) + '"></video><span class="k-line">' + esc(fill(S.ep, { n })) + '</span>' + speaker(key) + '</span><figcaption>' + esc(cap) + '</figcaption></figure>').join('') + '</div></div>' +
      '<p class="s-foot">' + esc(S.foot) + '</p>';
    drawSeries();
    watch(sm);
    sm.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab]');
      if (t) { SV.tab = +t.dataset.tab; drawSeries(); return; }
      const v = e.target.closest('[data-voice]');
      if (v) {
        const k = 'v' + v.dataset.voice;
        if (soundOn === audio && audio.dataset.key === k) setSound(null);
        else { audio.src = VOICE[+v.dataset.voice]; audio.dataset.key = k; setSound(audio); }
        drawSeries();
      }
    });
  }
})();
