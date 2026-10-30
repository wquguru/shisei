#!/usr/bin/env python3
"""Check data/catalog.json, data/qc.json and images/ against each other.

- every non-null catalog view has a `pass` in qc.json and exists in both tiers;
- every null view has a non-pass qc status and a matching `gaps` entry (missing, line or structure);
- every rating override in data/rating_overrides.json is applied;
- every redrawn pose (catalog `source`) was merged as such: qc.json `sources` names the same source;
- every single-view fill (catalog `fills`) was merged as such (qc.json `fills`) and sits in an original set (D-09);
- every photo has a `pass` in qc.json photos and exists in both tiers; nothing under images/ is unreferenced;
- every README download link names a zip of the data/packs.json version.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWS = ("front", "diag", "side", "above", "below")
TIERS = ("w300", "w600", "w900")
README_FILES = ("README.md", "docs/readme/README.zh-CN.md", "docs/readme/README.ja.md", "docs/readme/README.ko.md")


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
    fills = {p["id"]: p["fills"] for p in cat if p.get("fills")}
    if fills != qcd.get("fills", {}):
        errs.append("catalog fills differ from qc.json fills (run qc_merge.py after import_fills.py)")
    errs += [f"{p['id']}: fills in a redrawn set ({p['source']})" for p in cat if p.get("fills") and p.get("source")]
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
    # README download links are versioned file names; pack_release.py rewrites them, this catches a hand edit.
    packs_path = ROOT / "data/packs.json"
    if packs_path.exists():
        packs = json.loads(packs_path.read_text())
        files = {k["file"] for k in packs["packs"].values()}
        for md in README_FILES:
            for m in re.finditer(r"releases/download/v([\d.]+)/(shisei-[\w]+-v[\d.]+\.zip)", (ROOT / md).read_text()):
                if m.group(1) != packs["version"] or m.group(2) not in files:
                    errs.append(f"{md}: download link {m.group(2)} is not in data/packs.json v{packs['version']}")
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
