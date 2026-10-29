<div align="center">

<a href="https://shisei.indaloop.app/en/"><img src="docs/logo.svg" width="72" alt="Shisei"></a>

# Shisei 姿勢

**256 mannequin poses in four series × 5 camera angles, drawn as clean line art for AI image tools.**

English · [简体中文](docs/readme/README.zh-CN.md) · [日本語](docs/readme/README.ja.md) · [한국어](docs/readme/README.ko.md)

[![Poses](https://img.shields.io/badge/poses-256-15171A?style=flat-square)](data/catalog.json)
[![Line art](https://img.shields.io/badge/line%20art-1049%20QC%20passed-1A5CC8?style=flat-square)](docs/GENERATION.md)
[![Photos](https://img.shields.io/badge/photos-103-5B616A?style=flat-square)](docs/GENERATION.md)
[![Languages](https://img.shields.io/badge/names-ja%20·%20zh%20·%20en%20·%20ko-0aa06e?style=flat-square)](data/catalog.csv)
[![Dependencies](https://img.shields.io/badge/runtime%20deps-0-E07A52?style=flat-square)](web)
[![Images](https://img.shields.io/badge/images-CC0--1.0-blue?style=flat-square)](LICENSE-images)
[![Code](https://img.shields.io/badge/code-Apache--2.0-blue?style=flat-square)](LICENSE)

</div>

---

> **Content note:** the sexy and duo series are suggestive adult pose references (faceless mannequins, no
> nudity detail). They are kept out of previews and search pages, and the gallery hides them until you turn them on.

[![Shisei gallery: hero with a marquee of mannequin poses on pastel category tiles](docs/screenshot.png)](https://shisei.indaloop.app/en/)

Shisei is a self-made pose reference library. Every pose is a faceless mannequin drawn from five angles — front,
three-quarter, side, above and below — so you can feed the same pose to an image model from whichever camera you
need. Names and categories come in Japanese, Chinese, English and Korean.

All images are original to this project.

## What's inside

| Series | Poses shown | Views that passed QC | On the site |
|---|---:|---:|---|
| Full body · standard (`std`, P###) | 50 of 73 | 208 / 365 | shown |
| Upper body (`upper`, U###) | 77 of 80 | 307 / 400 | shown |
| Full body · sexy (`sexy`, S###) | 80 of 80 | 341 / 400 | hidden; a switch shows it |
| Duo (`duo`, D###) | 49 of 55 | 193 / 275 | hidden; a switch shows it |

Poses rated `suggestive` (the sexy and duo series, upper's Sexy and Chest emphasis) are hidden by default and kept off
the marquee, pose pages, share cards and sitemap; one switch shows them.

- **Every view is reviewed** ([docs/qc/](docs/qc/README.md)). A view that fails (nipple marks, a face or hair,
  clothing, background, broken anatomy, the wrong camera angle, a figure that reads as a minor, or a drawing that is not
  the named pose) is removed
  from `images/` and the catalog, and `data/qc.json` keeps the reason. 23 std sets show a different pose from their
  name and stay hidden until they are relabelled.
- Views that were never generated stay empty rather than being filled with a bad drawing.
- **103 photo renders** for std P001–P022 and P050, reviewed like the line art: AI-generated adults, not real people.
- `data/catalog.json` / `catalog.csv`: series, rating, category and name in four languages, an English pose
  description for std, the file for each view, and why a view is empty.

## Using the images

Upload a view as the pose or composition reference in your image tool. Using several angles of the same pose keeps
the figure consistent across shots. Face, clothing and background come from your prompt or other references.

| Tier | Where | Size | Typical file |
|---|---|---|---|
| `w300` | `images/*/w300/` | 300 px wide | ~6 KB |
| `w900` | `images/*/w900/` | 900 × 1200 | ~26 KB |
| full | [Releases](../../releases) zip | 1344 × 1792 (photos 1120 × 2240) | ~100 KB |

The repository holds the two web tiers (about 17 MB). Each Release carries the downloads the gallery offers: the w900
tier as one zip per series and one for everything (recommended, about a quarter of the originals' size), plus the
originals. Only views that passed QC go in, and every zip includes LICENSE, LICENSE-images and NOTICE.

## Gallery

`web/` is a zero-dependency static gallery built from the catalog: category tabs, an angle filter, a
line-art / photo switch, a by-pose or single-image view, a lightbox with keyboard and swipe navigation, four UI
languages and a dark theme. The spec is in [docs/DESIGN.md](docs/DESIGN.md).

```bash
python3 tools/build_site.py --link-images      # writes site/ (images symlinked for a fast preview)
python3 -m http.server 8000 -d site            # http://localhost:8000
python3 tools/build_site.py                    # deployable copy with images, ~17 MB
```

Deep links open the lightbox directly: `#P001-diag`, `#P001-diag-photo`; filters live in the query string
(`?lang=ja&cat=5&angle=1&src=photo`).

## Layout

```
data/       catalog.json, catalog.csv — the source of truth
images/     line/ and photo/, each with w300/ and w900/ tiers
web/        static gallery source (index.html, app.js, app.css, i18n.js)
tools/      build_images.py, build_site.py, verify.py, qc_merge.py, review_sheets.py, pack_release.py
docs/       DESIGN, DECISIONS, GENERATION, LICENSING, translated READMEs, logo, screenshot
```

Check that the catalog and the images agree:

```bash
python3 tools/verify.py
```

Contributions are welcome: read **[CONTRIBUTING.md](CONTRIBUTING.md)** first (coding agents also follow
**[AGENTS.md](AGENTS.md)**). Please report security issues privately as described in [SECURITY.md](SECURITY.md).

## Status and roadmap

Shisei is at **v0.1.0**: the 73 standard poses and the catalog are stable, IDs never change, and the gallery is
new. Release notes are in [CHANGELOG.md](CHANGELOG.md); open questions in [docs/DECISIONS.md](docs/DECISIONS.md).

| Milestone | State |
|---|---|
| 73 standard poses × 5 angles, catalog, two web tiers, verify | ✅ done |
| Static gallery generated from the catalog | ✅ done |
| Public gallery at shisei.indaloop.app (Cloudflare Pages) | ☐ next |
| Fill the P062 *below* view | ☐ open |
| Photo renders, after their own QC pass (D-03) | ✅ public |

## Acknowledgements

The gallery uses [Inter Tight](https://fonts.google.com/specimen/Inter+Tight),
[Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC) and
[JetBrains Mono](https://www.jetbrains.com/lp/mono/) (SIL OFL 1.1), served by Google Fonts, and
[shields.io](https://shields.io) badges in this README. Licensing rules are in [docs/LICENSING.md](docs/LICENSING.md).

The pose list — which poses, their numbering (`orig_id`), names and categories — follows the public catalog of
[ai-pose-gallery](https://ai-pose-gallery.pages.dev/) by [ギア (@giaaibusi)](https://x.com/giaaibusi); the Chinese, English and Korean names are translations of it. Thank you. Only the list
is shared: every image here was made for this project. Shisei is not affiliated with or endorsed by its author.

## Notes

Every image was made for this project; none are copied, traced or derived from other pose collections. The figures
are mannequins or AI-generated adults and do not depict real people. Do not use them to depict real people or minors,
or for explicit content. Image metadata is stripped.

## License

- **Images** (`images/` and the Release zips) and the project's own data in `data/` are dedicated to the public domain
  under [CC0 1.0](LICENSE-images): use, modify and redistribute them, commercially or not, with no attribution needed.
- **Code and documentation** are licensed under the [Apache License 2.0](LICENSE).
- **The pose list** (selection, numbering, names and categories) comes from ai-pose-gallery's catalog and is credited,
  not licensed: neither licence covers it. See [NOTICE](NOTICE).

Using the images as a pose reference puts no conditions on the images you generate.
