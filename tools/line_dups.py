#!/usr/bin/env python3
"""Flag views of one pose that are practically the same image (the edit model sometimes ignores the target angle).

Usage: python3 tools/line_dups.py OUT.json std=SRC_IMG_DIR sexy=SRC_IMG_DIR upper=SRC_IMG_DIR
       python3 tools/line_dups.py data/qc-input/dups_digi.json --source digi digi=SRC_IMG_DIR
       python3 tools/line_dups.py data/qc-input/dups_fill-r1.json --source fill-r1 fill-r1=DIR std=SRC_IMG_DIR …
With --source only views from that source are checked (a redrawn set, or single-view fills compared against the rest
of their set) and the output is tagged with it (qc_merge.py); only a view from that source is ever flagged.
Lines are thickened with a min filter, then compared at 96x128; the same image scores < 6, distinct angles > 8.
The non-front (later) view of each near-identical pair is flagged.
"""
import itertools, json, pathlib, sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWS = ("front", "diag", "side", "above", "below")


def main() -> None:
    args = sys.argv[2:]
    source = args[args.index("--source") + 1] if "--source" in args else None
    args = [x for x in args if "=" in x]
    out, srcs, flags = pathlib.Path(sys.argv[1]), dict(a.split("=", 1) for a in args), []
    for p in json.loads((ROOT / "data/catalog.json").read_text()):
        vsrc = {v: p.get("fills", {}).get(v) or p.get("source") or p["series"] for v in VIEWS if p["views"].get(v)}
        vsrc = {v: s for v, s in vsrc.items() if s in srcs}
        mine = {v for v, s in vsrc.items() if s == (source or p["series"])}
        if not mine:
            continue
        im = {v: np.asarray(Image.open(pathlib.Path(srcs[s]).expanduser() / p["views"][v]).convert("L")
                            .filter(ImageFilter.MinFilter(5)).resize((96, 128)), dtype=float) for v, s in vsrc.items()}
        for a, b in itertools.combinations(im, 2):
            diff = float(np.abs(im[a] - im[b]).mean())
            flag = b if b in mine else a
            # Only a fill is compared across sources: it must differ from the views it was added next to.
            if flag not in mine or ({a, b} - mine and p.get("fills", {}).get(flag) != source):
                continue
            if diff < 6:
                flags.append({"set": p["id"], "angle": flag, "kind": "structure",
                              "reason": f"same image as {a if flag == b else b} (diff {diff:.1f})"})
    out.write_text(json.dumps({"source": source, "fails": flags} if source else flags, ensure_ascii=False, indent=1))
    print(f"duplicate panels {len(flags)}")


if __name__ == "__main__":
    main()
