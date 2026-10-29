#!/usr/bin/env python3
"""Contact sheets for the QC reviews (docs/qc/README.md), drawn from full-size sources.

Usage: python3 tools/review_sheets.py OUT_DIR [--mode MODE] [--passed] std=SRC sexy=SRC upper=SRC duo=SRC
SRC is a source set (e.g. ~/Downloads/pose-gallery-std73); line art is read from SRC/img, photos from SRC/photo.
Only the series given are drawn, so one series can be reviewed on its own.

Modes (each pairs with a prompt in docs/qc/):
  panels      up to 3 views per sheet, 600x800 each        review_prompt.md      <id>__<view>-<view>.jpg
  name        first 3 views of a set on one sheet           name_prompt.md        <id>.jpg
  proportion  every view of a set, 360x480 each             proportion_prompt.md  <id>.jpg
  rating      first 3 views of a set on one sheet           rating_prompt.md      <id>.jpg
  photo       up to 3 photo renders per sheet, 400x800      photo_prompt.md       <id>__<view>-<view>.jpg
Views are every generated file (catalog or qc.json), so a failed view can be re-reviewed; --passed keeps only the
views now in the catalog — use it for proportion and rating, which judge what ships.
A batch file for a reviewer is just a list of sheet paths: `ls OUT_DIR/*.jpg | split -l 35 - OUT_DIR/batch_`.
"""
import argparse, json, pathlib

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWS = ("front", "diag", "side", "above", "below")
EXPECT = {
    "std": "1 woman, full body",
    "sexy": "1 woman, full body",
    "upper": "1 woman, upper-body framing (head to hips); full body visible is acceptable",
    "duo": "2 figures in contact, full body",
}
BODIES = {"MF": "1 man (broad shoulders) + 1 woman", "FF": "2 women"}
# panel size, views per sheet (None = all), per-set sheet name
MODES = {"panels": ((600, 800), 3, False), "name": ((600, 800), 3, True), "proportion": ((360, 480), None, True),
         "rating": ((600, 800), 3, True), "photo": ((400, 800), 3, False)}


def sheet(path, title, panels, size):
    w, h = size
    sh = Image.new("RGB", (w * len(panels), h + 40), "white")
    dr = ImageDraw.Draw(sh)
    dr.text((8, 6), title, fill="black")
    for j, (label, f) in enumerate(panels):
        sh.paste(Image.open(f).convert("RGB").resize((w, h)), (j * w, 40))
        dr.text((j * w + 8, 24), label, fill="red")
    sh.save(path, quality=88)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--mode", default="panels", choices=MODES)
    ap.add_argument("--passed", action="store_true")
    ap.add_argument("srcs", nargs="+", metavar="series=SRC")
    a = ap.parse_args()
    srcs = {k: pathlib.Path(v).expanduser() for k, v in (s.split("=", 1) for s in a.srcs)}
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    size, per, per_set = MODES[a.mode]
    qc_path = ROOT / "data/qc.json"
    qc = json.loads(qc_path.read_text()) if qc_path.exists() else {}
    n = 0
    for p in json.loads((ROOT / "data/catalog.json").read_text()):
        if p["series"] not in srcs:
            continue
        src, pid = srcs[p["series"]], p["id"]
        expect = EXPECT[p["series"]] + (f" ({BODIES[p['bodies']]})" if p.get("bodies") else "")
        if a.mode == "photo":
            files = {v: r["file"] for v, r in qc.get("photos", {}).get(pid, {}).items()} | (p.get("photos") or {})
            if a.passed:
                files = p.get("photos") or {}
            panels = [(v, src / "photo" / files[v]) for v in VIEWS if v in files]
            title = f"{pid} | {p['name_en']} | {p['class_en']} | expected: 1 adult woman, photo render, full body"
        else:
            files = {v: (p["views"].get(v) or (None if a.passed else qc.get("views", {}).get(pid, {}).get(v, {}).get("file")))
                     for v in VIEWS}
            panels = [(v, src / "img" / files[v]) for v in VIEWS if files[v]]
            title = {"panels": f"{pid} | {p['name_en']} | expected: {expect}",
                     "name": f"{pid} | {p['class_en']} | {p['name_en']} | ja: {p['name_jp']}"
                             + (f" | bodies {p['bodies']}" if p.get("bodies") else ""),
                     "proportion": f"{pid} | {p['name_en']} | bodies {p.get('bodies') or 'F'}",
                     "rating": f"{pid} | {p['series']} | {p['class_en']} | {p['name_en']}"}[a.mode]
        if not panels:
            continue
        if per_set:
            sheet(out / f"{pid}.jpg", title, panels[:per], size)
            n += 1
            continue
        for i in range(0, len(panels), per):
            chunk = panels[i:i + per]
            sheet(out / f"{pid}__{'-'.join(v for v, _ in chunk)}.jpg", title, chunk, size)
            n += 1
    print(f"{a.mode}: {n} sheets in {out}")


if __name__ == "__main__":
    main()
