#!/usr/bin/env python3
"""Expand data/<lib>-src/<CAT>.json (forms × variants) into data/<lib>s.json, one item per variant.

The scene, prop and animal counterpart of costume_cards.py, with the same ID rules (AGENTS §2): an item keeps the ID
recorded for its `cat:form:variant` key, new keys take the next free number, a dropped key keeps its ID retired, and
generated fields (views, gaps) carry over. Per-library differences come from series_kit.LIBS.

Usage: python3 -I tools/series_cards.py scene|prop|furniture|light|animal [--check]   (--check validates without writing)
"""
import json, pathlib, re, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))  # -I drops the script dir from sys.path
from series_kit import LANGS, LIBS  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent


def fill(text: str, vars_: dict, where: str) -> str:
    out = re.sub(r"\{(\w+)\}", lambda m: vars_[m.group(1)] if m.group(1) in vars_ else m.group(0), text)
    left = re.findall(r"\{\w+\}", out)
    if left:
        raise SystemExit(f"{where}: unfilled placeholder(s) {left}")
    return out


def main() -> None:
    lib = sys.argv[1] if len(sys.argv) > 1 else ""
    check = "--check" in sys.argv[2:]
    if lib not in LIBS:
        raise SystemExit(f"usage: series_cards.py {'|'.join(LIBS)}")
    cfg = LIBS[lib]
    src_dir, out_path, letter = ROOT / cfg["src"], ROOT / cfg["out"], cfg["letter"]
    cats = json.loads((src_dir / "_categories.json").read_text())
    old = json.loads(out_path.read_text()) if out_path.exists() else {"retired": {}, "items": []}
    by_key = {it["key"]: it for it in old["items"]}
    retired = dict(old.get("retired", {}))
    used = [int(i["id"][1:]) for i in old["items"]] + [int(v[1:]) for v in retired.values()]
    nxt = max(used, default=0) + 1

    items, seen = [], set()
    for cat in sorted(cats, key=lambda c: cats[c]["order"]):
        f = src_dir / f"{cat}.json"
        if not f.exists():
            continue
        src = json.loads(f.read_text())
        groups = src.get("groups", {})
        for form in src["forms"]:
            assert len(form["checks"]) >= 3, form["key"]
            if lib == "furniture":  # intake scales by these, and the front prompt quotes them
                assert all(isinstance(form.get("dims", {}).get(k), int) for k in "wdh"), f"{form['key']}: dims w/d/h"
            assert form.get("group") in groups, f"{cat}:{form['key']}: group {form.get('group')!r} not in groups"
            for v in form["variants"]:
                key = f"{cat}:{form['key']}:{v['key']}"
                assert key not in seen, f"duplicate {key}"
                seen.add(key)
                prev = by_key.get(key)
                if prev:
                    iid = prev["id"]
                elif key in retired:
                    iid = retired.pop(key)
                else:
                    iid, nxt = f"{letter}{nxt:03d}", nxt + 1
                vars_ = v.get("vars", {})
                # library-specific fields: scenes carry the variant's light, props their placement and size,
                # animals their species, lights their subject; anything not set falls back to the form, then the category
                extra = {k: v.get(k, form.get(k, cats[cat].get(k))) for k in ("light", "season", "place", "size", "species", "tail", "coat", "setting", "subject", "dims", "bg")
                         if v.get(k, form.get(k, cats[cat].get(k))) is not None}
                for k in ("light", "setting"):
                    if k in extra:
                        extra[k] = fill(extra[k], vars_, key)
                items.append({
                    "id": iid, "key": key, "cat": cat, "form": form["key"], "group": form["group"],
                    "rating": v.get("rating", form.get("rating", cats[cat].get("rating", "general"))),
                    **({"probe": True} if form.get("probe") and v is form["variants"][0] else {}),
                    **extra,
                    **{f"name_{l}": f"{form['name'][l]}（{v['name'][l]}）" if l in ("zh", "ja")
                       else f"{form['name'][l]} ({v['name'][l]})" for l in LANGS},
                    **{f"group_{l}": groups[form["group"]][l] for l in LANGS},
                    "desc_en": fill(form["desc"], vars_, key),
                    "keep_en": fill(form["keep"], vars_, key),
                    "checks": form["checks"],
                    "views": (prev or {}).get("views") or {vw: None for vw in cfg["views"]},
                    "gaps": (prev or {}).get("gaps") or {},
                })
    for key, it in by_key.items():
        if key not in seen:
            retired[key] = it["id"]
    items.sort(key=lambda i: i["id"])
    if not check:
            out_path.write_text(json.dumps({"views": list(cfg["views"]), "retired": retired, "items": items},
                                       ensure_ascii=False, indent=1) + "\n")
    per = {}
    for i in items:
        per[i["cat"]] = per.get(i["cat"], 0) + 1
    print(f"{cfg['out']}{' (check only)' if check else ''}: {len(items)} items {per}, probe {sum(1 for i in items if i.get('probe'))}, "
          f"retired {len(retired)}")


if __name__ == "__main__":
    main()
