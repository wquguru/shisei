"""HTML for the static pages build_site.py writes: shared <head> (SEO and share tags), page shell, pose pages,
changelog, 404, plus the Atom feeds and sitemap.

Every page exists once per language. zh is the unprefixed default (and x-default, matching the gallery), the others
live under ja/, en/, ko/. Pages are directories (pose/P001/index.html) so URLs end in / on every static host and in
`python3 -m http.server`; links between pages are relative so a sub-path deploy (user.github.io/shisei/) works.
"""
import html, json

LOCS = ("zh", "ja", "en", "ko")
PREFIX = {"zh": "", "ja": "ja/", "en": "en/", "ko": "ko/"}
HTML_LANG = {"zh": "zh-CN", "ja": "ja", "en": "en", "ko": "ko"}
NAME_KEY = {"zh": "cn", "ja": "jp", "en": "en", "ko": "kr"}
VIEWS = ("front", "diag", "side", "above", "below")
CAT_KEYS = ("Sitting", "Standing", "Kneeling", "Lying", "Side sit / W-sit", "Squatting", "Leaning forward",
            "Arching back", "Twist")
TINT = ("#D3D1E6", "#AFC3E0", "#BCD3C6", "#E3CBB0", "#EBC0BC", "#C7DCD6", "#E6B7A1", "#CBD0AC", "#DDB9C8")
MON = ("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November",
       "December")

LICENSE = "https://www.apache.org/licenses/LICENSE-2.0"  # D-01: Apache-2.0 for code, catalog and images
esc = lambda s: html.escape(str(s), quote=True)
CURRENT = ' aria-current="true"'
LOGO = ('<svg class="logo" width="{s}" height="{s}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="24" fill="#18181B"/>'
        '<circle cx="60" cy="23" r="8" fill="none" stroke="#F5F2ED" stroke-width="6"/><path d="M57 37C38 52 42 68 64 82" fill="none" '
        'stroke="#E07A52" stroke-width="11" stroke-linecap="round"/></svg>')
SHARE_ICON = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
              'stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>')
FEED_ICON = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
             'aria-hidden="true"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>')


def fmt_day(loc, iso):
    y, m, d = iso[:4], int(iso[5:7]), int(iso[8:10])
    if loc == "en":
        return f"{MON[m - 1][:3]} {d}, {y}"
    return f"{y}년 {m}월 {d}일" if loc == "ko" else f"{y}年{m}月{d}日"


def fmt_month(loc, ym):
    y, m = ym[:4], int(ym[5:7])
    if loc == "en":
        return f"{MON[m - 1]} {y}"
    return f"{y}년 {m}월" if loc == "ko" else f"{y}年{m}月"


def fill(s, **kv):
    for k, v in kv.items():
        s = s.replace("{" + k + "}", str(v))
    return s


def list_join(loc, items):
    return ", ".join(items) if loc == "en" else ("、".join(items) if loc in ("zh", "ja") else "·".join(items))


class Site:
    """Build context: absolute site URL, strings, catalog, version, and where each page's files live."""

    def __init__(self, site, repo, version, strings, poses, og):
        self.site = site.rstrip("/")
        self.repo, self.version, self.S, self.poses, self.og = repo, version, strings, poses, og
        self.by_id = {p["id"]: p for p in poses}

    def abs(self, path):
        return f"{self.site}/{path}"

    @staticmethod
    def rel(page):
        """'../' per directory level of a page key like 'ja/pose/P001/'."""
        return "../" * page.count("/")

    def og_image(self, loc, key):
        """(url, w, h) for a card id like 'home' or 'P001'; falls back to the front line art when cards were skipped."""
        if self.og:
            return self.abs(f"og/{loc}/{key}.png"), 1200, 630
        p = self.by_id.get(key) or self.poses[0]
        f = next(f for f in p["line"] if f)
        return self.abs(f"images/line/w900/{f}"), 900, 1200

    # ---- <head>
    def head(self, loc, key, title, desc, image, alt, ld, page_type="website", feed=None, robots=None):
        """key: page path without the language prefix ('' for home, 'pose/P001/'); one URL per language."""
        T = self.S[loc]
        url = self.abs(PREFIX[loc] + key)
        rel = self.rel(PREFIX[loc] + key)
        img, w, h = image
        touch = f'<link rel="apple-touch-icon" href="{rel}apple-touch-icon.png">\n' if self.og else ""
        alts = "".join(f'\n<link rel="alternate" hreflang="{HTML_LANG[l]}" href="{esc(self.abs(PREFIX[l] + key))}">' for l in LOCS)
        alts += f'\n<link rel="alternate" hreflang="x-default" href="{esc(self.abs(key))}">'
        og_alt = "".join(f'\n<meta property="og:locale:alternate" content="{self.S[l]["ogLocale"]}">' for l in LOCS if l != loc)
        feed_link = f'\n<link rel="alternate" type="application/atom+xml" title="{esc(T["clFeed"])}" href="{feed}">' if feed else ""
        # "</" would end the inline script; JSON allows "<\\/" for it.
        ld_json = json.dumps(ld, ensure_ascii=False).replace("</", "<\\/") if ld else ""
        ld_tag = f'\n<script type="application/ld+json">{ld_json}</script>' if ld else ""
        return f"""{boot_script(loc, rel, key)}
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">{f'''
<meta name="robots" content="{robots}">''' if robots else ""}
<link rel="canonical" href="{esc(url)}">{alts}{feed_link}
<meta property="og:type" content="{page_type}">
<meta property="og:site_name" content="Shisei">
<meta property="og:url" content="{esc(url)}">
<meta property="og:locale" content="{T["ogLocale"]}">{og_alt}
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{esc(img)}">
<meta property="og:image:width" content="{w}">
<meta property="og:image:height" content="{h}">
<meta property="og:image:alt" content="{esc(alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{esc(img)}">
<meta name="twitter:image:alt" content="{esc(alt)}">
<link rel="icon" href="{rel}favicon.svg" type="image/svg+xml">
{touch}<link rel="manifest" href="{rel}manifest.webmanifest">{ld_tag}"""

    # ---- page shell for the static pages (the gallery has its own template)
    def shell(self, loc, key, head, main, cls=""):
        T = self.S[loc]
        rel = self.rel(PREFIX[loc] + key)
        home = rel + PREFIX[loc] or "./"
        langs = "".join(
            f'<a href="{rel}{PREFIX[l]}{key}" hreflang="{HTML_LANG[l]}" lang="{HTML_LANG[l]}" data-lang-link="{l}"'
            f'{CURRENT if l == loc else ""}>{esc(self.S[l]["langName"])}</a>' for l in LOCS)
        return f"""<!doctype html>
<html lang="{HTML_LANG[loc]}" data-loc="{loc}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
{head}
<meta name="theme-color" content="#F5F2ED">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&family=Noto+Sans+SC:wght@400;500;700;900&family=JetBrains+Mono:wght@500&display=swap">
<link rel="stylesheet" href="{rel}app.css?v={self.version}">
</head>
<body class="static {cls}">
<!-- Generated by tools/build_site.py from web/ and data/; edit the generator, not this file. -->
<a class="skip" href="#main">{esc(T["skip"])}</a>
<nav class="nav wrap" aria-label="Shisei">
  <a class="brand" href="{home}">{LOGO.format(s=40)}<span>Shisei</span></a>
  <div class="nav-links">
    <a href="{home}#all">{esc(T["navPoses"])}</a>
    <a href="{rel}{PREFIX[loc]}changelog/">{esc(T["navChangelog"])}</a>
  </div>
  <div class="nav-tools">
    <a class="pill dark small" href="{self.repo}">GitHub</a>
  </div>
</nav>
{main}
<footer class="foot">
  <div class="wrap foot-in">
    <div class="foot-brand">{LOGO.format(s=28)}<strong>Shisei 姿勢</strong><span>{esc(T["footer"])}</span></div>
    <nav class="foot-links" aria-label="Footer">
      <a href="{self.repo}">GitHub</a>
      <a href="{rel}{PREFIX[loc]}changelog/">{esc(T["navChangelog"])} v{self.version}</a>
      <a href="{rel}catalog.json">catalog.json</a>
    </nav>
    <nav class="foot-langs" aria-label="Language">{langs}</nav>
  </div>
</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="{rel}i18n.js?v={self.version}"></script>
<script src="{rel}common.js?v={self.version}"></script>
</body>
</html>
"""

    # ---- pose page
    def pose_page(self, loc, i):
        T = self.S[loc]
        p = self.poses[i]
        key = f"pose/{p['id']}/"
        page = PREFIX[loc] + key
        rel = self.rel(page)
        home = rel + PREFIX[loc]
        name = p["name_" + NAME_KEY[loc]]
        cat = p["class_" + NAME_KEY[loc]]
        have = [T["views"][k] for k, f in enumerate(p["line"]) if f]
        n = len(have)
        title = fill(T["poseTitle"], name=name, cat=cat, id=p["id"])
        desc = fill(T["poseDesc"], name=name, cat=cat, n=n, views=list_join(loc, have))
        alt = fill(T["poseOgAlt"], id=p["id"], name=name, views=list_join(loc, have))
        img = lambda tier, f: f"{rel}images/line/{tier}/{f}"
        absimg = lambda f: self.abs(f"images/line/w900/{f}")
        first = next(f for f in p["line"] if f)
        ld = {"@context": "https://schema.org", "@graph": [
            {"@type": "ImageGallery", "@id": self.abs(page), "url": self.abs(page), "name": title, "description": desc,
             "inLanguage": HTML_LANG[loc], "isPartOf": {"@type": "WebSite", "name": "Shisei", "url": self.abs(PREFIX[loc])},
             "primaryImageOfPage": absimg(first),
             "associatedMedia": [{"@type": "ImageObject", "contentUrl": absimg(f), "width": 900, "height": 1200,
                                  "name": f"{p['id']} {name} · {T['views'][k]}", "caption": p["desc_en"],
                                  "license": LICENSE, "acquireLicensePage": self.repo + "/blob/main/LICENSE",
                                  "creditText": "Shisei", "creator": {"@type": "Organization", "name": "Shisei"}}
                                 for k, f in enumerate(p["line"]) if f]},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Shisei", "item": self.abs(PREFIX[loc])},
                {"@type": "ListItem", "position": 2, "name": cat, "item": self.abs(PREFIX[loc]) + f"?cat={p['ci']}"},
                {"@type": "ListItem", "position": 3, "name": f"{p['id']} {name}", "item": self.abs(page)}]}]}
        head = self.head(loc, key, title, desc, self.og_image(loc, p["id"]), alt, ld, page_type="article")
        others = "".join(f'<dt>{l.upper()}</dt><dd lang="{HTML_LANG[l]}">{esc(p["name_" + NAME_KEY[l]])}</dd>'
                         for l in LOCS if l != loc)
        figs = []
        for k, f in enumerate(p["line"]):
            v = T["views"][k]
            if f:
                eager = ' fetchpriority="high"' if f == first else ' loading="lazy"'
                figs.append(
                    f'<figure class="pp-view"><a class="pp-tile" href="{home}#{p["id"]}-{VIEWS[k]}">'
                    f'<img src="{img("w900", f)}" srcset="{img("w300", f)} 300w, {img("w900", f)} 900w" sizes="(max-width: 720px) 50vw, 280px" '
                    f'width="900" height="1200" alt="{esc(p["id"] + " " + name + " · " + v)}"{eager} decoding="async"></a>'
                    f'<figcaption><span>{esc(v)}</span><a href="{img("w900", f)}" download="shisei_{p["id"]}_{VIEWS[k]}.webp">'
                    f'{esc(T["downloadView"])}</a></figcaption></figure>')
            else:
                figs.append(f'<figure class="pp-view"><div class="pp-tile missing"><b>{esc(v)} · {esc(T["notYet"])}</b></div>'
                            f'<figcaption><span>{esc(v)}</span></figcaption></figure>')
        prev, nxt = self.poses[i - 1], self.poses[(i + 1) % len(self.poses)]
        pn = lambda q, label, cls: (f'<a class="pp-pn-{cls}" href="../{q["id"]}/" rel="{"prev" if cls == "l" else "next"}">'
                                    f'<span>{esc(label)}</span><b>{q["id"]} · {esc(q["name_" + NAME_KEY[loc]])}</b></a>')
        same = [q for q in self.poses if q["ci"] == p["ci"] and q["id"] != p["id"]][:8]
        rel_cards = "".join(
            f'<a class="pp-rel" href="../{q["id"]}/"><span class="pp-rel-t" style="background:{TINT[q["ci"]]}">'
            f'<img src="{img("w300", next(f for f in q["line"] if f))}" alt="" width="300" height="400" loading="lazy" decoding="async"></span>'
            f'<span class="pp-rel-n"><b>{esc(q["name_" + NAME_KEY[loc]])}</b><span class="mono">{q["id"]}</span></span></a>' for q in same)
        share = (f'<button type="button" class="pill light small" data-share data-share-url="./" '
                 f'data-share-text="{esc(fill(T["shareText"], name=name))}" data-share-image="{esc(absimg(first))}">'
                 f'{SHARE_ICON}<span>{esc(T["share"])}</span></button>')
        main = f"""<main id="main" class="wrap page pose-page" style="--tint:{TINT[p["ci"]]}">
  <nav class="crumbs" aria-label="{esc(T["crumb"])}"><a href="{home}">Shisei</a><span aria-hidden="true">/</span><a href="{home}?cat={p["ci"]}#all">{esc(cat)}</a><span aria-hidden="true">/</span><span aria-current="page">{p["id"]}</span></nav>
  <header class="pp-head">
    <p class="pp-meta mono">{p["id"]} · {esc(cat)} · {esc(fill(T["anglesN"], n=n))}</p>
    <h1>{esc(name)}</h1>
    <dl class="lb-names" aria-label="{esc(T["otherNames"])}">{others}</dl>
    <div class="pp-actions">
      <a class="pill dark small" href="{home}#{p["id"]}-front">{esc(T["openInGallery"])}</a>
      {share}
    </div>
  </header>
  <section class="lb-desc pp-desc" aria-label="{esc(T["descLabel"])}">
    <div class="lb-desc-h"><span>{esc(T["descLabel"])}</span><button type="button" class="pill light tiny" data-copy="{esc(p["desc_en"])}">{esc(T["copy"])}</button></div>
    <p lang="en">{esc(p["desc_en"])}</p>
  </section>
  <section class="pp-sec" aria-labelledby="angles-h">
    <h2 id="angles-h">{esc(T["anglesTitle"])}</h2>
    <div class="pp-views">{"".join(figs)}</div>
  </section>
  <nav class="pp-pn" aria-label="{esc(T["prevPose"])} / {esc(T["nextPose"])}">{pn(prev, T["prevPose"], "l")}{pn(nxt, T["nextPose"], "r")}</nav>
  <section class="pp-sec" aria-labelledby="rel-h">
    <h2 id="rel-h">{esc(T["related"])}</h2>
    <div class="pp-rels">{rel_cards}</div>
  </section>
</main>"""
        return page, self.shell(loc, key, head, main)

    # ---- changelog
    def changelog_page(self, loc, entries):
        T = self.S[loc]
        key = "changelog/"
        page = PREFIX[loc] + key
        rel = self.rel(page)
        f = lambda e, k: e[k] if loc == "en" else e[f"{k}_{loc}"]
        link = lambda e: rel + PREFIX[loc] + e["link"].lstrip("/") if e["link"] != "/" else (rel + PREFIX[loc] or "./")
        months = []
        for e in entries:
            if not months or months[-1][0] != e["date"][:7]:
                months.append((e["date"][:7], []))
            months[-1][1].append(e)
        newest = entries[0]["date"]
        art = lambda e: f"""<article id="{e["id"]}" data-tag="{e["tag"]}" class="cl-item">
          <time datetime="{e["date"]}" class="mono">{esc(fmt_day(loc, e["date"]))}</time>
          <div class="cl-body">
            <span class="cl-tag t-{e["tag"]}">{esc(T["tags"][e["tag"]])}</span>
            <h3><a href="{esc(link(e))}">{esc(f(e, "title"))}</a></h3>
            <p>{esc(f(e, "desc"))}</p>
            <a class="cl-cta" href="{esc(link(e))}">{esc(f(e, "cta"))} →</a>
          </div>
        </article>"""
        tags = [t for t in ("new", "improve", "announce", "removed") if any(e["tag"] == t for e in entries)]
        filters = "".join(f'<button type="button" class="chip" data-filter="{t}" aria-pressed="{str(t == "all").lower()}">'
                          f'{esc(T["filterAll"] if t == "all" else T["tags"][t])}</button>' for t in ["all"] + tags)
        feed = "changelog.xml"
        title, desc = T["clMetaTitle"], T["clMetaDesc"]
        ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": title, "url": self.abs(page),
              "inLanguage": HTML_LANG[loc], "description": desc, "dateModified": newest,
              "isPartOf": {"@type": "WebSite", "name": "Shisei", "url": self.abs(PREFIX[loc])}}
        head = self.head(loc, key, title, desc, self.og_image(loc, "home"), T["ogAlt"], ld, feed=feed)
        share = (f'<button type="button" class="pill light small" data-share data-share-url="./" data-share-heading="{esc(T["share"])}">'
                 f'{SHARE_ICON}<span>{esc(T["share"])}</span></button>')
        main = f"""<main id="main" class="wrap page cl-page">
  <p class="eyebrow">{esc(T["navChangelog"]).upper()}</p>
  <h1>{esc(T["clH1"])}</h1>
  <p class="cl-lead">{esc(T["clLead"])}</p>
  <div class="cl-tools">
    <a class="pill dark small" href="{feed}" type="application/atom+xml">{FEED_ICON}<span>{esc(T["subscribe"])}</span></a>
    {share}
    <span class="muted">{fill(esc(T["updated"]), date=f'<time datetime="{newest}">{esc(fmt_day(loc, newest))}</time>')}</span>
  </div>
  <div class="cl-filter" role="group" aria-label="{esc(T["filterLabel"])}" data-filter-group hidden>{filters}</div>
  <div class="cl-list">
    {"".join(f'<section id="m{m}" aria-labelledby="m{m}-h"><h2 id="m{m}-h" class="mono">{esc(fmt_month(loc, m))}</h2>{"".join(art(e) for e in items)}</section>' for m, items in months)}
    <p class="muted" data-filter-empty hidden>{esc(T["clEmpty"])}</p>
  </div>
</main>"""
        return page, self.shell(loc, key, head, main)

    def atom(self, loc, entries):
        T = self.S[loc]
        page = self.abs(PREFIX[loc] + "changelog/")
        f = lambda e, k: e[k] if loc == "en" else e[f"{k}_{loc}"]
        x = lambda s: esc(s).replace("&#x27;", "&apos;")
        items = "".join(f"""
  <entry>
    <id>{x(page)}#{e["id"]}</id>
    <title>{x(f(e, "title"))}</title>
    <updated>{e["date"]}T00:00:00Z</updated>
    <link rel="alternate" type="text/html" href="{x(self.abs(PREFIX[loc] + e["link"].lstrip("/")))}"/>
    <category term="{e["tag"]}" label="{x(T["tags"][e["tag"]])}"/>
    <summary>{x(f(e, "desc"))}</summary>
  </entry>""" for e in entries)
        return f"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="{HTML_LANG[loc]}">
  <title>{x(T["clFeed"])}</title>
  <subtitle>{x(T["clMetaDesc"])}</subtitle>
  <id>{x(page)}</id>
  <link rel="alternate" type="text/html" href="{x(page)}"/>
  <link rel="self" type="application/atom+xml" href="{x(self.abs(PREFIX[loc] + "changelog/changelog.xml"))}"/>
  <updated>{entries[0]["date"]}T00:00:00Z</updated>
  <author><name>Shisei</name></author>
  <icon>{x(self.abs("favicon.svg"))}</icon>{items}
</feed>
"""

    def not_found(self):
        """One 404 for every language: hosts serve it at any depth, so links and assets are root-absolute."""
        root = "/" + self.site.split("://", 1)[1].split("/", 1)[1] + "/" if self.site.count("/") > 2 else "/"
        blocks = "".join(f"""<section lang="{HTML_LANG[l]}" class="nf-block"><h1>{esc(self.S[l]["nfTitle"])}</h1>
    <p>{esc(self.S[l]["nfBody"])}</p><a class="pill dark small" href="{root}{PREFIX[l]}">{esc(self.S[l]["backHome"])}</a></section>""" for l in LOCS)
        return f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 · Shisei</title>
<meta name="robots" content="noindex">
<link rel="icon" href="{root}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="{root}app.css?v={self.version}">
{THEME}
</head>
<body class="static">
<main class="wrap page nf-page">
  <a class="brand" href="{root}">{LOGO.format(s=56)}<span>Shisei</span></a>
  {blocks}
</main>
</body>
</html>
"""


# Saved theme before first paint, same key as the gallery.
THEME = "<script>try{var t=localStorage.getItem('shisei.theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>"


def boot_script(loc, rel, key):
    """Theme, then language. ?lang always wins; on zh pages (also the x-default) a saved choice or else the browser
    language moves the reader to their language before first paint. Crawlers stay on the URL they asked for, so each
    language's page is indexed as itself. The target is <this dir> + rel (site root) + language prefix + key."""
    auto = ("" if loc != "zh" else
            "if(!(w in P)){var s;try{s=localStorage.getItem('shisei.lang')}catch(e){}w=s in P?s:null;"
            "if(!w&&!/bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|lighthouse|headless/i.test(navigator.userAgent)){"
            "var n=String(navigator.language||'').toLowerCase();w=/^ja/.test(n)?'ja':/^ko/.test(n)?'ko':/^zh/.test(n)?'zh':n?'en':null}}")
    lang = ("<script>(function(){var P=" + json.dumps(PREFIX) + ",L=" + json.dumps(loc) + ",q=new URLSearchParams(location.search),w=q.get('lang');"
            + auto + "if(w in P&&w!==L){q.delete('lang');var r=q.toString();"
            "location.replace(location.pathname.replace(/[^/]*$/,'')+" + json.dumps(rel) + "+P[w]+" + json.dumps(key) + "+(r?'?'+r:'')+location.hash)}})()</script>")
    return THEME + "\n" + lang
