#!/usr/bin/env python3
"""Stage single-view fills from the original generator (Muse) and point those catalog views at them.

Usage: python3 tools/import_fills.py DELIVERY OUT --source fill-r1
DELIVERY holds img/<series>_<ID>_<view>.webp (a Muse batch, docs/GENERATION.md); each file is copied to OUT/img
under the same name, so OUT works as a source set (`fill-r1=OUT`) for build_images.py, review_sheets.py,
line_dups.py and pack_release.py. In data/catalog.json the view gets `fills: {view: source}` and its file name, so the
next review sees it; qc_merge.py then judges it on reviews tagged with that source only.
A fill is the same generator and mannequin as the rest of its set, so it may sit next to the set's other views. It is
refused for redrawn sets (catalog `source`, D-09: five views from one drawing) and for views that already pass.
"""
import argparse, json, pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
NAME = re.compile(r"^([a-z]+)_([A-Z]\d{3})_(front|diag|side|above|below)\.webp$")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("delivery")
    ap.add_argument("out")
    ap.add_argument("--source", required=True)
    a = ap.parse_args()
    src, out = pathlib.Path(a.delivery).expanduser(), pathlib.Path(a.out).expanduser()
    (out / "img").mkdir(parents=True, exist_ok=True)
    path = ROOT / "data/catalog.json"
    cat = json.loads(path.read_text())
    by_id = {p["id"]: p for p in cat}
    staged, errs = [], []
    for f in sorted((src / "img").glob("*.webp")):
        m = NAME.match(f.name)
        p = by_id.get(m.group(2)) if m else None
        if p is None or p["series"] != m.group(1):
            errs.append(f"{f.name}: not a catalog view name")
        elif p.get("source"):
            errs.append(f"{f.name}: {p['id']} is a redrawn set ({p['source']}); fills would mix two drawings")
        elif p["views"].get(m.group(3)) and p.get("fills", {}).get(m.group(3)) != a.source:
            errs.append(f"{f.name}: view already passes")
        else:
            staged.append((p, m.group(3), f))
    if errs:
        sys.exit("\n".join(errs))
    for p, v, f in staged:
        shutil.copy2(f, out / "img" / f.name)
        p.setdefault("fills", {})[v] = a.source
        p["views"][v] = f.name
        p["gaps"].pop(v, None)
    path.write_text(json.dumps(cat, ensure_ascii=False, indent=1) + "\n")
    print(f"{a.source}: {len(staged)} views staged in {out / 'img'}; run the review, then qc_merge.py")


if __name__ == "__main__":
    main()
