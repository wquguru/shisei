<div align="center">

<a href="https://shisei.indaloop.app/ja/"><img src="../logo.svg" width="72" alt="Shisei"></a>

# Shisei 姿勢

**4 シリーズ 256 ポーズ × 5 アングル。AI 画像生成のポーズ参照に使える素体の線画ライブラリ。**

[English](../../README.md) · [简体中文](README.zh-CN.md) · 日本語 · [한국어](README.ko.md)

[![Poses](https://img.shields.io/badge/ポーズ-256-15171A?style=flat-square)](../../data/catalog.json)
[![Line art](https://img.shields.io/badge/線画-1049%20QC%20passed-1A5CC8?style=flat-square)](../GENERATION.md)
[![Photos](https://img.shields.io/badge/実写-103-5B616A?style=flat-square)](../GENERATION.md)
[![Languages](https://img.shields.io/badge/名称-ja%20·%20zh%20·%20en%20·%20ko-0aa06e?style=flat-square)](../../data/catalog.csv)
[![Dependencies](https://img.shields.io/badge/ランタイム依存-0-E07A52?style=flat-square)](../../web)
[![Images](https://img.shields.io/badge/images-CC0--1.0-blue?style=flat-square)](../../LICENSE-images)
[![Code](https://img.shields.io/badge/code-Apache--2.0-blue?style=flat-square)](../../LICENSE)

</div>

---

> **ご注意：**全身・セクシーとふたりのシリーズは、やや性的な成人向けポーズ参考です（素体、露出の描写なし）。プレビューや検索用ページには出さず、ギャラリーではスイッチを入れるまで表示されません。

[![Shisei ギャラリー：カテゴリ色のタイルに素体ポーズが並ぶトップ画面](../screenshot.png)](https://shisei.indaloop.app/ja/)

Shisei は自作のポーズ参照ライブラリです。すべてのポーズは顔なしの素体で、正面・斜め・横・上から・下からの五つのアングルで描いています。必要なカメラ位置の一枚をそのまま画像モデルに渡せます。ポーズ名とカテゴリは日本語・中国語・英語・韓国語の四か国語です。

画像はすべて本プロジェクトのオリジナルです。

## 収録内容

| シリーズ | 表示ポーズ | 品質チェック合格 | サイトでの扱い |
|---|---:|---:|---|
| 全身・標準（`std`、P###） | 50 / 73 | 208 / 365 | 表示 |
| 上半身（`upper`、U###） | 77 / 80 | 307 / 400 | 表示 |
| 全身・セクシー（`sexy`、S###） | 80 / 80 | 341 / 400 | 非表示（スイッチで表示できます） |
| ふたり（`duo`、D###） | 49 / 55 | 193 / 275 | 非表示（スイッチで表示できます） |

`suggestive` のポーズ（全身・セクシー、ふたり、上半身のセクシー系・胸元強調系）は初期状態で非表示で、トップのスクロール、ポーズページ、シェアカード、sitemap には入りません。スイッチひとつでまとめて表示できます。

- **すべてのアングルを品質チェック**しています（[docs/qc/](../qc/README.md)）。乳首の印、顔や髪、衣服、背景、崩れた構造、違うアングル、未成年に見える人物、名前と違うポーズのものは `images/` と catalog から外し、理由を `data/qc.json` に残しています。std の 23 ポーズは名前と絵が合わないため、名前を直すまで非表示です。
- 生成できなかったアングルは、崩れた絵で埋めずに空けています。
- **実写 103 枚**（std の P001–P022 と P050）。線画と同じく品質チェック済みです。AI 生成の成人で、実在の人物ではありません。
- `data/catalog.json` / `catalog.csv`：シリーズ、レーティング、4 言語の分類と名前、std の英語ポーズ説明、アングルごとのファイル、空欄の理由。

## 使い方

画像生成ツールのポーズ参照や構図参照に、アングルを一枚アップロードします。同じポーズの複数アングルを続けて使うと、人物のポーズが安定します。顔・服装・背景はプロンプトや別の参照画像で指定してください。

| サイズ | 場所 | 寸法 | 1 枚あたり |
|---|---|---|---|
| `w300` | `images/*/w300/` | 幅 300 px | 約 6 KB |
| `w900` | `images/*/w900/` | 900 × 1200 | 約 26 KB |
| 原寸 | [Releases](../../../../releases) の zip | 1344 × 1792（実写 1120 × 2240） | 約 100 KB |

リポジトリには Web 用の 2 サイズ（約 17 MB）だけを置いているので、クローンは軽く済みます。各 Release にはギャラリーのダウンロードを添付しています。w900 をシリーズごとの zip と全シリーズの zip（おすすめ、原寸の約 4 分の 1）にまとめたものと、原寸の zip です。品質チェックを通ったアングルだけを収録し、どの zip にも LICENSE、LICENSE-images、NOTICE が入っています。

## ギャラリー

`web/` はカタログから生成する依存ゼロの静的ギャラリーです。カテゴリタブ、アングル絞り込み、線画 / 実写の切り替え、ポーズ単位・一枚単位の表示、キーボードとスワイプで操作できるライトボックス、四か国語の UI、ダークモードに対応しています。仕様は [DESIGN.md](../DESIGN.md) にあります。

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
tools/      build_images.py、build_site.py、verify.py、qc_merge.py、review_sheets.py、pack_release.py
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
| 公開ギャラリー shisei.indaloop.app（Cloudflare Pages） | ☐ 次 |
| P062 の下からのアングル | ☐ 未解決 |
| 実写を品質チェック後に公開（D-03） | ✅ 公開 |

## 謝辞

ギャラリーでは [Inter Tight](https://fonts.google.com/specimen/Inter+Tight)、[Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC)、[JetBrains Mono](https://www.jetbrains.com/lp/mono/)（SIL OFL 1.1、Google Fonts で配信）を使っています。README のバッジは [shields.io](https://shields.io) です。ライセンスの方針は [LICENSING.md](../LICENSING.md) にあります。

ポーズの一覧（収録するポーズ、番号 `orig_id`、名前、分類）は [ギア (@giaaibusi)](https://x.com/giaaibusi) さんの [ai-pose-gallery](https://ai-pose-gallery.pages.dev/) の公開カタログに沿っています。中国語・英語・韓国語の名前はその翻訳です。ありがとうございます。借りているのは一覧だけで、画像はすべて本プロジェクトで作ったものです。Shisei は原作者とは関係がなく、原作者の承認も受けていません。

## 注意事項

画像はすべて本プロジェクトのために作ったもので、他のポーズ集からのコピー・トレース・派生ではありません。人物は素体または AI 生成の成人で、実在の人物ではありません。実在の人物や未成年を表す用途、露骨な表現には使わないでください。画像のメタデータは削除済みです。

## ライセンス

- **画像**（`images/` と Release の zip）と `data/` の本プロジェクト独自のデータは [CC0 1.0](../../LICENSE-images) で権利を放棄しています。商用を含めて自由に利用・改変・再配布でき、クレジットも不要です。
- **コードとドキュメント**は [Apache License 2.0](../../LICENSE) です。
- **ポーズの一覧**（選定、番号、名前、分類）は ai-pose-gallery のカタログに由来し、出典の明記のみで、上の二つのライセンスの対象外です。[NOTICE](../../NOTICE) を参照してください。

ポーズ参照として使って生成した画像には、追加の条件はありません。
