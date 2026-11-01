#!/usr/bin/env python3
"""Fail map views that do not line up with their line art (docs/qc/maps_prompt.md).

Usage: python3 tools/map_align.py OUT.json maps=~/Downloads/pose-gallery-clay [--min 0.9]
The lightbox lays clay, depth and normal over the line art, so a view whose render drifted (upper-body clay drawn
as a full figure at another scale, a limb moved) is useless there even when the render itself is clean. Score: the
share of the drawing's dark pixels that fall on the depth silhouette, grown by 8 px. Hand-checked on the first run:
0.92 and up overlays cleanly, 0.81 and below is visibly off. The output is a `maps_*.json` result for qc_merge.py.
"""
import argparse, json, pathlib

import numpy as np
from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWS = ("front", "diag", "side", "above", "below")


def score(line, depth):
    d = Image.open(depth).convert("L")
    body = np.asarray(d.point(lambda x: 255 if x > 12 else 0).filter(ImageFilter.MaxFilter(17))) > 0
    ink = np.asarray(Image.open(line).convert("L").resize(d.size)) < 140
    return float((ink & body).sum() / max(ink.sum(), 1))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("maps")
    ap.add_argument("--min", type=float, default=0.9)
    a = ap.parse_args()
    maps = pathlib.Path(a.maps.split("=", 1)[1]).expanduser()
    fails, checked = [], []
    for p in json.loads((ROOT / "data/catalog.json").read_text()):
        for v in VIEWS:
            f = p["views"].get(v)
            if not f or not (maps / "depth" / f).exists():
                continue
            s = score(ROOT / "images/line/w900" / f, maps / "depth" / f)
            checked.append(f)
            if s < a.min:
                fails.append({"set": p["id"], "angle": v, "kind": "structure",
                              "reason": f"map not aligned with the line art (overlap {s:.2f})"})
    pathlib.Path(a.out).write_text(json.dumps({"checked": checked, "fails": fails}, indent=1) + "\n")
    print(f"{len(checked)} views, {len(fails)} below {a.min}")


if __name__ == "__main__":
    main()
