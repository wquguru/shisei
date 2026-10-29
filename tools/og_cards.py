"""Share cards (1200×630 PNG) and app icons for the static site, rendered with headless Chrome.

Chrome is the only compositor this repo can count on (no PIL, no ImageMagick), and a card is just HTML: line art
multiplied onto its category colour, the same look as the gallery. Renders are cached in build/og-cache/ under a
hash of the card's HTML and the image files it uses, so a rebuild only renders what changed. Only line art goes on
cards (photo renders wait on docs/DECISIONS.md D-03).
"""
import concurrent.futures, hashlib, html, os, pathlib, shutil, subprocess, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / "build/og-cache"
W, H = 1200, 630

FONTS = {
    "zh": "'PingFang SC', 'Hiragino Sans GB', 'Noto Sans CJK SC', 'Noto Sans SC'",
    "ja": "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans CJK JP', 'Noto Sans JP'",
    "en": "'Helvetica Neue', 'Inter', 'Noto Sans'",
    "ko": "'Apple SD Gothic Neo', 'Noto Sans CJK KR', 'Noto Sans KR'",
}
LOGO = ('<svg width="{s}" height="{s}" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#18181B"/>'
        '<circle cx="60" cy="23" r="8" fill="none" stroke="#F5F2ED" stroke-width="6"/>'
        '<path d="M57 37C38 52 42 68 64 82" fill="none" stroke="#E07A52" stroke-width="11" stroke-linecap="round"/></svg>')


def find_chrome():
    cands = [os.environ.get("CHROME"), "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
             shutil.which("google-chrome"), shutil.which("google-chrome-stable"), shutil.which("chromium"),
             shutil.which("chromium-browser")]
    return next((c for c in cands if c and pathlib.Path(c).exists()), None)


def _img(f):
    return (ROOT / "images/line/w900" / f).as_uri()


def _page(loc, body, w=W, h=H):
    return f"""<!doctype html><meta charset="utf-8"><style>
html,body{{margin:0;width:{w}px;height:{h}px;overflow:hidden;background:#F5F2ED;color:#18181B;
  font-family:{FONTS[loc]},'PingFang SC','Hiragino Sans','Apple SD Gothic Neo',sans-serif;-webkit-font-smoothing:antialiased}}
.l{{position:absolute;left:64px;top:56px;bottom:56px;width:470px;display:flex;flex-direction:column}}
.brand{{display:flex;align-items:center;gap:14px;font:800 30px/1 'Helvetica Neue',sans-serif;letter-spacing:-0.02em}}
.meta{{margin-top:auto;font:500 24px/1.3 Menlo,monospace;color:#6B6862}}
.name{{margin:14px 0 0;font-size:54px;line-height:1.16;font-weight:800;letter-spacing:-0.02em;
  display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}}
.chips{{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}}
.chip{{height:40px;padding:0 18px;border-radius:999px;display:inline-flex;align-items:center;font-size:20px;font-weight:600;
  background:#ECE7DF;color:#3F3D39}}
.chip.y{{background:#F2F08A;color:#18181B}}
.r{{position:absolute;right:56px;top:56px;bottom:56px;width:584px;display:grid;gap:14px}}
.t{{border-radius:28px;overflow:hidden;display:flex;align-items:center;justify-content:center}}
.t img{{width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply}}
.big{{font:800 92px/1 'Helvetica Neue',sans-serif;letter-spacing:-0.05em;text-shadow:3px 4px 0 #EDB79C;margin-top:auto}}
.line{{margin-top:22px;font-size:40px;font-weight:800;letter-spacing:-0.01em}}
.sub{{margin-top:14px;font-size:24px;line-height:1.45;color:#55534E}}
</style><body>{body}</body>"""


def pose_card(loc, p, T, tint, cat, views):
    """views: the pose's line files in VIEWS order (None for a gap). Big tile is the front, two small ones diag/side."""
    have = [f for f in views if f]
    big = views[0] or have[0]
    small = [f for f in (views[1], views[2], views[3], views[4]) if f and f != big][:2]
    tiles = (f'<div class="t" style="background:{tint};grid-row:1/3"><img src="{_img(big)}"></div>' +
             "".join(f'<div class="t" style="background:{tint}"><img src="{_img(f)}"></div>' for f in small))
    chips = f'<span class="chip y">{html.escape(T["anglesN"].format(n=len(have)))}</span>' + "".join(
        f'<span class="chip">{html.escape(v)}</span>' for v, f in zip(T["views"], views) if f)
    body = (f'<div class="l"><div class="brand">{LOGO.format(s=52)}Shisei</div>'
            f'<div class="meta">{p["id"]} · {html.escape(cat)}</div>'
            f'<h1 class="name">{html.escape(p["name"])}</h1><div class="chips">{chips}</div></div>'
            f'<div class="r" style="grid-template-columns:388px 182px;grid-template-rows:1fr 1fr">{tiles}</div>')
    return _page(loc, body)


def home_card(loc, T, picks):
    """picks: six (tint, file) pairs for the 3×2 tile grid."""
    tiles = "".join(f'<div class="t" style="background:{t}"><img src="{_img(f)}"></div>' for t, f in picks)
    body = (f'<div class="l"><div class="brand">{LOGO.format(s=64)}</div><div class="big">Shisei</div>'
            f'<div class="line">{html.escape(T["ogLine"])}</div><div class="sub">{html.escape(T["ogSub"])}</div></div>'
            f'<div class="r" style="grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr">{tiles}</div>')
    return _page(loc, body)


def icon_page(size):
    # Full-bleed square: iOS and Android round the corners themselves.
    return (f'<!doctype html><style>html,body{{margin:0;width:{size}px;height:{size}px;overflow:hidden;background:#18181B}}'
            f'svg{{display:block}}</style>' + LOGO.format(s=size).replace('rx="24"', 'rx="0"'))


def _key(doc):
    h = hashlib.sha1(doc.encode())
    for uri in sorted(set(part.split('"')[0] for part in doc.split('src="file://')[1:])):
        f = pathlib.Path("/" + uri.lstrip("/"))
        st = f.stat()
        h.update(f"{f.name}:{st.st_size}:{st.st_mtime_ns}".encode())
    return h.hexdigest()[:20]


def _shoot(chrome, doc, out, w, h):
    key = _key(doc)
    cached = CACHE / f"{key}.png"
    if not cached.exists():
        src = CACHE / f"{key}.html"
        src.write_text(doc)
        with tempfile.TemporaryDirectory() as prof:
            subprocess.run([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
                            "--no-default-browser-check", f"--user-data-dir={prof}", f"--window-size={w},{h}",
                            "--virtual-time-budget=3000", f"--screenshot={cached}", src.as_uri()],
                           check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
        src.unlink()
        if not cached.exists():
            raise RuntimeError(f"chrome wrote no screenshot for {out.name}")
    out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(cached, out)


def render(jobs, chrome, workers=6):
    """jobs: (html, out_path, w, h). Returns how many were rendered fresh (not from cache)."""
    CACHE.mkdir(parents=True, exist_ok=True)
    fresh = sum(1 for doc, *_ in jobs if not (CACHE / f"{_key(doc)}.png").exists())
    with concurrent.futures.ThreadPoolExecutor(workers) as ex:
        list(ex.map(lambda j: _shoot(chrome, *j), jobs))
    return fresh
