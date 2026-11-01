#!/usr/bin/env python3
"""Build the static site into site/ from web/, data/catalog.json and web/changelog.yaml.

Writes, per language (zh unprefixed, ja/ en/ ko/): the gallery home, one page per pose, the changelog and its Atom
feed; plus share cards (og/), sitemap.xml, robots.txt, 404.html, manifest and icons. Fails on a bad changelog entry,
a page without its share tags, or a relative link that points nowhere.

Usage: python3 tools/build_site.py [--site URL] [--repo URL] [--link-images] [--no-og] [--out site]
--site          absolute URL the site is served from (canonical, og:image, sitemap); default $SHISEI_SITE_URL or
                the GitHub Pages address, see docs/DECISIONS.md D-05
--link-images   symlink images/ instead of copying (fast local preview)
--no-og         skip rendering share cards (no Chrome needed); og:image falls back to the pose's front line art
--public        the public deploy: the series in PUBLIC_SERIES, line art and photo renders that passed QC; only the files
                the catalog lists are copied (DECISIONS D-03, D-06)
"""
import argparse, datetime, hashlib, json, os, pathlib, re, shutil, subprocess, sys
from html.parser import HTMLParser

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))  # -I drops the script dir from sys.path
import og_cards, site_pages  # noqa: E402
from site_pages import CAT_KEYS, HTML_LANG, LOCS, NAME_KEY, PREFIX, TINT, VIEWS, Site, esc, fill  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_SITE = "https://wquguru.github.io/shisei"
PUBLIC_SERIES = ("std", "upper", "sexy", "duo")
TODAY = datetime.date.today().isoformat()


def version() -> str:
    m = re.search(r"^## \[(\d+\.\d+\.\d+)\]", (ROOT / "CHANGELOG.md").read_text(), re.M)
    return m.group(1) if m else "0.0.0"


def strings():
    """The strict-JSON block in web/i18n.js (window.I18N_PAGES), so page strings live in one place with the UI's."""
    s = (ROOT / "web/i18n.js").read_text()
    return json.loads(s.split("// BEGIN-JSON", 1)[1].split("// END-JSON", 1)[0])


def library_stats(catalog, ver, updated):
    """The library's numbers, computed once per build: page titles, descriptions, share cards and /stats.json all
    read them, so no surface carries a count of its own. Suggestive poses count (they are public behind the switch,
    D-06); only their images stay off previews."""
    shown = [p for p in catalog if any(p["views"].values())]
    n_views = lambda p: sum(1 for v in VIEWS if p["views"].get(v))
    series = {}
    for p in catalog:
        s = series.setdefault(p["series"], {"sets": 0, "sets_total": 0, "views": 0, "sets_full": 0})
        s["sets_total"] += 1
        if n_views(p):
            s["sets"] += 1
            s["views"] += n_views(p)
            s["sets_full"] += n_views(p) == len(VIEWS)
    views = sum(n_views(p) for p in shown)
    # Long-cached surfaces (search titles, share cards) round down to the hundred so they never overstate.
    return {"version": ver, "updated": updated, "sets": len(shown), "views": views,
            "views_round": f"{views // 100 * 100:,}+", "sets_full": sum(n_views(p) == len(VIEWS) for p in shown),
            "sets_general": sum(p["rating"] == "general" for p in shown),
            "photos": sum(len(p.get("photos") or {}) for p in shown), "languages": 4, "series": series}


# The libraries that attach to a pose (docs/DESIGN.md, 素材库与搭配), in menu and tray order. dir: the image folder
# under images/; kind: how a tile shows it (grey product shot, photo, or line art multiplied on a tint like the poses);
# group: the menu group; views: the library's own angles, in the order its files are listed.
LIBS = {
    "costume": {"data": "costumes", "src": "costume", "dir": "costume/grey", "kind": "grey", "group": "wear",
                "views": ("front", "diag", "side", "back")},
    "prop": {"data": "props", "src": "prop", "dir": "prop/grey", "kind": "grey", "group": "wear",
             "views": ("front", "diag", "side", "back")},
    "furniture": {"data": "furniture", "src": "furniture", "dir": "furniture/grey", "kind": "grey", "group": "near",
                  "views": ("front", "diag", "side", "back", "above")},
    "animal": {"data": "animals", "src": "animal", "dir": "animal/plain", "kind": "line", "group": "near",
               "views": ("front", "diag", "side", "above", "below")},
    "scene": {"data": "scenes", "src": "scene", "dir": "scene/plain", "kind": "photo", "group": "env",
              "views": ("eye", "above", "below")},
    "light": {"data": "lights", "src": "light", "dir": "light/plain", "kind": "photo", "group": "env",
              "views": ("front", "diag", "side")},
}


def first_clause(s):
    return re.split(r"[,;:]", s or "", 1)[0].strip()


def clause(lib, c):
    """How the item joins the pose's prompt in the tray: pose desc_en, then these, in LIBS order."""
    if lib == "costume":
        return "wearing " + c.get("keep_en", "")
    if lib == "prop":
        return "holding " + first_clause(c.get("desc_en"))
    if lib == "furniture":
        return "with " + first_clause(c.get("desc_en"))
    if lib == "animal":
        return "with a " + first_clause(c.get("species") or c.get("group_en", "animal")) + " " + first_clause(c.get("desc_en"))
    if lib == "scene":
        return "in " + first_clause(c.get("desc_en"))
    return "lit by " + first_clause(c.get("keep_en"))


def library_data(lib):
    """One library as its page reads it: items with at least one view that passed QC (the library's qc.json decides
    what is in its data file), trimmed to what the page shows. Lingerie is public and blurred like the suggestive
    poses (D-06, D-11)."""
    L = LIBS[lib]
    src = json.loads((ROOT / f"data/{L['data']}.json").read_text())
    cats = json.loads((ROOT / f"data/{L['src']}-src/_categories.json").read_text())
    items = []
    for c in src["items"]:
        v = [(c.get("views") or {}).get(k) for k in L["views"]]
        if not any(v):
            continue
        sub = "era" if lib == "costume" else "group"
        main = L["views"].index(c["main"]) if c.get("main") in L["views"] else 0
        item = {"id": c["id"], "cat": c["cat"], "r": c.get("rating", "general"), "n": {l: c["name_" + l] for l in LOCS},
                "sub": {l: c.get(f"{sub}_{l}") or c.get(f"{sub}_en") or "" for l in LOCS} if c.get(f"{sub}_en") else None,
                "desc": c.get("desc_en", ""), "clause": clause(lib, c), "v": v, "m": main if v[main] else v.index(next(f for f in v if f))}
        if lib == "costume":
            item["g"] = c.get("gender", "U")
        items.append(item)
    order = sorted(cats, key=lambda k: cats[k]["order"])
    return {"lib": lib, "views": list(L["views"]), "dir": L["dir"], "kind": L["kind"],
            "cats": [{"key": k, "name": cats[k]["name"]} for k in order if any(i["cat"] == k for i in items)],
            "items": items}


def nav_data(libs, catalog):
    """What every page's menu and tray need, inlined per page: counts, a thumbnail per library, each library's views."""
    shown = [p for p in catalog if any(p["views"].values())]
    series = [[k, sum(1 for p in shown if p.get("series", "std") == k)] for k in ("std", "upper", "sexy", "duo")]
    out = []
    for lib, D in libs.items():
        gen = [i for i in D["items"] if i["r"] == "general"]
        thumb = gen[0]["v"][gen[0]["m"]] if gen else None
        out.append({"key": lib, "n": len(D["items"]), "views": D["views"], "dir": D["dir"], "kind": D["kind"],
                    "group": LIBS[lib]["group"], "thumb": thumb, "imgs": sum(1 for i in D["items"] for f in i["v"] if f)})
    return {"poses": len(shown), "series": [s for s in series if s[1]], "libs": out}


def git_day(path):
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", path], cwd=ROOT, capture_output=True, text=True)
        return out.stdout.strip() or TODAY
    except OSError:
        return TODAY


# ---- web/changelog.yaml: `entries:` then `- key: value` items, scalar values only
TAGS = ("new", "improve", "announce", "removed")
TEXT = ("title", "desc", "cta")
NEED = ["date", "tag", "link"] + [k if l == "en" else f"{k}_{l}" for l in ("en", "zh", "ja", "ko") for k in TEXT]
# CJK says the same in roughly half the characters.
MAX = {"en": (60, 200), "zh": (30, 100), "ja": (36, 110), "ko": (40, 130)}
# Readers get "what you can see now", not how it was built.
JARGON = re.compile(r"\b(refactor(ed)?|lint|CI|WIP|verify\.py|build_site|catalog\.json|KNOWN_GAPS)\b", re.I)


def parse_changelog(text):
    entries, errs, cur, seen = [], [], None, False
    for i, raw in enumerate(text.split("\n"), 1):
        line = raw.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line == "entries:":
            seen = True
            continue
        m = re.match(r"^(\s*)(- )?([a-z_]+):(?: (.*))?$", line)
        if not seen or not m or (not m[2] and cur is None):
            errs.append(f"line {i}: cannot parse {line.strip()!r}")
            continue
        if m[2]:
            cur = {"line": i}
            entries.append(cur)
        if m[3] in cur:
            errs.append(f"line {i}: duplicate key {m[3]}")
        cur[m[3]] = (m[4] or "").strip()
    if not seen:
        errs.append('missing top-level "entries:"')
    return entries, errs


def audit_changelog(entries, pose_ids):
    bad = []
    for e in entries:
        at = f"line {e['line']} {e.get('title', '')!r}"
        for k in NEED:
            if not e.get(k):
                bad.append(f"{at}: missing {k}")
        for k in e:
            if k != "line" and k not in NEED:
                bad.append(f"{at}: unknown key {k}")
        d = e.get("date", "")
        try:
            datetime.date.fromisoformat(d)
            if d > TODAY:
                bad.append(f"{at}: date {d} is in the future")
        except ValueError:
            bad.append(f"{at}: bad date {d!r} (want YYYY-MM-DD)")
        if e.get("tag") and e["tag"] not in TAGS:
            bad.append(f"{at}: unknown tag {e['tag']} (want {' | '.join(TAGS)})")
        for l, (tmax, dmax) in MAX.items():
            sfx = "" if l == "en" else f"_{l}"
            for k, mx in (("title", tmax), ("desc", dmax)):
                if len(e.get(k + sfx, "")) > mx:
                    bad.append(f"{at}: {k}{sfx} is {len(e[k + sfx])} chars (max {mx})")
            for k in TEXT:
                hit = JARGON.search(e.get(k + sfx, ""))
                if hit:
                    bad.append(f"{at}: {k}{sfx} uses internal term {hit[0]!r}")
        link = e.get("link", "")
        path = re.split(r"[?#]", link, 1)[0]
        ok = path in ("/", "/changelog/") or path.strip("/") in LIBS or (re.fullmatch(r"/pose/(P\d{3})/", path) and path[6:10] in pose_ids)
        if link and not ok:
            bad.append(f"{at}: link {link} is not a site page (/, /changelog/, a library page or /pose/<id>/ of a catalog pose)")
    return bad


def changelog_entries(pose_ids):
    entries, errs = parse_changelog((ROOT / "web/changelog.yaml").read_text())
    bad = errs + audit_changelog(entries, pose_ids) + ([] if entries else ["no entries"])
    if bad:
        sys.exit("web/changelog.yaml:\n  " + "\n  ".join(bad))
    slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:48]
    for k, e in enumerate(entries):
        e["id"], e["i"] = f"{e['date']}-{slug(e['title'])}", k
    return sorted(entries, key=lambda e: (-int(e["date"].replace("-", "")), e["i"]))


# ---- checks on the output
class Refs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.meta, self.links = [], {}, {}

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for k in ("href", "src"):
            if a.get(k):
                self.refs.append(a[k])
        for part in (a.get("srcset") or "").split(","):
            if part.strip():
                self.refs.append(part.split()[0])
        if tag == "meta" and (a.get("property") or a.get("name")):
            self.meta[a.get("property") or a.get("name")] = a.get("content")
        if tag == "link" and a.get("rel"):
            self.links[a["rel"]] = a.get("href")


def check_site(out, site):
    bad = []
    for f in out.rglob("*.html"):
        if f.name == "404.html":
            continue
        doc = f.read_text()
        r = Refs()
        r.feed(doc)
        where = f.relative_to(out)
        for need in ("og:title", "og:description", "og:image", "og:url", "twitter:card", "description"):
            if not r.meta.get(need):
                bad.append(f"{where}: no {need}")
        if not (r.links.get("canonical") or "").startswith(site):
            bad.append(f"{where}: canonical missing or not on {site}")
        if (r.meta.get("og:image") or "") and not r.meta["og:image"].startswith(site):
            bad.append(f"{where}: og:image is not absolute on {site}")
        for ref in r.refs:
            if re.match(r"^(?:[a-z]+:|#|//|__)", ref):
                continue
            target = (f.parent / re.split(r"[?#]", ref, 1)[0]).resolve()
            if ref.split("#")[0].split("?")[0].endswith("/") or ref in (".", "./") or target.is_dir():
                target = target / "index.html"
            if not target.exists():
                bad.append(f"{where}: broken link {ref}")
    return bad


# Cloudflare Pages response headers. Scripts and styles ship as assets/<name>.<content hash>.<ext>: the hash lives in
# the file name, not a ?v= query, because Pages ignores the query when it looks up a file. With ?v=, an edge still on
# the previous deployment answered the new URL with the old script, and the zone cache kept that for a year (a blank
# gallery on 2026-10-29). A hashed name the old deployment lacks cannot be filled with old code, so only assets/ is
# immutable; the unhashed copies stay for HTML cached before the switch and revalidate like pages. Image names stay
# the same when a view is redrawn, so images get a week plus background revalidation rather than immutable.
HEADERS = """/assets/*
  Cache-Control: public, max-age=31536000, immutable
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/images/*
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400
/og/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=86400
"""
STAMPED = ("app.css", "app.js", "common.js", "i18n.js", "tray.js", "library.js")
# The image host (a second Pages project) answers the tray's fetch() for the phone share sheet, so it allows any origin.
MEDIA_HEADERS = """/images/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400
"""


def stamp_assets(out, ver):
    """Copy each asset to assets/<stem>.<content hash><ext> and point every page's name?v=<release> reference at it."""
    (out / "assets").mkdir(exist_ok=True)
    pages = list(out.rglob("*.html"))
    for name in STAMPED:
        data = (out / name).read_bytes()
        stem, ext = os.path.splitext(name)
        hashed = f"{stem}.{hashlib.sha256(data).hexdigest()[:10]}{ext}"
        (out / "assets" / hashed).write_bytes(data)
        pat = re.compile(re.escape(name) + r"\?v=" + re.escape(ver) + r"(?=\")")
        for f in pages:
            doc = f.read_text()
            if name in doc:
                f.write_text(pat.sub("assets/" + hashed, doc))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default=os.environ.get("SHISEI_SITE_URL", DEFAULT_SITE))
    ap.add_argument("--repo", default="https://github.com/wquguru/shisei")
    ap.add_argument("--out", default="site")
    ap.add_argument("--link-images", action="store_true")
    ap.add_argument("--no-og", action="store_true")
    ap.add_argument("--public", action="store_true")
    ap.add_argument("--media", default="", help="absolute URL of the image host for the libraries (DESIGN.md)")
    ap.add_argument("--media-out", default="site-media")
    args = ap.parse_args()
    site_url = args.site.rstrip("/")

    out = ROOT / args.out
    if out.is_symlink() or out.is_file():
        out.unlink()
    elif out.exists():
        shutil.rmtree(out)
    out.mkdir()

    catalog = json.loads((ROOT / "data/catalog.json").read_text())
    if args.public:
        # Filtering the catalog is not enough on its own: every file under site/ is downloadable, so the images are
        # copied from this list too.
        if args.link_images:
            sys.exit("--public copies only the public images; drop --link-images")
        # A new series goes public only once a human has OK'd it (AGENTS.md §8): add it here then.
        catalog = [p for p in catalog if p.get("series", "std") in PUBLIC_SERIES]
    # Pose pages, share cards and the sitemap cover the published std series only: other series are still being
    # imported and reviewed, and a new series needs a human OK (AGENTS.md §8) before it gets indexable pages.
    # Suggestive poses never get indexable pages or share cards; a pose with no usable view is hidden.
    poses = [dict(p, ci=CAT_KEYS.index(p["class_en"]) if p["class_en"] in CAT_KEYS else 0,
                  line=[p["views"].get(v) for v in VIEWS],
                  photo=[(p.get("photos") or {}).get(v) for v in VIEWS])
             for p in catalog if p.get("series", "std") == "std" and p.get("rating", "general") == "general"
             and any(p["views"].values())]
    ver = version()
    entries = changelog_entries({p["id"] for p in poses})
    stats = library_stats(catalog, ver, entries[0]["date"])
    S = strings()
    for T in S.values():  # every count on a page comes from stats, the same numbers stats.json publishes
        for k in ("metaTitle", "metaDesc", "ogLine"):
            T[k] = fill(T[k], n=stats["sets"], views=f"{stats['views']:,}", views_round=stats["views_round"])
            if re.search(r"\{\w+\}", T[k]):
                sys.exit(f"web/i18n.js {k}: unfilled placeholder in {T[k]!r}")

    # Share cards first: pages point at them only when they exist.
    chrome = None if args.no_og else og_cards.find_chrome()
    if not args.no_og and not chrome:
        print("warning: no Chrome found (set CHROME=...); share cards skipped, og:image falls back to line art",
              file=sys.stderr)
    if chrome:
        jobs = []
        picks_src = [p for p in poses if p["orig_id"]][:3] + [p for p in poses if not p["orig_id"]][:3]
        for loc in LOCS:
            T = S[loc]
            picks = [(TINT[p["ci"]], p["line"][1] or next(f for f in p["line"] if f)) for p in picks_src]
            jobs.append((og_cards.home_card(loc, T, picks), out / f"og/{loc}/home.png", 1200, 630))
            for p in poses:
                card = dict(p, name=p["name_" + NAME_KEY[loc]])
                jobs.append((og_cards.pose_card(loc, card, T, TINT[p["ci"]], p["class_" + NAME_KEY[loc]], p["line"]),
                             out / f"og/{loc}/{p['id']}.png", 1200, 630))
        jobs.append((og_cards.icon_page(180), out / "apple-touch-icon.png", 180, 180))
        jobs.append((og_cards.icon_page(512), out / "icon-512.png", 512, 512))
        fresh = og_cards.render(jobs, chrome)
        print(f"share cards: {len(jobs)} ({fresh} rendered, {len(jobs) - fresh} cached)")

    site = Site(site_url, args.repo.rstrip("/"), ver, S, poses, og=bool(chrome))
    write = lambda page, doc: ((out / page).mkdir(parents=True, exist_ok=True), (out / page / "index.html").write_text(doc))

    # Gallery home per language
    tpl = (ROOT / "web/index.html").read_text()
    compact = json.dumps(catalog, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    # Download sizes for the gallery's download panel; without a packs.json the panel links to the latest Release.
    packs_file = ROOT / "data/packs.json"
    packs = json.loads(packs_file.read_text()) if packs_file.exists() else None
    if packs and packs["version"] != ver:
        print(f"warning: data/packs.json is for v{packs['version']}, the site is v{ver}", file=sys.stderr)
    libs = {lib: library_data(lib) for lib in LIBS}
    nav = nav_data(libs, catalog)
    ltpl = (ROOT / "web/library.html").read_text()
    for loc in LOCS:
        T = S[loc]
        rel = Site.rel(PREFIX[loc])
        home = site.abs(PREFIX[loc])
        ld = {"@context": "https://schema.org", "@graph": [
            {"@type": "WebSite", "name": "Shisei", "alternateName": "Shisei 姿勢", "url": home, "inLanguage": HTML_LANG[loc],
             "description": T["metaDesc"]},
            {"@type": "Dataset", "name": T["metaTitle"], "description": T["metaDesc"], "url": home,
             "inLanguage": HTML_LANG[loc], "version": ver, "license": site_pages.LICENSE,
             "dateModified": stats["updated"],
             "distribution": [{"@type": "DataDownload", "encodingFormat": "application/json",
                               "contentUrl": site.abs("catalog.json")}]}]}
        head = site.head(loc, "", T["metaTitle"], T["metaDesc"], site.og_image(loc, "home"), T["ogAlt"], ld,
                         feed=f"{rel}{PREFIX[loc]}changelog/changelog.xml")
        noscript = "<noscript><nav class=\"wrap section\"><ul>" + "".join(
            f'<li><a href="{rel}{PREFIX[loc]}pose/{p["id"]}/">{p["id"]} {esc(p["name_" + NAME_KEY[loc]])}</a></li>'
            for p in poses) + "</ul></nav></noscript>"
        doc = (tpl.replace("__HEAD__", head).replace("__HTMLLANG__", HTML_LANG[loc]).replace("__LOC__", loc)
               .replace("__SKIP__", esc(T["skip"])).replace("__NOSCRIPT__", noscript)
               .replace("__CHANGELOG__", f"{rel}{PREFIX[loc]}changelog/").replace("__BASE__", rel)
               .replace("__CATALOG__", compact).replace("__REPO__", site.repo).replace("__VERSION__", ver)
               .replace("__PACKS__", json.dumps(packs, separators=(",", ":"))))
        write(PREFIX[loc], doc)

        # One page per library and language, like the gallery.
        for lib, D in libs.items():
            key = lib + "/"
            lrel = Site.rel(PREFIX[loc] + key)
            n, L = len(D["items"]), T["libs"][lib]
            meta = dict(name=L["name"], n=n, unit=L["unit"], sub=L["sub"])
            lhead = site.head(loc, key, fill(T["libTitle"], **meta), fill(T["libDesc"], **meta),
                              site.og_image(loc, "home"), T["ogAlt"], None)
            lnoscript = "<noscript><ul class=\"wrap\">" + "".join(
                f'<li>{c["id"]} {esc(c["n"][loc])}</li>' for c in D["items"]) + "</ul></noscript>"
            ldoc = (ltpl.replace("__HEAD__", lhead).replace("__HTMLLANG__", HTML_LANG[loc]).replace("__LOC__", loc)
                    .replace("__SKIP__", esc(T["skip"])).replace("__NOSCRIPT__", lnoscript)
                    .replace("__HOME__", lrel + PREFIX[loc] or "./").replace("__CHANGELOG__", f"{lrel}{PREFIX[loc]}changelog/")
                    .replace("__BASE__", lrel).replace("__DATAFILE__", f"{lrel}{LIBS[lib]['data']}.json")
                    .replace("__LIBDATA__", json.dumps(D, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/"))
                    .replace("__REPO__", site.repo).replace("__VERSION__", ver))
            write(PREFIX[loc] + key, ldoc)

        for i in range(len(poses)):
            write(*site.pose_page(loc, i))
        write(*site.changelog_page(loc, entries))
        (out / PREFIX[loc] / "changelog/changelog.xml").write_text(site.atom(loc, entries))

    (out / "404.html").write_text(site.not_found())

    # Static files
    for f in (ROOT / "web").iterdir():
        if f.is_file() and f.name not in ("index.html", "library.html", "changelog.yaml"):
            shutil.copy2(f, out / f.name)
    # Self-hosted Latin font subsets and their OFL licences (docs/LICENSING.md).
    shutil.copytree(ROOT / "web/fonts", out / "fonts")
    (out / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=1) + "\n")
    for lib, D in libs.items():
        (out / f"{LIBS[lib]['data']}.json").write_text(json.dumps(D, ensure_ascii=False, indent=1) + "\n")
    (out / "stats.json").write_text(json.dumps(stats, ensure_ascii=False, indent=1) + "\n")
    if args.link_images:
        (out / "images").symlink_to(ROOT / "images", target_is_directory=True)
    elif args.public:
        for kind, key in (("line", "views"), ("photo", "photos"), ("clay", "maps"), ("depth", "maps"), ("normal", "maps")):
            files = {f for p in catalog for f in (p.get(key) or {}).values() if f}
            for tier in ("w300", "w600", "w900"):
                (out / "images" / kind / tier).mkdir(parents=True)
                for f in sorted(files):
                    shutil.copy2(ROOT / "images" / kind / tier / f, out / "images" / kind / tier / f)
    else:
        shutil.copytree(ROOT / "images", out / "images", ignore=shutil.ignore_patterns("full"))
    # Library images: on the media host when there is one (a Pages deployment holds 20,000 files, and the libraries
    # would take the site past that), else beside the pages. Costumes and props ship their grey tiers only; the
    # transparent versions stay in the download packs.
    if args.public:
        mout = ROOT / args.media_out if args.media else out
        if args.media:
            shutil.rmtree(mout, ignore_errors=True)
            mout.mkdir()
            (mout / "_headers").write_text(MEDIA_HEADERS)
            (mout / "index.html").write_text(f'<!doctype html><meta charset="utf-8"><title>Shisei media</title><a href="{site_url}/">Shisei</a>\n')
        for lib, D in libs.items():
            for tier in ("w300", "w600", "w900"):
                d = mout / "images" / D["dir"] / tier
                d.mkdir(parents=True, exist_ok=True)
                for f in sorted({f for i in D["items"] for f in i["v"] if f}):
                    shutil.copy2(ROOT / "images" / D["dir"] / tier / f, d / f)
    # Every page gets the menu and tray data, and where library images live, before its scripts run.
    media = args.media.rstrip("/") + "/" if args.media else None
    for f in out.rglob("*.html"):
        doc = f.read_text()
        m = re.search(r'<script src="([./]*)i18n\.js', doc)
        if not m:
            continue
        rel = m.group(1)
        data = dict(nav, root=rel, media=media or rel)
        tag = "<script>window.SHISEI_NAV = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";</script>\n"
        f.write_text(doc[:m.start()] + tag + doc[m.start():])
    icons = [{"src": "favicon.svg", "sizes": "any", "type": "image/svg+xml"}]
    if chrome:
        icons += [{"src": "apple-touch-icon.png", "sizes": "180x180", "type": "image/png"},
                  {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"}]
    (out / "manifest.webmanifest").write_text(json.dumps({
        "name": "Shisei 姿勢", "short_name": "Shisei", "start_url": "./", "scope": "./", "display": "standalone",
        "background_color": "#F5F2ED", "theme_color": "#F5F2ED", "icons": icons}, ensure_ascii=False, indent=1))
    (out / ".nojekyll").write_text("")  # GitHub Pages: serve files as they are
    stamp_assets(out, ver)
    (out / "_headers").write_text(HEADERS)

    # sitemap.xml with hreflang alternates and the line art as image entries; robots.txt
    cat_day, cl_day = git_day("data/catalog.json"), entries[0]["date"]
    rows = []
    for key, day, imgs in ([("", cat_day, []), ("changelog/", cl_day, [])] +
                           [(lib + "/", git_day(f"data/{LIBS[lib]['data']}.json"), []) for lib in LIBS] +
                           [(f"pose/{p['id']}/", cat_day, [f for f in p["line"] if f]) for p in poses]):
        alts = "".join(f'<xhtml:link rel="alternate" hreflang="{HTML_LANG[l]}" href="{esc(site.abs(PREFIX[l] + key))}"/>'
                       for l in LOCS) + f'<xhtml:link rel="alternate" hreflang="x-default" href="{esc(site.abs(key))}"/>'
        im = "".join(f"<image:image><image:loc>{esc(site.abs('images/line/w900/' + f))}</image:loc></image:image>" for f in imgs)
        rows += [f"  <url><loc>{esc(site.abs(PREFIX[l] + key))}</loc><lastmod>{day}</lastmod>{alts}{im}</url>" for l in LOCS]
    (out / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
        + "\n".join(rows) + "\n</urlset>\n")
    (out / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {site.abs('sitemap.xml')}\n")

    bad = check_site(out, site_url)
    if bad:
        sys.exit("site check failed:\n  " + "\n  ".join(bad[:40]) + (f"\n  … {len(bad) - 40} more" if len(bad) > 40 else ""))
    print(f"built {out.relative_to(ROOT)}/ v{ver} for {site_url}{' (public)' if args.public else ''}: "
          f"{len(catalog)} gallery poses, {len(poses)} pose pages × {len(LOCS)} languages, "
          f"{len(entries)} changelog entries, {len(rows)} sitemap URLs")


if __name__ == "__main__":
    main()
