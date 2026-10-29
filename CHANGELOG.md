# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org).
For a data library, a minor version adds poses or views; a major version renames IDs, changes file names or changes
the catalog schema.

## [Unreleased]

### Added
- Licensed under Apache-2.0 (`LICENSE`, `NOTICE`) for code, catalog, docs and images; the full-size zip now includes
  both files. Licensing rules in [docs/LICENSING.md](docs/LICENSING.md).
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue templates (bug, pose request) and a PR template.
- Japanese and Korean READMEs; all four READMEs gain the logo, a gallery screenshot, roadmap and licence sections.
- Static gallery in `web/`, built into `site/` by `tools/build_site.py`: hero with pose marquee, 23 new poses row,
  category / angle / line-art-or-photo / by-pose-or-single filters, search, warm-grey cards that take their category
  colour on hover, per-card angle dots, lightbox with downloads and copyable pose description, keyboard (← → ↑ ↓ L Esc,
  `/` for search) and swipe navigation, deep links, ja / zh / en / ko UI, dark theme, mobile filter sheet.
- Logo (line of action) and favicon.
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
