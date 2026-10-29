(() => {
  'use strict';

  const CATALOG = JSON.parse(document.getElementById('catalog').textContent);
  const I18N = window.I18N;
  const LANGS = ['zh', 'ja', 'en', 'ko'];
  const VIEWS = ['front', 'diag', 'side', 'above', 'below'];
  const SERIES = ['std', 'upper', 'sexy'];
  // Categories per series, keyed by the catalog's class_en. std's order matches I18N[*].cats (its catalog names are
  // long); the other series use their catalog class_* names as labels.
  const CATS = {
    std: [['Sitting', '#D3D1E6'], ['Standing', '#AFC3E0'], ['Kneeling', '#BCD3C6'], ['Lying', '#E3CBB0'], ['Side sit / W-sit', '#EBC0BC'],
      ['Squatting', '#C7DCD6'], ['Leaning forward', '#E6B7A1'], ['Arching back', '#CBD0AC'], ['Twist', '#DDB9C8']],
    upper: [['Cute', '#EBC0BC'], ['Sexy', '#E6B7A1'], ['Chest emphasis', '#CBD0AC']],
    sexy: [['Standing', '#AFC3E0'], ['Sitting', '#D3D1E6'], ['Lying', '#E3CBB0'], ['Kneeling & all fours', '#BCD3C6'], ['Special', '#DDB9C8']]
  };
  // Suggestive poses (the sexy series, upper's Sexy / Chest emphasis) stay hidden until the reader opts in (DECISIONS D-06).
  const SHOW_SUGGESTIVE_DEFAULT = false;
  const TOOLS = ['ComfyUI', 'Stable Diffusion', 'Flux', 'Midjourney', 'Nano Banana', 'Qwen-Image', '即梦'];
  const NAME_LABEL = { cn: 'ZH', jp: 'JA', en: 'EN', kr: 'KO' };
  // Each language has its own copy of this page (zh at the root, the others under ja/ en/ ko/) so search engines and
  // link previews see it in that language; BASE leads back to the site root from here.
  const BASE = window.SHISEI.base || '';
  const PREFIX = { zh: '', ja: 'ja/', en: 'en/', ko: 'ko/' };

  // A view is in the catalog only if it passed QC; a pose with no passing view is not shown at all.
  const LATEST = CATALOG.map((p) => p.added_in || '').sort().pop();
  const poses = CATALOG.filter((p) => VIEWS.some((v) => p.views[v])).map((p) => {
    const ci = Math.max(0, (CATS[p.series] || CATS.std).findIndex((c) => c[0] === p.class_en));
    const line = VIEWS.map((v) => p.views[v] || null);
    return {
      ...p, ci, line,
      tint: (CATS[p.series] || CATS.std)[ci][1],
      isNew: p.added_in === LATEST,
      suggestive: p.rating === 'suggestive',
      full: line.every(Boolean),
      photo: VIEWS.map((v) => (p.photos && p.photos[v]) || null)
    };
  });
  const byId = new Map(poses.map((p) => [p.id, p]));

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
    series: SERIES.includes(params.get('series')) ? params.get('series') : 'all',
    cat: intParam('cat', 0, 8, -1),
    full: params.get('full') === '1',
    adult: (store.get('adult') ?? (SHOW_SUGGESTIVE_DEFAULT ? '1' : '0')) === '1',
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
  const catLabel = (p) => (p.series === 'std' ? t().cats[p.ci] : p['class_' + t().suffix]);
  // What the reader may see at all: rating first, then the series tab.
  const allowed = () => poses.filter((p) => S.adult || !p.suggestive);
  const inSeries = () => allowed().filter((p) => S.series === 'all' || p.series === S.series);
  const missingText = (p, v, photo) => {
    const T = t();
    if (photo) return [T.missingPhoto(T.views[v]), T.missingPhotoSub];
    const g = (p.gaps || {})[VIEWS[v]];
    return g === 'line' || g === 'structure' ? [T.qcFail(T.views[v]), T.qcFailSub] : [T.missingLine(T.views[v]), T.missingLineSub];
  };
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
    if (S.series !== 'all') p.set('series', S.series);
    if (S.cat >= 0) p.set('cat', S.cat);
    if (S.full) p.set('full', '1');
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
    const n = allowed().length;
    document.querySelector('.hero-sub').textContent = T.heroSub(n);
    document.querySelector('[data-i18n="browse"]').textContent = T.browse(n);
    $('new-title').textContent = T.newTitle(allowed().filter((p) => p.isNew).length);
    $('howList').innerHTML = T.how.map((s) => '<li>' + esc(s) + '</li>').join('');
    $('termsList').innerHTML = T.termsItems.map((s) => '<li>' + esc(s) + '</li>').join('');
  }

  /* hero */
  function renderMarquee() {
    const safe = poses.filter((p) => !p.suggestive);
    const row = (offset) => {
      const tiles = [];
      for (let k = 0; k < 18; k++) {
        const p = safe[(k * 7 + offset * 11) % safe.length];
        const vi = (k * 2 + offset) % 5;
        const f = p.line[vi] || p.line[firstView(p.line)];
        tiles.push('<span class="mq-tile" style="background:' + p.tint + '"><img src="' + src('line', 'w300', f) + '" alt="" width="146" height="146" decoding="async"></span>');
      }
      return tiles.join('') + tiles.join('');
    };
    $('mq1').innerHTML = row(0);
    $('mq2').innerHTML = row(3);
    $('tools').innerHTML = TOOLS.map((x) => '<span>' + esc(x) + '</span>').join('');
  }

  function renderFeatured() {
    const T = t();
    $('featured').innerHTML = allowed().filter((p) => p.isNew).slice(0, 24).map((p) => {
      const vi = p.line[1] ? 1 : firstView(p.line);
      const n = p.line.filter(Boolean).length;
      return '<button type="button" class="fcard" data-open="' + p.id + '" data-v="' + vi + '" aria-label="' + esc(T.open(p.id) + ' ' + nameOf(p)) + '">' +
        '<span class="ftile" style="background:' + p.tint + '"><img src="' + src('line', 'w300', p.line[vi]) + '" srcset="' + srcset('line', p.line[vi]) + '" sizes="300px" alt="" loading="lazy" decoding="async">' +
        '<span class="badge new">' + T.newBadge + '</span><span class="vlabel">' + n + '/5</span></span>' +
        '<span class="fcard-t"><span>' + esc(nameOf(p)) + '</span><span class="mono muted" style="font-size:13px">' + p.id + '</span></span></button>';
    }).join('');
  }

  /* filters */
  function renderCats() {
    const T = t();
    const chip = (label, n, sel, dot, act) => '<button type="button" class="chip" role="tab" aria-selected="' + sel + '" data-act="' + act + '"><span class="dot" style="background:' + dot + '"></span>' + esc(label) + '<span class="n">' + n + '</span></button>';
    const ok = allowed();
    const tabs = [['all', ok.length]].concat(SERIES.map((k) => [k, ok.filter((p) => p.series === k).length])).filter((x) => x[1] > 0);
    $('series').setAttribute('aria-label', T.seriesLabel);
    $('series').innerHTML = tabs.map(([k, n]) => '<button type="button" data-act="series:' + k + '" aria-pressed="' + (S.series === k) + '">' + esc(T.series[k]) + ' <span class="n">' + n + '</span></button>').join('');
    const adult = $('adult');
    adult.setAttribute('aria-pressed', String(S.adult));
    adult.title = T.adultHint;
    adult.innerHTML = '<span class="dot" style="background:' + (S.adult ? 'var(--accent)' : 'var(--line)') + '"></span>' + esc(S.adult ? T.adultOn : T.adultOff);
    const base = inSeries();
    const cats = S.series === 'all' ? [] : CATS[S.series].map((c, i) => {
      const sample = base.find((p) => p.ci === i);
      return sample ? chip(catLabel(sample), base.filter((p) => p.ci === i).length, S.cat === i, c[1], 'cat:' + i) : '';
    });
    const nNew = base.filter((p) => p.isNew).length;
    const nFull = base.filter((p) => p.full).length;
    $('cats').innerHTML = chip(T.all, base.length, S.cat < 0 && !S.newOnly && !S.full, 'var(--accent)', 'cat:-1') + cats.join('') +
      (nNew && nNew < base.length ? chip(T.newBadge, nNew, S.newOnly, 'var(--new)', 'new') : '') +
      chip(T.full, nFull, S.full, 'var(--ink)', 'full');
  }

  function segHtml(cls, label, opts) {
    return '<div class="seg ' + cls + '" role="group" aria-label="' + esc(label) + '">' +
      opts.map(([text, act, on]) => '<button type="button" data-act="' + act + '" aria-pressed="' + on + '">' + esc(text) + '</button>').join('') + '</div>';
  }
  function filterGroups() {
    const T = t();
    return [
      [T.angle, segHtml('angle', T.angle, [[T.angleAll, 'angle:-1', S.angle < 0]].concat(T.views.map((v, i) => [v, 'angle:' + i, S.angle === i])))],
      [T.medium, segHtml('medium', T.medium, [[T.line, 'medium:line', S.medium === 'line'], [T.photo + ' · ' + inSeries().filter((p) => p.photo.some(Boolean)).length, 'medium:photo', S.medium === 'photo']])],
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
    return inSeries().filter((p) => {
      if (S.series !== 'all' && S.cat >= 0 && p.ci !== S.cat) return false;
      if (S.newOnly && !p.isNew) return false;
      if (S.full && !p.full) return false;
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
    const [missB, missS] = missingText(p, cur, photo);
    return '<article class="card" data-id="' + p.id + '" style="--tint:' + p.tint + '">' +
      '<a class="tile" href="#' + p.id + '-' + VIEWS[cur] + '" data-tile aria-label="' + esc(T.open(p.id) + ' ' + nameOf(p)) + '">' +
        '<img' + (f ? ' src="' + src(kind, 'w300', f) + '" srcset="' + srcset(kind, f) + '"' : '') + ' sizes="(max-width: 720px) 50vw, 320px" alt="' + esc(p.id + ' ' + nameOf(p) + ' · ' + T.views[cur]) + '" loading="lazy" decoding="async"' + (f ? '' : ' hidden') + '>' +
        '<span class="missing"' + (f ? ' hidden' : '') + '><b>' + esc(missB) + '</b><span>' + esc(missS) + '</span></span>' +
        (p.isNew ? '<span class="badge new">' + T.newBadge + '</span>' : '') +
        (!photo && p.photo.some(Boolean) ? '<span class="badge ph">' + esc(T.hasPhoto) + '</span>' : '') +
        '<span class="vlabel">' + esc(T.views[cur]) + ' ' + (cur + 1) + '/5</span>' +
      '</a>' +
      '<div class="card-foot"><div class="card-t"><h3>' + esc(nameOf(p)) + '</h3><span>' + p.id + ' · ' + esc(catLabel(p)) + '</span></div>' +
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
    if (!f) { const [b, s] = missingText(p, cur, photo); miss.innerHTML = '<b>' + esc(b) + '</b><span>' + esc(s) + '</span>'; }
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
        tiles.push('<a class="stile" href="#' + p.id + '-' + VIEWS[i] + '" data-open="' + p.id + '" data-v="' + i + '" style="--tint:' + p.tint + '" aria-label="' + esc(p.id + ' ' + nameOf(p) + ' · ' + T.views[i]) + '">' +
          '<span class="tile">' + '<img src="' + src(kind, 'w300', f) + '" srcset="' + srcset(kind, f) + '" sizes="(max-width: 720px) 50vw, 200px" alt="" loading="lazy" decoding="async"></span>' +
          '<span class="stile-t"><span class="mono">' + p.id + '</span><span>' + esc(T.views[i]) + '</span></span></a>');
      }));
      count = tiles.length;
      grid.innerHTML = tiles.join('');
    }
    $('count').textContent = S.view === 'pose' ? T.countPoses(list.length, inSeries().length) : T.countImages(count);
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
    if (k === 'cat') { S.cat = +v; S.newOnly = false; if (S.cat < 0) S.full = false; }
    else if (k === 'series') { S.series = v; S.cat = -1; S.newOnly = false; }
    else if (k === 'new') { S.newOnly = !S.newOnly; if (S.newOnly) S.cat = -1; }
    else if (k === 'full') { S.full = !S.full; }
    else if (k === 'angle') { S.angle = +v; S.per = {}; }
    else if (k === 'medium') { S.medium = v; S.per = {}; }
    else if (k === 'view') { S.view = v; }
    renderCats();
    renderFilters();
    renderGrid();
    syncUrl();
  }
  $('adult').addEventListener('click', () => {
    S.adult = !S.adult;
    store.set('adult', S.adult ? '1' : '0');
    if (!S.adult && S.series === 'sexy') S.series = 'all';
    renderAll();
    renderMarquee();
    syncUrl();
  });
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
    return list.some((p) => p.id === LB.id) ? list : allowed();
  }
  function openLb(id, v, photo) {
    const p = byId.get(id);
    if (!p || (p.suggestive && !S.adult)) return;
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
    const tint = LB.photo ? 'var(--tile)' : p.tint;
    $('lb').style.setProperty('--tint', tint);
    $('lb').classList.toggle('photo', LB.photo);
    const img = $('lbImg');
    if (f) { img.src = src(kind, 'w900', f); img.alt = p.id + ' ' + nameOf(p) + ' · ' + T.views[LB.v]; }
    img.hidden = !f;
    const miss = $('lbMissing');
    miss.hidden = !!f;
    const [mb, ms] = missingText(p, LB.v, LB.photo);
    miss.innerHTML = f ? '' : '<b>' + esc(mb) + '</b><span>' + esc(ms) + '</span>';
    $('lbCounter').textContent = T.views[LB.v] + ' ' + (LB.v + 1) + '/5';
    $('lbMeta').textContent = p.id + ' · ' + T.series[p.series] + ' · ' + catLabel(p);
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
    $('lbDesc').textContent = p.desc_en || '';
    $('lbDescBox').hidden = !p.desc_en;
    const dl = $('lbDl');
    $('lbDlText').textContent = T.download + ' · ' + (LB.photo ? '900×1800' : '900×1200');
    if (f) { dl.href = src(kind, 'w900', f); dl.setAttribute('download', 'shisei_' + p.id + '_' + VIEWS[LB.v] + (LB.photo ? '_photo' : '') + '.webp'); dl.removeAttribute('aria-disabled'); }
    else { dl.removeAttribute('href'); dl.setAttribute('aria-disabled', 'true'); }
    // Static pose pages exist only for general std poses (tools/site_pages.py).
    const hasPage = hasPosePage(p);
    $('lbPage').hidden = !hasPage;
    if (hasPage) $('lbPage').href = posePage(p.id);
    history.replaceState(null, '', location.pathname + location.search + '#' + p.id + '-' + VIEWS[LB.v] + (LB.photo ? '-photo' : ''));
  }
  const posePage = (id) => BASE + PREFIX[S.lang] + 'pose/' + id + '/';
  // Same rule as tools/build_site.py: only general-rated std poses get a static page.
  const hasPosePage = (p) => p.series === 'std' && !p.suggestive;
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
  // Poses without a page fall back to the gallery deep link (generic card, but it opens the pose).
  $('lbShare').addEventListener('click', () => {
    const p = byId.get(LB.id);
    const f = p.line[LB.v] || p.line[firstView(p.line)];
    window.ShiseiShare.open({
      url: hasPosePage(p) ? posePage(p.id) : BASE + PREFIX[S.lang] + '#' + p.id + '-' + VIEWS[LB.v],
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
    const m = location.hash.match(/^#([PSU]\d{3})(?:-(front|diag|side|above|below))?(-photo)?$/);
    if (m && byId.has(m[1])) openLb(m[1], m[2] ? VIEWS.indexOf(m[2]) : 0, !!m[3]);
  }
  window.addEventListener('hashchange', openFromHash);

  /* boot */
  renderMarquee();
  renderAll();
  openFromHash();
})();
