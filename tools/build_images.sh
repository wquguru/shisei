#!/usr/bin/env bash
# Build the two committed image tiers from a source set (already-lossy 1344×1792 / 1120×2240 WebP).
# Usage: tools/build_images.sh <source-dir-with-img-and-photo> [out-dir=images]
# Re-encoding is downscale-only: w900 is the lightbox/download tier, w300 the grid tier.
# Full-size sources are never committed; they ship as a Release zip (docs/DECISIONS.md D-02).
set -euo pipefail
src=${1:?source dir}; out=${2:-images}
q900=75; q300=70
for kind in img:line photo:photo; do
  from=$src/${kind%%:*}; to=$out/${kind##*:}
  [ -d "$from" ] || continue
  mkdir -p "$to/w900" "$to/w300"
  for f in "$from"/*.webp; do
    n=$(basename "$f")
    [ "$to/w900/$n" -nt "$f" ] || cwebp -quiet -mt -m 6 -q $q900 -resize 900 0 -metadata none "$f" -o "$to/w900/$n"
    [ "$to/w300/$n" -nt "$f" ] || cwebp -quiet -mt -m 6 -q $q300 -resize 300 0 -metadata none "$f" -o "$to/w300/$n"
  done
done
du -sh "$out"/*/*
