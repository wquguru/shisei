<div align="center">

<img src="../logo.svg" width="72" alt="Shisei">

# Shisei 姿勢

**73 ポーズ × 5 アングル。AI 画像生成のポーズ参照に使える素体の線画ライブラリ。**

[English](../../README.md) · [简体中文](README.zh-CN.md) · 日本語 · [한국어](README.ko.md)

[![Poses](https://img.shields.io/badge/ポーズ-73-15171A?style=flat-square)](../../data/catalog.json)
[![Line art](https://img.shields.io/badge/線画-364%2F365-1A5CC8?style=flat-square)](../GENERATION.md)
[![Photos](https://img.shields.io/badge/実写-111-5B616A?style=flat-square)](../GENERATION.md)
[![Languages](https://img.shields.io/badge/名称-ja%20·%20zh%20·%20en%20·%20ko-0aa06e?style=flat-square)](../../data/catalog.csv)
[![Dependencies](https://img.shields.io/badge/ランタイム依存-0-E07A52?style=flat-square)](../../web)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square)](../../LICENSE)

</div>

---

![Shisei ギャラリー：カテゴリ色のタイルに素体ポーズが並ぶトップ画面](../screenshot.png)

Shisei は自作のポーズ参照ライブラリです。すべてのポーズは顔なしの素体で、正面・斜め・横・上から・下からの五つのアングルで描いています。必要なカメラ位置の一枚をそのまま画像モデルに渡せます。ポーズ名とカテゴリは日本語・中国語・英語・韓国語の四か国語です。

画像はすべて本プロジェクトのオリジナルです。

## 収録内容

| カテゴリ | ポーズ数 | | カテゴリ | ポーズ数 |
|---|---:|---|---|---:|
| 座り | 14 | | しゃがみ | 6 |
| 立ち | 14 | | 前かがみ | 6 |
| 膝立ち | 10 | | 反り | 3 |
| 寝そべり | 9 | | ひねり | 3 |
| 横座り | 8 | | **合計** | **73** |

- 線画は **365 枚中 364 枚**。唯一の欠番は P062 の下からのアングルで、9 回試して失敗したため、出来の悪い絵で埋めずに欠番としています。
- **実写 111 枚**（23 ポーズ：P001–P022 は 5 アングル、P050 は正面）。AI 生成の成人で、実在の人物ではありません。
- `data/catalog.json` / `catalog.csv`：ID、四か国語のカテゴリと名称、プロンプトに貼れる英語のポーズ説明、アングルごとのファイル名。

## 使い方

画像生成ツールのポーズ参照や構図参照に、アングルを一枚アップロードします。同じポーズの複数アングルを続けて使うと、人物のポーズが安定します。顔・服装・背景はプロンプトや別の参照画像で指定してください。

| サイズ | 場所 | 寸法 | 1 枚あたり |
|---|---|---|---|
| `w300` | `images/*/w300/` | 幅 300 px | 約 6 KB |
| `w900` | `images/*/w900/` | 900 × 1200 | 約 26 KB |
| 原寸 | [Releases](../../../../releases) の zip | 1344 × 1792（実写 1120 × 2240） | 約 100 KB |

リポジトリには Web 用の 2 サイズ（約 17 MB）だけを置き、原寸画像は Release の zip で配布しているので、クローンは軽く済みます。

## ギャラリー

`web/` はカタログから生成する依存ゼロの静的ギャラリーです。カテゴリタブ、検索、アングル絞り込み、線画 / 実写の切り替え、ポーズ単位・一枚単位の表示、キーボードとスワイプで操作できるライトボックス、四か国語の UI、ダークモードに対応しています。仕様は [DESIGN.md](../DESIGN.md) にあります。

```bash
python3 tools/build_site.py --link-images      # site/ を生成（画像はシンボリックリンクで高速プレビュー）
python3 -m http.server 8000 -d site            # http://localhost:8000
python3 tools/build_site.py                    # 画像込みのデプロイ用コピー、約 17 MB
```

ディープリンクでライトボックスを直接開けます：`#P001-diag`、`#P001-diag-photo`。絞り込み条件はクエリ文字列に入ります（`?lang=ja&cat=5&angle=1&src=photo`）。

## 構成

```
data/       catalog.json、catalog.csv — 唯一のデータソース
images/     line/ と photo/、それぞれ w300/ と w900/
web/        静的ギャラリーのソース（index.html、app.js、app.css、i18n.js）
tools/      build_images.sh、build_site.py、verify.py、pack_release.sh
docs/       DESIGN、DECISIONS、GENERATION、LICENSING、各言語の README、ロゴ、スクリーンショット
```

カタログと画像が一致しているか確認するには：

```bash
python3 tools/verify.py
```

コントリビュート歓迎です。まず **[CONTRIBUTING.md](../../CONTRIBUTING.md)** をお読みください（コーディングエージェントは **[AGENTS.md](../../AGENTS.md)** にも従います）。セキュリティの問題は [SECURITY.md](../../SECURITY.md) の手順で非公開でご報告ください。

## 状況とロードマップ

現在 **v0.1.0**。73 の標準ポーズとカタログは安定しており、ID は変わりません。ギャラリーは新しく作ったものです。リリースノートは [CHANGELOG.md](../../CHANGELOG.md)、未決事項は [DECISIONS.md](../DECISIONS.md) にあります。

| マイルストーン | 状況 |
|---|---|
| 標準 73 ポーズ × 5 アングル、カタログ、Web 用 2 サイズ、検証 | ✅ 完了 |
| カタログから生成する静的ギャラリー | ✅ 完了 |
| GitHub Pages での公開ギャラリー | ☐ 次 |
| P062 の下からのアングル | ☐ 未解決 |
| 実写を公開リポジトリに含めるか（D-03） | ☐ 未決定 |

## 謝辞

ギャラリーでは [Inter Tight](https://fonts.google.com/specimen/Inter+Tight)、[Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC)、[JetBrains Mono](https://www.jetbrains.com/lp/mono/)（SIL OFL 1.1、Google Fonts で配信）を使っています。README のバッジは [shields.io](https://shields.io) です。ライセンスの方針は [LICENSING.md](../LICENSING.md) にあります。

## 注意事項

画像はすべて本プロジェクトのために作ったもので、他のポーズ集からのコピー・トレース・派生ではありません。人物は素体または AI 生成の成人で、実在の人物ではありません。実在の人物や未成年を表す用途、露骨な表現には使わないでください。画像のメタデータは削除済みです。

## ライセンス

Shisei のコード・カタログ・ドキュメント・画像はすべて [Apache License 2.0](../../LICENSE) です（[NOTICE](../../NOTICE) も参照）。商用を含め、画像の利用・改変・再配布ができます。ファイルを再配布するときはライセンスと NOTICE を添えてください。ポーズ参照として使って生成した画像には、追加の条件はありません。
