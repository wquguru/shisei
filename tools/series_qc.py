#!/usr/bin/env python3
"""Merge a library's QC inputs into data/<lib>-qc.json (port of costume_qc.py; prompts in docs/qc/<lib>_prompt.md).

Inputs in data/<lib>-qc-input/, applied gen files first, then by review round (`_r<N>` in the name), reviewer before
manual within a round, so a later round overrides an earlier one:
  gen_<run>.json    {"run", "missing": {"E009_above": "Muse note", …}}: cells the generator never produced
  fail_<...>.json   reviewer output {"reviewed": [ids], "fails": [{"id", "view", "status", "reason"}]}
  manual_<...>.json same shape, written by a person; a fail entry with status "pass" re-admits a panel
A view is pass when its item was reviewed, the source set has it and no later file fails it; missing comes from gen
files. Statuses per library are series_kit.LIBS[lib]["statuses"].

Usage: python3 -I tools/series_qc.py scene
       python3 -I tools/series_qc.py scene --gen ~/Downloads/run01-src/scene/intake.json scene_run01   # record missing
"""
import argparse, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import series_kit as K


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("lib", choices=sorted(K.LIBS))
    ap.add_argument("--gen", nargs=2, metavar=("INTAKE_JSON", "RUN"))
    a = ap.parse_args()
    cfg = K.LIBS[a.lib]
    inp, out = (ROOT / p for p in K.qc_paths(a.lib))
    views, statuses = cfg["views"], set(cfg["statuses"]) | set(K.STATUSES_ALL)
    inp.mkdir(parents=True, exist_ok=True)
    if a.gen:
        log = json.loads(pathlib.Path(a.gen[0]).expanduser().read_text())
        miss = {k: v.get("note", "") for k, v in log.items() if v["status"] == "missing"}
        (inp / f"gen_{a.gen[1]}.json").write_text(
            json.dumps({"run": a.gen[1], "missing": dict(sorted(miss.items()))}, ensure_ascii=False, indent=1) + "\n")
        print(f"gen_{a.gen[1]}.json: {len(miss)} missing")

    items = {i["id"] for i in json.loads((ROOT / cfg["out"]).read_text())["items"]}
    qc = {}

    def order(f):
        m = re.search(r"_r(\d+)[_.]", f.name)
        return (not f.name.startswith("gen_"), int(m.group(1)) if m else 1, f.name.startswith("manual_"), f.name)

    for f in sorted(inp.glob("*.json"), key=order):
        d = json.loads(f.read_text())
        if f.name.startswith("gen_"):
            for cell, note in d["missing"].items():
                cid, v = cell.split("_")
                qc.setdefault(cid, {})[v] = {"status": "missing", "reason": note[:200], "by": f.name}
            continue
        for cid in d["reviewed"]:
            assert cid in items, f"{f.name}: unknown id {cid}"
            for v in views:
                cur = qc.setdefault(cid, {}).get(v)
                if not cur or cur["status"] != "missing":
                    qc[cid][v] = {"status": "pass", "by": f.name}
        for x in d["fails"]:
            assert x["status"] in statuses and x["view"] in views, f"{f.name}: bad entry {x}"
            if qc.get(x["id"], {}).get(x["view"], {}).get("status") == "missing":
                continue
            qc.setdefault(x["id"], {})[x["view"]] = {"status": x["status"], "reason": x.get("reason", ""), "by": f.name}
    qc = {cid: {v: vs[v] for v in views if v in vs} for cid, vs in qc.items()}
    out.write_text(json.dumps({"views": list(views), "items": dict(sorted(qc.items()))},
                              ensure_ascii=False, indent=1) + "\n")
    c = {}
    for vs in qc.values():
        for v in vs.values():
            c[v["status"]] = c.get(v["status"], 0) + 1
    print(f"{out.name}: {len(qc)} items, {c}")


if __name__ == "__main__":
    main()
