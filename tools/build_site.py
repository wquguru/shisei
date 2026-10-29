#!/usr/bin/env python3
"""Build the static gallery into site/ from web/ and data/catalog.json.

Usage: python3 tools/build_site.py [--repo URL] [--link-images] [--out site]
--link-images symlinks images/ instead of copying (fast local preview).
"""
import argparse, json, pathlib, re, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent


def version() -> str:
    m = re.search(r"^## \[(\d+\.\d+\.\d+)\]", (ROOT / "CHANGELOG.md").read_text(), re.M)
    return m.group(1) if m else "0.0.0"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default="https://github.com/wquguru/shisei")
    ap.add_argument("--out", default="site")
    ap.add_argument("--link-images", action="store_true")
    args = ap.parse_args()

    out = ROOT / args.out
    if out.is_symlink() or out.is_file():
        out.unlink()
    elif out.exists():
        shutil.rmtree(out)
    out.mkdir()

    catalog = (ROOT / "data/catalog.json").read_text()
    compact = json.dumps(json.loads(catalog), ensure_ascii=False, separators=(",", ":"))
    ver = version()
    html = (ROOT / "web/index.html").read_text()
    # "</" would end the inline <script>; the catalog never needs a literal one.
    html = html.replace("__CATALOG__", compact.replace("</", "<\\/"))
    html = html.replace("__REPO__", args.repo.rstrip("/")).replace("__VERSION__", ver)
    (out / "index.html").write_text(html)

    for f in (ROOT / "web").iterdir():
        if f.name != "index.html" and f.is_file():
            shutil.copy2(f, out / f.name)
    shutil.copy2(ROOT / "data/catalog.json", out / "catalog.json")

    if args.link_images:
        (out / "images").symlink_to(ROOT / "images", target_is_directory=True)
    else:
        shutil.copytree(ROOT / "images", out / "images", ignore=shutil.ignore_patterns("full"))
    print(f"built {out.relative_to(ROOT)}/ v{ver} ({len(json.loads(catalog))} poses)")


if __name__ == "__main__":
    main()
