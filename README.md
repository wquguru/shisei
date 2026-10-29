<div align="center">

# Shisei 姿勢

**73 mannequin poses × 5 camera angles, drawn as clean line art for AI image tools.**

English · [简体中文](docs/readme/README.zh-CN.md) · 日本語 (planned) · 한국어 (planned)

![Poses](https://img.shields.io/badge/poses-73-15171A?style=flat-square)
![Line art](https://img.shields.io/badge/line%20art-364%2F365-1A5CC8?style=flat-square)
![Photos](https://img.shields.io/badge/photos-111-5B616A?style=flat-square)
![Languages](https://img.shields.io/badge/names-ja%20·%20zh%20·%20en%20·%20ko-0aa06e?style=flat-square)
![License](https://img.shields.io/badge/license-TBD-lightgrey?style=flat-square)

</div>

---

<!-- TODO: docs/screenshot.png once web/ is built from the design canvas -->

Shisei is a self-made pose reference library. Every pose is a faceless mannequin drawn from five angles — front,
three-quarter, side, above and below — so you can feed the same pose to an image model from whichever camera you
need. Names and categories come in Japanese, Chinese, English and Korean.

All images are original to this project.

## What's inside

| Category | Poses | | Category | Poses |
|---|---:|---|---|---:|
| Sitting 座り | 14 | | Squatting しゃがみ | 6 |
| Standing 立ち | 14 | | Leaning forward 前かがみ | 6 |
| Kneeling 膝立ち | 10 | | Arching back 反り | 3 |
| Lying 寝そべり | 9 | | Twist ひねり | 3 |
| Side sit / W-sit 横座り | 8 | | **Total** | **73** |

- **364 of 365** line-art views. The one gap is P062 *below*: nine attempts failed, so it is marked missing rather
  than filled with a bad drawing.
- **111 photo renders** for 23 poses (P001–P022 in five angles, P050 front) — AI-generated adults, not real people.
- `data/catalog.json` / `catalog.csv`: ID, category and name in four languages, an English pose description you can
  paste into a prompt, and the file for each view.

## Using the images

Upload a view as the pose or composition reference in your image tool. Using several angles of the same pose keeps
the figure consistent across shots. Face, clothing and background come from your prompt or other references.

| Tier | Where | Size | Typical file |
|---|---|---|---|
| `w300` | `images/*/w300/` | 300 px wide | ~6 KB |
| `w900` | `images/*/w900/` | 900 × 1200 | ~26 KB |
| full | [Releases](../../releases) zip | 1344 × 1792 (photos 1120 × 2240) | ~100 KB |

The repository holds the two web tiers (about 17 MB). Full-size originals ship as a Release asset so cloning stays
fast.

## Gallery

`web/` is a zero-dependency static gallery built from the catalog: category tabs, search, an angle filter, a
line-art / photo switch, a by-pose or single-image view, a lightbox with keyboard and swipe navigation, four UI
languages and a dark theme. The spec is in [docs/DESIGN.md](docs/DESIGN.md).

```bash
python3 tools/build_site.py --link-images      # writes site/ (images symlinked for a fast preview)
python3 -m http.server 8000 -d site            # http://localhost:8000
python3 tools/build_site.py --repo https://github.com/<owner>/shisei   # deployable copy, ~17 MB
```

Deep links open the lightbox directly: `#P001-diag`, `#P001-diag-photo`; filters live in the query string
(`?lang=ja&cat=5&angle=1&src=photo`).

## Layout

```
data/       catalog.json, catalog.csv — the source of truth
images/     line/ and photo/, each with w300/ and w900/ tiers
web/        static gallery source (index.html, app.js, app.css, i18n.js)
tools/      build_images.sh, build_site.py, verify.py, pack_release.sh
docs/       DESIGN, DECISIONS, GENERATION, translated READMEs
```

Check that the catalog and the images agree:

```bash
python3 tools/verify.py
```

Contributions are welcome. Coding agents follow [AGENTS.md](AGENTS.md). Release notes are in
[CHANGELOG.md](CHANGELOG.md).

## License

**To be decided** before the first public release — see [docs/DECISIONS.md](docs/DECISIONS.md) D-01. Code and images
will carry separate licences.

The figures are mannequins or AI-generated adults and do not depict real people. Do not use them to depict real
people or minors.
