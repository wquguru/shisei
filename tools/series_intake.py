#!/usr/bin/env python3
"""Collect Muse deliveries for the scene / prop / furniture / light / animal libraries into their source sets.

Port of costume_intake.py (docs/costume/PLAN.md §9–10). The library comes from each file's ID letter, so one call
can take every part of a run.

Usage (matting needs numpy, pillow and onnxruntime, so it does not run on the bare system python):
  uv run --with numpy --with pillow --with onnxruntime python -I tools/series_intake.py \
      ~/Downloads/run01-src ~/Downloads/run01-out/run01-3-prop-part1 … [--model ~/.u2net/isnet-general-use.onnx]

For every img/<ID>_<view>.png that Muse marked ok, under ROOT/<lib>/ (read-only input for later steps):
  raw/<ID>_<view>.png    the delivered image, centre-cropped to exactly 3:4 and resized to 1344×1792
and for the matted libraries (prop, furniture; series_kit.LIBS[lib]["matte"]) also, as in the costume library:
  alpha/  RGBA cut-out with the background colour removed from soft edges
  grey/   the cut-out on the house background #D9D9D9
  dark/   the cut-out on #18181B, used only by review sheets to expose matting errors
ROOT/<lib>/intake.json records per cell the delivery, Muse's outcome and note. Deliveries also hold their best
wrong attempts in img/; those are never taken (only `ok` rows), and cells nobody delivered are logged missing.
"""
import argparse, csv, json, pathlib, sys, time
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import series_kit as K

W, H = 1344, 1792
HOUSE, DARK = (217, 217, 217), (24, 24, 27)
LIB_OF = {cfg["letter"]: lib for lib, cfg in K.LIBS.items()}


def to_34(im: Image.Image) -> Image.Image:
    w, h = im.size
    if w * 4 > h * 3:  # too wide: trim the sides
        nw = h * 3 // 4
        im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    elif w * 4 < h * 3:
        nh = w * 4 // 3
        im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    return im.resize((W, H), Image.LANCZOS)


class Matter:
    """isnet-general-use (MIT), loaded on first use so the unmatted libraries need no onnxruntime."""

    def __init__(self, model: str):
        self.model, self.sess = model, None

    def __call__(self, src: pathlib.Path, stem: str, im: Image.Image) -> dict:
        import numpy as np
        if self.sess is None:
            import onnxruntime as ort
            self.sess = ort.InferenceSession(str(pathlib.Path(self.model).expanduser()),
                                             providers=["CoreMLExecutionProvider", "CPUExecutionProvider"])
            self.name = self.sess.get_inputs()[0].name
        rgb = np.asarray(im, np.float32)
        f = np.concatenate([rgb[:24].reshape(-1, 3), rgb[-24:].reshape(-1, 3),
                            rgb[:, :24].reshape(-1, 3), rgb[:, -24:].reshape(-1, 3)])
        bg = np.median(f, axis=0)
        x = np.asarray(im.resize((1024, 1024), Image.BILINEAR), np.float32) / 255.0 - 0.5
        m = self.sess.run(None, {self.name: x.transpose(2, 0, 1)[None]})[0][0, 0]
        m = (m - m.min()) / (m.max() - m.min() + 1e-8)
        al = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize(im.size, Image.BILINEAR), np.float32) / 255
        # Remove the background colour mixed into soft edges: C = aF + (1-a)B  =>  F = (C - (1-a)B) / a.
        a3 = al[..., None]
        fg = np.where(a3 > 0.02, (rgb - (1 - a3) * bg) / np.maximum(a3, 1e-3), rgb).clip(0, 255)
        # snap the faint floor and near-solid values: invisible, but they cost WebP bytes (costume D-10 7)
        al = np.where(al < 0.05, 0.0, np.where(al > 0.95, 1.0, al))
        a3 = al[..., None]
        Image.fromarray(np.dstack([fg.astype(np.uint8), (al * 255).round().astype(np.uint8)]), "RGBA") \
            .save(src / "alpha" / f"{stem}.png")
        for sub, col in (("grey", HOUSE), ("dark", DARK)):
            out = fg * a3 + np.array(col, np.float32) * (1 - a3)
            Image.fromarray(out.round().astype(np.uint8)).save(src / sub / f"{stem}.png")
        return {"bg": [round(float(v)) for v in bg]}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("root", help="parent of the per-library source sets, e.g. ~/Downloads/run01-src")
    ap.add_argument("deliveries", nargs="+")
    ap.add_argument("--model", default="~/.u2net/isnet-general-use.onnx")
    ap.add_argument("--reset", help="manifest.json of a repair brief: its cells are cleared first, so a view turned "
                                    "from an old main view never stays next to a new one")
    a = ap.parse_args()
    root = pathlib.Path(a.root).expanduser()
    matter, logs, t0, n = Matter(a.model), {}, time.time(), 0

    def lib_dir(stem: str) -> tuple:
        lib = LIB_OF[stem[0]]
        src = root / lib
        if lib not in logs:
            for d in ("raw", "alpha", "grey", "dark") if K.LIBS[lib]["matte"] else ("raw",):
                (src / d).mkdir(parents=True, exist_ok=True)
            p = src / "intake.json"
            logs[lib] = json.loads(p.read_text()) if p.exists() else {}
        return lib, src, logs[lib]

    if a.reset:
        man = json.loads(pathlib.Path(a.reset).expanduser().read_text())
        for cid, views in man["need"].items():
            for v in views:
                lib, src, log = lib_dir(f"{cid}_{v}")
                for d in ("raw", "alpha", "grey", "dark"):
                    (src / d / f"{cid}_{v}.png").unlink(missing_ok=True)
                log[f"{cid}_{v}"] = {"from": man["run"], "status": "missing", "muse": "", "note": "reset for " + man["run"]}

    for dl in map(lambda p: pathlib.Path(p).expanduser(), a.deliveries):
        for r in csv.DictReader(open(dl / "attempts.csv", encoding="utf-8")):
            stem = r["file"].rsplit(".", 1)[0]
            lib, src, log = lib_dir(stem)
            png = dl / "img" / r["file"]
            if r["outcome"] != "ok" or not png.exists():
                # Muse's verdict wins only when it produced nothing usable; a later delivery may still fill it.
                if stem not in log or log[stem].get("status") == "missing":
                    log[stem] = {"from": dl.name, "status": "missing", "muse": r["outcome"], "note": r["note"][:300]}
                continue
            im = to_34(Image.open(png).convert("RGB"))
            extra = matter(src, stem, im) if K.LIBS[lib]["matte"] else {}
            im.save(src / "raw" / f"{stem}.png")
            log[stem] = {"from": dl.name, "status": "ok", "muse": r["outcome"], "hits": r.get("hits", ""),
                         "note": r["note"][:300], **extra}
            n += 1
    for lib, log in logs.items():
        (root / lib / "intake.json").write_text(json.dumps(dict(sorted(log.items())), ensure_ascii=False, indent=1) + "\n")
        ok = sum(1 for v in log.values() if v["status"] == "ok")
        print(f"{lib}: {ok} ok, {len(log) - ok} missing -> {root / lib}")
    print(f"{n} images taken in {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
