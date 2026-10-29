(() => {
  'use strict';

  const CATALOG = JSON.parse(document.getElementById('catalog').textContent);
  const I18N = window.I18N;
  const LANGS = ['zh', 'ja', 'en', 'ko'];
  const VIEWS = ['front', 'diag', 'side', 'above', 'below'];
  // Order matches I18N[*].cats; class_en is the stable key in the catalog.
  const CAT_KEYS = ['Sitting', 'Standing', 'Kneeling', 'Lying', 'Side sit / W-sit', 'Squatting', 'Leaning forward', 'Arching back', 'Twist'];
  const TINT = ['#D3D1E6', '#AFC3E0', '#BCD3C6', '#E3CBB0', '#EBC0BC', '#C7DCD6', '#E6B7A1', '#CBD0AC', '#DDB9C8'];
  const TOOLS = ['ComfyUI', 'Stable Diffusion', 'Flux', 'Midjourney', 'Nano Banana', 'Qwen-Image', '即梦'];
  const NAME_LABEL = { cn: 'ZH', jp: 'JA', en: 'EN', kr: 'KO' };
  // Each language has its own copy of this page (zh at the root, the others under ja/ en/ ko/) so search engines and
  // link previews see it in that language; BASE leads back to the site root from here.
  const BASE = window.SHISEI.base || '';
  const PREFIX = { zh: '', ja: 'ja/', en: 'en/', ko: 'ko/' };

  const poses = CATALOG.map((p) => ({
    ...p,
    ci: Math.max(0, CAT_KEYS.indexOf(p.class_en)),
    isNew: !!p.orig_id,
    line: VIEWS.map((v) => p.views[v] || null),
    photo: VIEWS.map((v) => ((p.photos || []).includes(v) ? p.views[v] : null))
  }));
  const byId = new Map(poses.map((p) => [p.id, p]));
  const catCounts = CAT_KEYS.map((_, i) => poses.filter((p) => p.ci === i).length);
  const newCount = poses.filter((p) => p.isNew).length;
  const photoCount = poses.filter((p) => p.photo.some(Boolean)).length;

  const store = {
    get: (k) => { try { return localStorage.getItem('shisei.' + k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem('shisei.' + k, v); } catch (e) { /* private mode */ } }
  };

  const params = new URLSearchParams(location.search);
  const intParam = (k, lo, hi, dflt) => {
    const n = parseInt(params.get(k), 10);
    return Number.isInteger(n) && n >= lo && n <= hi ? n : dflt;
  };
  // The page's own language; the head script already moved the reader if ?lang or their saved choice says otherwise.
  const S = {
    lang: LANGS.includes(window.SHISEI.lang) ? window.SHISEI.lang : 'zh',
    cat: intParam('cat', 0, CAT_KEYS.length - 1, -1),
    newOnly: params.get('new') === '1',
    angle: intParam('angle', 0, 4, -1),
    medium: params.get('src') === 'photo' ? 'photo' : 'line',
    view: params.get('view') === 'single' ? 'single' : 'pose',
    q: params.get('q') || '',
    per: {}
  };

  const $ = (id) => document.getElementById(id);
  const t = () => I18N[S.lang];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nameOf = (p) => p['name_' + t().suffix];
  const src = (kind, tier, file) => BASE + 'images/' + kind + '/' + tier + '/' + file;
  const srcset = (kind, file) => src(kind, 'w300', file) + ' 300w, ' + src(kind, 'w900', file) + ' 900w';
  const files = (p, photo) => (photo ? p.photo : p.line);
  const firstView = (arr) => Math.max(0, arr.findIndex(Boolean));

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 1600);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e2) { /* nothing else to try */ }
      ta.remove();
    }
    toast(t().copied);
  }

  function syncUrl() {
    const p = new URLSearchParams();
    if (S.cat >= 0) p.set('cat', S.cat);
    if (S.newOnly) p.set('new', '1');
    if (S.angle >= 0) p.set('angle', S.angle);
    if (S.medium === 'photo') p.set('src', 'photo');
    if (S.view === 'single') p.set('view', 'single');
    if (S.q) p.set('q', S.q);
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }

  /* static text */
  function applyText() {
    const T = t();
    document.documentElement.lang = T.htmlLang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = T[el.dataset.i18n];
      if (typeof v === 'string') el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = T[el.dataset.i18nPh]; });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', T[el.dataset.i18nAria]); });
    $('lang').textContent = T.short;
    $('howList').innerHTML = T.how.map((s) => '<li>' + esc(s) + '</li>').join('');
    $('termsList').innerHTML = T.termsItems.map((s) => '<li>' + esc(s) + '</li>').join('');
  }

  /* hero */
  function renderMarquee() {
    const row = (offset) => {
      const tiles = [];
      for (let k = 0; k < 18; k++) {
        const p = poses[(k * 7 + offset * 11) % poses.length];
        const vi = (k * 2 + offset) % 5;
        const f = p.line[vi] || p.line[firstView(p.line)];
        tiles.push('<span class="mq-tile" style="background:' + TINT[p.ci] + '"><img src="' + src('line', 'w300', f) + '" alt="" width="146" height="146" decoding="async"></span>');
      }
      return tiles.join('') + tiles.join('');
    };
    $('mq1').innerHTML = row(0);
    $('mq2').innerHTML = row(3);
    $('tools').innerHTML = TOOLS.map((x) => '<span>' + esc(x) + '</span>').join('');
  }

  function renderFeatured() {
    const T = t();
    $('featured').innerHTML = poses.filter((p) => p.isNew).map((p) => {
      const vi = p.line[1] ? 1 : firstView(p.line);
      const n = p.line.filter(Boolean).length;
      return '<button type="button" class="fcard" data-open="' + p.id + '" data-v="' + vi + '" aria-label="' + esc(T.open(p.id) + ' ' + nameOf(p)) + '">' +
        '<span class="ftile" style="background:' + TINT[p.ci] + '"><img src="' + src('line', 'w300', p.line[vi]) + '" srcset="' + srcset('line', p.line[vi]) + '" sizes="300px" alt="" loading="lazy" decoding="async">' +
        '<span class="badge new">' + T.newBadge + '</span><span class="vlabel">' + n + '/5</span></span>' +
        '<span class="fcard-t"><span>' + esc(nameOf(p)) + '</span><span class="mono muted" style="font-size:13px">' + p.id + '</span></span></button>';
    }).join('');
  }

  /* filters */
  function renderCats() {
    const T = t();
    const chip = (label, n, sel, dot, act) => '<button type="button" class="chip" role="tab" aria-selected="' + sel + '" data-act="' + act + '"><span class="dot" style="background:' + dot + '"></span>' + esc(label) + '<span class="n">' + n + '</span></button>';
    $('cats').innerHTML = chip(T.all, poses.length, S.cat < 0 && !S.newOnly, 'var(--accent)', 'cat:-1') +
      T.cats.map((c, i) => chip(c, catCounts[i], S.cat === i, TINT[i], 'cat:' + i)).join('') +
      chip(T.newBadge, newCount, S.newOnly, 'var(--new)', 'new');
  }

  function segHtml(cls, label, opts) {
    return '<div class="seg ' + cls + '" role="group" aria-label="' + esc(label) + '">' +
      opts.map(([text, act, on]) => '<button type="button" data-act="' + act + '" aria-pressed="' + on + '">' + esc(text) + '</button>').join('') + '</div>';
  }
  function filterGroups() {
    const T = t();
    return [
      [T.angle, segHtml('angle', T.angle, [[T.angleAll, 'angle:-1', S.angle < 0]].concat(T.views.map((v, i) => [v, 'angle:' + i, S.angle === i])))],
      [T.medium, segHtml('medium', T.medium, [[T.line, 'medium:line', S.medium === 'line'], [T.photo + ' · ' + photoCount, 'medium:photo', S.medium === 'photo']])],
      [T.view, segHtml('view', T.view, [[T.byPose, 'view:pose', S.view === 'pose'], [T.single, 'view:single', S.view === 'single']])]
    ];
  }
  function renderFilters() {
    const groups = filterGroups();
    $('inlineFilters').innerHTML = groups.map((g) => g[1]).join('');
    $('sheetFilters').innerHTML = groups.map((g) => '<div class="grp"><span>' + esc(g[0]) + '</span>' + g[1] + '</div>').join('');
    const n = (S.angle >= 0) + (S.medium === 'photo') + (S.view === 'single');
    $('sheetBadge').textContent = n ? String(n) : '';
  }

  /* grid */
  function pool() {
    const q = S.q.trim().toLowerCase();
    return poses.filter((p) => {
      if (S.cat >= 0 && p.ci !== S.cat) return false;
      if (S.newOnly && !p.isNew) return false;
      if (S.medium === 'photo' && !p.photo.some(Boolean)) return false;
      if (!q) return true;
      const hay = [p.id, p.orig_id || '', p.name_cn, p.name_jp, p.name_en, p.name_kr, p.class_cn, p.class_jp, p.class_en, p.class_kr].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }
  function curView(p) {
    const arr = files(p, S.medium === 'photo');
    if (S.angle >= 0) return S.angle;
    return S.per[p.id] ?? firstView(arr);
  }

  function cardHtml(p) {
    const T = t();
    const photo = S.medium === 'photo';
    const arr = files(p, photo);
    const cur = curView(p);
    const f = arr[cur];
    const kind = photo ? 'photo' : 'line';
    const dots = VIEWS.map((_, i) => '<button type="button" data-dot="' + i + '" aria-label="' + esc(T.views[i]) + '" aria-pressed="' + (i === cur) + '"' + (arr[i] ? '' : ' disabled') + '><i></i></button>').join('');
    return '<article class="card" data-id="' + p.id + '" style="--tint:' + TINT[p.ci] + '">' +
      '<a class="tile" href="#' + p.id + '-' + VIEWS[cur] + '" data-tile aria-label="' + esc(T.open(p.id) + ' ' + nameOf(p)) + '">' +
        '<img' + (f ? ' src="' + src(kind, 'w300', f) + '" srcset="' + srcset(kind, f) + '"' : '') + ' sizes="(max-width: 720px) 50vw, 320px" alt="' + esc(p.id + ' ' + nameOf(p) + ' · ' + T.views[cur]) + '" loading="lazy" decoding="async"' + (f ? '' : ' hidden') + '>' +
        '<span class="missing"' + (f ? ' hidden' : '') + '><b>' + esc(photo ? T.missingPhoto(T.views[cur]) : T.missingLine(T.views[cur])) + '</b><span>' + esc(photo ? T.missingPhotoSub : T.missingLineSub) + '</span></span>' +
        (p.isNew ? '<span class="badge new">' + T.newBadge + '</span>' : '') +
        (!photo && p.photo.some(Boolean) ? '<span class="badge ph">' + esc(T.hasPhoto) + '</span>' : '') +
        '<span class="vlabel">' + esc(T.views[cur]) + ' ' + (cur + 1) + '/5</span>' +
      '</a>' +
      '<div class="card-foot"><div class="card-t"><h3>' + esc(nameOf(p)) + '</h3><span>' + p.id + ' · ' + esc(T.cats[p.ci]) + '</span></div>' +
      '<div class="dots" role="group" aria-label="' + esc(T.angle) + '">' + dots + '</div></div></article>';
  }

  // Swap one card's angle in place so hover state and transitions are not interrupted.
  function updateCard(card, p) {
    const T = t();
    const photo = S.medium === 'photo';
    const arr = files(p, photo);
    const cur = curView(p);
    const f = arr[cur];
    const kind = photo ? 'photo' : 'line';
    const img = card.querySelector('img');
    const miss = card.querySelector('.missing');
    if (f) {
      img.src = src(kind, 'w300', f);
      img.srcset = srcset(kind, f);
      img.alt = p.id + ' ' + nameOf(p) + ' · ' + T.views[cur];
    }
    img.hidden = !f;
    miss.hidden = !!f;
    card.querySelector('.vlabel').textContent = T.views[cur] + ' ' + (cur + 1) + '/5';
    card.querySelector('[data-tile]').setAttribute('href', '#' + p.id + '-' + VIEWS[cur]);
    card.querySelectorAll('[data-dot]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.dot === cur)));
  }

  function renderGrid() {
    const T = t();
    const list = pool();
    const grid = $('grid');
    const photo = S.medium === 'photo';
    grid.className = 'grid' + (S.view === 'single' ? ' single' : '') + (photo ? ' photo-mode' : '');
    let count = list.length;
    if (!list.length) {
      grid.className = '';
      grid.innerHTML = '<p class="empty">' + esc(T.empty) + '</p>';
    } else if (S.view === 'pose') {
      grid.innerHTML = list.map(cardHtml).join('');
    } else {
      const kind = photo ? 'photo' : 'line';
      const tiles = [];
      list.forEach((p) => files(p, photo).forEach((f, i) => {
        if (!f || (S.angle >= 0 && S.angle !== i)) return;
        tiles.push('<a class="stile" href="#' + p.id + '-' + VIEWS[i] + '" data-open="' + p.id + '" data-v="' + i + '" style="--tint:' + TINT[p.ci] + '" aria-label="' + esc(p.id + ' ' + nameOf(p) + ' · ' + T.views[i]) + '">' +
          '<span class="tile">' + '<img src="' + src(kind, 'w300', f) + '" srcset="' + srcset(kind, f) + '" sizes="(max-width: 720px) 50vw, 200px" alt="" loading="lazy" decoding="async"></span>' +
          '<span class="stile-t"><span class="mono">' + p.id + '</span><span>' + esc(T.views[i]) + '</span></span></a>');
      }));
      count = tiles.length;
      grid.innerHTML = tiles.join('');
    }
    $('count').textContent = S.view === 'pose' ? T.countPoses(list.length) : T.countImages(count);
    $('sheetApply').textContent = T.show(list.length);
  }

  function renderAll() {
    applyText();
    renderFeatured();
    renderCats();
    renderFilters();
    renderGrid();
    if ($('lb').open) renderLb();
  }

  /* actions */
  function act(a) {
    const [k, v] = a.split(':');
    if (k === 'cat') { S.cat = +v; S.newOnly = false; }
    else if (k === 'new') { S.newOnly = !S.newOnly; if (S.newOnly) S.cat = -1; }
    else if (k === 'angle') { S.angle = +v; S.per = {}; }
    else if (k === 'medium') { S.medium = v; S.per = {}; }
    else if (k === 'view') { S.view = v; }
    renderCats();
    renderFilters();
    renderGrid();
    syncUrl();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b) act(b.dataset.act);
  });

  const grid = $('grid');
  const pickDot = (e) => {
    const b = e.target.closest('[data-dot]');
    if (!b || b.disabled) return;
    const card = b.closest('.card');
    const p = byId.get(card.dataset.id);
    const i = +b.dataset.dot;
    if (curView(p) === i && S.angle < 0) return;
    S.angle = -1;
    S.per[p.id] = i;
    updateCard(card, p);
  };
  grid.addEventListener('mouseover', pickDot);
  grid.addEventListener('focusin', pickDot);
  grid.addEventListener('click', (e) => {
    if (e.target.closest('[data-dot]')) { pickDot(e); return; }
    const tile = e.target.closest('[data-tile]');
    if (tile) {
      e.preventDefault();
      const p = byId.get(tile.closest('.card').dataset.id);
      openLb(p.id, curView(p), S.medium === 'photo');
      return;
    }
    const s = e.target.closest('.stile');
    if (s) { e.preventDefault(); openLb(s.dataset.open, +s.dataset.v, S.medium === 'photo'); }
  });
  $('featured').addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (b) openLb(b.dataset.open, +b.dataset.v, false);
  });
  $('viewNew').addEventListener('click', () => {
    S.newOnly = true; S.cat = -1;
    renderCats(); renderGrid(); syncUrl();
    $('all').scrollIntoView();
  });

  const q = $('q');
  q.value = S.q;
  q.addEventListener('input', () => { S.q = q.value; renderGrid(); syncUrl(); });
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('all').scrollIntoView(); });

  $('lang').addEventListener('click', () => {
    const next = LANGS[(LANGS.indexOf(S.lang) + 1) % LANGS.length];
    store.set('lang', next);
    location.assign(BASE + PREFIX[next] + location.search + location.hash);
  });
  $('theme').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    store.set('theme', root.dataset.theme);
  });

  /* dialogs */
  const dialogs = { how: $('dlgHow'), terms: $('dlgTerms') };
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open="how"], [data-open="terms"]');
    if (o) dialogs[o.dataset.open].showModal();
    const c = e.target.closest('[data-close]');
    if (c) c.closest('dialog').close();
  });
  document.querySelectorAll('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));
  $('sheetBtn').addEventListener('click', () => $('sheet').showModal());
  $('sheetApply').addEventListener('click', () => $('sheet').close());
  $('sheetReset').addEventListener('click', () => {
    S.angle = -1; S.medium = 'line'; S.view = 'pose'; S.per = {};
    renderFilters(); renderGrid(); syncUrl();
  });

  /* lightbox */
  const LB = { id: null, v: 0, photo: false };
  function lbList() {
    const list = pool();
    return list.some((p) => p.id === LB.id) ? list : poses;
  }
  function openLb(id, v, photo) {
    const p = byId.get(id);
    if (!p) return;
    LB.id = id;
    LB.photo = photo && p.photo.some(Boolean);
    const arr = files(p, LB.photo);
    LB.v = arr[v] ? v : firstView(arr);
    renderLb();
    if (!$('lb').open) $('lb').showModal();
  }
  function renderLb() {
    const T = t();
    const p = byId.get(LB.id);
    const arr = files(p, LB.photo);
    const f = arr[LB.v];
    const kind = LB.photo ? 'photo' : 'line';
    const tint = LB.photo ? 'var(--tile)' : TINT[p.ci];
    $('lb').style.setProperty('--tint', tint);
    $('lb').classList.toggle('photo', LB.photo);
    const img = $('lbImg');
    if (f) { img.src = src(kind, 'w900', f); img.alt = p.id + ' ' + nameOf(p) + ' · ' + T.views[LB.v]; }
    img.hidden = !f;
    const miss = $('lbMissing');
    miss.hidden = !!f;
    miss.innerHTML = f ? '' : '<b>' + esc(LB.photo ? T.missingPhoto(T.views[LB.v]) : T.missingLine(T.views[LB.v])) + '</b><span>' + esc(LB.photo ? T.missingPhotoSub : T.missingLineSub) + '</span>';
    $('lbCounter').textContent = T.views[LB.v] + ' ' + (LB.v + 1) + '/5';
    $('lbMeta').textContent = p.id + ' · ' + T.cats[p.ci];
    $('lbTitle').textContent = nameOf(p);
    $('lbNames').innerHTML = ['cn', 'jp', 'en', 'kr'].filter((s) => s !== T.suffix)
      .map((s) => '<dt>' + NAME_LABEL[s] + '</dt><dd>' + esc(p['name_' + s]) + '</dd>').join('');
    $('lbChips').setAttribute('aria-label', T.angle);
    $('lbChips').innerHTML = VIEWS.map((_, i) => '<button type="button" data-lbv="' + i + '" aria-pressed="' + (i === LB.v) + '"' + (arr[i] ? '' : ' disabled') + '>' +
      '<span>' + (arr[i] ? '<img src="' + src(kind, 'w300', arr[i]) + '" alt="">' : '') + '</span>' + esc(T.views[i]) + '</button>').join('');
    const hasPhoto = p.photo.some(Boolean);
    $('lbMedium').setAttribute('aria-label', T.medium);
    $('lbMedium').innerHTML = '<button type="button" data-lbm="line" aria-pressed="' + !LB.photo + '">' + esc(T.line) + '</button>' +
      '<button type="button" data-lbm="photo" aria-pressed="' + LB.photo + '"' + (hasPhoto ? '' : ' disabled') + '>' + esc(T.photo) + '</button>';
    $('lbDesc').textContent = p.desc_en;
    const dl = $('lbDl');
    $('lbDlText').textContent = T.download + ' · ' + (LB.photo ? '900×1800' : '900×1200');
    if (f) { dl.href = src(kind, 'w900', f); dl.setAttribute('download', 'shisei_' + p.id + '_' + VIEWS[LB.v] + (LB.photo ? '_photo' : '') + '.webp'); dl.removeAttribute('aria-disabled'); }
    else { dl.removeAttribute('href'); dl.setAttribute('aria-disabled', 'true'); }
    $('lbPage').href = posePage(p.id);
    history.replaceState(null, '', location.pathname + location.search + '#' + p.id + '-' + VIEWS[LB.v] + (LB.photo ? '-photo' : ''));
  }
  const posePage = (id) => BASE + PREFIX[S.lang] + 'pose/' + id + '/';
  function stepAngle(d) {
    const arr = files(byId.get(LB.id), LB.photo);
    for (let k = 1; k <= 5; k++) {
      const i = (LB.v + d * k + 25) % 5;
      if (arr[i]) { LB.v = i; break; }
    }
    renderLb();
  }
  function stepPose(d) {
    const list = lbList();
    const i = list.findIndex((p) => p.id === LB.id);
    const next = list[(i + d + list.length) % list.length];
    openLb(next.id, LB.v, LB.photo);
  }
  $('lbPrev').addEventListener('click', () => stepAngle(-1));
  $('lbNext').addEventListener('click', () => stepAngle(1));
  $('lbClose').addEventListener('click', () => $('lb').close());
  $('lbChips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lbv]');
    if (b && !b.disabled) { LB.v = +b.dataset.lbv; renderLb(); }
  });
  $('lbMedium').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lbm]');
    if (b && !b.disabled) openLb(LB.id, LB.v, b.dataset.lbm === 'photo');
  });
  $('lbCopyDesc').addEventListener('click', () => copy(byId.get(LB.id).desc_en));
  $('lbCopyId').addEventListener('click', () => copy(LB.id));
  // Share the pose page, not this #hash: link previews never see a fragment, the pose page has its own card.
  $('lbShare').addEventListener('click', () => {
    const p = byId.get(LB.id);
    const f = p.line[LB.v] || p.line[firstView(p.line)];
    window.ShiseiShare.open({
      url: posePage(p.id),
      heading: t().shareTitle,
      text: t().shareText.replace('{name}', nameOf(p)),
      image: new URL(src('line', 'w900', f), location.href).href
    });
  });
  $('lb').addEventListener('close', () => history.replaceState(null, '', location.pathname + location.search));
  $('lb').addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepAngle(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); stepAngle(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); stepPose(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); stepPose(1); }
    else if (e.key === 'l' || e.key === 'L') {
      if (byId.get(LB.id).photo.some(Boolean)) openLb(LB.id, LB.v, !LB.photo);
    }
  });
  let swipeX = null;
  $('lbStage').addEventListener('pointerdown', (e) => { swipeX = e.clientX; });
  $('lbStage').addEventListener('pointerup', (e) => {
    if (swipeX === null) return;
    const dx = e.clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 50) stepAngle(dx < 0 ? 1 : -1);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || document.querySelector('dialog[open]')) return;
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    e.preventDefault();
    q.focus();
  });

  // Deep links: #P001, #P001-diag, #P001-diag-photo
  function openFromHash() {
    const m = location.hash.match(/^#(P\d{3})(?:-(front|diag|side|above|below))?(-photo)?$/);
    if (m && byId.has(m[1])) openLb(m[1], m[2] ? VIEWS.indexOf(m[2]) : 0, !!m[3]);
  }
  window.addEventListener('hashchange', openFromHash);

  /* boot */
  renderMarquee();
  renderAll();
  openFromHash();
})();
