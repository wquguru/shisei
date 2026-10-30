#!/usr/bin/env python3
"""Merge QC results into data/qc.json and apply them to data/catalog.json.

Usage: python3 tools/qc_merge.py QC_DIR [--date YYYY-MM-DD]
QC_DIR holds fail_*.json (panel review), name_*.json (pose-name check), optionally dups.json (tools/line_dups.py)
and photo_*.json (photo-render review, docs/qc/photo_prompt.md). Without photo_*.json the previous photo results stay.
A result file with a top-level "source" applies only to poses whose catalog `source` matches; files without one apply
to poses without one. A redrawn set (tools/import_redraws.py) is therefore judged only on reviews of its new drawing,
while the old files stay so the old results remain reproducible (dups*.json from line_dups.py works the same way).
A single view filled later (catalog `fills`, tools/import_fills.py) is judged the same way per view: only panel
results tagged with its fill source apply to it; the set's name check still comes from the original drawing.
Rules (docs/qc/README.md):
- a set whose drawing does not show the named pose (match "no") fails every view as `structure`;
- per-panel "pose mismatch" fails are dropped when the set-level check says yes/partial (the set check decides names);
- a thin floor/ground line alone is not a defect (line fails only; a reason that names anything else still fails);
- `structure` beats `line` when a panel has both.
Catalog views keep their file only when the status is `pass`; other views become null and get a `gaps` entry.
qc.json keeps every file name, so a later re-review can bring a view back.
"""
import argparse, datetime, glob, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWS = ("front", "diag", "side", "above", "below")
HARMLESS = re.compile(r"floor|ground", re.I)
# Words that mean the floor line comes with a real defect: background objects, nipple marks, crops.
REAL = re.compile(r"textur|scribbl|shadow|speckl|chair|furniture|noise|box|guide|blob|malform|melt|wall|hatch|table|"
                  r"background|ruled|nipple|areola|crop", re.I)
MISMATCH = re.compile(r"pose mismatch", re.I)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("qc_dir")
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    a = ap.parse_args()
    d = pathlib.Path(a.qc_dir)
    cat_path, qc_path = ROOT / "data/catalog.json", ROOT / "data/qc.json"
    cat = json.loads(cat_path.read_text())
    old = json.loads(qc_path.read_text()) if qc_path.exists() else {"views": {}}

    def load(pattern, key):
        """Entries of every matching file, each tagged with the file's source (None = the original generation)."""
        out = []
        for f in sorted(d.glob(pattern)):
            doc = json.loads(f.read_text())
            doc = {"fails": doc} if isinstance(doc, list) else doc
            out += [(doc.get("source"), x) for x in doc.get(key, [])]
        return out

    src = {p["id"]: p.get("source") for p in cat}
    fills = {p["id"]: p["fills"] for p in cat if p.get("fills")}

    def vsrc(pid, v):
        return fills.get(pid, {}).get(v) or src.get(pid)

    # A redrawn set has no older results to fall back on, so an unreviewed view would pass silently: every view of
    # it must be on a panel sheet its source's reviewers listed, and the set must have a name check.
    seen = {(source, n.split("__")[0], v) for source, n in load("fail_*.json", "reviewed") if source and "__" in n
            for v in n.split("__")[1].removesuffix(".jpg").split("-")}
    named = {(source, n) for source, n in load("name_*.json", "reviewed") if source}
    todo = [f"{p['id']} {v}" for p in cat if p.get("source") for v in VIEWS
            if p["views"].get(v) and (p["source"], p["id"], v) not in seen] + \
           [f"{p['id']} name check" for p in cat if p.get("source") and (p["source"], f"{p['id']}.jpg") not in named] + \
           [f"{pid} {v}" for pid, fv in fills.items() for v, s in fv.items()
            if next(p for p in cat if p["id"] == pid)["views"].get(v) and (s, pid, v) not in seen]
    if todo:
        sys.exit(f"not reviewed yet ({len(todo)}): {', '.join(todo[:8])} ...")
    sets = {s["set"]: s for source, s in load("name_*.json", "sets") if src.get(s["set"]) == source}
    fails = [x for source, x in load("fail_*.json", "fails") + load("dups*.json", "fails")
             if vsrc(x["set"], x["angle"]) == source]

    panel = {}
    for x in fails:
        # Structure fails are never a floor line, even when the reason mentions the floor (a hand on the ground).
        if x["kind"] == "line" and HARMLESS.search(x["reason"]) and not REAL.search(x["reason"]):
            continue
        if MISMATCH.search(x["reason"]) and sets.get(x["set"], {}).get("match") != "no":
            continue
        key = (x["set"], x["angle"])
        if key not in panel or (x["kind"] == "structure" and panel[key]["kind"] == "line"):
            panel[key] = x

    views, set_notes = {}, {}
    for p in cat:
        pid, row = p["id"], {}
        # The previous run's file names belong to the old drawing until a merge has recorded the new source.
        prev = old["views"].get(pid, {}) if old.get("sources", {}).get(pid) == src[pid] else {}
        match = sets.get(pid, {}).get("match", "yes")
        if match != "yes":
            s = sets[pid]
            set_notes[pid] = {"match": match, "category_ok": s.get("category_ok", True), "actual": s["actual"]}
        for v in VIEWS:
            f = p["views"].get(v) or prev.get(v, {}).get("file")
            if not f:
                row[v] = {"status": "missing"}
            elif match == "no":
                row[v] = {"file": f, "status": "structure", "reason": "pose does not match its name: " + sets[pid]["actual"]}
            elif (pid, v) in panel:
                row[v] = {"file": f, "status": panel[(pid, v)]["kind"], "reason": panel[(pid, v)]["reason"]}
            else:
                row[v] = {"file": f, "status": "pass"}
        views[pid] = row
        p["views"] = {v: (row[v]["file"] if row[v]["status"] == "pass" else None) for v in VIEWS}
        p["gaps"] = {v: row[v]["status"] for v in VIEWS if row[v]["status"] != "pass"}

    photo_files = sorted(d.glob("photo_*.json"))
    photos = old.get("photos", {})
    if photo_files:
        pfail = {(x["set"], x["angle"]): x for f in photo_files for x in json.loads(f.read_text())["fails"]}
        photos = {}
        for p in cat:
            files = {v: r["file"] for v, r in old.get("photos", {}).get(p["id"], {}).items()} | (p.get("photos") or {})
            if not files:
                continue
            row = {v: ({"file": f, "status": pfail[(p["id"], v)]["kind"], "reason": pfail[(p["id"], v)]["reason"]}
                       if (p["id"], v) in pfail else {"file": f, "status": "pass"}) for v, f in files.items()}
            photos[p["id"]] = row
            p["photos"] = {v: r["file"] for v, r in row.items() if r["status"] == "pass"}

    qc = {"schema": 1, "reviewed": a.date, "method": "docs/qc/README.md", "sets": set_notes,
          "sources": {pid: s for pid, s in src.items() if s}, "fills": fills, "views": views, "photos": photos}
    qc_path.write_text(json.dumps(qc, ensure_ascii=False, indent=1) + "\n")
    cat_path.write_text(json.dumps(cat, ensure_ascii=False, indent=1) + "\n")

    tally = {}
    for pid, row in views.items():
        series = next(p["series"] for p in cat if p["id"] == pid)
        t = tally.setdefault(series, {"pass": 0, "line": 0, "structure": 0, "missing": 0, "hidden_sets": 0})
        for r in row.values():
            t[r["status"]] += 1
        t["hidden_sets"] += all(r["status"] != "pass" for r in row.values())
    for s, t in tally.items():
        print(s, t)
    print("photos", sum(r["status"] == "pass" for row in photos.values() for r in row.values()), "/",
          sum(len(row) for row in photos.values()), "pass")


if __name__ == "__main__":
    main()
