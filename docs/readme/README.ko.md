<div align="center">

<img src="../logo.svg" width="72" alt="Shisei">

# Shisei 姿勢

**4개 시리즈 256가지 포즈 × 5개 앵글. AI 이미지 도구의 포즈 참고용 마네킹 선화 라이브러리.**

[English](../../README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · 한국어

[![Poses](https://img.shields.io/badge/포즈-256-15171A?style=flat-square)](../../data/catalog.json)
[![Line art](https://img.shields.io/badge/선화-1049%20QC%20passed-1A5CC8?style=flat-square)](../GENERATION.md)
[![Photos](https://img.shields.io/badge/실사-103-5B616A?style=flat-square)](../GENERATION.md)
[![Languages](https://img.shields.io/badge/이름-ja%20·%20zh%20·%20en%20·%20ko-0aa06e?style=flat-square)](../../data/catalog.csv)
[![Dependencies](https://img.shields.io/badge/런타임%20의존성-0-E07A52?style=flat-square)](../../web)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square)](../../LICENSE)

</div>

---

> **콘텐츠 안내:** 전신・섹시와 2인 시리즈는 다소 선정적인 성인용 포즈 참고입니다(마네킹, 노출 묘사 없음). 미리보기와 검색용 페이지에는 넣지 않으며, 갤러리에서는 스위치를 켜야 표시됩니다.

![Shisei 갤러리: 카테고리 색 타일 위에 마네킹 포즈가 늘어선 첫 화면](../screenshot.png)

Shisei는 직접 만든 포즈 참고 라이브러리입니다. 모든 포즈는 얼굴 없는 마네킹으로, 정면·사선·측면·위에서·아래에서의 다섯 앵글로 그렸습니다. 필요한 카메라 위치의 한 장을 그대로 이미지 모델에 넣으면 됩니다. 포즈 이름과 카테고리는 일본어·중국어·영어·한국어 네 가지 언어로 제공합니다.

모든 이미지는 이 프로젝트의 오리지널입니다.

## 구성 내용

| 시리즈 | 표시 포즈 | 품질 검사 통과 앵글 | 사이트에서 |
|---|---:|---:|---|
| 전신・표준 (`std`, P###) | 50 / 73 | 208 / 365 | 표시 |
| 상반신 (`upper`, U###) | 77 / 80 | 307 / 400 | 표시 |
| 전신・섹시 (`sexy`, S###) | 80 / 80 | 341 / 400 | 숨김 (스위치로 표시할 수 있음) |
| 2인 (`duo`, D###) | 49 / 55 | 193 / 275 | 숨김 (스위치로 표시할 수 있음) |

`suggestive` 등급 포즈(전신・섹시, 2인, 상반신의 섹시계·가슴 강조계)는 기본으로 숨겨지며, 첫 화면 스크롤, 포즈 페이지, 공유 카드, sitemap에는 들어가지 않습니다. 스위치 하나로 모두 표시할 수 있습니다.

- **모든 앵글을 품질 검사**했습니다([docs/qc/](../qc/README.md)). 유두 표시, 얼굴이나 머리카락, 옷, 배경, 망가진 구조, 잘못된 앵글, 미성년자로 보이는 인물, 이름과 다른 포즈는 `images/`와 catalog에서 뺐고, 이유는 `data/qc.json`에 남겼습니다. std의 23개 세트는 그림이 이름과 달라 이름을 고칠 때까지 숨깁니다.
- 생성하지 못한 앵글은 잘못된 그림으로 채우지 않고 비워 둡니다.
- **실사 103장** (std의 P001–P022, P050). 선화와 같이 품질 검사를 거쳤습니다. AI로 생성한 성인이며 실존 인물이 아닙니다.
- `data/catalog.json` / `catalog.csv`: 시리즈, 등급, 4개 언어 분류와 이름, std의 영문 포즈 설명, 앵글별 파일, 빈 앵글의 이유.

## 사용 방법

이미지 도구의 포즈 참고나 구도 참고에 앵글 한 장을 업로드하세요. 같은 포즈의 여러 앵글을 이어서 쓰면 인물의 자세가 더 일관됩니다. 얼굴, 옷, 배경은 프롬프트나 다른 참고 이미지로 지정하세요.

| 크기 | 위치 | 규격 | 장당 |
|---|---|---|---|
| `w300` | `images/*/w300/` | 너비 300 px | 약 6 KB |
| `w900` | `images/*/w900/` | 900 × 1200 | 약 26 KB |
| 원본 | [Releases](../../../../releases) zip | 1344 × 1792 (실사 1120 × 2240) | 약 100 KB |

저장소에는 웹용 두 가지 크기(약 17 MB)만 두고, 원본 이미지는 Release zip으로 배포하므로 클론이 가볍습니다.

## 갤러리

`web/`은 카탈로그에서 생성하는 의존성 없는 정적 갤러리입니다. 카테고리 탭, 검색, 앵글 필터, 선화 / 실사 전환, 포즈별 또는 한 장씩 보기, 키보드와 스와이프로 넘기는 라이트박스, 4개 언어 UI, 다크 모드를 지원합니다. 사양은 [DESIGN.md](../DESIGN.md)에 있습니다.

```bash
python3 tools/build_site.py --link-images      # site/ 생성 (이미지는 심볼릭 링크로 빠르게 미리보기)
python3 -m http.server 8000 -d site            # http://localhost:8000
python3 tools/build_site.py                    # 이미지를 포함한 배포용 사본, 약 17 MB
```

딥 링크로 라이트박스를 바로 열 수 있습니다: `#P001-diag`, `#P001-diag-photo`. 필터 조건은 쿼리 문자열에 들어갑니다 (`?lang=ko&cat=5&angle=1&src=photo`).

## 디렉터리

```
data/       catalog.json, catalog.csv — 유일한 데이터 원본
images/     line/과 photo/, 각각 w300/과 w900/
web/        정적 갤러리 소스 (index.html, app.js, app.css, i18n.js)
tools/      build_images.py, build_site.py, verify.py, qc_merge.py, review_sheets.py, pack_release.sh
docs/       DESIGN, DECISIONS, GENERATION, LICENSING, 언어별 README, 로고, 스크린샷
```

카탈로그와 이미지가 일치하는지 확인하려면:

```bash
python3 tools/verify.py
```

기여를 환영합니다. 먼저 [CONTRIBUTING.md](../../CONTRIBUTING.md)를 읽어 주세요 (코딩 에이전트는 [AGENTS.md](../../AGENTS.md)도 따릅니다). 보안 문제는 [SECURITY.md](../../SECURITY.md)에 따라 비공개로 알려 주세요.

## 현황과 로드맵

현재 **v0.1.0**입니다. 73가지 표준 포즈와 카탈로그는 안정적이며 ID는 바뀌지 않습니다. 갤러리는 새로 만들었습니다. 릴리스 노트는 [CHANGELOG.md](../../CHANGELOG.md), 미결 사항은 [DECISIONS.md](../DECISIONS.md)에 있습니다.

| 마일스톤 | 상태 |
|---|---|
| 표준 73가지 포즈 × 5개 앵글, 카탈로그, 웹용 두 크기, 검증 | ✅ 완료 |
| 카탈로그에서 생성하는 정적 갤러리 | ✅ 완료 |
| 공개 갤러리 shisei.indaloop.app (Cloudflare Pages) | ☐ 다음 |
| P062 아래 앵글 채우기 | ☐ 미해결 |
| 실사는 품질 검사 후 공개 (D-03) | ✅ 공개 |

## 감사의 말

갤러리는 [Inter Tight](https://fonts.google.com/specimen/Inter+Tight), [Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC), [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (SIL OFL 1.1, Google Fonts 제공)를 사용하며, README 배지는 [shields.io](https://shields.io)입니다. 라이선스 원칙은 [LICENSING.md](../LICENSING.md)에 있습니다.

## 참고 사항

모든 이미지는 이 프로젝트를 위해 만들었으며, 다른 포즈 모음에서 복사·트레이스·파생한 것이 아닙니다. 인물은 마네킹 또는 AI로 생성한 성인이며 실존 인물이 아닙니다. 실존 인물이나 미성년자를 표현하거나 노골적인 콘텐츠에 쓰지 마세요. 이미지 메타데이터는 삭제했습니다.

## 라이선스

Shisei의 코드, 카탈로그, 문서, 이미지는 모두 [Apache License 2.0](../../LICENSE)을 따릅니다 ([NOTICE](../../NOTICE) 참고). 상업적 이용을 포함해 이미지를 사용·수정·재배포할 수 있으며, 파일을 재배포할 때는 라이선스와 NOTICE를 함께 포함하세요. 포즈 참고로 사용해 생성한 이미지에는 추가 조건이 없습니다.
