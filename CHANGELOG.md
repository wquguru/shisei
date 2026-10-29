# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org).
For a data library, a minor version adds poses or views; a major version renames IDs, changes file names or changes
the catalog schema.

## [Unreleased]

### Added
- Compare mode: the lightbox's source switch is now line art / photo / compare. Compare shows both at one height side
  by side (no overlay: they are framed differently), keeps the gap box for a missing side, marks angles that have both,
  and offers both 900 downloads. `L` cycles the three; deep link `#P001-diag-compare`. Pose pages with photos get a
  「线稿与实拍对照」 section. The grid keeps two modes.

### Changed
- Repeat visits load faster: scripts and styles are cached for a year under a content-hash `?v=`, images for a
  week with background revalidation (`site/_headers` for Cloudflare Pages). The hero marquee loads at low priority.
- Images and the project's own data are now CC0 1.0 (`LICENSE-images`); code and docs stay Apache-2.0. Every zip ships
  LICENSE, LICENSE-images and NOTICE. README and NOTICE credit the pose list to ai-pose-gallery by ギア (@giaaibusi).
- The README logo and screenshot link to the gallery at shisei.indaloop.app, in the README's language.
- Page titles, descriptions, hero headings and README taglines now say what people search for in each language:
  白模 / 素体ポーズ集 / mannequin pose reference / 마네킹 포즈 자료, free CC0, and the AI tools (Nano Banana, ChatGPT,
  ComfyUI, Midjourney).
- README screenshot retaken from the live gallery; README pose and view counts brought up to date.

### Fixed
- Lightbox angle arrows: ← → keys kept working only while focus stayed inside the lightbox, so they stopped after a
  click on a view chip, the line/photo switch or the image; the arrow buttons now grey out on poses with one view or
  none instead of looking live and doing nothing.

### Removed
- P006 front view: the drawing has three arms, which the QC review missed. Manual QC results now go in
  `data/qc-input/fail_manual.json`.
- Eight views a reviewer had failed but `qc_merge.py` let through: the floor-line rule matched "ground" inside
  "background". S006 diag / side / below (wall drawn), S068 front / side / below (ruled line), U032 below (table
  edge), D048 side (leg cut by the frame). The rule now only forgives line-level fails that name nothing but a floor
  line.
- 41 views with extra, missing or malformed limbs, hands drawn as stumps, or feet cut by the frame, found by a new
  limb-count check (`docs/qc/limbs_prompt.md`, `review_sheets.py --mode limbs`) and confirmed by a person. S039
  (every view drew stumps for hands) is no longer shown.

## [0.2.0] - 2026-10-29

### Added
- Two new series: upper body (80 poses, U001–U080) and full-body sexy (80 poses, S001–S080). The catalog gains
  `series`, `rating`, `added_in` and `gaps`; `photos` becomes a `{view: file}` map.
- Duo series: 55 two-figure poses (D001–D055, `bodies` MF / FF), rated suggestive; 49 sets and 193 / 275 views pass QC.
- Line-art QC for all 1,375 views ([docs/qc/](docs/qc/README.md)): Sonnet panel review plus a pose-name check,
  merged by `tools/qc_merge.py` into `data/qc.json`. 1,049 views pass; failed views leave `images/` and the catalog.
- Content-rating review of every shown set ([docs/qc/rating_prompt.md](docs/qc/rating_prompt.md)); 15 ratings changed by hand
  (`data/rating_overrides.json`): 13 to general, P057 and P071 to suggestive.
- Photo-render QC ([docs/qc/photo_prompt.md](docs/qc/photo_prompt.md)): 103 / 112 pass, results in `qc.json` `photos`.
- Gallery: series tabs, a "sexy content" switch (hidden by default, D-06), an "all 5 angles" filter, "failed QC" vs
  "not generated" placeholders, and counts computed from the data.
- Tools: `import_series.py`, `review_sheets.py`, `line_dups.py`, `qc_merge.py`, `export_csv.py`; `build_images.py`
  replaces `build_images.sh` and prunes files that are no longer in the catalog.
- Licensed under Apache-2.0 (`LICENSE`, `NOTICE`) for code, catalog, docs and images; the full-size zip now includes
  both files. Licensing rules in [docs/LICENSING.md](docs/LICENSING.md).
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue templates (bug, pose request) and a PR template.
- Japanese and Korean READMEs; all four READMEs gain the logo, a gallery screenshot, roadmap and licence sections.
- Static gallery in `web/`, built into `site/` by `tools/build_site.py`: hero with pose marquee, 23 new poses row,
  category / angle / line-art-or-photo / by-pose-or-single filters, search, warm-grey cards that take their category
  colour on hover, per-card angle dots, lightbox with downloads and copyable pose description, keyboard (← → ↑ ↓ L Esc,
  `/` for search) and swipe navigation, deep links, ja / zh / en / ko UI, dark theme, mobile filter sheet.
- Logo (line of action) and favicon.
- A page per pose in four languages (`pose/P001/`, `ja/pose/P001/` …) with all angles, other-language names,
  prev / next and same-category links; the gallery and each language get their own URL (`/`, `/ja/`, `/en/`, `/ko/`).
- Share button (lightbox, pose pages, changelog, footer): system share sheet on phones, otherwise copy link plus X,
  Facebook, Pinterest and per-language Weibo / LINE / Reddit. Every page has a 1200×630 share card rendered from the
  line art (`tools/og_cards.py`, headless Chrome).
- In-site changelog (`web/changelog.yaml` → `/changelog/` in four languages, Atom feed per language).
- SEO: canonical, hreflang + x-default, Open Graph and Twitter cards, JSON-LD (WebSite + Dataset, ImageGallery,
  BreadcrumbList, CollectionPage), sitemap.xml with image entries, robots.txt, 404 page, web manifest and icons;
  the build fails on a missing share tag or a broken relative link.
- Gallery design: desktop, lightbox, mobile filter sheet and five pose-card states ([docs/DESIGN.md](docs/DESIGN.md)).
- Gallery download panel: the w900 tier as one zip per series and one for all series (recommended, about a quarter
  of the originals' size), plus an originals zip; sizes come from `data/packs.json`. `tools/pack_release.py` replaces
  `pack_release.sh` and packs only views that passed QC (the old script zipped the whole source set).

### Changed
- Suggestive poses (sexy, duo, upper's Sexy and Chest emphasis) are now hidden by default; the switch shows them (D-06).
- Neutral names for suggestive poses: duo categories no longer use sex-position terms (e.g. 後背位 → 前後に並ぶ,
  From-behind → One behind the other), and ja names in the sexy and upper series match the plainer zh / en / ko wording.
- Gallery: the language button is now a menu listing all four languages (it used to cycle through them, and a
  `?lang` in the address could send the reader back); pose counts in the hero cover the whole library and no longer
  change with the sexy-content switch.

### Removed
- 157 std views that failed QC, including 23 whole sets whose drawing is a different pose from their name (D-07).
- 9 photo renders that failed QC (cropped limbs, an extra foot).
- Gallery search (and the `/` shortcut, `?q=`) and the "N new poses" row on the home page; the NEW filter stays.

## [0.1.0] - 2026-10-28

First version, prepared for open-sourcing.

### Added
- 73 standard full-body poses × 5 angles (front, three-quarter, side, above, below): 364 of 365 line-art views.
  P062 *below* is a known gap after nine failed attempts.
- 23 new poses on top of the earlier 50: lying 5, squatting 6, leaning forward 6, arching back 3, twist 3. Their
  numbers in the source list are kept in `orig_id`.
- 111 photo renders for 23 poses (P001–P022 in five angles, P050 front).
- `data/catalog.json` and `catalog.csv`: categories and names in ja / zh / en / ko, an English pose description,
  file per view, list of views that have photos.
- Two web tiers per image (`w300`, `w900`, WebP, metadata stripped), 55 MB → 17 MB; full-size originals as a
  Release asset.
- `tools/verify.py` (catalog ↔ files, known gaps), `tools/build_images.sh`, `tools/pack_release.sh`, CI.

[Unreleased]: ../../compare/v0.1.0...HEAD
[0.1.0]: ../../releases/tag/v0.1.0
