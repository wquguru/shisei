<div align="center">

<a href="https://shisei.indaloop.app/ko/"><img src="../logo.svg" width="72" alt="Shisei"></a>

# Shisei 姿勢

**무료(CC0) 마네킹 포즈 자료. 4개 시리즈 280가지 포즈 × 5개 앵글의 선화를 Nano Banana, ChatGPT, ComfyUI, Midjourney 등 AI 그림 도구의 포즈 참고로 바로 쓸 수 있습니다.**

[English](../../README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · 한국어

**[갤러리 열기](https://shisei.indaloop.app/ko/) · [전체 다운로드 (w900, 34.1 MB)](https://github.com/wquguru/shisei/releases/download/v0.3.0/shisei-all-v0.3.0.zip) · [다른 다운로드](#다운로드)**

[![Poses](https://img.shields.io/badge/포즈-280-15171A?style=flat-square)](../../data/catalog.json)
[![Line art](https://img.shields.io/badge/선화-1133%20QC%20passed-1A5CC8?style=flat-square)](../GENERATION.md)
[![Photos](https://img.shields.io/badge/실사-89-5B616A?style=flat-square)](../GENERATION.md)
[![Languages](https://img.shields.io/badge/이름-ja%20·%20zh%20·%20en%20·%20ko-0aa06e?style=flat-square)](../../data/catalog.csv)
[![Dependencies](https://img.shields.io/badge/런타임%20의존성-0-E07A52?style=flat-square)](../../web)
[![Images](https://img.shields.io/badge/images-CC0--1.0-blue?style=flat-square)](../../LICENSE-images)
[![Code](https://img.shields.io/badge/code-Apache--2.0-blue?style=flat-square)](../../LICENSE)

</div>

---

> **콘텐츠 안내:** 전신・섹시와 2인 시리즈는 다소 선정적인 성인용 포즈 참고입니다(마네킹, 노출 묘사 없음). 미리보기와 검색용 페이지에는 넣지 않으며, 갤러리에서는 기본으로 흐리게 보이며, 하나씩 탭하거나 스위치를 켜면 볼 수 있습니다.

[![Shisei 갤러리: 카테고리 색 타일 위에 마네킹 포즈가 늘어선 첫 화면](../screenshot.png)](https://shisei.indaloop.app/ko/)

Shisei는 직접 만든 포즈 참고 라이브러리입니다. 모든 포즈는 얼굴 없는 마네킹으로, 정면·사선·측면·위에서·아래에서의 다섯 앵글로 그렸습니다. 필요한 카메라 위치의 한 장을 그대로 이미지 모델에 넣으면 됩니다. 포즈 이름과 카테고리는 일본어·중국어·영어·한국어 네 가지 언어로 제공합니다.

모든 이미지는 이 프로젝트의 오리지널입니다.

## 구성 내용

| 시리즈 | 표시 포즈 | 품질 검사 통과 앵글 | 사이트에서 |
|---|---:|---:|---|
| 전신・표준 (`std`, P###) | 71 / 73 | 287 / 365 | 표시 |
| 상반신 (`upper`, U###) | 80 / 80 | 337 / 400 | 표시 |
| 전신・섹시 (`sexy`, S###) | 80 / 80 | 323 / 400 | 흐림 (탭 또는 스위치로 표시) |
| 2인 (`duo`, D###) | 49 / 55 | 186 / 275 | 흐림 (탭 또는 스위치로 표시) |

`suggestive` 등급 포즈(전신・섹시, 2인, 상반신의 섹시계·가슴 강조계)는 갤러리에서 기본으로 흐리게 표시되며, 첫 화면 스크롤, 포즈 페이지, 공유 카드, sitemap에는 들어가지 않습니다. 하나씩 탭해서 볼 수 있고, 스위치 하나로 모두 표시할 수 있습니다.

- **모든 앵글을 품질 검사**했습니다([docs/qc/](../qc/README.md)). 유두 표시, 얼굴이나 머리카락, 옷, 배경, 망가진 구조, 잘못된 앵글, 미성년자로 보이는 인물, 이름과 다른 포즈는 `images/`와 catalog에서 뺐고, 이유는 `data/qc.json`에 남겼습니다. 
- 원래 그림이 2앵글 이하였거나 이름과 다른 포즈였던 43개 세트는 다른 생성원으로 다시 그렸습니다(catalog의 `source: digi`. 약간 다른 마네킹이고 위·아래 앵글이 완만합니다. 세트 단위로 교체하며 섞지 않습니다). P038과 P052는 그림이 이름과 달라 계속 숨깁니다.
- 생성하지 못한 앵글은 잘못된 그림으로 채우지 않고 비워 둡니다.
- **실사 89장** (std의 P001–P022, P050. P019·P020·P022는 예전 그림의 포즈라 뺐습니다). 선화와 같이 품질 검사를 거쳤습니다. AI로 생성한 성인이며 실존 인물이 아닙니다.
- `data/catalog.json` / `catalog.csv`: 시리즈, 등급, 4개 언어 분류와 이름, std의 영문 포즈 설명, 앵글별 파일, 빈 앵글의 이유.

## 사용 방법

이미지 도구의 포즈 참고나 구도 참고에 앵글 한 장을 업로드하세요. 같은 포즈의 여러 앵글을 이어서 쓰면 인물의 자세가 더 일관됩니다. 얼굴, 옷, 배경은 프롬프트나 다른 참고 이미지로 지정하세요.

| 크기 | 위치 | 규격 | 장당 |
|---|---|---|---|
| `w300` | `images/*/w300/` | 너비 300 px | 약 7 KB |
| `w600` | `images/*/w600/` | 600 × 800 | 약 17 KB |
| `w900` | `images/*/w900/` | 900 × 1200 | 약 29 KB |
| 원본 | [원본 zip](#다운로드) | 1344 × 1792 (실사 1120 × 2240, 다시 그린 세트 900 × 1200) | 약 100 KB |

저장소에는 웹용 세 가지 크기(약 63 MB)만 두므로 클론이 가볍습니다. 원본과 묶음 zip은 [Releases](https://github.com/wquguru/shisei/releases) 페이지에 있습니다.

### 다운로드

v0.3.0, 갤러리 다운로드 패널과 같은 파일입니다. 품질 검사를 통과한 앵글의 w900(선화와 실사)에 LICENSE, LICENSE-images, NOTICE가 들어 있고, zip마다 옆에 `.sha256`이 있습니다.

| zip | 세트 | 이미지 | 크기 |
|---|---:|---:|---:|
| [전체 시리즈](https://github.com/wquguru/shisei/releases/download/v0.3.0/shisei-all-v0.3.0.zip) (추천) | 280 | 1222 | 34.1 MB |
| [전신・표준](https://github.com/wquguru/shisei/releases/download/v0.3.0/shisei-std-v0.3.0.zip) | 71 | 376 | 9.0 MB |
| [상반신](https://github.com/wquguru/shisei/releases/download/v0.3.0/shisei-upper-v0.3.0.zip) | 80 | 337 | 9.4 MB |
| [전신・섹시](https://github.com/wquguru/shisei/releases/download/v0.3.0/shisei-sexy-v0.3.0.zip) (선정적) | 80 | 323 | 8.5 MB |
| [2인](https://github.com/wquguru/shisei/releases/download/v0.3.0/shisei-duo-v0.3.0.zip) (선정적) | 49 | 186 | 7.1 MB |
| [원본](https://github.com/wquguru/shisei/releases/download/v0.3.0/shisei-original-v0.3.0.zip) | 280 | 1222 | 144.8 MB |

## 갤러리

`web/`은 카탈로그에서 생성하는 의존성 없는 정적 갤러리입니다. 시리즈 탭(시리즈를 고르면 분류로 필터), 앵글 필터, 선화 / 실사 전환, 포즈별 또는 한 장씩 보기, 섹시 시리즈의 흐림을 푸는 스위치, 키보드와 스와이프로 넘기고 선화 / 실사 / 비교를 바꿀 수 있는 라이트박스, 포즈별 페이지, 4개 언어 UI, 다크 모드를 지원합니다. 사양은 [DESIGN.md](../DESIGN.md)에 있습니다.

```bash
python3 tools/build_site.py --link-images      # site/ 생성 (이미지는 심볼릭 링크로 빠르게 미리보기)
python3 -m http.server 8000 -d site            # http://localhost:8000
python3 -I tools/build_site.py --public --site https://shisei.indaloop.app   # 이미지와 공유 카드를 포함한 배포용 빌드
```

딥 링크로 라이트박스를 바로 열 수 있습니다: `#P001-diag`, `#P001-diag-photo`, `#P001-diag-compare`. 필터 조건은 쿼리 문자열에 들어갑니다 (`?lang=ko&series=std&cat=5&angle=1&src=photo`).

## 디렉터리

```
data/       catalog.json, catalog.csv — 유일한 데이터 원본
images/     line/과 photo/, 각각 w300/, w600/, w900/
web/        정적 갤러리 소스 (index.html, app.js, app.css, i18n.js, common.js, changelog.yaml)
tools/      build_images.py, build_site.py, verify.py, import_series.py, qc_merge.py, review_sheets.py, pack_release.py 등
docs/       DESIGN, DECISIONS, GENERATION, LICENSING, 언어별 README, 로고, 스크린샷
```

카탈로그와 이미지가 일치하는지 확인하려면:

```bash
python3 tools/verify.py
```

기여를 환영합니다. 먼저 [CONTRIBUTING.md](../../CONTRIBUTING.md)를 읽어 주세요 (코딩 에이전트는 [AGENTS.md](../../AGENTS.md)도 따릅니다). 보안 문제는 [SECURITY.md](../../SECURITY.md)에 따라 비공개로 알려 주세요.

## 현황과 로드맵

현재 **v0.3.0**입니다. 4개 시리즈 280가지 포즈이며, 카탈로그는 안정적이고 ID는 바뀌지 않습니다. 릴리스 노트는 [CHANGELOG.md](../../CHANGELOG.md), 미결 사항은 [DECISIONS.md](../DECISIONS.md)에 있습니다.

| 마일스톤 | 상태 |
|---|---|
| 표준 73가지 포즈 × 5개 앵글, 카탈로그, 웹용 크기, 검증 | ✅ v0.1.0 |
| 상반신・섹시・2인 시리즈, 앵글별 품질 검사 | ✅ v0.2.0 |
| 실사는 품질 검사 후 공개 (D-03) | ✅ 공개 |
| 공개 갤러리 [shisei.indaloop.app](https://shisei.indaloop.app/ko/) (Cloudflare Pages) | ✅ 운영 중 |
| 앵글이 적거나 다른 포즈였던 43개 세트를 세트 단위로 다시 그림 (D-09) | ✅ v0.3.0 |
| P038・P052: 그림이 다른 포즈 | ☐ 미해결 |
| P062 아래 앵글 채우기 | ☐ 미해결 |

## 감사의 말

갤러리는 [Inter Tight](https://fonts.google.com/specimen/Inter+Tight), [Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC), [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (SIL OFL 1.1, Google Fonts 제공)를 사용하며, README 배지는 [shields.io](https://shields.io)입니다. 라이선스 원칙은 [LICENSING.md](../LICENSING.md)에 있습니다.

포즈 목록(어떤 포즈를 넣을지, 번호 `orig_id`, 이름, 분류)은 [ギア (@giaaibusi)](https://x.com/giaaibusi)의 [ai-pose-gallery](https://ai-pose-gallery.pages.dev/) 공개 카탈로그를 따랐으며, 중국어·영어·한국어 이름은 그 번역입니다. 감사드립니다. 가져온 것은 목록뿐이고, 이미지는 모두 이 프로젝트에서 직접 만들었습니다. Shisei는 원작자와 관계가 없으며 원작자의 승인을 받지 않았습니다.

## 참고 사항

모든 이미지는 이 프로젝트를 위해 만들었으며, 다른 포즈 모음에서 복사·트레이스·파생한 것이 아닙니다. 인물은 마네킹 또는 AI로 생성한 성인이며 실존 인물이 아닙니다. 실존 인물이나 미성년자를 표현하거나 노골적인 콘텐츠에 쓰지 마세요. 이미지 메타데이터는 삭제했습니다.

## 라이선스

- **이미지**(`images/`와 Release의 zip)와 `data/`의 이 프로젝트 자체 데이터는 [CC0 1.0](../../LICENSE-images)으로 권리를 포기합니다. 상업적 이용을 포함해 자유롭게 사용·수정·재배포할 수 있으며 출처 표시도 필요 없습니다.
- **코드와 문서**는 [Apache License 2.0](../../LICENSE)을 따릅니다.
- **포즈 목록**(선정, 번호, 이름, 분류)은 ai-pose-gallery의 카탈로그에서 왔으며, 출처만 밝힐 뿐 위의 두 라이선스 대상이 아닙니다. [NOTICE](../../NOTICE)를 참고하세요.

포즈 참고로 사용해 생성한 이미지에는 추가 조건이 없습니다.
