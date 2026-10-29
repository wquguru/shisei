# AGENTS.md — Shisei

The single guide for AI agents (Claude Code, Codex, …) and humans working in this repository. `CLAUDE.md` only
includes this file.

## 1. What this is
A self-made pose reference library: faceless mannequin line art, each pose drawn from five angles (front, diag,
side, above, below), for people who drive AI image tools with pose references. Four series: `std` full body
(P###, 73 sets), `upper` upper body (U###, 80), `sexy` full body (S###, 80) and `duo` two figures (D###, 55); the last
two are rated suggestive. Plus photo renders for 23 std sets, a four-language catalog (ja / zh / en / ko) and a static gallery in `web/`.

## 2. Hard rules
- **No outside images.** Never download, cache, mirror, re-encode or trace images from ai-pose-gallery
  (ギア @giaaibusi), its Chinese mirror anhao/ai-pose-gallery-zh, or any other pose site. Their terms forbid
  redistributing the image data, processed copies included; the mirror's MIT licence covers its front-end code only.
  UI patterns may be referenced; code and copy may not be copied.
- **Catalog is the source of truth.** Every image is listed in `data/catalog.json`; `tools/verify.py` must pass.
  A view that could not be generated is `null` with `gaps: missing` — never fill a gap with a mirrored, flipped or
  low-quality drawing.
- **No view ships without a QC pass.** Every catalog view has `status: pass` in `data/qc.json`; a new or redrawn
  view goes through docs/qc/README.md (review sheets → Sonnet review + pose-name check → `qc_merge.py`) before it
  enters `images/`; photo renders likewise need a `pass` in qc.json `photos` (docs/qc/photo_prompt.md). Never mark a
  view `pass` by hand to get it in.
- **Ratings.** Every pose has `rating` (`general` / `suggestive`). Everything that passed QC is public; suggestive poses
  are shown by default behind one hide switch and stay out of the marquee, pose pages, share cards and sitemap (D-06).
  Nipple marks, exposure, genital detail and a figure that reads as a minor are generation errors: they fail QC.
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
README.md            overview (English); docs/readme/README.{zh-CN,ja,ko}.md — keep all four in step
LICENSE, NOTICE      Apache-2.0 for code, catalog, docs and images (D-01); NOTICE ships in every zip
CONTRIBUTING.md      contributor guide; SECURITY.md, CODE_OF_CONDUCT.md; .github/ issue + PR templates
CHANGELOG.md         Keep a Changelog; every user-visible change adds a line under [Unreleased]
data/catalog.json    288 poses: id, orig_id, series, rating, added_in, class_*, name_* (jp/cn/en/kr), desc_en,
                     views{front..below} (file or null), gaps{view: missing|line|structure}, photos{view: file},
                     bodies (duo only: MF / FF)
data/qc.json         per-view and per-photo QC status, reason and file name; per-set pose-name notes (docs/qc/README.md)
data/catalog.csv     tools/export_csv.py output (o = passed, x = failed QC, - = not generated)
images/line/w300/    grid tier, 300 px wide WebP q70
images/line/w900/    lightbox/download tier, 900×1200 WebP q75
images/photo/…       same two tiers for photo renders
web/                 gallery source: index.html template, app.js, app.css, i18n.js, common.js (share sheet, copy,
                     language links), favicon.svg, changelog.yaml (reader-facing changelog, four languages)
site/                build output of tools/build_site.py (git-ignored; deploy this): home, pose pages and changelog
                     per language (zh at the root, ja/ en/ ko/), og/ share cards, sitemap, robots, 404, manifest
build/og-cache/      share-card render cache (git-ignored)
tools/               build_images.py, build_site.py (+ site_pages.py, og_cards.py), verify.py, pack_release.sh,
                     import_series.py, review_sheets.py, line_dups.py, qc_merge.py, export_csv.py
docs/qc/             QC method, results and the reviewer prompts (line art, photos)
docs/DESIGN.md       gallery layout, tokens, interaction spec (agent-facing copy of the design canvas)
docs/DECISIONS.md    open questions and decisions awaiting a human
docs/GENERATION.md   how the sets were made, gap log
docs/LICENSING.md    licensing rules (outside images, redistribution, AI-generated images)
docs/logo.svg, docs/screenshot.png   README assets; retake the screenshot when the hero changes
.github/workflows/   CI: verify.py
```
File names are `<series>_<ID>_<view>.webp` (`std_P001_front.webp`, `upper_U001_front.webp`), identical across tiers.
All series share `data/catalog.json`; a new series gets its own prefix and ID letter.

## 4. Environment
- macOS, zsh. Unquoted `$var` is not word-split in zsh; write flags literally or use arrays.
- `cwebp` 1.6 (Homebrew) for image tiers; Python 3.9+ (system) is enough for the tools; run Python with `-I`.
- The source set lives outside the repo (e.g. `~/Downloads/pose-gallery-std73/`); treat it as read-only input.

## 5. Common commands
```bash
python3 tools/build_images.py std=~/Downloads/pose-gallery-std73 sexy=~/Downloads/pose-gallery-sexy80 \
  upper=~/Downloads/pose-gallery-upper80 duo=~/Downloads/pose-gallery-duo55   # passing views only; prunes the rest
python3 tools/verify.py                                # catalog ↔ qc.json ↔ images, gaps, orphans
python3 tools/import_series.py SRC --series X --added 0.2.0 [--general Cute]   # merge a new series
python3 tools/qc_merge.py <qc_dir>                     # apply review results (docs/qc/README.md)
python3 tools/build_site.py --link-images && python3 -m http.server 8000 -d site   # preview the gallery
python3 -I tools/build_site.py --public --site https://shisei.indaloop.app   # deploy build (D-05); share cards need Chrome, --no-og skips
tools/pack_release.sh ~/Downloads/pose-gallery-std73 0.1.0   # dist/shisei-std73-full-v0.1.0.zip + sha256
```

## 6. Way of working
- **Adding poses or views**: drop sources into the source set → `import_series.py` (or edit the catalog: all four
  languages, `desc_en` where possible) → QC per docs/qc/README.md → `qc_merge.py` → `build_images.py` → `verify.py`
  → `export_csv.py` → CHANGELOG line and a GENERATION.md note.
- **Translations**: ja is the original naming; zh / en / ko are translations. Keep names short (`動作・手の位置`
  shape); change all four together.
- **Web**: follow docs/DESIGN.md. Every UI string lives in `web/i18n.js` in all four languages; `index.html` placeholders
  (`__CATALOG__`, `__REPO__`, `__VERSION__`) are filled by `build_site.py`. Zero runtime dependencies, works at 390×844 without horizontal scroll, every
  string in all four languages, images lazy-loaded with `alt` = ID + name + view, keyboard: ← → angle, ↑ ↓ pose,
  Esc closes, `/` focuses search.
- **Pages and SEO**: strings the build needs (page titles, share sheet, changelog) live in the strict-JSON
  `I18N_PAGES` block at the end of `web/i18n.js`. Reader-facing updates go in `web/changelog.yaml` (all four
  languages; the build audits them) as well as CHANGELOG.md. Share what has a page: pose pages, not `#P001` hashes.
  Only std / general-rated poses with a usable view get pose pages, cards and sitemap rows.
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
| Pages deploy of `site/` to shisei.indaloop.app (D-05) | ✅ OK'd 2026-10-29 |
| ja / ko README copies, screenshot, community files | ✅ |
| Licence (D-01): Apache-2.0 | ✅ 2026-10-28 |
| Photo policy (D-03): public after photo QC | ✅ 2026-10-29 |
| Fill P062 below | ☐ open |
| upper + sexy series, line-art QC, series / rating filters | ✅ v0.2.0 (unreleased) |
| duo series (55 sets) and photo QC | ✅ v0.2.0 (unreleased) |
| Relabel the 23 std sets whose drawing is another pose (D-07) | ☐ waiting on a human |
| Rewrite failed views out of git history before going public (D-08) | ☐ waiting on a human |
