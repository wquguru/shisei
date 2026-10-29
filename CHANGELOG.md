# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org).
For a data library, a minor version adds poses or views; a major version renames IDs, changes file names or changes
the catalog schema.

## [Unreleased]

### Added
- Two new series: upper body (80 poses, U001–U080) and full-body sexy (80 poses, S001–S080). The catalog gains
  `series`, `rating`, `added_in` and `gaps`; `photos` becomes a `{view: file}` map.
- Duo series: 55 two-figure poses (D001–D055, `bodies` MF / FF), rated suggestive; 49 sets and 193 / 275 views pass QC.
- Line-art QC for all 1,375 views ([docs/qc/](docs/qc/README.md)): Sonnet panel review plus a pose-name check,
  merged by `tools/qc_merge.py` into `data/qc.json`. 1,049 views pass; failed views leave `images/` and the catalog.
- Photo-render QC ([docs/qc/photo_prompt.md](docs/qc/photo_prompt.md)): 103 / 112 pass, results in `qc.json` `photos`.
- Gallery: series tabs, a "sexy content" switch (shown by default, D-06), an "all 5 angles" filter, "failed QC" vs
  "not generated" placeholders, and counts computed from the data.
- Tools: `import_series.py`, `review_sheets.py`, `line_dups.py`, `qc_merge.py`, `export_csv.py`; `build_images.py`
  replaces `build_images.sh` and prunes files that are no longer in the catalog.

### Changed
- Neutral names for suggestive poses: duo categories no longer use sex-position terms (e.g. 後背位 → 前後に並ぶ,
  From-behind → One behind the other), and ja names in the sexy and upper series match the plainer zh / en / ko wording.

### Removed
- 157 std views that failed QC, including 23 whole sets whose drawing is a different pose from their name (D-07).
- 9 photo renders that failed QC (cropped limbs, an extra foot).
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
