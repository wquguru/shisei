#!/usr/bin/env python3
"""Clear background left inside a costume cut-out, or restore a small piece the matte dropped (docs/costume/PLAN.md §14).

The matting model keeps background that a garment encloses (a round cut-out, a leg opening, an armhole) as part of
the garment, fully or as a faint smudge; on the dark review composite it shows as a grey disc. Muse's own image is
clean there: the opening is the flat background colour. This clears every flat, background-coloured patch of the raw
image from the alpha, then rebuilds grey/ and dark/ the way costume_intake.py does.

With --restore it does the opposite for pieces floating apart from the garment (white cuffs, a collar): the model
drops pale ones as background. Every compact patch of the raw image that stands clearly off the background (brighter
or coloured, so not a cast shadow) and is mostly transparent in the matte is made solid.

Only run it on cells a reviewer failed as `matte` and look at the result: a garment part that is itself flat and the
exact background grey would be cleared too. The alpha before the first fix is kept in alpha-prehole/.

Usage: uv run --with numpy --with pillow --with scipy python -I tools/costume_holes.py ~/Downloads/costume-lg \
         C481_front C482_diag …
       … tools/costume_holes.py ~/Downloads/costume-lg --restore C486_front …
"""
import argparse, json, pathlib, shutil

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HOUSE, DARK = (217, 217, 217), (24, 24, 27)
TOL, MIN_PX = 6, 150  # within 6 levels of the background, at least 150 px of it at 1344×1792


def restore(rgb: np.ndarray, al: np.ndarray, bg: np.ndarray) -> np.ndarray:
    off = np.abs(rgb - bg).max(2)
    lit = (rgb.mean(2) > bg.mean() + 10) | (rgb.max(2) - rgb.min(2) > 20)
    obj = ndi.binary_closing(ndi.binary_opening((off > 18) & lit, iterations=2), iterations=3)
    obj = ndi.binary_fill_holes(obj)
    lab, n = ndi.label(obj)
    ids = [i for i in range(1, n + 1) if (lab == i).sum() >= 800 and al[lab == i].mean() < 0.5]
    piece = ndi.binary_dilation(np.isin(lab, ids), iterations=1)
    # edge alpha from the distance to the background, against the piece's own colour
    col = np.array([np.median(rgb[piece][:, c]) for c in range(3)]) if piece.any() else bg
    est = np.clip(np.linalg.norm(rgb - bg, axis=2) / max(float(np.linalg.norm(col - bg)), 1.0), 0, 1)
    edge = ndi.binary_dilation(piece, iterations=2) & ~ndi.binary_erosion(piece, iterations=2)
    return np.maximum(al, np.where(piece & ~edge, 1.0, np.where(edge, est, 0.0)))


def write(src: pathlib.Path, cell: str, rgb: np.ndarray, bg: np.ndarray, new: np.ndarray) -> None:
    new = np.where(new < 0.05, 0.0, np.where(new > 0.95, 1.0, new))
    a3 = new[..., None]
    fg = np.where(a3 > 0.02, (rgb - (1 - a3) * bg) / np.maximum(a3, 1e-3), rgb).clip(0, 255)
    Image.fromarray(np.dstack([fg.astype(np.uint8), (new * 255).round().astype(np.uint8)]), "RGBA") \
        .save(src / "alpha" / f"{cell}.png")
    for sub, col in (("grey", HOUSE), ("dark", DARK)):
        out = fg * a3 + np.array(col, np.float32) * (1 - a3)
        Image.fromarray(out.round().astype(np.uint8)).save(src / sub / f"{cell}.png")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("cells", nargs="+", help="e.g. C481_front")
    ap.add_argument("--restore", action="store_true", help="restore dropped pieces instead of clearing holes")
    a = ap.parse_args()
    src = pathlib.Path(a.src).expanduser()
    log_path = src / "intake.json"
    log = json.loads(log_path.read_text())
    (src / "alpha-prehole").mkdir(exist_ok=True)
    for cell in a.cells:
        keep = src / "alpha-prehole" / f"{cell}.png"
        if not keep.exists():
            shutil.copy2(src / "alpha" / f"{cell}.png", keep)
        rgb = np.asarray(Image.open(src / "raw" / f"{cell}.png").convert("RGB"), np.float32)
        al = np.asarray(Image.open(keep), np.float32)[..., 3] / 255.0
        bg = np.array(log[cell]["bg"], np.float32)
        lum = rgb.mean(2)
        if a.restore:
            new = restore(rgb, al, bg)
            write(src, cell, rgb, bg, new)
            log[cell]["restored"] = int(((al < 0.5) & (new >= 0.5)).sum())
            print(f"{cell}: {log[cell]['restored']} px restored")
            continue
        sd = np.sqrt(np.maximum(ndi.uniform_filter(lum ** 2, 9) - ndi.uniform_filter(lum, 9) ** 2, 0))
        # flat and the background's own grey: shaded lining and white or grey fabric differ by more than TOL
        flat = (np.abs(rgb - bg).max(2) < TOL) & (rgb.max(2) - rgb.min(2) < TOL) & (sd < 5)
        flat = ndi.binary_opening(flat, iterations=2)
        lab, n = ndi.label(flat & (al > 0.02))
        sizes = ndi.sum(np.ones_like(al), lab, range(1, n + 1))
        hole = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= MIN_PX])
        # the texture test misses the opening's last pixels next to the fabric: grow into anything close to the
        # background, then close specks the model left inside
        near = np.abs(rgb - bg).max(2) < 20
        for _ in range(8):
            hole = ndi.binary_dilation(hole) & near | hole
        # only small specks: a rim traced round the whole outline would otherwise fill the garment itself
        gaps, m = ndi.label(ndi.binary_fill_holes(hole) & ~hole)
        gsz = ndi.sum(np.ones_like(al), gaps, range(1, m + 1))
        hole |= np.isin(gaps, [i + 1 for i, s in enumerate(gsz) if s < 2000])
        hole = ndi.binary_dilation(hole, iterations=2)
        soft = ndi.gaussian_filter(hole.astype(np.float32), 1.0)
        new = al * (1 - soft)
        # The rim of an opening is a 2–3 px mix of fabric and background that the model left near-solid, a light
        # ring on dark fabric. Re-estimate alpha there from how far each pixel is from the background, measured
        # against the fabric colour just outside the rim; skipped where fabric and background are too close to tell.
        band = ndi.binary_dilation(hole, iterations=5) & ~hole
        solid = (al > 0.98) & ~ndi.binary_dilation(hole, iterations=3)
        wsum = ndi.uniform_filter(solid.astype(np.float32), 21)
        fab = np.stack([ndi.uniform_filter(rgb[..., c] * solid, 21) for c in range(3)], -1) / np.maximum(wsum, 1e-6)[..., None]
        span = np.linalg.norm(fab - bg, axis=2)
        est = np.clip(np.linalg.norm(rgb - bg, axis=2) / np.maximum(span, 1e-6), 0, 1)
        ok = band & (wsum > 0.05) & (span > 40)
        new = np.where(ok, np.minimum(new, est), new)
        write(src, cell, rgb, bg, new)
        cleared = int(((al > 0.05) & (new < 0.05)).sum())
        log[cell]["holes"] = cleared
        print(f"{cell}: {cleared} px cleared")
    log_path.write_text(json.dumps(dict(sorted(log.items())), ensure_ascii=False, indent=1) + "\n")


if __name__ == "__main__":
    main()
