#!/usr/bin/env python3
"""Stage whole-set redraws from another generator as a new source and point their catalog entries at it.

Usage: python3 tools/import_redraws.py SRC OUT --source digi [--only P019,U051,...]
SRC is a redraw delivery with index.json (one row per set: set, shisei_id) and <group>/<set>/<view>.png.
Each listed view is written losslessly to OUT/img/<series>_<ID>_<view>.webp, the name the tiers use, so OUT works
as a source set for build_images.py, review_sheets.py, line_dups.py and pack_release.py (`--src digi=OUT`).
In data/catalog.json the pose gets `source` and its views are replaced as a whole set: a view the delivery lacks
becomes null, never a view kept from the old drawing (AGENTS §2, no mixing within a set). Names, class, rating and
orig_id stay; ja is the original naming and the delivery's own labels are not imported.
--only takes the sets a person chose after QC (docs/GENERATION.md); the others keep their original drawing.
Run qc_merge.py afterwards: results from other sources no longer apply to these poses (docs/qc/README.md).
"""
import argparse, json, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWS = ("front", "diag", "side", "above", "below")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--source", required=True)
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    src, out = pathlib.Path(a.src).expanduser(), pathlib.Path(a.out).expanduser()
    (out / "img").mkdir(parents=True, exist_ok=True)
    path = ROOT / "data/catalog.json"
    cat = json.loads(path.read_text())
    by_id = {p["id"]: p for p in cat}
    n = 0
    only = {s for s in a.only.split(",") if s}
    for row in json.loads((src / "index.json").read_text()):
        if only and row["shisei_id"] not in only:
            continue
        p = by_id[row["shisei_id"]]
        views = {}
        for v in VIEWS:
            png = next(src.glob(f"*/{row['set']}/{v}.png"), None)
            if png is None:
                views[v] = None
                continue
            name = f"{p['series']}_{p['id']}_{v}.webp"
            subprocess.run(["cwebp", "-quiet", "-lossless", "-metadata", "none", str(png), "-o", str(out / "img" / name)],
                           check=True)
            views[v] = name
            n += 1
        p["source"] = a.source
        p["views"] = views
        p["gaps"] = {}
    path.write_text(json.dumps(cat, ensure_ascii=False, indent=1) + "\n")
    print(f"{a.source}: {n} views staged in {out / 'img'}")


if __name__ == "__main__":
    main()
