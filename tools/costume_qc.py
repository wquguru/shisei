#!/usr/bin/env python3
"""Merge the costume QC inputs into data/costume-qc.json (docs/qc/costume_prompt.md).

Inputs in data/costume-qc-input/, applied in file-name order so a later round overrides an earlier one:
  gen_<run>.json    {"run", "missing": {"C007_front": "Muse note", …}}: cells the generator never produced
  fail_<...>.json   reviewer output {"reviewed": [ids], "fails": [{"id", "view", "status", "reason"}]}
  manual_<...>.json same shape, written by a person; a fail entry with status "pass" re-admits a panel
A view is pass when its item was reviewed and no later file fails it; missing comes from gen files.

Usage: python3 -I tools/costume_qc.py
       python3 -I tools/costume_qc.py --gen ~/Downloads/costume-hc/intake.json hc_run01   # record missing cells
"""
import argparse, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
INP, OUT = ROOT / "data/costume-qc-input", ROOT / "data/costume-qc.json"
VIEWS = ("front", "diag", "side", "back")
STATUSES = {"pass", "form", "consistency", "view", "content", "matte", "missing"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--gen", nargs=2, metavar=("INTAKE_JSON", "RUN"))
    a = ap.parse_args()
    INP.mkdir(parents=True, exist_ok=True)
    if a.gen:
        log = json.loads(pathlib.Path(a.gen[0]).expanduser().read_text())
        miss = {k: v.get("note", "") for k, v in log.items() if v["status"] == "missing"}
        (INP / f"gen_{a.gen[1]}.json").write_text(
            json.dumps({"run": a.gen[1], "missing": miss}, ensure_ascii=False, indent=1) + "\n")
        print(f"gen_{a.gen[1]}.json: {len(miss)} missing")

    items = {i["id"]: i for i in json.loads((ROOT / "data/costumes.json").read_text())["items"]}
    qc = {}
    for f in sorted(INP.glob("*.json")):
        d = json.loads(f.read_text())
        if f.name.startswith("gen_"):
            for cell, note in d["missing"].items():
                cid, v = cell.split("_")
                qc.setdefault(cid, {})[v] = {"status": "missing", "reason": note[:200], "by": f.name}
            continue
        for cid in d["reviewed"]:
            assert cid in items, f"{f.name}: unknown id {cid}"
            for v in VIEWS:
                cur = qc.setdefault(cid, {}).get(v)
                if not cur or cur["status"] != "missing":
                    qc[cid][v] = {"status": "pass", "by": f.name}
        for x in d["fails"]:
            assert x["status"] in STATUSES and x["view"] in VIEWS, f"{f.name}: bad entry {x}"
            if qc.get(x["id"], {}).get(x["view"], {}).get("status") == "missing":
                continue
            qc.setdefault(x["id"], {})[x["view"]] = {"status": x["status"], "reason": x.get("reason", ""), "by": f.name}
    qc = {cid: {v: vs[v] for v in VIEWS if v in vs} for cid, vs in qc.items()}
    OUT.write_text(json.dumps({"views": list(VIEWS), "items": dict(sorted(qc.items()))},
                              ensure_ascii=False, indent=1) + "\n")
    c = {}
    for vs in qc.values():
        for v in vs.values():
            c[v["status"]] = c.get(v["status"], 0) + 1
    print(f"costume-qc.json: {len(qc)} items, {c}")


if __name__ == "__main__":
    main()
