#!/usr/bin/env python3
"""Check data/catalog.json, data/qc.json and images/ against each other.

- every non-null catalog view has a `pass` in qc.json and exists in both tiers;
- every null view has a non-pass qc status and a matching `gaps` entry (missing, line or structure);
- every rating override in data/rating_overrides.json is applied;
- every redrawn pose (catalog `source`) was merged as such: qc.json `sources` names the same source;
- every photo has a `pass` in qc.json photos and exists in both tiers; nothing under images/ is unreferenced.
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWS = ("front", "diag", "side", "above", "below")
TIERS = ("w300", "w600", "w900")


def main() -> int:
    cat = json.loads((ROOT / "data/catalog.json").read_text())
    qcd = json.loads((ROOT / "data/qc.json").read_text())
    qc, qc_photos = qcd["views"], qcd.get("photos", {})
    errs, want = [], set()
    ov_path = ROOT / "data/rating_overrides.json"
    for pid, o in (json.loads(ov_path.read_text()) if ov_path.exists() else {}).items():
        if next((p["rating"] for p in cat if p["id"] == pid), None) != o["rating"]:
            errs.append(f"{pid}: rating should be {o['rating']} (data/rating_overrides.json)")
    sources = {p["id"]: p["source"] for p in cat if p.get("source")}
    if sources != qcd.get("sources", {}):
        errs.append("catalog sources differ from qc.json sources (run qc_merge.py after import_redraws.py)")
    ids = [p["id"] for p in cat]
    if len(ids) != len(set(ids)):
        errs.append("duplicate ids in catalog")
    for p in cat:
        q = qc.get(p["id"])
        if q is None:
            errs.append(f"{p['id']}: no qc entry")
            continue
        for v in VIEWS:
            f, st = p["views"].get(v), q[v]["status"]
            if f:
                if st != "pass":
                    errs.append(f"{p['id']} {v}: in catalog but qc says {st}")
                for t in TIERS:
                    want.add(("line", t, f))
                    if not (ROOT / "images/line" / t / f).exists():
                        errs.append(f"{p['id']} {v}: images/line/{t}/{f} missing")
            else:
                if st == "pass":
                    errs.append(f"{p['id']} {v}: qc pass but catalog view is null")
                if p.get("gaps", {}).get(v) != st:
                    errs.append(f"{p['id']} {v}: gaps entry should be {st}")
        for v, f in (p.get("photos") or {}).items():
            if qc_photos.get(p["id"], {}).get(v, {}).get("status") != "pass":
                errs.append(f"{p['id']} photo {v}: in catalog without a qc pass")
            for t in TIERS:
                want.add(("photo", t, f))
                if not (ROOT / "images/photo" / t / f).exists():
                    errs.append(f"{p['id']} photo {v}: images/photo/{t}/{f} missing")
    for f in (ROOT / "images").glob("*/*/*.webp"):
        if (f.parent.parent.name, f.parent.name, f.name) not in want:
            errs.append(f"orphan {f.relative_to(ROOT)}")
    for s in sorted({p["series"] for p in cat}):
        ps = [p for p in cat if p["series"] == s]
        shown = [p for p in ps if any(p["views"].values())]
        n = sum(1 for p in ps for v in VIEWS if p["views"].get(v))
        print(f"{s}: {len(shown)}/{len(ps)} poses shown, {n}/{len(ps) * 5} views pass")
    for e in errs:
        print("ERR", e)
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
