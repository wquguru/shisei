#!/usr/bin/env python3
"""Costume review sheets: one sheet per item, its four views side by side on the dark composite (matting errors and
stray grey show up there), with the ID, name, expected gender and the 形制要点 in the header. Also writes batch files
of N sheets each for the qc-reviewer agents (docs/qc/costume_prompt.md).

Usage: uv run --with pillow python -I tools/costume_sheets.py ~/Downloads/costume-hc OUT [--cat HC] [--per 28]
"""
import argparse, json, pathlib
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWS = (("front", "正面"), ("back", "背面"), ("side", "侧面"), ("diag", "斜侧"))
PW, PH, HEAD = 450, 600, 150
FONT = "/System/Library/Fonts/Hiragino Sans GB.ttc"
GENDER = {"F": "女装", "M": "男装", "U": "中性"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--cat", default="")
    ap.add_argument("--per", type=int, default=28)
    a = ap.parse_args()
    src, out = pathlib.Path(a.src).expanduser(), pathlib.Path(a.out).expanduser()
    (out / "sheets").mkdir(parents=True, exist_ok=True)
    big, small = ImageFont.truetype(FONT, 30), ImageFont.truetype(FONT, 22)
    items = [i for i in json.loads((ROOT / "data/costumes.json").read_text())["items"] if not a.cat or i["cat"] == a.cat]
    made = []
    for i in items:
        files = [src / "dark" / f"{i['id']}_{v}.png" for v, _ in VIEWS]
        if not any(f.exists() for f in files):
            continue
        sheet = Image.new("RGB", (PW * 4, PH + HEAD), (245, 242, 237))
        d = ImageDraw.Draw(sheet)
        era = f"{i['era_zh']} · " if i.get("era_zh") else ""
        d.text((16, 12), f"{i['id']}  {era}{i['name_zh']}   [{GENDER[i['gender']]}]", font=big, fill=(24, 24, 27))
        d.text((16, 56), "要点：" + "  ".join(f"{'①②③④⑤⑥'[k]}{t}" for k, t in enumerate(i["checks"])),
               font=small, fill=(63, 61, 57))
        for k, ((v, zh), f) in enumerate(zip(VIEWS, files)):
            x = k * PW
            d.text((x + 16, HEAD - 40), f"{zh} {v}", font=small, fill=(24, 24, 27))
            if f.exists():
                sheet.paste(Image.open(f).resize((PW, PH), Image.LANCZOS), (x, HEAD))
            else:
                d.rectangle((x + 8, HEAD + 8, x + PW - 8, HEAD + PH - 8), outline=(150, 150, 150), width=3)
                d.text((x + 150, HEAD + PH // 2), "未生成", font=big, fill=(120, 120, 120))
        p = out / "sheets" / f"{i['id']}.jpg"
        sheet.save(p, quality=88)
        made.append(str(p))
    for n in range(0, len(made), a.per):
        (out / f"batch_{n // a.per + 1:02d}.txt").write_text("\n".join(made[n:n + a.per]) + "\n")
    print(f"{len(made)} sheets, {(len(made) + a.per - 1) // a.per} batches -> {out}")


if __name__ == "__main__":
    main()
