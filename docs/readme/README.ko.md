<div align="center">

<img src="../logo.svg" width="72" alt="Shisei">

# Shisei 姿勢

**73가지 포즈 × 5개 앵글. AI 이미지 도구의 포즈 참고용 마네킹 선화 라이브러리.**

[English](../../README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · 한국어

[![Poses](https://img.shields.io/badge/포즈-73-15171A?style=flat-square)](../../data/catalog.json)
[![Line art](https://img.shields.io/badge/선화-364%2F365-1A5CC8?style=flat-square)](../GENERATION.md)
[![Photos](https://img.shields.io/badge/실사-111-5B616A?style=flat-square)](../GENERATION.md)
[![Languages](https://img.shields.io/badge/이름-ja%20·%20zh%20·%20en%20·%20ko-0aa06e?style=flat-square)](../../data/catalog.csv)
[![Dependencies](https://img.shields.io/badge/런타임%20의존성-0-E07A52?style=flat-square)](../../web)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square)](../../LICENSE)

</div>

---

![Shisei 갤러리: 카테고리 색 타일 위에 마네킹 포즈가 늘어선 첫 화면](../screenshot.png)

Shisei는 직접 만든 포즈 참고 라이브러리입니다. 모든 포즈는 얼굴 없는 마네킹으로, 정면·사선·측면·위에서·아래에서의 다섯 앵글로 그렸습니다. 필요한 카메라 위치의 한 장을 그대로 이미지 모델에 넣으면 됩니다. 포즈 이름과 카테고리는 일본어·중국어·영어·한국어 네 가지 언어로 제공합니다.

모든 이미지는 이 프로젝트의 오리지널입니다.

## 구성 내용

| 카테고리 | 포즈 수 | | 카테고리 | 포즈 수 |
|---|---:|---|---|---:|
| 앉기 | 14 | | 쪼그려 앉기 | 6 |
| 서기 | 14 | | 숙이기 | 6 |
| 무릎 꿇기 | 10 | | 젖히기 | 3 |
| 눕기 | 9 | | 비틀기 | 3 |
| 옆 앉기 | 8 | | **합계** | **73** |

- 선화 **365장 중 364장**. 유일하게 빠진 것은 P062의 아래에서 본 앵글로, 9번 시도해 실패해서 잘못된 그림으로 채우지 않고 빈칸으로 두었습니다.
- **실사 111장** (23가지 포즈: P001–P022는 5개 앵글, P050은 정면). AI로 생성한 성인이며 실존 인물이 아닙니다.
- `data/catalog.json` / `catalog.csv`: ID, 4개 언어의 카테고리와 이름, 프롬프트에 붙여 넣을 수 있는 영어 포즈 설명, 앵글별 파일.

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
tools/      build_images.sh, build_site.py, verify.py, pack_release.sh
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
| GitHub Pages 공개 갤러리 | ☐ 다음 |
| P062 아래 앵글 채우기 | ☐ 미해결 |
| 실사를 공개 저장소에 포함할지 (D-03) | ☐ 미정 |

## 감사의 말

갤러리는 [Inter Tight](https://fonts.google.com/specimen/Inter+Tight), [Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC), [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (SIL OFL 1.1, Google Fonts 제공)를 사용하며, README 배지는 [shields.io](https://shields.io)입니다. 라이선스 원칙은 [LICENSING.md](../LICENSING.md)에 있습니다.

## 참고 사항

모든 이미지는 이 프로젝트를 위해 만들었으며, 다른 포즈 모음에서 복사·트레이스·파생한 것이 아닙니다. 인물은 마네킹 또는 AI로 생성한 성인이며 실존 인물이 아닙니다. 실존 인물이나 미성년자를 표현하거나 노골적인 콘텐츠에 쓰지 마세요. 이미지 메타데이터는 삭제했습니다.

## 라이선스

Shisei의 코드, 카탈로그, 문서, 이미지는 모두 [Apache License 2.0](../../LICENSE)을 따릅니다 ([NOTICE](../../NOTICE) 참고). 상업적 이용을 포함해 이미지를 사용·수정·재배포할 수 있으며, 파일을 재배포할 때는 라이선스와 NOTICE를 함께 포함하세요. 포즈 참고로 사용해 생성한 이미지에는 추가 조건이 없습니다.
