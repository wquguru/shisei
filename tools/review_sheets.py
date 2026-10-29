#!/usr/bin/env python3
"""Contact sheets for the line-art QC review: up to 3 panels per sheet, 600x800 each, from full-size sources.

Usage: python3 tools/review_sheets.py OUT_DIR std=SRC_IMG_DIR sexy=SRC_IMG_DIR upper=SRC_IMG_DIR
Sheet name <id>__<view>-<view>.jpg; the title line carries id, pose name and what the panel must show.
"""
import json, pathlib, sys

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWS = ("front", "diag", "side", "above", "below")
EXPECT = {
    "std": "1 woman, full body",
    "sexy": "1 woman, full body",
    "upper": "1 woman, upper-body framing (head to hips); full body visible is acceptable",
}


def main() -> None:
    out = pathlib.Path(sys.argv[1])
    srcs = dict(a.split("=", 1) for a in sys.argv[2:])
    out.mkdir(parents=True, exist_ok=True)
    W, H, n = 600, 800, 0
    for p in json.loads((ROOT / "data/catalog.json").read_text()):
        src = pathlib.Path(srcs[p["series"]]).expanduser()
        views = [v for v in VIEWS if p["views"].get(v)]
        for i in range(0, len(views), 3):
            chunk = views[i:i + 3]
            sh = Image.new("RGB", (W * len(chunk), H + 40), "white")
            dr = ImageDraw.Draw(sh)
            dr.text((8, 6), f"{p['id']} | {p['name_en']} | expected: {EXPECT[p['series']]}", fill="black")
            for j, v in enumerate(chunk):
                sh.paste(Image.open(src / p["views"][v]).convert("RGB").resize((W, H)), (j * W, 40))
                dr.text((j * W + 8, 24), v, fill="red")
            sh.save(out / f"{p['id']}__{'-'.join(chunk)}.jpg", quality=88)
            n += 1
    print(f"sheets {n}")


if __name__ == "__main__":
    main()
