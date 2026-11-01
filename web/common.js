// Behaviour shared by the gallery and the generated pages: share sheet, copy buttons, language links, changelog filter.
// Strings come from window.I18N_PAGES (web/i18n.js); the page language is <html data-loc>.
(() => {
  'use strict';

  const loc = document.documentElement.dataset.loc || 'zh';
  // i18n.js merges I18N_PAGES into I18N, so this sees both tables.
  const T = (window.I18N || {})[loc] || {};
  const enc = encodeURIComponent;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Plain share links: no SDKs, nothing loads until the reader picks one. Which ones show depends on the language
  // (T.nets): Weibo for zh, LINE for ja / ko, Reddit for en; Pinterest everywhere, it is where pose references live.
  const NETS = {
    x: (u, t) => 'https://x.com/intent/tweet?text=' + enc(t) + '&url=' + enc(u),
    facebook: (u) => 'https://www.facebook.com/sharer/sharer.php?u=' + enc(u),
    line: (u, t) => 'https://social-plugins.line.me/lineit/share?url=' + enc(u) + '&text=' + enc(t),
    weibo: (u, t, img) => 'https://service.weibo.com/share/share.php?url=' + enc(u) + '&title=' + enc(t) + (img ? '&pic=' + enc(img) : ''),
    pinterest: (u, t, img) => 'https://www.pinterest.com/pin/create/button/?url=' + enc(u) + '&description=' + enc(t) + (img ? '&media=' + enc(img) : ''),
    reddit: (u, t) => 'https://www.reddit.com/submit?url=' + enc(u) + '&title=' + enc(t)
  };

  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
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
    toast(T.copied);
  }

  let dlg = null;
  function sheet() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'info share-sheet';
    dlg.setAttribute('aria-labelledby', 'shareH');
    dlg.innerHTML = '<div class="info-h"><h2 id="shareH"></h2><button type="button" class="circle" data-share-close aria-label="' + esc(T.close || '×') + '">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="share-url"><input type="text" readonly aria-label="URL"><button type="button" class="pill dark small" data-share-copy>' + esc(T.copyLink) + '</button></div>' +
      '<div class="share-nets"></div>';
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg || e.target.closest('[data-share-close]')) dlg.close();
      if (e.target.closest('[data-share-copy]')) copy(dlg.querySelector('input').value);
    });
    document.body.appendChild(dlg);
    return dlg;
  }

  /** open({ url, heading, text, image }): the system share sheet on phones, our own sheet elsewhere. */
  function open(o) {
    const url = new URL(o.url || location.href, location.href).href;
    const text = o.text || document.title;
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      navigator.share({ title: text, text: text, url: url }).catch(() => { /* dismissed */ });
      return;
    }
    const d = sheet();
    d.querySelector('h2').textContent = o.heading || T.share;
    d.querySelector('input').value = url;
    d.querySelector('.share-nets').innerHTML = Object.keys(T.nets || {}).filter((k) => NETS[k]).map((k) =>
      '<a class="pill light" target="_blank" rel="noopener noreferrer" href="' + esc(NETS[k](url, text, o.image)) + '">' + esc(T.nets[k]) + '</a>').join('');
    d.showModal();
  }
  window.ShiseiShare = { open: open, copy: copy };

  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-share]');
    if (s) {
      const site = s.hasAttribute('data-share-site');
      const home = (window.SHISEI && window.SHISEI.base !== undefined) ? window.SHISEI.base + (loc === 'zh' ? '' : loc + '/') : null;
      open({
        url: s.dataset.shareUrl || (site && home !== null ? home : location.href),
        heading: site ? T.shareSite : (s.dataset.shareHeading || T.shareTitle),
        text: s.dataset.shareText || document.title,
        image: s.dataset.shareImage
      });
    }
    const c = e.target.closest('[data-copy]');
    if (c) copy(c.dataset.copy);
    // Picking a language by hand is remembered, so the zh / x-default pages send the reader there next time.
    const l = e.target.closest('[data-lang-link]');
    if (l) { try { localStorage.setItem('shisei.lang', l.dataset.langLink); } catch (err) { /* private mode */ } }
  });


  /* Site menu (docs/DESIGN.md, 素材库与搭配): a "Library" dropdown in the desktop nav and, below 1100 px where the nav
     links are hidden, a menu button that opens the whole site on one screen. Built here so the gallery, the library
     pages and the generated pages share one menu; the data is window.SHISEI_NAV (tools/build_site.py). */
  const NAV = window.SHISEI_NAV;
  const TL = (window.I18N_LIB || {})[loc];
  if (NAV && TL && NAV.libs.length) {
    const PREFIX = { zh: '', ja: 'ja/', en: 'en/', ko: 'ko/' };
    const LANGS = ['zh', 'ja', 'en', 'ko'];
    const home = NAV.root + PREFIX[loc];
    const here = (location.pathname.match(/\/(costume|prop|furniture|animal|scene|light)\/$/) || [])[1];
    const thumb = (l) => (l.thumb ? '<img src="' + esc(NAV.media + 'images/' + l.dir + '/w300/' + l.thumb) + '" alt="" loading="lazy">' : '');
    const libLink = (l, cls) => '<a class="' + cls + ' ' + l.kind + '" href="' + esc(home + l.key + '/') + '"' + (l.key === here ? ' aria-current="page"' : '') + '>' +
      '<span class="lk-img">' + thumb(l) + '</span><span class="lk-t"><b>' + esc(T.libs[l.key].name) + '</b><span class="mono">' + l.n + '</span></span></a>';
    const groups = ['wear', 'near', 'env'].map((g) => [g, NAV.libs.filter((l) => l.group === g)]).filter((x) => x[1].length);
    const links = document.querySelector('.nav-links');
    if (links) {
      const box = document.createElement('div');
      box.className = 'libnav';
      box.innerHTML = '<button type="button" class="libnav-btn" aria-expanded="false" aria-controls="libnavPop"' + (here ? ' aria-current="page"' : '') + '>' + esc(T.navLibrary) +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>' +
        '<div class="libnav-pop" id="libnavPop" hidden>' + groups.map(([g, ls]) => '<span class="libnav-g">' + esc(TL.groups[g]) + '</span><div class="libnav-row">' + ls.map((l) => libLink(l, 'lk')).join('') + '</div>').join('') + '</div>';
      const first = links.querySelector('a');
      links.insertBefore(box, first ? first.nextSibling : links.firstChild);
      const btn = box.querySelector('button'), pop = box.querySelector('.libnav-pop');
      const setOpen = (o) => { btn.setAttribute('aria-expanded', String(o)); pop.hidden = !o; };
      btn.addEventListener('click', () => setOpen(pop.hidden));
      document.addEventListener('click', (e) => { if (!e.target.closest('.libnav')) setOpen(false); });
      box.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { setOpen(false); btn.focus(); } });
    }
    const tools = document.querySelector('.nav-tools');
    if (tools) {
      const mb = document.createElement('button');
      mb.type = 'button';
      mb.className = 'circle menu-btn';
      mb.setAttribute('aria-label', TL.menu);
      mb.setAttribute('aria-haspopup', 'dialog');
      mb.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
      tools.appendChild(mb);
      let menu = null;
      mb.addEventListener('click', () => {
        if (!menu) {
          // The same page in each language: the path after the language prefix, plus query and hash.
          const root = new URL(NAV.root || './', location.href).pathname;
          const key = location.pathname.slice(root.length).replace(/^(ja|en|ko)\//, '');
          const langs = LANGS.map((l) => '<a href="' + esc(NAV.root + PREFIX[l] + key + location.search) + '" data-lang-link="' + l + '" lang="' + ((window.I18N || {})[l] || {}).htmlLang + '"' + (l === loc ? ' aria-current="true"' : '') + '>' + esc(((window.I18N || {})[l] || {}).langName || l) + '</a>').join('');
          const ser = (window.I18N[loc] || {}).series || {};
          const tint = { std: '#AFC3E0', upper: '#D3D1E6', sexy: '#EBC0BC', duo: '#BCD3C6' };
          const repo = (document.querySelector('a.gh') || {}).href || 'https://github.com/wquguru/shisei';
          menu = document.createElement('dialog');
          menu.className = 'site-menu';
          menu.setAttribute('aria-label', TL.menu);
          menu.innerHTML = '<div class="sm-h"><a class="brand" href="' + esc(home || './') + '"><svg class="logo" width="36" height="36" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="24" fill="#18181B"/><circle cx="60" cy="23" r="8" fill="none" stroke="#F5F2ED" stroke-width="6"/><path d="M57 37C38 52 42 68 64 82" fill="none" stroke="#E07A52" stroke-width="11" stroke-linecap="round"/></svg><span>Shisei</span></a>' +
            '<button type="button" class="circle" data-menu-close aria-label="' + esc(T.close || '×') + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
            '<nav class="sm-body" aria-label="' + esc(TL.menu) + '">' +
            '<a class="sm-poses" href="' + esc(home + '#all') + '"><span>' + esc(T.navPoses) + '</span><span class="mono">' + esc(TL.poseSets(NAV.poses)) + ' →</span></a>' +
            '<div class="sm-series">' + NAV.series.map(([k, n]) => '<a href="' + esc(home + '?series=' + k + '#all') + '"><i style="background:' + tint[k] + '"></i><span>' + esc(ser[k] || k) + '</span><span class="mono">' + n + '</span></a>').join('') + '</div>' +
            '<span class="sm-label">' + esc(TL.libsLabel) + '</span><div class="sm-libs">' + NAV.libs.map((l) => libLink(l, 'sm-lib')).join('') + '</div>' +
            '<div class="sm-links"><a href="' + esc(home + 'changelog/') + '">' + esc(T.navChangelog) + '</a><a href="' + esc(repo) + '">GitHub</a></div></nav>' +
            '<div class="sm-foot"><div class="sm-langs">' + langs + '</div><button type="button" class="circle" data-menu-theme aria-label="' + esc(T.theme || '') + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button></div>';
          menu.addEventListener('click', (e) => {
            if (e.target === menu || e.target.closest('[data-menu-close]')) menu.close();
            else if (e.target.closest('[data-menu-theme]')) {
              const r = document.documentElement;
              const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
              r.dataset.theme = dark ? 'light' : 'dark';
              try { localStorage.setItem('shisei.theme', r.dataset.theme); } catch (err) { /* private mode */ }
            } else if (e.target.closest('a')) setTimeout(() => menu.close(), 0);  // same-page links (#all) still land
          });
          document.body.appendChild(menu);
        }
        menu.showModal();
      });
    }
  }

  // Changelog: filter by tag. Without JS the buttons stay hidden and every entry shows.
  const g = document.querySelector('[data-filter-group]');
  if (g) {
    g.hidden = false;
    g.addEventListener('click', (e) => {
      const b = e.target.closest('[data-filter]');
      if (!b) return;
      const f = b.dataset.filter;
      let n = 0;
      g.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      document.querySelectorAll('article[data-tag]').forEach((a) => { a.hidden = !(f === 'all' || a.dataset.tag === f); if (!a.hidden) n++; });
      document.querySelectorAll('.cl-list section').forEach((s) => { s.hidden = !s.querySelector('article:not([hidden])'); });
      document.querySelector('[data-filter-empty]').hidden = n > 0;
    });
  }
})();
