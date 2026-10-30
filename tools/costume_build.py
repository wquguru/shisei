#!/usr/bin/env python3
"""Build the costume image tiers from the costume source set and record them in data/costumes.json.

Only views with `pass` in data/costume-qc.json are built; everything else under images/costume/ is removed, and the
item's view becomes null with the QC status in `gaps` (same rule as poses, AGENTS §2). Two looks per view (D-10):
  images/costume/grey/{w300,w600,w900}/costume_<ID>_<view>.webp    on the house background #D9D9D9
  images/costume/alpha/{w300,w600,w900}/costume_<ID>_<view>.webp   transparent cut-out
Usage: python3 -I tools/costume_build.py ~/Downloads/costume-hc [more source sets…]
"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TIERS = {"w300": (300, 400, 70), "w600": (600, 800, 72), "w900": (900, 1200, 75)}  # same sizes and q as poses
LOOKS = ("grey", "alpha")
OUT = ROOT / "images/costume"


def cwebp(src: pathlib.Path, dst: pathlib.Path, w: int, h: int, q: int, alpha: bool) -> None:
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    extra = ["-alpha_q", "100", "-exact"] if alpha else []
    subprocess.run(["cwebp", "-quiet", "-q", str(q), "-resize", str(w), str(h), *extra, str(src), "-o", str(dst)],
                   check=True)


def main() -> None:
    srcs = [pathlib.Path(p).expanduser() for p in sys.argv[1:]]
    if not srcs:
        raise SystemExit(__doc__)
    data = json.loads((ROOT / "data/costumes.json").read_text())
    qc = json.loads((ROOT / "data/costume-qc.json").read_text())["items"]
    want, built = set(), 0
    for it in data["items"]:
        q = qc.get(it["id"], {})
        for v in data["views"]:
            st = q.get(v, {}).get("status")
            name = f"costume_{it['id']}_{v}.webp"
            src = {look: next((s / look / f"{it['id']}_{v}.png" for s in srcs
                               if (s / look / f"{it['id']}_{v}.png").exists()), None) for look in LOOKS}
            if st == "pass" and all(src.values()):
                for look in LOOKS:
                    for t, (w, h, qual) in TIERS.items():
                        dst = OUT / look / t / name
                        cwebp(src[look], dst, w, h, qual, look == "alpha")
                        want.add(dst)
                it["views"][v] = name
                it["gaps"].pop(v, None)
                built += 1
            else:
                if st == "pass":
                    raise SystemExit(f"{it['id']} {v}: qc pass but no source image in {srcs}")
                it["views"][v] = None
                if st:
                    it["gaps"][v] = st
                else:
                    it["gaps"].pop(v, None)  # not generated or reviewed yet: no gap to report
    for f in OUT.glob("*/*/*.webp"):
        if f not in want:
            f.unlink()
    (ROOT / "data/costumes.json").write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(f"{built} views built ({built * 6} files)")


if __name__ == "__main__":
    main()
