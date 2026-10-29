# Contributing to Shisei

Thanks for helping. Shisei is a pose reference library, so most changes are judged by one question: does the catalog
still describe exactly the images in the repository, in all four languages? This file covers how to propose a change
and what "done" means here. Coding agents (Claude Code, Codex, …) also follow [AGENTS.md](AGENTS.md).

## Before you start

- **Typos, translations, gallery bugs**: open a pull request directly, or an issue if you are not sure.
- **New poses or a new series**: open an issue first (there is a "Pose request" template) so we can agree on the
  pose, its category and its four names. IDs are stable and never reused.
- **Security issues**: do not open a public issue; see [SECURITY.md](SECURITY.md).

## The one hard rule: no outside images

Every image in this repository is made for the project. Do not add, trace, re-encode or derive images from other pose
sites or collections (including ai-pose-gallery and its mirrors), even if their front-end code is open source: their
terms forbid redistributing the images. A pull request that adds an image must say how it was made.

Figures are mannequins or AI-generated adults. Nothing that reads as a minor, a real person or explicit content is
accepted.

## Setup

Requirements: Python 3.9+ for the tools, `cwebp` 1.6+ (`brew install webp`) only to rebuild image tiers. The gallery
has no runtime dependencies and no build step beyond `build_site.py`.

```bash
python3 -I tools/verify.py                                   # catalog ↔ files, known gaps, orphans
python3 -I tools/build_site.py --link-images                 # writes site/ with symlinked images
python3 -m http.server 8000 -d site                          # http://localhost:8000
python3 tools/build_images.py std=~/path/to/std-source-set …  # (re)build w300 + w600 + w900 for views that passed QC
```

## What a pull request needs

1. **`tools/verify.py` passes.** Never weaken it to make it pass. A view that could not be made is `null` in the
   catalog, listed in `gaps` (`missing`), and explained in [docs/GENERATION.md](docs/GENERATION.md) — never filled with a
   mirrored, flipped or low-quality drawing.
2. **Catalog entries are complete**: `class_*` and `name_*` in ja / zh / en / ko and an English `desc_en`. Japanese is
   the original naming; change all four names together and keep them short (`動作・手の位置`).
3. **Images**: only the `w300`, `w600` and `w900` tiers are committed, built by `tools/build_images.py` (metadata stripped), and only for views with a QC `pass` in `data/qc.json` ([docs/qc/](docs/qc/README.md)).
   Full-size originals ship in the Release zip. Image rebuilds go in their own commit.
4. **Web changes** follow [docs/DESIGN.md](docs/DESIGN.md), include a screenshot, work at 390×844 without horizontal
   scroll, and add every user-visible string to `web/i18n.js` in all four languages. Check with
   `node --check web/app.js web/i18n.js`.
5. **A CHANGELOG line** under `[Unreleased]` for every user-visible change.
6. **Code style**: comments in English, explaining why. No runtime dependencies in the gallery.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org) in English:

```
feat(data): add 6 squatting poses

Explain why the change is needed and how it was verified.
```

Scopes: `data`, `images`, `web`, `tools`, `docs`, `ci`. Keep the subject under 72 characters, one logical change per
commit. Pull requests are squash-merged, so the PR title becomes the commit subject.

## AI-assisted contributions

AI-assisted work is welcome; much of this repository was made with coding agents and image models. You are responsible
for everything you submit: look at every image, run the checks above, and make sure it follows the rules on this page.
Credit the tool with a `Co-Authored-By:` trailer if you like.

## Licence

Code and documentation are licensed under the [Apache License 2.0](LICENSE); images and the project's own data are
dedicated to the public domain under [CC0 1.0](LICENSE-images). By submitting a contribution you agree that code and
docs are licensed under Apache-2.0 (§5) and that images and data are released under CC0; there is no separate CLA. Make
sure you have the right to submit it. The pose list follows ai-pose-gallery's catalog and is credited, not licensed
(see [NOTICE](NOTICE)).

## Code of conduct

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
