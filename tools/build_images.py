#!/usr/bin/env python3
"""Build the committed image tiers (w300, w900) for every view that passed QC, and prune everything else.

Usage: python3 tools/build_images.py std=~/Downloads/pose-gallery-std73 sexy=... upper=...
Line art comes from <src>/img/<file>, photos from <src>/photo/<file>. Only catalog views (non-null) and catalog
photos are built; any other file under images/ is deleted, so a view that fails QC leaves the repo.
Re-encoding is downscale-only from already-lossy sources: w900 q75 (lightbox/download), w300 q70 (grid).
"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TIERS = (("w900", 900, 75), ("w300", 300, 70))


def main() -> None:
    srcs = {k: pathlib.Path(v).expanduser() for k, v in (a.split("=", 1) for a in sys.argv[1:])}
    want = set()
    for p in json.loads((ROOT / "data/catalog.json").read_text()):
        jobs = [("line", srcs[p["series"]] / "img" / f) for f in p["views"].values() if f]
        jobs += [("photo", srcs[p["series"]] / "photo" / f) for f in (p.get("photos") or {}).values()]
        for kind, src in jobs:
            for tier, width, q in TIERS:
                dst = ROOT / "images" / kind / tier / src.name
                want.add(dst)
                if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
                    continue
                dst.parent.mkdir(parents=True, exist_ok=True)
                subprocess.run(["cwebp", "-quiet", "-mt", "-m", "6", "-q", str(q), "-resize", str(width), "0",
                                "-metadata", "none", str(src), "-o", str(dst)], check=True)
    pruned = 0
    for f in (ROOT / "images").glob("*/*/*.webp"):
        if f not in want:
            f.unlink()
            pruned += 1
    print(f"{len(want)} files in images/, pruned {pruned}")


if __name__ == "__main__":
    main()
