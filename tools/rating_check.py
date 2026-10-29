#!/usr/bin/env python3
"""Compare a rating review (docs/qc/rating_prompt.md) with the ratings in data/catalog.json. Changes nothing.

Usage: python3 tools/rating_check.py QC_DIR
QC_DIR holds rating_*.json. Prints sets the reviewer rates differently from the catalog, sets flagged as a problem
(these go back to the QC review) and catalog sets that were not reviewed. A person decides every change; ratings are
set per category in tools/import_series.py, so a disagreement usually means a category rule or a single pose to move.
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def main() -> int:
    d = pathlib.Path(sys.argv[1])
    got = {s["set"]: s for f in sorted(d.glob("rating_*.json")) for s in json.loads(f.read_text())["sets"]}
    cat = [p for p in json.loads((ROOT / "data/catalog.json").read_text()) if any(p["views"].values())]
    diff, problems = [], []
    for p in cat:
        r = got.get(p["id"])
        if not r:
            continue
        if r.get("problem"):
            problems.append(f"{p['id']}  {r['reason']}")
        if r["rating"] != p["rating"]:
            diff.append(f"{p['id']}  {p['series']:5} {p['class_en'][:24]:24} catalog {p['rating']:10} -> {r['rating']:10}"
                        f" ({r['confidence']}) {r['reason']}")
    series = {p["series"] for p in cat if p["id"] in got}
    missing = [p["id"] for p in cat if p["series"] in series and p["id"] not in got]
    print(f"reviewed {len(got)} of {len(cat)} shown sets; {len(diff)} disagree; {len(problems)} problems")
    for line in diff:
        print("DIFF", line)
    for line in problems:
        print("PROBLEM", line)
    if missing:
        print("NOT REVIEWED", " ".join(missing))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
