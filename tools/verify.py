#!/usr/bin/env python3
"""Check data/catalog.json against images/: every listed view exists in both tiers, no orphans.

Known gaps are declared here so a new gap fails loudly instead of slipping in.
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
KNOWN_GAPS = {("P062", "below")}  # 9 attempts, see docs/GENERATION.md
VIEWS = ("front", "diag", "side", "above", "below")

def main() -> int:
    cat = json.loads((ROOT / "data/catalog.json").read_text())
    errs, listed = [], set()
    for p in cat:
        for v in VIEWS:
            f = p["views"].get(v)
            if f is None:
                if (p["id"], v) not in KNOWN_GAPS:
                    errs.append(f"{p['id']} {v}: missing view not in KNOWN_GAPS")
                continue
            listed.add(f)
            for tier in ("w300", "w900"):
                if not (ROOT / "images/line" / tier / f).exists():
                    errs.append(f"{p['id']} {v}: images/line/{tier}/{f} missing")
        for v in p.get("photos", []):
            for tier in ("w300", "w900"):
                if not (ROOT / "images/photo" / tier / p["views"][v]).exists():
                    errs.append(f"{p['id']} photo {v}: images/photo/{tier} missing")
    for tier in ("w300", "w900"):
        for f in (ROOT / "images/line" / tier).glob("*.webp"):
            if f.name not in listed:
                errs.append(f"orphan images/line/{tier}/{f.name}")
    n = sum(1 for p in cat for v in VIEWS if p["views"].get(v))
    print(f"{len(cat)} poses, {n}/{len(cat) * 5} line views, "
          f"{sum(len(p.get('photos', [])) for p in cat)} photos")
    for e in errs:
        print("ERR", e)
    return 1 if errs else 0

if __name__ == "__main__":
    sys.exit(main())
