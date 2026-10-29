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
