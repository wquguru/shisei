#!/usr/bin/env bash
# Pack the full-size originals (never committed) into a Release asset.
# Usage: tools/pack_release.sh <source-dir-with-img-and-photo> <version>
set -euo pipefail
src=${1:?source dir}; ver=${2:?version, e.g. 0.1.0}
out=dist/shisei-std73-full-v$ver.zip
mkdir -p dist; rm -f "$out"
(cd "$src" && zip -qr -X - img photo) > "$out"
# Redistributed copies must carry the licence and notice (Apache-2.0 §4).
zip -qj -X "$out" LICENSE NOTICE
shasum -a 256 "$out" | tee "$out.sha256"
