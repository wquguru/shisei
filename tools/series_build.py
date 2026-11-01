#!/usr/bin/env python3
"""Build a library's image tiers from its source set and record them in data/<lib>.json (port of costume_build.py).

Only views with `pass` in data/<lib>-qc.json are built; everything else under images/<lib>/ is removed, and the
item's view becomes null with the QC status in `gaps` (same rule as poses, AGENTS §2). Looks and quality come from
series_kit.LOOKS / CWEBP:
  prop, furniture   images/<lib>/grey/{w300,w600,w900}/  on #D9D9D9, and images/<lib>/alpha/w900/ transparent
  scene, light, animal   images/<lib>/plain/{w300,w600,w900}/  the delivered image as is
File names <lib>_<ID>_<view>.webp. Full-size originals stay out of git (release packs only).
Usage: python3 -I tools/series_build.py prop ~/Downloads/run01-src/prop [more source sets…]
"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import series_kit as K

SRC_DIR = {"grey": "grey", "alpha": "alpha", "plain": "raw"}


def cwebp(src: pathlib.Path, dst: pathlib.Path, w: int, h: int, look: str, tier: str) -> None:
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    args = K.CWEBP[look][tier] if isinstance(K.CWEBP[look], dict) else K.CWEBP[look]
    subprocess.run(["cwebp", "-quiet", *args, "-resize", str(w), str(h), str(src), "-o", str(dst)], check=True)


def main() -> None:
    if len(sys.argv) < 3 or sys.argv[1] not in K.LIBS:
        raise SystemExit(__doc__)
    lib, srcs = sys.argv[1], [pathlib.Path(p).expanduser() for p in sys.argv[2:]]
    cfg = K.LIBS[lib]
    looks = K.LOOKS[cfg["matte"]]
    out_dir = ROOT / "images" / lib
    data = json.loads((ROOT / cfg["out"]).read_text())
    qc_file = ROOT / K.qc_paths(lib)[1]
    qc = json.loads(qc_file.read_text())["items"] if qc_file.exists() else {}
    want, built = set(), 0
    for it in data["items"]:
        q = qc.get(it["id"], {})
        for v in data["views"]:
            st = q.get(v, {}).get("status")
            name = f"{lib}_{it['id']}_{v}.webp"
            src = {look: next((s / SRC_DIR[look] / f"{it['id']}_{v}.png" for s in srcs
                               if (s / SRC_DIR[look] / f"{it['id']}_{v}.png").exists()), None) for look in looks}
            if st == "pass" and all(src.values()):
                for look, tiers in looks.items():
                    for t, (w, h) in tiers.items():
                        dst = out_dir / look / t / name
                        cwebp(src[look], dst, w, h, look, t)
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
    for f in out_dir.glob("*/*/*.webp"):
        if f not in want:
            f.unlink()
    (ROOT / cfg["out"]).write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(f"{lib}: {built} views built ({built * sum(map(len, looks.values()))} files)")


if __name__ == "__main__":
    main()
