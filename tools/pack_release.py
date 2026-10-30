#!/usr/bin/env python3
"""Pack the Release downloads and record their sizes in data/packs.json for the gallery's download panel.

Usage: python3 -I tools/pack_release.py 0.2.0 std=~/Downloads/pose-gallery-std73 upper=... sexy=... duo=...
Writes to dist/:
  shisei-<series>-v<ver>.zip   one per series, the w900 tier (line art + photos): the recommended download
  shisei-all-v<ver>.zip        every series, w900
  shisei-original-v<ver>.zip   every series at the source resolution, from <src>/img and <src>/photo; redrawn sets
                               (catalog `source`) and single-view fills (catalog `fills`) from their source set,
                               at its resolution (digi: 900x1200)
Only files the catalog lists go in, so a view that failed QC never ships, even though the source sets still hold it.
Every zip carries LICENSE-images (CC0, the images), LICENSE (Apache-2.0) and NOTICE, which credits the pose list. The
images are already lossy WebP, so deflate barely shrinks them; it is used anyway because it costs nothing for the text.
The four READMEs' download links, counts and sizes are rewritten to match (verify.py checks the links).
"""
import hashlib, json, pathlib, re, sys, zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SERIES = ("std", "upper", "sexy", "duo")
READMES = ("README.md", "docs/readme/README.zh-CN.md", "docs/readme/README.ja.md", "docs/readme/README.ko.md")
LINK = re.compile(r"releases/download/v[\d.]+/shisei-(\w+)-v[\d.]+\.zip")


def entries(poses, original, srcs):
    """(path on disk, path in the zip) for every catalog line-art view and photo of these poses."""
    out = []
    for p in poses:
        for kind, key, sub in (("line", "views", "img"), ("photo", "photos", "photo")):
            for v, f in sorted((v, f) for v, f in (p.get(key) or {}).items() if f):
                root = (srcs[p.get("fills", {}).get(v) or p.get("source") or p["series"]] if kind == "line"
                        else srcs[p["series"]])
                disk = root / sub / f if original else ROOT / "images" / kind / "w900" / f
                out.append((disk, f"{kind}/{f}"))
    return out


def pack(path, files):
    path.unlink(missing_ok=True)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for disk, arc in files:
            z.write(disk, arc)
        for f in ("LICENSE", "LICENSE-images", "NOTICE"):
            z.write(ROOT / f, f)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    (path.parent / (path.name + ".sha256")).write_text(f"{digest}  {path.name}\n")
    return path.stat().st_size


def update_readmes(ver, packs):
    """Point the README download links at the new zips and refresh their counts and sizes.

    A table row ends `| sets | images | size |`; any other line with a link (the one under the badges) carries just
    the size. The Downloads section opens with the version, so a line starting `v<x.y.z>` is bumped too."""
    for md in READMES:
        path = ROOT / md
        out = []
        for line in path.read_text().split("\n"):
            m = LINK.search(line)
            if m and m.group(1) in packs:
                p = packs[m.group(1)]
                line = LINK.sub(lambda m: f"releases/download/v{ver}/{packs[m.group(1)]['file']}", line)
                size = f"{p['bytes'] / 1e6:.1f} MB"
                if line.startswith("|"):
                    cells = line.split("|")
                    cells[-4:-1] = [f" {p['sets']} ", f" {p['images']} ", f" {size} "]
                    line = "|".join(cells)
                else:
                    line = re.sub(r"\d+(\.\d+)? MB", size, line, count=1)
            line = re.sub(r"^v\d+\.\d+\.\d+(?=\W)", f"v{ver}", line)
            out.append(line)
        path.write_text("\n".join(out))


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1].count(".") != 2:
        sys.exit(__doc__)
    ver = sys.argv[1]
    srcs = {k: pathlib.Path(v).expanduser() for k, v in (a.split("=", 1) for a in sys.argv[2:])}
    catalog = [p for p in json.loads((ROOT / "data/catalog.json").read_text()) if any(p["views"].values())]
    need = {p["series"] for p in catalog} | {p["source"] for p in catalog if p.get("source")} | \
        {s for p in catalog for v, s in p.get("fills", {}).items() if p["views"].get(v)}
    if set(srcs) != need:
        sys.exit(f"need a source dir for each series and redraw source: {sorted(need)}")
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)

    jobs = [(s, f"shisei-{s}-v{ver}.zip", [p for p in catalog if p["series"] == s], False) for s in SERIES]
    jobs += [("all", f"shisei-all-v{ver}.zip", catalog, False), ("original", f"shisei-original-v{ver}.zip", catalog, True)]
    packs = {}
    for key, name, poses, original in jobs:
        files = entries(poses, original, srcs)
        missing = [str(d) for d, _ in files if not d.exists()]
        if missing:
            sys.exit(f"{name}: {len(missing)} files missing, e.g. {missing[0]}")
        size = pack(dist / name, files)
        packs[key] = {"file": name, "bytes": size, "sets": len(poses), "images": len(files)}
        print(f"{name}: {len(poses)} sets, {len(files)} images, {size / 1e6:.1f} MB")
    (ROOT / "data/packs.json").write_text(json.dumps({"version": ver, "packs": packs}, indent=1) + "\n")
    update_readmes(ver, packs)


if __name__ == "__main__":
    main()
