#!/usr/bin/env python3
"""Expand data/costume-src/<CAT>.json (forms × colorways) into data/costumes.json, one item per colorway.

IDs are stable (AGENTS §2): an item keeps the ID already recorded for its `form:colorway` key, new keys take the
next free number, and a key that disappears from the source keeps its ID retired (it is never reused). Generated
fields (views, gaps) are carried over from the existing file, so re-running after editing a description is safe.

Usage: python3 -I tools/costume_cards.py
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "data/costume-src", ROOT / "data/costumes.json"
VIEWS = ("front", "diag", "side", "back")
LANGS = ("zh", "ja", "en", "ko")
GENDERS = {"F", "M", "U"}


def fill(text: str, vars_: dict, where: str) -> str:
    out = re.sub(r"\{(\w+)\}", lambda m: vars_[m.group(1)] if m.group(1) in vars_ else m.group(0), text)
    left = re.findall(r"\{\w+\}", out)
    if left:
        raise SystemExit(f"{where}: unfilled placeholder(s) {left}")
    return out


def main() -> None:
    cats = json.loads((SRC / "_categories.json").read_text())
    old = json.loads(OUT.read_text()) if OUT.exists() else {"retired": {}, "items": []}
    by_key = {it["key"]: it for it in old["items"]}
    retired = dict(old.get("retired", {}))  # key -> id, so a dropped item's number is never handed out again
    used = [int(i["id"][1:]) for i in old["items"]] + [int(v[1:]) for v in retired.values()]
    nxt = max(used, default=0) + 1

    items, seen = [], set()
    for cat in sorted(cats, key=lambda c: cats[c]["order"]):
        f = SRC / f"{cat}.json"
        if not f.exists():
            continue
        src = json.loads(f.read_text())
        for form in src["forms"]:
            assert form["gender"] in GENDERS, form["key"]
            assert len(form["checks"]) >= 3, form["key"]
            era = src.get("eras", {}).get(form.get("era"), {})
            for cw in form["colorways"]:
                key = f"{cat}:{form['key']}:{cw['key']}"
                assert key not in seen, f"duplicate {key}"
                seen.add(key)
                prev = by_key.get(key)
                if prev:
                    cid = prev["id"]
                elif key in retired:
                    cid = retired.pop(key)
                else:
                    cid, nxt = f"C{nxt:03d}", nxt + 1
                where = key
                items.append({
                    "id": cid, "key": key, "cat": cat, "form": form["key"], "era": form.get("era"),
                    "gender": form["gender"], "rating": form.get("rating", "general"),
                    "bg": cw.get("bg", "light"), "lower": form.get("lower", "hem"),
                    **{f"name_{l}": f"{form['name'][l]}（{cw['name'][l]}）" if l in ("zh", "ja")
                       else f"{form['name'][l]} ({cw['name'][l]})" for l in LANGS},
                    **{f"era_{l}": era.get(l) for l in LANGS if era},
                    "desc_en": fill(form["desc"], cw.get("vars", {}), where),
                    "keep_en": fill(form["keep"], cw.get("vars", {}), where),
                    "checks": form["checks"],
                    "views": (prev or {}).get("views") or {v: None for v in VIEWS},
                    "gaps": (prev or {}).get("gaps") or {},
                })
    for key, it in by_key.items():
        if key not in seen:
            retired[key] = it["id"]
    items.sort(key=lambda i: i["id"])
    OUT.write_text(json.dumps({"views": list(VIEWS), "retired": retired, "items": items},
                              ensure_ascii=False, indent=1) + "\n")
    per = {}
    for i in items:
        per[i["cat"]] = per.get(i["cat"], 0) + 1
    print(f"costumes.json: {len(items)} items {per}, retired {len(retired)}")


if __name__ == "__main__":
    main()
