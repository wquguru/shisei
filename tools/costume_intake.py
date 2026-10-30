#!/usr/bin/env python3
"""Collect a Muse costume delivery into the costume source set and matte it (docs/costume/PLAN.md §9–10).

Usage (needs numpy, pillow and onnxruntime, so it does not run on the bare system python):
  uv run --with numpy --with pillow --with onnxruntime python -I tools/costume_intake.py \
      ~/Downloads/costume-hc ~/Downloads/costume-HC-run01-part1 … [--model ~/.u2net/isnet-general-use.onnx]

For every img/<ID>_<view>.png in the deliveries it writes, under SRC (read-only input for build steps):
  raw/<ID>_<view>.png    the delivered image, centre-cropped to exactly 3:4 and resized to 1344×1792
  alpha/<ID>_<view>.png  RGBA cut-out; edge pixels have the background colour removed so no grey halo
  grey/<ID>_<view>.png   the cut-out on the house background #D9D9D9 (D-10), so every image matches
  dark/<ID>_<view>.png   the cut-out on #18181B, used only by review sheets to expose matting errors
and SRC/intake.json: per file the delivery it came from, Muse's outcome/note and the measured background.
Files Muse marked wrong or refused are recorded as missing and not processed.
"""
import argparse, csv, json, pathlib, time
import numpy as np, onnxruntime as ort
from PIL import Image

W, H = 1344, 1792
HOUSE, DARK = (217, 217, 217), (24, 24, 27)
VIEWS = ("front", "back", "side", "diag")


def to_34(im: Image.Image) -> Image.Image:
    w, h = im.size
    if w * 4 > h * 3:  # too wide: trim the sides
        nw = h * 3 // 4
        im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    elif w * 4 < h * 3:
        nh = w * 4 // 3
        im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    return im.resize((W, H), Image.LANCZOS)


def border_bg(a: np.ndarray) -> tuple:
    """Median colour of a 24 px frame, and the spread between the four corners (a gradient shows up here)."""
    f = np.concatenate([a[:24].reshape(-1, 3), a[-24:].reshape(-1, 3), a[:, :24].reshape(-1, 3), a[:, -24:].reshape(-1, 3)])
    corners = [a[:40, :40], a[:40, -40:], a[-40:, :40], a[-40:, -40:]]
    lum = [float(c.mean()) for c in corners]
    return np.median(f, axis=0), max(lum) - min(lum)


def matte(sess, name, im: Image.Image) -> np.ndarray:
    x = np.asarray(im.resize((1024, 1024), Image.BILINEAR), np.float32) / 255.0 - 0.5
    m = sess.run(None, {name: x.transpose(2, 0, 1)[None]})[0][0, 0]
    m = (m - m.min()) / (m.max() - m.min() + 1e-8)
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize(im.size, Image.BILINEAR), np.float32) / 255.0


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("deliveries", nargs="+")
    ap.add_argument("--model", default="~/.u2net/isnet-general-use.onnx")
    a = ap.parse_args()
    src = pathlib.Path(a.src).expanduser()
    for d in ("raw", "alpha", "grey", "dark"):
        (src / d).mkdir(parents=True, exist_ok=True)
    log_path = src / "intake.json"
    log = json.loads(log_path.read_text()) if log_path.exists() else {}

    sess = ort.InferenceSession(str(pathlib.Path(a.model).expanduser()),
                                providers=["CoreMLExecutionProvider", "CPUExecutionProvider"])
    name = sess.get_inputs()[0].name
    t0, n = time.time(), 0
    for dl in map(lambda p: pathlib.Path(p).expanduser(), a.deliveries):
        rows = {r["file"]: r for r in csv.DictReader(open(dl / "attempts.csv", encoding="utf-8"))}
        for fname, r in rows.items():
            stem = fname[:-4]
            png = dl / "img" / fname
            if r["outcome"] != "ok" or not png.exists():
                # Muse's verdict wins only when it produced nothing usable; a later delivery may still fill it.
                if stem not in log or log[stem].get("status") == "missing":
                    log[stem] = {"from": dl.name, "status": "missing", "muse": r["outcome"], "note": r["note"][:300]}
                continue
            im = to_34(Image.open(png).convert("RGB"))
            rgb = np.asarray(im, np.float32)
            bg, spread = border_bg(rgb)
            al = matte(sess, name, im)
            # Remove the background colour mixed into soft edges: C = aF + (1-a)B  =>  F = (C - (1-a)B) / a.
            a3 = al[..., None]
            fg = np.where(a3 > 0.02, (rgb - (1 - a3) * bg) / np.maximum(a3, 1e-3), rgb).clip(0, 255)
            alpha8 = (al * 255).round().astype(np.uint8)
            Image.fromarray(np.dstack([fg.astype(np.uint8), alpha8]), "RGBA").save(src / "alpha" / f"{stem}.png")
            for sub, col in (("grey", HOUSE), ("dark", DARK)):
                out = fg * a3 + np.array(col, np.float32) * (1 - a3)
                Image.fromarray(out.round().astype(np.uint8)).save(src / sub / f"{stem}.png")
            im.save(src / "raw" / f"{stem}.png")
            log[stem] = {"from": dl.name, "status": "ok", "muse": r["outcome"], "hits": r.get("hits", ""),
                         "note": r["note"][:300], "bg": [round(float(v)) for v in bg], "bg_spread": round(spread, 1)}
            n += 1
    log_path.write_text(json.dumps(dict(sorted(log.items())), ensure_ascii=False, indent=1) + "\n")
    miss = sum(1 for v in log.values() if v["status"] == "missing")
    print(f"{n} images matted in {time.time() - t0:.0f}s; {len(log)} logged, {miss} missing -> {src}")


if __name__ == "__main__":
    main()
