(() => {
  'use strict';

  const CATALOG = JSON.parse(document.getElementById('catalog').textContent);
  const I18N = window.I18N;
  const LANGS = ['zh', 'ja', 'en', 'ko'];
  const VIEWS = ['front', 'diag', 'side', 'above', 'below'];
  const SERIES = ['std', 'upper', 'sexy', 'duo'];
  const MAP_KINDS = ['clay', 'depth', 'normal'];
  // Categories per series, keyed by the catalog's class_en. std's order matches I18N[*].cats (its catalog names are
  // long); the other series use their catalog class_* names as labels.
  const CATS = {
    std: [['Sitting', '#D3D1E6'], ['Standing', '#AFC3E0'], ['Kneeling', '#BCD3C6'], ['Lying', '#E3CBB0'], ['Side sit / W-sit', '#EBC0BC'],
      ['Squatting', '#C7DCD6'], ['Leaning forward', '#E6B7A1'], ['Arching back', '#CBD0AC'], ['Twist', '#DDB9C8']],
    upper: [['Cute', '#EBC0BC'], ['Sexy', '#E6B7A1'], ['Chest emphasis', '#CBD0AC']],
    sexy: [['Standing', '#AFC3E0'], ['Sitting', '#D3D1E6'], ['Lying', '#E3CBB0'], ['Kneeling & all fours', '#BCD3C6'], ['Special', '#DDB9C8']],
    duo: [['Face-to-face lying', '#E3CBB0'], ['One behind the other', '#E6B7A1'], ['Seated, back to partner', '#D3D1E6'], ['Face-close', '#EBC0BC'],
      ['Seated on top', '#DDB9C8'], ['Standing', '#AFC3E0'], ['Standing close', '#C7DCD6'], ['Side-lying', '#CBD0AC'], ['Seated', '#D3D1E6'],
      ['Face-to-face seated', '#BCD3C6'], ['Seated close', '#D3D1E6'], ['Lying', '#E3CBB0'], ['Close contact', '#EBC0BC']]
  };
  // Suggestive poses (the sexy and duo series, upper's Sexy / Chest emphasis) stay in the grid but blurred until the
  // reader taps one or turns them all on (DECISIONS D-06): a first visit from the README or a shared link shows nothing
  // suggestive, yet the series are in plain sight instead of hidden behind a switch nobody found.
  const SHOW_SUGGESTIVE_DEFAULT = false;
  // After this many one-by-one reveals, offer to show them all.
  const NUDGE_AT = 2;
  const EYE_OFF = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9"/><path d="M6.6 6.6C3.9 8.4 2 12 2 12s4 7 10 7c1.8 0 3.4-.6 4.8-1.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  const TOOLS = ['ComfyUI', 'Stable Diffusion', 'Flux', 'Midjourney', 'Nano Banana', 'Qwen-Image', '即梦'];
  const NAME_LABEL = { cn: 'ZH', jp: 'JA', en: 'EN', kr: 'KO' };
  // Each language has its own copy of this page (zh at the root, the others under ja/ en/ ko/) so search engines and
  // link previews see it in that language; BASE leads back to the site root from here.
  const BASE = window.SHISEI.base || '';
  const PREFIX = { zh: '', ja: 'ja/', en: 'en/', ko: 'ko/' };
  const SERIES_TINT = { std: '#AFC3E0', upper: '#D3D1E6', sexy: '#EBC0BC', duo: '#BCD3C6' };
  const PACKS = window.SHISEI.packs;  // null when the build found no data/packs.json
  const mb = (b) => { const m = b / 1e6; return (m < 10 ? m.toFixed(1) : Math.round(m)) + ' MB'; };
  const DL_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>';

  // A view is in the catalog only if it passed QC; a pose with no passing view is not shown at all.
  const poses = CATALOG.filter((p) => VIEWS.some((v) => p.views[v])).map((p) => {
    const ci = Math.max(0, (CATS[p.series] || CATS.std).findIndex((c) => c[0] === p.class_en));
    const line = VIEWS.map((v) => p.views[v] || null);
    // Clay, depth and normal share the line art's file name, one folder each (tools/build_images.py).
    const maps = VIEWS.map((v) => (p.maps && p.maps[v]) || null);
    return {
      ...p, ci, line, clay: maps, depth: maps, normal: maps,
      tint: (CATS[p.series] || CATS.std)[ci][1],
      suggestive: p.rating === 'suggestive',
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
    adult: (store.get('adult') ?? (SHOW_SUGGESTIVE_DEFAULT ? '1' : '0')) === '1',
    angle: intParam('angle', 0, 4, -1),
    medium: params.get('src') === 'photo' && poses.some((p) => p.photo.some(Boolean)) ? 'photo' : 'line',
    view: params.get('view') === 'single' ? 'single' : 'pose',
    // Phone column count (CSS ignores it above 720px): a per-reader preference, so storage, not the URL.
    cols: store.get('cols') === '2' ? 2 : 3,
    per: {},
    // Poses revealed one by one: this visit only, the switch is the lasting choice.
    revealed: new Set(),
    nudged: false
  };

  const $ = (id) => document.getElementById(id);
  const t = () => I18N[S.lang];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nameOf = (p) => p['name_' + t().suffix];
  const src = (kind, tier, file) => BASE + 'images/' + kind + '/' + tier + '/' + file;
  const srcset = (kind, file) => src(kind, 'w300', file) + ' 300w, ' + src(kind, 'w600', file) + ' 600w, ' + src(kind, 'w900', file) + ' 900w';
  const files = (p, photo) => (photo ? p.photo : p.line);
  const catLabel = (p) => (p.series === 'std' ? t().cats[p.ci] : p['class_' + t().suffix]);
  const veiled = (p) => p.suggestive && !S.adult && !S.revealed.has(p.id);
  const inSeries = () => poses.filter((p) => S.series === 'all' || p.series === S.series);
  // A series this build does not ship (?series=duo on a std-only build) has no tab; fall back to all.
  if (S.series !== 'all' && !poses.some((p) => p.series === S.series)) S.series = 'all';
  const firstView = (arr) => Math.max(0, arr.findIndex(Boolean));
  // The closest angle that has an image, the next one first; -1 when the set has none.
  const nearView = (arr, v) => {
    for (let d = 1; d < VIEWS.length; d++) for (const i of [v + d, v - d]) if (arr[i]) return i;
    return -1;
  };
  // A gap is shown the same way whatever its cause (never generated or failed QC): readers only need to know
  // it is on the way and where to look meanwhile, so every gap box offers one way out.
  const ICON = {
    line: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M14 8l3 3"/></svg>',
    photo: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    // Clay, depth and normal share one icon: stacked layers, as they are layers over the line art.
    map: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 16l8 4 8-4"/></svg>',
  };
  const ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  // kind: 'line' | 'photo' | a map format (true / false still mean photo / line for the grid's two media).
  const gapIcon = (kind) => '<span class="gap-ic">' + ICON[kind === true ? 'photo' : !kind ? 'line' : MAP_KINDS.includes(kind) ? 'map' : kind] + '</span>';
  // Grid card: the way out is the nearest angle in the same medium (the medium switch is page-wide).
  function cardGapHtml(arr, v, photo) {
    const T = t();
    const n = nearView(arr, v);
    return gapIcon(photo) + '<b>' + esc(photo ? T.gapPhoto : T.gapLine) + '</b>' +
      '<span class="gap-sub">' + esc(photo ? T.gapOther : T.gapLineSub) + '</span>' +
      '<span class="gap-short">' + esc(photo ? T.gapPhotoShort : T.gapLineShort) + '</span>' +
      (n >= 0 ? '<button type="button" class="gap-go" data-go="' + n + '">' + esc(T.goView(T.views[n])) + ARROW + '</button>' : '');
  }

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
    if (S.angle >= 0) p.set('angle', S.angle);
    if (S.medium === 'photo') p.set('src', 'photo');
    if (S.view === 'single') p.set('view', 'single');
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
    $('langName').textContent = I18N[S.lang].langName;
    $('langShort').textContent = I18N[S.lang].langShort;
    // The hero counts the whole published library, so the number does not move when suggestive poses are hidden.
    const n = poses.length;
    const views = poses.reduce((s, p) => s + p.line.filter(Boolean).length, 0);
    // Two phrases that never break inside: CJK has no spaces, so a single string let balance split a word across lines.
    $('heroTitle').innerHTML = '<span class="tp">' + esc(T.heroTitle[0]) + '</span> <span class="tp mark">' + esc(T.heroTitle[1]) + '</span>';
    document.querySelector('.hero-sub').textContent = T.heroSub(n, views.toLocaleString('en-US'));
    document.querySelector('[data-i18n="browse"]').textContent = T.browse(n);
    $('heroSeries').innerHTML = SERIES.map((k) => [k, poses.filter((p) => p.series === k).length]).filter((x) => x[1])
      .map(([k, c]) => '<span><i style="background:' + SERIES_TINT[k] + '"></i>' + esc(T.series[k]) + '<b>' + c + '</b></span>').join('');
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
        // Every other tile shows one of the map formats of the same view, so the hero says what each set holds.
        const mk = k % 2 ? MAP_KINDS[(k >> 1) % 3] : null;
        if (mk && p[mk][vi]) {
          tiles.push('<span class="mq-tile map" data-mq="' + p.id + ',' + vi + ',' + mk + '"><img src="' + src(mk, 'w300', p[mk][vi]) + '" alt="" width="146" height="146" decoding="async" fetchpriority="low"><b>' + esc(t()[mk]) + '</b></span>');
          continue;
        }
        const v = p.line[vi] ? vi : firstView(p.line);
        tiles.push('<span class="mq-tile" data-mq="' + p.id + ',' + v + ',line" style="background:' + p.tint + '"><img src="' + src('line', 'w300', p.line[v]) + '" alt="" width="146" height="146" decoding="async" fetchpriority="low"></span>');
      }
      return tiles.join('') + tiles.join('');
    };
    $('mq1').innerHTML = row(0);
    $('mq2').innerHTML = row(3);
    // A tile opens its pose in the lightbox, at that angle and in that format. The rows stay aria-hidden and out of
    // the tab order (each tile is there twice); the grid below is the keyboard and screen-reader way in.
    $('tools').innerHTML = TOOLS.map((x) => '<span>' + esc(x) + '</span>').join('');
  }

  document.querySelector('.marquee').addEventListener('click', (e) => {
    const tile = e.target.closest('[data-mq]');
    if (!tile) return;
    const [id, v, m] = tile.dataset.mq.split(',');
    // The overview, with the tile's own format outlined: same landing as a grid card, and the click still shows its result.
    LB.hl = m;
    openLb(id, +v, 'compare');
  });

  /* filters */
  function renderCats() {
    const T = t();
    const chip = (label, n, sel, dot, act) => '<button type="button" class="chip" role="tab" aria-selected="' + sel + '" data-act="' + act + '"><span class="dot" style="background:' + dot + '"></span>' + esc(label) + '<span class="n">' + n + '</span></button>';
    const ok = poses;
    const tabs = [['all', ok.length]].concat(SERIES.map((k) => [k, ok.filter((p) => p.series === k).length])).filter((x) => x[1] > 0);
    $('series').setAttribute('aria-label', T.seriesLabel);
    $('series').innerHTML = tabs.map(([k, n]) => '<button type="button" data-act="series:' + k + '" aria-pressed="' + (S.series === k) + '">' + esc(T.series[k]) + ' <span class="n">' + n + '</span></button>').join('');
    const adult = $('adult');
    // The public build ships no suggestive poses, so the toggle would switch nothing.
    adult.hidden = !poses.some((p) => p.suggestive);
    adult.setAttribute('aria-checked', String(S.adult));
    adult.title = T.adultHint;
    adult.innerHTML = esc(S.adult ? T.adultOn : T.adultOff) + '<span class="track" aria-hidden="true"><i></i></span>';
    const base = inSeries();
    const cats = S.series === 'all' ? [] : CATS[S.series].map((c, i) => {
      const sample = base.find((p) => p.ci === i);
      return sample ? chip(catLabel(sample), base.filter((p) => p.ci === i).length, S.cat === i, c[1], 'cat:' + i) : '';
    });
    // Categories only mean something inside one series; on "all" the row would hold a lone 全部 chip.
    $('cats').hidden = !cats.length;
    $('cats').innerHTML = cats.length ? chip(T.all, base.length, S.cat < 0, 'var(--accent)', 'cat:-1') + cats.join('') : '';
  }

  function segHtml(cls, label, opts) {
    return '<div class="seg ' + cls + '" role="group" aria-label="' + esc(label) + '">' +
      opts.map(([text, act, on]) => '<button type="button" data-act="' + act + '" aria-pressed="' + on + '">' + esc(text) + '</button>').join('') + '</div>';
  }
  function filterGroups() {
    const T = t();
    // The public build ships no photos; a switch to an empty mode is noise.
    const anyPhoto = poses.some((p) => p.photo.some(Boolean));
    return [
      [T.angle, segHtml('angle', T.angle, [[T.angleAll, 'angle:-1', S.angle < 0]].concat(T.views.map((v, i) => [v, 'angle:' + i, S.angle === i])))],
      anyPhoto && [T.medium, segHtml('medium', T.medium, [[T.line, 'medium:line', S.medium === 'line'], [T.photo + ' · ' + inSeries().filter((p) => p.photo.some(Boolean)).length, 'medium:photo', S.medium === 'photo']])],
      [T.view, segHtml('view', T.view, [[T.byPose, 'view:pose', S.view === 'pose'], [T.single, 'view:single', S.view === 'single']])]
    ].filter(Boolean);
  }
  function renderFilters() {
    const groups = filterGroups();
    $('inlineFilters').innerHTML = groups.map((g) => g[1]).join('');
    const cols = $('cols');
    cols.setAttribute('aria-label', t().cols3);
    cols.setAttribute('aria-pressed', String(S.cols === 3));
    cols.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      [3, 9.75, 16.5].map((x) => '<rect x="' + x + '" y="4" width="4.5" height="7" rx="1"/><rect x="' + x + '" y="13" width="4.5" height="7" rx="1"/>').join('') + '</svg>';
  }

  /* grid */
  function pool() {
    return inSeries().filter((p) => {
      if (S.series !== 'all' && S.cat >= 0 && p.ci !== S.cat) return false;
      return !(S.medium === 'photo' && !p.photo.some(Boolean));
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
    // The gap box sits beside the tile link, not in it: its button cannot nest inside an <a>.
    const veil = veiled(p);
    return '<article class="card' + (veil ? ' veiled' : '') + '" data-id="' + p.id + '" style="--tint:' + p.tint + '">' +
      '<div class="tile-box"><a class="tile" href="#' + p.id + '-' + VIEWS[cur] + '" data-tile aria-label="' + esc(T.open(p.id) + ' ' + nameOf(p)) + '">' +
        '<img' + (f ? ' src="' + src(kind, 'w300', f) + '" srcset="' + srcset(kind, f) + '"' : '') + ' sizes="(max-width: 720px) 50vw, 320px" alt="' + esc(p.id + ' ' + nameOf(p) + ' · ' + T.views[cur]) + '" loading="lazy" decoding="async"' + (f ? '' : ' hidden') + '>' +
        (!photo && p.photo.some(Boolean) ? '<span class="badge ph">' + esc(T.hasPhoto) + '</span>' : '') +
        '<span class="vlabel">' + esc(T.views[cur]) + ' ' + (cur + 1) + '/5</span>' +
      '</a><div class="missing"' + (f ? ' hidden>' : '>' + cardGapHtml(arr, cur, photo)) + '</div>' + (veil ? veilBtn(p) : '') + '</div>' +
      '<div class="card-foot"><div class="card-t"><h3>' + esc(nameOf(p)) + '</h3><span>' + p.id + ' · ' + esc(catLabel(p)) + '</span></div>' +
      '<div class="dots" role="group" aria-label="' + esc(T.angle) + '">' + dots + '</div></div></article>';
  }

  // The veil is a button over the tile, not part of the link: the first tap reveals, the next one opens.
  const veilBtn = (p) => '<button type="button" class="veil" data-reveal="' + p.id + '" aria-label="' + esc(t().veilShow(p.id) + ' ' + nameOf(p)) + '">' +
    '<span class="veil-ic">' + EYE_OFF + '</span><span class="veil-t">' + esc(t().veilTap) + '</span></button>';

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
    miss.innerHTML = f ? '' : cardGapHtml(arr, cur, photo);
    card.querySelector('.vlabel').textContent = T.views[cur] + ' ' + (cur + 1) + '/5';
    card.querySelector('[data-tile]').setAttribute('href', '#' + p.id + '-' + VIEWS[cur]);
    card.querySelectorAll('[data-dot]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.dot === cur)));
  }

  function renderGrid() {
    const T = t();
    const list = pool();
    const grid = $('grid');
    const photo = S.medium === 'photo';
    grid.className = 'grid' + (S.view === 'single' ? ' single' : '') + (S.cols === 3 ? ' c3' : '') + (photo ? ' photo-mode' : '');
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
        tiles.push('<a class="stile' + (veiled(p) ? ' veiled' : '') + '" href="#' + p.id + '-' + VIEWS[i] + '" data-open="' + p.id + '" data-v="' + i + '" style="--tint:' + p.tint + '" aria-label="' + esc(p.id + ' ' + nameOf(p) + ' · ' + T.views[i]) + '">' +
          '<span class="tile">' + '<img src="' + src(kind, 'w300', f) + '" srcset="' + srcset(kind, f) + '" sizes="(max-width: 720px) 50vw, 200px" alt="" loading="lazy" decoding="async">' +
          (veiled(p) ? '<span class="veil"><span class="veil-ic">' + EYE_OFF + '</span></span>' : '') + '</span>' +
          '<span class="stile-t"><span class="mono">' + p.id + '</span><span>' + esc(T.views[i]) + '</span></span></a>');
      }));
      count = tiles.length;
      grid.innerHTML = tiles.join('');
    }
    $('count').textContent = S.view === 'pose' ? T.countPoses(list.length, inSeries().length) : T.countImages(count);
  }

  function renderAll() {
    applyText();
    renderLangs();
    renderDl();
    renderCats();
    renderFilters();
    renderGrid();
    if ($('lb').open) renderLb();
  }

  /* actions */
  function act(a) {
    const [k, v] = a.split(':');
    if (k === 'cat') { S.cat = +v; }
    else if (k === 'series') { S.series = v; S.cat = -1; }
    else if (k === 'angle') { S.angle = +v; S.per = {}; }
    else if (k === 'medium') { S.medium = v; S.per = {}; }
    else if (k === 'view') { S.view = v; }
    renderCats();
    renderFilters();
    renderGrid();
    syncUrl();
  }
  function setAdult(on) {
    S.adult = on;
    store.set('adult', on ? '1' : '0');
    S.revealed.clear();
    S.nudged = false;
    $('nudge').hidden = true;
    renderAll();
  }
  $('adult').addEventListener('click', () => setAdult(!S.adult));
  // Unveil one pose in place (every card and tile of it) so the grid does not re-render under the reader's finger.
  function reveal(id) {
    S.revealed.add(id);
    document.querySelectorAll('#grid [data-id="' + id + '"], #grid [data-open="' + id + '"]').forEach((el) => {
      el.classList.remove('veiled');
      const v = el.querySelector('.veil');
      if (v) v.remove();
    });
    if ($('lb').open) renderLb();
    if (!S.nudged && S.revealed.size >= NUDGE_AT) {
      S.nudged = true;
      $('nudgeText').textContent = t().nudge(S.revealed.size);
      $('nudge').hidden = false;
    }
  }
  $('nudgeAll').addEventListener('click', () => setAdult(true));
  $('nudgeClose').addEventListener('click', () => { $('nudge').hidden = true; });
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
    const rv = e.target.closest('[data-reveal]');
    if (rv) { const card = rv.closest('.card'); reveal(rv.dataset.reveal); card.querySelector('[data-tile]').focus(); return; }
    if (e.target.closest('[data-dot]')) { pickDot(e); return; }
    const go = e.target.closest('[data-go]');
    if (go) {
      const card = go.closest('.card');
      S.angle = -1;
      S.per[card.dataset.id] = +go.dataset.go;
      updateCard(card, byId.get(card.dataset.id));
      card.querySelector('[data-tile]').focus();
      return;
    }
    const tile = e.target.closest('[data-tile]');
    if (tile) {
      e.preventDefault();
      const p = byId.get(tile.closest('.card').dataset.id);
      openLb(p.id, curView(p), S.medium === 'photo' ? 'photo' : 'compare');
      return;
    }
    const s = e.target.closest('.stile');
    if (s) {
      e.preventDefault();
      if (s.classList.contains('veiled')) reveal(s.dataset.open);
      else openLb(s.dataset.open, +s.dataset.v, S.medium === 'photo' ? 'photo' : 'compare');
    }
  });
  // An explicit list of the four languages: a single button that cycles them hid where the next click would land.
  // ?lang is dropped from the targets, because on arrival it outranks the reader's pick (tools/site_pages.py).
  function renderLangs() {
    const qs = new URLSearchParams(location.search);
    qs.delete('lang');
    const tail = (qs.toString() ? '?' + qs : '') + location.hash;
    $('langList').innerHTML = LANGS.map((l) => '<a href="' + esc(BASE + PREFIX[l] + tail) + '" lang="' + I18N[l].htmlLang + '" hreflang="' + I18N[l].htmlLang +
      '" data-lang-link="' + l + '"' + (l === S.lang ? ' aria-current="true"' : '') + '>' + esc(I18N[l].langName) + '</a>').join('');
  }
  const langBtn = $('lang');
  const setLangOpen = (open) => {
    if (open) renderLangs();  // pick up the filters and hash the reader has set since
    langBtn.setAttribute('aria-expanded', String(open));
    $('langList').hidden = !open;
  };
  langBtn.addEventListener('click', () => setLangOpen(langBtn.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('click', (e) => { if (!e.target.closest('.lang-menu')) setLangOpen(false); });
  document.querySelector('.lang-menu').addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('langList').hidden) { setLangOpen(false); langBtn.focus(); }
  });

  /* downloads: sizes come from data/packs.json, written by tools/pack_release.py with the Release assets */
  function renderDl() {
    const T = t();
    $('dlLic').textContent = 'v' + (PACKS ? PACKS.version : window.SHISEI.version) + ' · ' + T.dlLicense;
    if (!PACKS) {
      $('dlBody').innerHTML = '<a class="dl-row main" href="' + esc(window.SHISEI.repo + '/releases/latest') + '"><span><b>' + esc(T.dlAll) + '</b></span>' + DL_ICON + '</a>';
      return;
    }
    const P = PACKS.packs;
    const url = (k) => esc(window.SHISEI.repo + '/releases/download/v' + PACKS.version + '/' + P[k].file);
    // Every row says what is inside it (docs/DESIGN.md): the line-art zip is the recommended one, the complete zip
    // holds every format, each map format has its own zip, and the originals are line art and photos only.
    const chip = (k, n) => '<span class="fmt-chip ' + k + '">' + esc(T[k]) + (n ? ' ' + n.toLocaleString('en-US') : '') + '</span>';
    const nLine = poses.reduce((a, p) => a + p.line.filter(Boolean).length, 0);
    const nPhoto = poses.reduce((a, p) => a + p.photo.filter(Boolean).length, 0);
    const nMap = poses.reduce((a, p) => a + p.clay.filter(Boolean).length, 0);
    const size = (k, cls) => '<span class="dl-s"><span class="' + (cls || 'mono') + '">' + mb(P[k].bytes) + '</span>' + DL_ICON + '</span>';
    const row = (k, cls, title, sub, dot) => '<a class="dl-row ' + cls + '" href="' + url(k) + '" download>' +
      '<span class="dl-t">' + (dot ? '<i style="background:' + dot + '"></i>' : '') + '<span><b>' + title + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></span>' +
      size(k) + '</a>';
    const card = (k, title, chips, sub, cls) => '<a class="dl-row ' + cls + '" href="' + url(k) + '" download>' +
      '<span class="dl-t"><span><b>' + title + '</b><span class="fmt-chips">' + chips + '</span>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></span>' +
      size(k, cls === 'main' ? 'size-tag' : '') + '</a>';
    const series = SERIES.filter((k) => P[k]);
    const maps = MAP_KINDS.filter((k) => P[k]);
    $('dlBody').innerHTML =
      card('all', esc(T.dlLine) + ' <em>' + esc(T.dlRec) + '</em>', chip('line', nLine) + (nPhoto ? chip('photo', nPhoto) : ''), T.dlLineSub(P.all.sets), 'main') +
      (P.complete ? card('complete', esc(T.dlComplete), ['line', 'photo'].concat(MAP_KINDS).map((k) => chip(k)).join(''), '', 'every') : '') +
      (maps.length ? '<h3>' + esc(T.dlMaps(nMap)) + '</h3><div class="dl-maps">' + maps.map((k) =>
        '<a class="dl-map" href="' + url(k) + '" download><span class="dl-map-h"><i class="sw ' + k + '"></i><b>' + esc(T[k]) + '</b></span>' +
        '<span class="mono">' + mb(P[k].bytes) + '</span><small>' + esc(T.dlMapSub[k]) + '</small></a>').join('') + '</div>' : '') +
      '<h3>' + esc(T.dlBySeries) + '</h3><div class="dl-series">' +
      series.map((k) => row(k, '', esc(T.series[k]), T.dlSets(P[k].sets), SERIES_TINT[k])).join('') + '</div>' +
      (nPhoto ? '<p class="dl-foot">' + esc(T.dlPhotoNote) + '</p>' : '') +
      row('original', 'orig', esc(T.dlOriginalAll), T.dlOriginalSub);
  }

  $('theme').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    store.set('theme', root.dataset.theme);
  });

  /* dialogs */
  const dialogs = { how: $('dlgHow'), terms: $('dlgTerms'), dl: $('dlgDl') };
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open="how"], [data-open="terms"], [data-open="dl"]');
    if (o) dialogs[o.dataset.open].showModal();
    const c = e.target.closest('[data-close]');
    if (c) c.closest('dialog').close();
  });
  document.querySelectorAll('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));
  $('cols').addEventListener('click', () => {
    S.cols = S.cols === 3 ? 2 : 3;
    store.set('cols', String(S.cols));
    renderFilters(); renderGrid();
  });

  /* lightbox */
  // medium: 'line' | 'clay' | 'depth' | 'normal' | 'photo' | 'compare'. 'compare' is the overview the lightbox opens
  // on (2026-11-01, design B1): every format of the angle at once, the four aligned ones in a 2×2 grid and the photo in
  // its own column; a tile opens that format alone, and "← all formats" comes back. A set with nothing beyond line
  // art has no overview and opens on the line art. The grid of poses stays line art: it is for picking a pose.
  // more: the phone lightbox keeps names, description and secondary actions folded away so one set fits one screen.
  // hl: the format a marquee tile was, outlined in the overview it opens. pushed: a tile opened from the overview
  // added a history entry, so the browser's back (a phone's back gesture) returns to the overview first.
  const LB = { id: null, v: 0, medium: 'line', more: false, hl: null, pushed: false };
  const MEDIA = ['line', 'clay', 'depth', 'normal', 'photo', 'compare'];
  const isMap = (m) => MAP_KINDS.includes(m);
  const hasMedium = (p, m) => m === 'line' || (m === 'compare' ? p.photo.some(Boolean) || p.clay.some(Boolean) : p[m].some(Boolean));
  // In the overview an angle counts when any format has it; missing tiles show the usual gap icon.
  const lbFiles = (p, m) => (m === 'compare' ? p.line.map((f, i) => f || p.clay[i] || p.photo[i]) : isMap(m) ? p[m] : files(p, m === 'photo'));
  function lbList() {
    const list = pool();
    return list.some((p) => p.id === LB.id) ? list : poses;
  }
  // keep: a format switch inside the lightbox stays on this angle even when the new format lacks it; the gap box
  // then offers the way out (the line art of this angle, or the nearest angle that has the format).
  function openLb(id, v, medium, keep) {
    const p = byId.get(id);
    if (!p) return;
    LB.id = id;
    LB.medium = MEDIA.includes(medium) && hasMedium(p, medium) ? medium : hasMedium(p, 'compare') ? 'compare' : 'line';
    const arr = lbFiles(p, LB.medium);
    LB.v = arr[v] || (keep && arr.some(Boolean)) ? v : firstView(arr);
    renderLb();
    if (!$('lb').open) $('lb').showModal();
  }
  /* Phones save to the photo album: <a download> lands in Files on iOS and in Downloads on Android, while the
     system share sheet with the file attached offers "Save Image", which goes to Photos. share() has to run inside
     the tap and an awaited fetch first loses the gesture on iOS, so the view on screen is fetched ahead of the tap.
     Browsers without file sharing (WeChat, older ones) get a long-press hint instead of a dead download. */
  const ALBUM = matchMedia('(pointer: coarse)').matches;
  const SHARE_FILES = ALBUM && !!navigator.canShare && (() => {
    try { return navigator.canShare({ files: [new File([''], 'a.webp', { type: 'image/webp' })] }); } catch (e) { return false; }
  })();
  const FILES = new Map();
  function prefetch(a) {
    if (!SHARE_FILES || !a.href || FILES.has(a.href)) return;
    const url = a.href, entry = { file: null };
    FILES.set(url, entry);
    // About 60 KB each; keep the recent ones so stepping back and forth needs no refetch.
    if (FILES.size > 24) FILES.delete(FILES.keys().next().value);
    fetch(url).then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
      .then((b) => { entry.file = new File([b], a.getAttribute('download'), { type: 'image/webp' }); })
      .catch(() => FILES.delete(url));
  }
  function lbTip(msg) {
    const el = $('lbTip');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(lbTip.timer);
    lbTip.timer = setTimeout(() => { el.hidden = true; }, 4000);
  }
  function saveToAlbum(e) {
    const a = e.currentTarget;
    if (!ALBUM || !a.href) return;
    e.preventDefault();
    const entry = SHARE_FILES && FILES.get(a.href);
    if (entry && entry.file) {
      // Resolving only means the sheet closed, not that the image was saved, so success says nothing.
      navigator.share({ files: [entry.file] }).catch((err) => { if (err.name !== 'AbortError') lbTip(t().holdToSave); });
    } else if (SHARE_FILES) { prefetch(a); lbTip(t().preparing); }
    else lbTip(t().holdToSave);
  }
  function setDl(a, label, f, kind, p) {
    a.querySelector('span').textContent = label;
    if (f) { a.href = src(kind, 'w900', f); a.setAttribute('download', 'shisei_' + p.id + '_' + VIEWS[LB.v] + (kind === 'line' ? '' : '_' + kind) + '.webp'); a.removeAttribute('aria-disabled'); }
    else { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); }
  }
  function pairCell(p, kind, f, T) {
    const label = kind === 'photo' ? T.photo : T.line;
    // The other half of the pair is right beside it, so this gap needs no way out.
    if (!f) return '<div class="lb-cell ' + kind + ' gap">' + gapIcon(kind === 'photo') + '<b>' + esc(kind === 'photo' ? T.gapPhoto : T.gapLine) + '</b></div>';
    return '<figure class="lb-cell ' + kind + '"><img src="' + src(kind, 'w900', f) + '" alt="' + esc(p.id + ' ' + nameOf(p) + ' · ' + T.views[LB.v] + ' · ' + label) + '">' +
      '<figcaption>' + esc(label) + '</figcaption></figure>';
  }
  // Lightbox gap: the same angle in the other medium is the best way out when it exists, else the nearest angle.
  // A map that did not pass QC points back to the line art it was drawn from, then to the nearest angle with that map.
  function lbGapHtml(p, arr, m, T) {
    const v = LB.v;
    if (isMap(m)) {
      const n = nearView(arr, v);
      const go = (attr, label, dark) => '<button type="button" class="gap-go' + (dark ? ' dark' : '') + '" ' + attr + '>' + esc(label) + (dark ? ARROW : '') + '</button>';
      const acts = (p.line[v] ? [go('data-lbgm="line"', T.goLine, true)] : []).concat(n >= 0 ? [go('data-lbgo="' + n + '"', T.goView(T.views[n]), !p.line[v])] : []);
      return gapIcon(m) + '<b>' + esc(T.views[v] + ' · ' + T.gapMap(T[m])) + '</b>' +
        '<span class="gap-sub">' + esc(p.line[v] ? T.gapPhotoSub : T.gapOther) + '</span>' +
        (acts.length ? '<span class="gap-acts">' + acts.join('') + '</span>' : '');
    }
    const photo = m === 'photo';
    const other = photo ? p.line[v] : p.photo[v];
    const n = nearView(arr, v);
    const btn = (attr, label, dark) => '<button type="button" class="gap-go' + (dark ? ' dark' : '') + '" ' + attr + '>' + esc(label) + (dark ? ARROW : '') + '</button>';
    const acts = [];
    if (photo && other) acts.push(btn('data-lbgm="line"', T.goLine, true));
    if (n >= 0) acts.push(btn('data-lbgo="' + n + '"', T.goView(T.views[n]), !acts.length));
    if (!photo && other) acts.push(btn('data-lbgm="photo"', T.goPhoto, false));
    return gapIcon(photo) + '<b>' + esc(T.views[v] + ' · ' + (photo ? T.gapPhoto : T.gapLine)) + '</b>' +
      '<span class="gap-sub">' + esc(photo ? (other ? T.gapPhotoSub : T.gapOther) : T.gapLineSub) + '</span>' +
      (acts.length ? '<span class="gap-acts">' + acts.join('') + '</span>' : '');
  }
  // The overview: the aligned formats the set has in a 2×2 grid, then the photo column (on phones a row under the
  // grid). A format missing at this angle keeps its place as a gap tile, so the grid never reshuffles between angles.
  function overviewHtml(p, T) {
    const v = LB.v;
    const tile = (k, f) => f
      ? '<button type="button" class="lb-tile ' + k + (LB.hl === k ? ' hl' : '') + '" data-lbopen="' + k + '">' + '<img src="' + src(k, 'w600', f) + '" alt="' + esc(p.id + ' ' + nameOf(p) + ' · ' + T.views[v] + ' · ' + T[k]) + '"><span>' + esc(T[k]) + '</span></button>'
      : '<div class="lb-tile ' + k + ' gap"><span class="lb-tile-gap">' + gapIcon(k === 'photo' ? true : k === 'line' ? false : k) + '<b>' + esc(k === 'photo' ? T.gapPhoto : k === 'line' ? T.gapLine : T.gapMap(T[k])) + '</b></span><span>' + esc(T[k]) + '</span></div>';
    const kinds = ['line'].concat(p.clay.some(Boolean) ? MAP_KINDS : []);
    const hasPhoto = p.photo.some(Boolean);
    $('lb').classList.toggle('ov-one', kinds.length === 1);
    $('lb').classList.toggle('ov-photo', hasPhoto);
    return '<div class="lb-ov"><div class="lb-ov-grid">' + kinds.map((k) => tile(k, p[k][v])).join('') + '</div>' +
      (hasPhoto ? tile('photo', p.photo[v]) : '') + '</div>';
  }
  // The formats this set has, in the order of the format row and the vertical swipe: the overview first.
  const fmtList = (p) => (hasMedium(p, 'compare') ? ['compare', 'line'] : ['line'])
    .concat(p.clay.some(Boolean) ? MAP_KINDS : [], p.photo.some(Boolean) ? ['photo'] : []);
  // The format row under an enlarged image (design X1): one tap to any other format, and its first item, the
  // overview, is the way back. A format this angle lacks stays in place, disabled.
  function fmtsHtml(p, T) {
    const v = LB.v;
    return fmtList(p).map((k) => {
      const f = k === 'compare' ? true : p[k][v];
      const ic = k === 'compare' ? '<span class="fmt-all" aria-hidden="true"><i></i><i></i><i></i><i></i></span>'
        : f ? '<img src="' + src(k, 'w300', f) + '" alt="">' : '<span class="fmt-gap">' + ICON[isMap(k) ? 'map' : k] + '</span>';
      return '<button type="button" class="' + k + '" data-lbfmt="' + k + '" aria-pressed="' + (LB.medium === k) + '"' + (f ? '' : ' disabled') + '>' +
        ic + '<span>' + esc(k === 'compare' ? T.allShort : T[k]) + '</span></button>';
    }).join('');
  }
  function renderLb() {
    const T = t();
    const p = byId.get(LB.id);
    const m = LB.medium;
    const photo = m === 'photo', compare = m === 'compare';
    const arr = lbFiles(p, m);
    const f = arr[LB.v];
    const kind = compare ? 'line' : m;
    $('lb').style.setProperty('--tint', m === 'line' ? p.tint : 'var(--tile)');
    $('lb').classList.toggle('photo', photo);
    $('lb').classList.toggle('map', isMap(m));
    $('lb').classList.toggle('has-maps', p.clay.some(Boolean));
    $('lb').dataset.medium = m;
    $('lb').classList.toggle('compare', compare);
    // A veiled pose opens blurred, all five angles with it; downloads wait until it is shown.
    const veil = veiled(p);
    $('lb').classList.toggle('veiled', veil);
    $('lbVeil').hidden = !veil;
    $('lbVeilTitle').textContent = T.veilTitle;
    $('lbVeilOne').textContent = T.veilOne;
    $('lbVeilAll').textContent = T.veilAll;
    const img = $('lbImg');
    if (f && !compare) { img.src = src(kind, 'w900', f); img.alt = p.id + ' ' + nameOf(p) + ' · ' + T.views[LB.v]; }
    img.hidden = !f || compare;
    // Maps are drawn over the line art, so the line art can be wiped in over them to check the fit.
    const wipe = isMap(m) && f && p.line[LB.v];
    $('lbWipe').hidden = $('lbWipeBar').hidden = !wipe;
    if (wipe) {
      $('lbWipeImg').src = src('line', 'w900', p.line[LB.v]);
      $('lbWipeRange').setAttribute('aria-label', T.overlay);
      $('lbWipeLabel').textContent = T.overlay;
      setWipe();
    }
    const pair = $('lbPair');
    pair.hidden = !compare;
    pair.innerHTML = compare ? overviewHtml(p, T) : '';
    // The format row replaces the back buttons; they stay in the markup, hidden.
    const fmts = hasMedium(p, 'compare') && !compare;
    $('lbBack').hidden = $('lbBack2').hidden = true;
    $('lb').classList.toggle('has-fmts', fmts);
    $('lbFmts').hidden = !fmts;
    $('lbFmts').setAttribute('aria-label', T.medium);
    $('lbFmts').innerHTML = fmts ? fmtsHtml(p, T) : '';
    const miss = $('lbMissing');
    miss.hidden = !!f || compare;
    miss.innerHTML = f || compare ? '' : lbGapHtml(p, arr, m, T);
    $('lbCounter').textContent = T.views[LB.v] + ' ' + (LB.v + 1) + '/5';
    // With one view or none there is nowhere to step; a live-looking arrow that does nothing reads as broken.
    $('lbPrev').disabled = $('lbNext').disabled = arr.filter(Boolean).length < 2;
    const list = lbList();
    // Phones keep only the ID and category in this line (.lb-mx hides the rest) to give the image the height.
    $('lbMeta').innerHTML = esc(p.id) + '<span class="lb-mx"> · ' + esc(T.series[p.series]) + '</span> · ' + esc(catLabel(p)) +
      '<span class="lb-mx"> · ' + (list.indexOf(p) + 1) + '/' + list.length + '</span>';
    $('lb').classList.toggle('more', LB.more);
    $('lbMore').setAttribute('aria-expanded', String(LB.more));
    $('lbTitle').textContent = nameOf(p);
    $('lbNames').innerHTML = ['cn', 'jp', 'en', 'kr'].filter((s) => s !== T.suffix)
      .map((s) => '<dt>' + NAME_LABEL[s] + '</dt><dd>' + esc(p['name_' + s]) + '</dd>').join('');
    $('lbChips').setAttribute('aria-label', T.angle);
    // Overview thumbnails show the line art when there is one.
    $('lbChips').innerHTML = VIEWS.map((_, i) => {
      const tk = compare ? (p.line[i] ? 'line' : p.clay[i] ? 'clay' : 'photo') : kind;
      const both = false;
      return '<button type="button" data-lbv="' + i + '" aria-pressed="' + (i === LB.v) + '"' + (arr[i] ? '' : ' disabled') + '>' +
        '<span class="' + tk + (both ? ' both' : '') + '">' + (arr[i] ? '<img src="' + src(tk, 'w300', arr[i]) + '" alt="">' : ICON[isMap(kind) ? 'map' : kind]) + '</span>' + esc(T.views[i]) + '</button>';
    }).join('');
    const hasPhoto = p.photo.some(Boolean), hasMaps = p.clay.some(Boolean);
    $('lb').classList.toggle('no-photo', !hasPhoto && !hasMaps);
    $('lbMedium').setAttribute('aria-label', T.medium);
    // A set without maps shows no map buttons at all; photo and compare stay, disabled, as before.
    $('lbMedium').innerHTML = MEDIA.filter((k) => !isMap(k) || hasMaps).map((k) => '<button type="button" data-lbm="' + k + '" aria-pressed="' + (m === k) + '"' +
      (hasMedium(p, k) ? '' : ' disabled') + (k === 'photo' && hasMaps ? ' class="gap-l"' : '') + '>' + esc(T[k]) + '</button>').join('');
    $('lbMedium').hidden = true;
    $('lbNote').hidden = !isMap(m) && !compare;
    $('lbNote').textContent = compare ? T.overviewNote : isMap(m) ? T.fmtNote[m] : '';
    $('lbDesc').textContent = p.desc_en || '';
    $('lbDescBox').hidden = !p.desc_en;
    const dl2 = $('lbDl2');
    dl2.hidden = true;
    // The overview downloads the line art of the angle; every other format downloads from its own enlarged view.
    if (compare) setDl($('lbDl'), ALBUM ? T.saveAlbum : T.download + ' · ' + T.line + ' 900×1200', p.line[LB.v], 'line', p);
    else setDl($('lbDl'), ALBUM ? T.saveAlbum : T.download + ' · ' + (isMap(m) ? T[m] + ' ' : '') + (photo ? '900×1800' : '900×1200'), f, kind, p);
    if (veil) [$('lbDl'), dl2].forEach((a) => { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); });
    else [$('lbDl'), dl2].forEach((a) => { if (!a.hidden) prefetch(a); });
    clearTimeout(lbTip.timer);
    $('lbTip').hidden = true;
    // Static pose pages exist only for general std poses (tools/site_pages.py).
    const hasPage = hasPosePage(p);
    $('lbPage').hidden = !hasPage;
    if (hasPage) $('lbPage').href = posePage(p.id);
    // No suffix is the overview (the default); the line art alone is -line.
    history.replaceState(null, '', location.pathname + location.search + '#' + p.id + '-' + VIEWS[LB.v] + (m === 'compare' ? '' : '-' + m));
  }
  const posePage = (id) => BASE + PREFIX[S.lang] + 'pose/' + id + '/';
  // Same rule as tools/build_site.py: only general-rated std poses get a static page.
  const hasPosePage = (p) => p.series === 'std' && !p.suggestive;
  function stepAngle(d) {
    LB.hl = null;
    const arr = lbFiles(byId.get(LB.id), LB.medium);
    for (let k = 1; k <= 5; k++) {
      const i = (LB.v + d * k + 25) % 5;
      if (arr[i]) { LB.v = i; break; }
    }
    renderLb();
  }
  function stepPose(d) {
    LB.hl = null;
    const list = lbList();
    const i = list.findIndex((p) => p.id === LB.id);
    const next = list[(i + d + list.length) % list.length];
    openLb(next.id, LB.v, LB.medium);
  }
  $('lbPrev').addEventListener('click', () => stepAngle(-1));
  $('lbNext').addEventListener('click', () => stepAngle(1));
  $('lbClose').addEventListener('click', () => $('lb').close());
  $('lbPrevPose').addEventListener('click', () => stepPose(-1));
  $('lbNextPose').addEventListener('click', () => stepPose(1));
  $('lbMore').addEventListener('click', () => { LB.more = !LB.more; renderLb(); });
  $('lbChips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lbv]');
    if (b && !b.disabled) { LB.v = +b.dataset.lbv; renderLb(); }
  });
  $('lbMissing').addEventListener('click', (e) => {
    const go = e.target.closest('[data-lbgo]');
    const gm = e.target.closest('[data-lbgm]');
    if (go) { LB.v = +go.dataset.lbgo; renderLb(); }
    else if (gm) openLb(LB.id, LB.v, gm.dataset.lbgm);
  });
  $('lbPair').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lbopen]');
    if (!b) return;
    LB.hl = null;
    history.pushState(null, '', location.href);
    LB.pushed = true;
    openLb(LB.id, LB.v, b.dataset.lbopen, true);
  });
  // Back to the overview: through history when a tile pushed an entry, so back button, Esc and the browser's back
  // all land on the same entry.
  function toOverview() {
    if (LB.pushed) history.back();
    else openLb(LB.id, LB.v, 'compare', true);
  }
  $('lbBack').addEventListener('click', toOverview);
  $('lbFmts').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lbfmt]');
    if (b && !b.disabled) pickFormat(b.dataset.lbfmt);
  });
  // Switching from one enlarged format to another replaces the entry; the overview goes back through history.
  function pickFormat(k) {
    if (k === LB.medium) return;
    if (k === 'compare') return toOverview();
    // Leaving the overview pushes one entry, as a tile tap does, so back returns to it.
    if (LB.medium === 'compare') { history.pushState(null, '', location.href); LB.pushed = true; }
    openLb(LB.id, LB.v, k, true);
  }
  function flash(label) {
    const el = $('lbFlash');
    el.textContent = label;
    el.classList.remove('on');
    void el.offsetWidth;  // restart the fade
    el.classList.add('on');
  }
  $('lbBack2').addEventListener('click', toOverview);
  window.addEventListener('popstate', () => {
    if (!LB.pushed) return;
    LB.pushed = false;
    // Closed while enlarged: the step back only unwinds the entry; drop its hash so nothing reopens.
    if (!$('lb').open) history.replaceState(null, '', location.pathname + location.search);
    else openLb(LB.id, LB.v, 'compare', true);
  });
  // Esc on an enlarged format goes back to the overview first; a second Esc closes.
  $('lb').addEventListener('cancel', (e) => {
    if (LB.medium !== 'compare' && hasMedium(byId.get(LB.id), 'compare')) { e.preventDefault(); toOverview(); }
  });
  $('lbMedium').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lbm]');
    if (b && !b.disabled) openLb(LB.id, LB.v, b.dataset.lbm, true);
  });
  $('lbVeilOne').addEventListener('click', () => reveal(LB.id));
  $('lbVeilAll').addEventListener('click', () => setAdult(true));
  $('lbCopyDesc').addEventListener('click', () => copy(byId.get(LB.id).desc_en));
  $('lbCopyId').addEventListener('click', () => copy(LB.id));
  $('lbDl').addEventListener('click', saveToAlbum);
  $('lbDl2').addEventListener('click', saveToAlbum);
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
  $('lb').addEventListener('close', () => {
    LB.hl = null;
    history.replaceState(null, '', location.pathname + location.search);
    if (LB.pushed) history.back();
  });
  // On document, not the dialog: re-rendering the chips or clicking the image drops focus to <body>,
  // and a dialog-scoped listener would then miss every key until the reader tabbed back in.
  document.addEventListener('keydown', (e) => {
    // The share sheet opens on top of the lightbox; its keys are its own.
    if (!$('lb').open || document.querySelector('dialog[open]:not(#lb)') || e.target.closest('textarea, input:not([type="range"])')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepAngle(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); stepAngle(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); stepPose(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); stepPose(1); }
    else if (e.key === 'l' || e.key === 'L') {
      const p = byId.get(LB.id), have = MEDIA.filter((k) => hasMedium(p, k));
      if (have.length > 1) openLb(LB.id, LB.v, have[(have.indexOf(LB.medium) + 1) % have.length]);
    }
  });
  // The wipe: line art over the map, cut at the slider. Its own pointer events must not reach the stage's swipe.
  function setWipe() {
    const x = +$('lbWipeRange').value;
    // On the image itself: a clipped wrapper would be its own stacking context and the multiply would see white.
    $('lbWipeImg').style.clipPath = 'inset(0 ' + (100 - x) + '% 0 0)';
    $('lbWipeBar').style.setProperty('--x', x + '%');
  }
  $('lbWipeRange').addEventListener('input', setWipe);
  $('lbWipeBar').addEventListener('pointerdown', (e) => e.stopPropagation());
  let swipeX = null;
  let swipeY = null;
  $('lbStage').addEventListener('pointerdown', (e) => { swipeX = e.clientX; swipeY = e.clientY; });
  $('lbStage').addEventListener('pointerup', (e) => {
    if (swipeX === null) return;
    const dx = e.clientX - swipeX, dy = e.clientY - swipeY;
    swipeX = swipeY = null;
    // Phones: up / down steps through the formats in the row's order (not while the details panel scrolls).
    if (ALBUM && !LB.more && Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)) {
      const p = byId.get(LB.id), list = fmtList(p).filter((k) => k === 'compare' || p[k][LB.v]);
      const i = list.indexOf(LB.medium), next = list[i + (dy < 0 ? 1 : -1)];
      if (next) { pickFormat(next); flash(next === 'compare' ? t().overview : t()[next]); }
    } else if (Math.abs(dx) > 50) stepAngle(dx < 0 ? 1 : -1);
  });

  // Deep links: #P001 and #P001-diag open the overview (as do the older #P001-diag-compare links);
  // #P001-diag-line, -clay, -depth, -normal and -photo open one format.
  function openFromHash() {
    const m = location.hash.match(/^#([PSUD]\d{3})(?:-(front|diag|side|above|below))?(?:-(line|clay|depth|normal|photo|compare))?$/);
    if (m && byId.has(m[1])) openLb(m[1], m[2] ? VIEWS.indexOf(m[2]) : 0, m[3]);
  }
  window.addEventListener('hashchange', openFromHash);

  /* boot */
  renderMarquee();
  renderAll();
  openFromHash();
})();
