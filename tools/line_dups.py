#!/usr/bin/env python3
"""Flag views of one pose that are practically the same image (the edit model sometimes ignores the target angle).

Usage: python3 tools/line_dups.py OUT.json std=SRC_IMG_DIR sexy=SRC_IMG_DIR upper=SRC_IMG_DIR
Lines are thickened with a min filter, then compared at 96x128; the same image scores < 6, distinct angles > 8.
The non-front (later) view of each near-identical pair is flagged.
"""
import itertools, json, pathlib, sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWS = ("front", "diag", "side", "above", "below")


def main() -> None:
    out, srcs, flags = pathlib.Path(sys.argv[1]), dict(a.split("=", 1) for a in sys.argv[2:]), []
    for p in json.loads((ROOT / "data/catalog.json").read_text()):
        d = pathlib.Path(srcs[p["series"]]).expanduser()
        im = {v: np.asarray(Image.open(d / p["views"][v]).convert("L").filter(ImageFilter.MinFilter(5)).resize((96, 128)), dtype=float)
              for v in VIEWS if p["views"].get(v)}
        for a, b in itertools.combinations(im, 2):
            diff = float(np.abs(im[a] - im[b]).mean())
            if diff < 6:
                flags.append({"set": p["id"], "angle": b, "kind": "structure", "reason": f"same image as {a} (diff {diff:.1f})"})
    out.write_text(json.dumps(flags, ensure_ascii=False, indent=1))
    print(f"duplicate panels {len(flags)}")


if __name__ == "__main__":
    main()
