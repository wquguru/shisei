# AGENTS.md — Shisei

The single guide for AI agents (Claude Code, Codex, …) and humans working in this repository. `CLAUDE.md` only
includes this file.

## 1. What this is
A self-made pose reference library: faceless mannequin line art, each pose drawn from five angles (front, diag,
side, above, below), for people who drive AI image tools with pose references. v0.1.0 ships 73 standard full-body
poses (364/365 views), 111 photo renders for 23 poses, a four-language catalog (ja / zh / en / ko) and, next, a static
gallery in `web/`.

## 2. Hard rules
- **No outside images.** Never download, cache, mirror, re-encode or trace images from ai-pose-gallery
  (ギア @giaaibusi), its Chinese mirror anhao/ai-pose-gallery-zh, or any other pose site. Their terms forbid
  redistributing the image data, processed copies included; the mirror's MIT licence covers its front-end code only.
  UI patterns may be referenced; code and copy may not be copied.
- **Catalog is the source of truth.** Every image is listed in `data/catalog.json`; `tools/verify.py` must pass.
  A view that could not be generated is `null` and goes into `KNOWN_GAPS` with the reason in `docs/GENERATION.md` —
  never fill a gap with a mirrored, flipped or low-quality drawing.
- **IDs are stable.** `P001`… never get renumbered or reused (P023 and P028 are retired). New poses take the next
  free number; the source-list number goes in `orig_id`.
- **Full-size originals stay out of git.** Commit only the `w300` and `w900` tiers; full size ships as a Release
  zip (`tools/pack_release.sh`).
- **Content safety.** Figures are mannequins or AI-generated adults. Nothing that reads as a minor, a real person or
  explicit content enters the repo.
- **Do not publish the repo, create releases, deploy, post or spend money** without a human's OK (§8).
- Never weaken `verify.py` to make it pass; never delete `docs/` content to "simplify" — fix it when outdated.

## 3. Layout
```
AGENTS.md            this file; CLAUDE.md only includes it
README.md            overview (English); docs/readme/README.zh-CN.md (ja / ko planned)
CHANGELOG.md         Keep a Changelog; every user-visible change adds a line under [Unreleased]
data/catalog.json    73 poses: id, orig_id, class_*, name_* (jp/cn/en/kr), desc_en, views{front..below}, photos[]
data/catalog.csv     same data for spreadsheets (o = view present)
images/line/w300/    grid tier, 300 px wide WebP q70
images/line/w900/    lightbox/download tier, 900×1200 WebP q75
images/photo/…       same two tiers for photo renders
web/                 gallery source: index.html template, app.js, app.css, i18n.js, favicon.svg
site/                build output of tools/build_site.py (git-ignored; deploy this)
tools/               build_images.sh, build_site.py, verify.py, pack_release.sh
docs/DESIGN.md       gallery layout, tokens, interaction spec (agent-facing copy of the design canvas)
docs/DECISIONS.md    open questions and decisions awaiting a human
docs/GENERATION.md   how the sets were made, gap log
.github/workflows/   CI: verify.py
```
File names are `std_<ID>_<view>.webp`, identical across tiers. `std` is the series (standard full-body); a future
series gets its own prefix and its own catalog file.

## 4. Environment
- macOS, zsh. Unquoted `$var` is not word-split in zsh; write flags literally or use arrays.
- `cwebp` 1.6 (Homebrew) for image tiers; Python 3.9+ (system) is enough for the tools; run Python with `-I`.
- The source set lives outside the repo (e.g. `~/Downloads/pose-gallery-std73/`); treat it as read-only input.

## 5. Common commands
```bash
tools/build_images.sh ~/Downloads/pose-gallery-std73   # (re)build w300 + w900, skips up-to-date files
python3 tools/verify.py                                # catalog ↔ files, known gaps, orphans
python3 tools/build_site.py --link-images && python3 -m http.server 8000 -d site   # preview the gallery
tools/pack_release.sh ~/Downloads/pose-gallery-std73 0.1.0   # dist/shisei-std73-full-v0.1.0.zip + sha256
```

## 6. Way of working
- **Adding poses or views**: drop sources into the source set → `build_images.sh` → add catalog entries (all four
  languages, `desc_en`) → `verify.py` → CHANGELOG line. A pose with a missing view ships with `null` plus a
  `KNOWN_GAPS` entry and a GENERATION.md note.
- **Translations**: ja is the original naming; zh / en / ko are translations. Keep names short (`動作・手の位置`
  shape); change all four together.
- **Web**: follow docs/DESIGN.md. Every UI string lives in `web/i18n.js` in all four languages; `index.html` placeholders
  (`__CATALOG__`, `__REPO__`, `__VERSION__`) are filled by `build_site.py`. Zero runtime dependencies, works at 390×844 without horizontal scroll, every
  string in all four languages, images lazy-loaded with `alt` = ID + name + view, keyboard: ← → angle, ↑ ↓ pose,
  Esc closes, `/` focuses search.
- **Comments and docs**: code comments in English, explain why. `docs/` may be Chinese; README is English-first with
  translated copies.

## 7. Git
- Conventional Commits in English: `feat(data): add 6 squatting poses`, `fix(images): rebuild w900 for P034`,
  `docs: …`. Scopes: `data`, `images`, `web`, `tools`, `docs`, `ci`.
- One logical change per commit; image rebuilds go in their own commit so diffs stay reviewable.
- Default branch `main`. Tag releases `vX.Y.Z` and attach the full-size zip.

## 8. Autonomy limits
Agents may edit files, rebuild tiers, run tools and commit locally. A human must OK: pushing to a public remote,
creating a release, deploying `web/`, choosing or changing a licence (docs/DECISIONS.md D-01), deleting images, or
adding a new image series.

## 9. Roadmap
| Item | State |
|---|---|
| 73 standard poses, catalog, two web tiers, verify | ✅ v0.1.0 |
| Gallery design (desktop, lightbox, mobile, card states, logo directions) | ✅ design canvas |
| `web/` static gallery generated from the catalog | ✅ |
| Pages deploy of `site/` | ☐ needs a human OK (§8) |
| ja / ko README copies, screenshot | ☐ |
| Licence decision (D-01), photo policy (D-03) | ☐ waiting on a human |
| Fill P062 below | ☐ open |
