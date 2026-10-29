#!/usr/bin/env python3
"""Merge one generated series (a pose-gallery-* folder) into data/catalog.json.

Usage: python3 tools/import_series.py SRC --series sexy --added 0.2.0 [--general Cute,...]
Entries of that series are replaced; others are kept. Views become bare file names (null = not generated).
--general lists class_en values rated "general"; every other category of the series is "suggestive".
Without --general the whole series is rated by --rating (default general).
"""
import argparse, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWS = ("front", "diag", "side", "above", "below")
FIELDS = ("id", "orig_id", "series", "added_in", "rating", "class_jp", "class_cn", "class_en", "class_kr",
          "name_jp", "name_cn", "name_en", "name_kr", "desc_en", "views", "photos")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--series", required=True)
    ap.add_argument("--added", required=True)
    ap.add_argument("--general", default="")
    ap.add_argument("--rating", default="general", choices=("general", "suggestive"))
    a = ap.parse_args()
    general = {s for s in a.general.split(",") if s}
    src = json.loads((pathlib.Path(a.src).expanduser() / "catalog.json").read_text())
    path = ROOT / "data/catalog.json"
    cat = [p for p in json.loads(path.read_text()) if p.get("series") != a.series]
    for p in src:
        q = dict(p)
        q["series"] = a.series
        q["added_in"] = a.added
        q["rating"] = ("general" if p["class_en"] in general else "suggestive") if general else a.rating
        q.setdefault("desc_en", "")
        q["views"] = {v: (pathlib.Path(p["views"][v]).name if p["views"].get(v) else None) for v in VIEWS}
        q.setdefault("photos", [])
        cat.append({k: q.get(k) for k in FIELDS})
    path.write_text(json.dumps(cat, ensure_ascii=False, indent=1) + "\n")
    print(f"{a.series}: {len(src)} poses; catalog now {len(cat)}")


if __name__ == "__main__":
    main()
