(() => {
  'use strict';

  const CATALOG = JSON.parse(document.getElementById('catalog').textContent);
  const I18N = window.I18N;
  const LANGS = ['zh', 'ja', 'en', 'ko'];
  const VIEWS = ['front', 'diag', 'side', 'above', 'below'];
  const SERIES = ['std', 'upper', 'sexy', 'duo'];
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
  const LATEST = CATALOG.map((p) => p.added_in || '').sort().pop();
  const poses = CATALOG.filter((p) => VIEWS.some((v) => p.views[v])).map((p) => {
    const ci = Math.max(0, (CATS[p.series] || CATS.std).findIndex((c) => c[0] === p.class_en));
    const line = VIEWS.map((v) => p.views[v] || null);
    return {
      ...p, ci, line,
      tint: (CATS[p.series] || CATS.std)[ci][1],
      isNew: p.added_in === LATEST,
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
  };
  const ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const gapIcon = (photo) => '<span class="gap-ic">' + ICON[photo ? 'photo' : 'line'] + '</span>';
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
    // The hero counts the whole published library, so the number does not move when suggestive poses are hidden.
    const n = poses.length;
    const views = poses.reduce((s, p) => s + p.line.filter(Boolean).length, 0);
    document.querySelector('.hero-sub').textContent = T.heroSub(n, views.toLocaleString('en-US'));
    document.querySelector('[data-i18n="browse"]').textContent = T.browse(n);
    $('heroSeries').innerHTML = SERIES.map((k) => [k, poses.filter((p) => p.series === k).length]).filter((x) => x[1])
      .map(([k, c]) => '<span><i style="background:' + SERIES_TINT[k] + '"></i>' + esc(T.series[k]) + '<b>' + c + '</b></span>').join('');
    document.querySelectorAll('[data-pack-size]').forEach((el) => {
      const k = PACKS && PACKS.packs[el.dataset.packSize];
      el.textContent = k ? mb(k.bytes) : '';
      el.hidden = !k;
    });
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
        tiles.push('<span class="mq-tile" style="background:' + p.tint + '"><img src="' + src('line', 'w300', f) + '" alt="" width="146" height="146" decoding="async" fetchpriority="low"></span>');
      }
      return tiles.join('') + tiles.join('');
    };
    $('mq1').innerHTML = row(0);
    $('mq2').innerHTML = row(3);
    $('tools').innerHTML = TOOLS.map((x) => '<span>' + esc(x) + '</span>').join('');
  }

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
        (p.isNew ? '<span class="badge new">' + T.newBadge + '</span>' : '') +
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
      openLb(p.id, curView(p), S.medium);
      return;
    }
    const s = e.target.closest('.stile');
    if (s) {
      e.preventDefault();
      if (s.classList.contains('veiled')) reveal(s.dataset.open);
      else openLb(s.dataset.open, +s.dataset.v, S.medium);
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
    const row = (k, cls, title, sub, dot) => '<a class="dl-row ' + cls + '" href="' + url(k) + '" download>' +
      '<span class="dl-t">' + (dot ? '<i style="background:' + dot + '"></i>' : '') + '<span><b>' + title + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></span>' +
      '<span class="dl-s"><span class="' + (cls === 'main' ? 'size-tag' : 'mono') + '">' + mb(P[k].bytes) + '</span>' + DL_ICON + '</span></a>';
    const series = SERIES.filter((k) => P[k]);
    $('dlBody').innerHTML =
      '<p class="dl-note">' + esc(T.dlNote(Math.round(P.original.bytes / P.all.bytes))) + '</p>' +
      row('all', 'main', esc(T.dlAll) + ' <em>' + esc(T.dlRec) + '</em>', T.dlSetsAll(P.all.sets)) +
      '<h3>' + esc(T.dlBySeries) + '</h3>' +
      series.map((k) => row(k, '', esc(T.series[k]), T.dlSets(P[k].sets), SERIES_TINT[k])).join('') +
      '<h3 class="dl-sep">' + esc(T.dlOriginal) + '</h3>' +
      row('original', 'orig', esc(T.dlOriginalAll), '');
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
  // medium: 'line' | 'photo' | 'compare'. Compare exists only here, not in the grid: a side-by-side pair
  // needs the room of one large image, and only the std sets with photos have anything to compare.
  // more: the phone lightbox keeps names, description and secondary actions folded away so one set fits one screen.
  const LB = { id: null, v: 0, medium: 'line', more: false };
  const MEDIA = ['line', 'photo', 'compare'];
  // In compare a view counts when either side has it; the missing side shows the usual gap box.
  const lbFiles = (p, m) => (m === 'compare' ? p.line.map((f, i) => f || p.photo[i]) : files(p, m === 'photo'));
  function lbList() {
    const list = pool();
    return list.some((p) => p.id === LB.id) ? list : poses;
  }
  function openLb(id, v, medium) {
    const p = byId.get(id);
    if (!p) return;
    LB.id = id;
    LB.medium = MEDIA.includes(medium) && p.photo.some(Boolean) ? medium : 'line';
    const arr = lbFiles(p, LB.medium);
    LB.v = arr[v] ? v : firstView(arr);
    renderLb();
    if (!$('lb').open) $('lb').showModal();
  }
  function setDl(a, label, f, kind, p) {
    a.querySelector('span').textContent = label;
    if (f) { a.href = src(kind, 'w900', f); a.setAttribute('download', 'shisei_' + p.id + '_' + VIEWS[LB.v] + (kind === 'photo' ? '_photo' : '') + '.webp'); a.removeAttribute('aria-disabled'); }
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
  function lbGapHtml(p, arr, photo, T) {
    const v = LB.v;
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
  function renderLb() {
    const T = t();
    const p = byId.get(LB.id);
    const m = LB.medium;
    const photo = m === 'photo', compare = m === 'compare';
    const arr = lbFiles(p, m);
    const f = arr[LB.v];
    const kind = photo ? 'photo' : 'line';
    $('lb').style.setProperty('--tint', m === 'line' ? p.tint : 'var(--tile)');
    $('lb').classList.toggle('photo', photo);
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
    const pair = $('lbPair');
    pair.hidden = !compare;
    pair.innerHTML = compare ? pairCell(p, 'line', p.line[LB.v], T) + pairCell(p, 'photo', p.photo[LB.v], T) : '';
    const miss = $('lbMissing');
    miss.hidden = !!f || compare;
    miss.innerHTML = f || compare ? '' : lbGapHtml(p, arr, photo, T);
    $('lbCounter').textContent = T.views[LB.v] + ' ' + (LB.v + 1) + '/5';
    // With one view or none there is nowhere to step; a live-looking arrow that does nothing reads as broken.
    $('lbPrev').disabled = $('lbNext').disabled = arr.filter(Boolean).length < 2;
    const list = lbList();
    $('lbMeta').textContent = p.id + ' · ' + T.series[p.series] + ' · ' + catLabel(p) + ' · ' + (list.indexOf(p) + 1) + '/' + list.length;
    $('lb').classList.toggle('more', LB.more);
    $('lbMore').setAttribute('aria-expanded', String(LB.more));
    $('lbTitle').textContent = nameOf(p);
    $('lbNames').innerHTML = ['cn', 'jp', 'en', 'kr'].filter((s) => s !== T.suffix)
      .map((s) => '<dt>' + NAME_LABEL[s] + '</dt><dd>' + esc(p['name_' + s]) + '</dd>').join('');
    $('lbChips').setAttribute('aria-label', T.angle);
    // Compare thumbnails show the line art when there is one; a dot marks the angles that have both sides.
    $('lbChips').innerHTML = VIEWS.map((_, i) => {
      const tk = compare ? (p.line[i] ? 'line' : 'photo') : kind;
      const both = compare && p.line[i] && p.photo[i];
      return '<button type="button" data-lbv="' + i + '" aria-pressed="' + (i === LB.v) + '"' + (arr[i] ? '' : ' disabled') + '>' +
        '<span class="' + tk + (both ? ' both' : '') + '">' + (arr[i] ? '<img src="' + src(tk, 'w300', arr[i]) + '" alt="">' : ICON[kind]) + '</span>' + esc(T.views[i]) + '</button>';
    }).join('');
    const hasPhoto = p.photo.some(Boolean);
    $('lb').classList.toggle('no-photo', !hasPhoto);
    $('lbMedium').setAttribute('aria-label', T.medium);
    $('lbMedium').innerHTML = MEDIA.map((k) => '<button type="button" data-lbm="' + k + '" aria-pressed="' + (m === k) + '"' +
      (k === 'line' || hasPhoto ? '' : ' disabled') + '>' + esc(T[k]) + '</button>').join('');
    $('lbDesc').textContent = p.desc_en || '';
    $('lbDescBox').hidden = !p.desc_en;
    const dl2 = $('lbDl2');
    dl2.hidden = !compare;
    if (compare) {
      setDl($('lbDl'), T.line + ' 900', p.line[LB.v], 'line', p);
      setDl(dl2, T.photo + ' 900', p.photo[LB.v], 'photo', p);
    } else setDl($('lbDl'), T.download + ' · ' + (photo ? '900×1800' : '900×1200'), f, kind, p);
    if (veil) [$('lbDl'), dl2].forEach((a) => { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); });
    // Static pose pages exist only for general std poses (tools/site_pages.py).
    const hasPage = hasPosePage(p);
    $('lbPage').hidden = !hasPage;
    if (hasPage) $('lbPage').href = posePage(p.id);
    history.replaceState(null, '', location.pathname + location.search + '#' + p.id + '-' + VIEWS[LB.v] + (m === 'line' ? '' : '-' + m));
  }
  const posePage = (id) => BASE + PREFIX[S.lang] + 'pose/' + id + '/';
  // Same rule as tools/build_site.py: only general-rated std poses get a static page.
  const hasPosePage = (p) => p.series === 'std' && !p.suggestive;
  function stepAngle(d) {
    const arr = lbFiles(byId.get(LB.id), LB.medium);
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
  $('lbMedium').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lbm]');
    if (b && !b.disabled) openLb(LB.id, LB.v, b.dataset.lbm);
  });
  $('lbVeilOne').addEventListener('click', () => reveal(LB.id));
  $('lbVeilAll').addEventListener('click', () => setAdult(true));
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
  // On document, not the dialog: re-rendering the chips or clicking the image drops focus to <body>,
  // and a dialog-scoped listener would then miss every key until the reader tabbed back in.
  document.addEventListener('keydown', (e) => {
    // The share sheet opens on top of the lightbox; its keys are its own.
    if (!$('lb').open || document.querySelector('dialog[open]:not(#lb)') || e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepAngle(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); stepAngle(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); stepPose(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); stepPose(1); }
    else if (e.key === 'l' || e.key === 'L') {
      if (byId.get(LB.id).photo.some(Boolean)) openLb(LB.id, LB.v, MEDIA[(MEDIA.indexOf(LB.medium) + 1) % 3]);
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

  // Deep links: #P001, #P001-diag, #P001-diag-photo, #P001-diag-compare
  function openFromHash() {
    const m = location.hash.match(/^#([PSUD]\d{3})(?:-(front|diag|side|above|below))?(?:-(photo|compare))?$/);
    if (m && byId.has(m[1])) openLb(m[1], m[2] ? VIEWS.indexOf(m[2]) : 0, m[3]);
  }
  window.addEventListener('hashchange', openFromHash);

  /* boot */
  renderMarquee();
  renderAll();
  openFromHash();
})();
