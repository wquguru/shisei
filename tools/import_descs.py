#!/usr/bin/env python3
"""Fill catalog `desc_en` from the generator's own prompt export.

Usage: python3 tools/import_descs.py EXPORT
EXPORT is a pose-prompts-export folder from Muse (docs/GENERATION.md): prompts_<series>.json, each an array of
{id, orig_id, desc_final, ...}, where desc_final is the English pose description the views were generated from.
Only an empty desc_en is filled; an existing one that differs is reported, never overwritten, because std's came
with its source set and a hand fix wins. A mismatched orig_id or an unknown id stops the run: the export would not
describe the pose the catalog holds.
"""
import argparse, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("export")
    a = ap.parse_args()
    src = pathlib.Path(a.export).expanduser()
    path = ROOT / "data/catalog.json"
    cat = json.loads(path.read_text())
    by_id = {p["id"]: p for p in cat}
    errs, filled, differ = [], 0, []
    for f in sorted(src.glob("prompts_*.json")):
        for e in json.loads(f.read_text()):
            p, d = by_id.get(e["id"]), (e.get("desc_final") or "").strip()
            if p is None:
                errs.append(f"{f.name}: {e['id']} not in catalog")
            elif str(e.get("orig_id")) != str(p.get("orig_id") or p["id"]):
                errs.append(f"{e['id']}: orig_id {e.get('orig_id')} != catalog {p.get('orig_id')}")
            elif d and not p.get("desc_en"):
                p["desc_en"], filled = d, filled + 1
            elif d and p["desc_en"] != d:
                differ.append(e["id"])
    if errs:
        print("\n".join("ERR " + e for e in errs))
        return 1
    path.write_text(json.dumps(cat, ensure_ascii=False, indent=1) + "\n")
    print(f"filled {filled}; kept {len(differ)} existing that differ: {' '.join(differ) or '-'}")
    print(f"still empty: {' '.join(p['id'] for p in cat if not p.get('desc_en')) or '-'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
