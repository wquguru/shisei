#!/usr/bin/env python3
"""Review sheets for the scene / prop / furniture / light / animal libraries (port of costume_sheets.py).

One sheet per item: ID, name, 要点 and the card's English description in the header, then its views in a grid of at
most three per row, so five-view items stay large enough to count legs, tails and furniture slats after the Read
tool downscales the sheet. Matted libraries show the cut-out on the dark composite (matting errors show up there);
the others show the delivered image. Also writes batch files of N sheets for the qc-reviewer agents
(docs/qc/<lib>_prompt.md).

Usage: uv run --with pillow python -I tools/series_sheets.py prop ~/Downloads/run01-src/prop OUT [--per 25] [--only T001,…]
"""
import argparse, json, pathlib, sys, textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import series_kit as K

PW, PH, COLS = 450, 600, 3
FONT = "/System/Library/Fonts/Hiragino Sans GB.ttc"
VIEW_ZH = {"eye": "平视", "above": "俯视", "below": "仰视", "front": "正面", "back": "背面", "side": "侧面", "diag": "斜侧"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("lib", choices=sorted(K.LIBS))
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--per", type=int, default=25)
    ap.add_argument("--only", default="", help="comma-separated IDs, e.g. the items of a repair run")
    a = ap.parse_args()
    cfg = K.LIBS[a.lib]
    src, out = pathlib.Path(a.src).expanduser(), pathlib.Path(a.out).expanduser()
    (out / "sheets").mkdir(parents=True, exist_ok=True)
    big, small = ImageFont.truetype(FONT, 30), ImageFont.truetype(FONT, 20)
    sub = "dark" if cfg["matte"] else "raw"
    items = [i for i in json.loads((ROOT / cfg["out"]).read_text())["items"]
             if not a.only or i["id"] in a.only.split(",")]
    made = []
    for i in items:
        # animals are drawn and reviewed from their main view outwards; others keep the library order
        views = K.ANIMAL_ORDER[i.get("main", "front")] if a.lib == "animal" else cfg["views"]
        files = [src / sub / f"{i['id']}_{v}.png" for v in views]
        if not any(f.exists() for f in files):
            continue
        desc = textwrap.wrap("desc: " + i["desc_en"], 120)[:5]
        checks = textwrap.wrap("要点：" + "  ".join(f"{'①②③④⑤⑥⑦⑧'[k]}{t}" for k, t in enumerate(i["checks"])), 60)
        head = 60 + 30 * len(checks) + 26 * len(desc) + 50
        cols = min(COLS, len(views))
        rows = (len(views) + cols - 1) // cols
        sheet = Image.new("RGB", (PW * cols, head + (PH + 40) * rows), (245, 242, 237))
        d = ImageDraw.Draw(sheet)
        main = f"   主图 {VIEW_ZH[i['main']]}" if a.lib == "animal" else ""
        d.text((16, 12), f"{i['id']}  {i['name_zh']}{main}", font=big, fill=(24, 24, 27))
        y = 60
        for t in checks:
            d.text((16, y), t, font=small, fill=(63, 61, 57)); y += 30
        for t in desc:
            d.text((16, y), t, font=small, fill=(110, 106, 100)); y += 26
        for k, (v, f) in enumerate(zip(views, files)):
            x, y = (k % cols) * PW, head + (k // cols) * (PH + 40)
            d.text((x + 16, y + 6), f"{VIEW_ZH[v]} {v}", font=small, fill=(24, 24, 27))
            if f.exists():
                sheet.paste(Image.open(f).convert("RGB").resize((PW, PH), Image.LANCZOS), (x, y + 40))
            else:
                d.rectangle((x + 8, y + 48, x + PW - 8, y + 40 + PH - 8), outline=(150, 150, 150), width=3)
                d.text((x + 150, y + 40 + PH // 2), "未生成", font=big, fill=(120, 120, 120))
        p = out / "sheets" / f"{i['id']}.jpg"
        sheet.save(p, quality=88)
        made.append(str(p))
    for n in range(0, len(made), a.per):
        (out / f"batch_{n // a.per + 1:02d}.txt").write_text("\n".join(made[n:n + a.per]) + "\n")
    print(f"{a.lib}: {len(made)} sheets, {(len(made) + a.per - 1) // a.per} batches -> {out}")


if __name__ == "__main__":
    main()
