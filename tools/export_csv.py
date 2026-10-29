#!/usr/bin/env python3
"""Write data/catalog.csv from data/catalog.json (o = view passed QC, x = failed QC, - = not generated)."""
import csv, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWS = ("front", "diag", "side", "above", "below")
COLS = ("id", "orig_id", "series", "rating", "class_jp", "class_cn", "class_en", "class_kr",
        "name_jp", "name_cn", "name_en", "name_kr")


def main() -> None:
    cat = json.loads((ROOT / "data/catalog.json").read_text())
    with open(ROOT / "data/catalog.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(COLS + VIEWS)
        for p in cat:
            gaps = p.get("gaps", {})
            marks = ["o" if p["views"].get(v) else ("-" if gaps.get(v) == "missing" else "x") for v in VIEWS]
            w.writerow([p.get(c) or "" for c in COLS] + marks)
    print(f"catalog.csv: {len(cat)} rows")


if __name__ == "__main__":
    main()
