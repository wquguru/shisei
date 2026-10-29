<div align="center">

<a href="https://shisei.indaloop.app/"><img src="../logo.svg" width="72" alt="Shisei"></a>

# Shisei 姿勢

**免费（CC0）白模姿势参考库：四个系列 255 套无脸白模（素体）姿势，每套 5 个机位，线稿可直接喂给 Nano Banana、ChatGPT、ComfyUI、Midjourney 等 AI 绘图工具。**

[English](../../README.md) · 简体中文 · [日本語](README.ja.md) · [한국어](README.ko.md)

[![Poses](https://img.shields.io/badge/姿势-255-15171A?style=flat-square)](../../data/catalog.json)
[![Line art](https://img.shields.io/badge/线稿-999%20QC%20passed-1A5CC8?style=flat-square)](../GENERATION.md)
[![Photos](https://img.shields.io/badge/实拍-103-5B616A?style=flat-square)](../GENERATION.md)
[![Languages](https://img.shields.io/badge/名称-ja%20·%20zh%20·%20en%20·%20ko-0aa06e?style=flat-square)](../../data/catalog.csv)
[![Dependencies](https://img.shields.io/badge/运行时依赖-0-E07A52?style=flat-square)](../../web)
[![Images](https://img.shields.io/badge/images-CC0--1.0-blue?style=flat-square)](../../LICENSE-images)
[![Code](https://img.shields.io/badge/code-Apache--2.0-blue?style=flat-square)](../../LICENSE)

</div>

---

> **内容提示：**全身・性感和双人系列是偏性感的成人姿势参考（素体人偶，无裸露细节），不进预览和搜索页面，图库里默认隐藏，打开开关才显示。

[![Shisei 画廊：首屏是一排排彩色分类色块上的素体姿势](../screenshot.png)](https://shisei.indaloop.app/)

Shisei 是一套自己生成的姿势参考库。每个姿势都是无脸素体，画了正面、斜侧、侧面、俯视、仰视五个机位，需要哪个角度就拿哪张喂给模型。姿势名和分类有日、中、英、韩四种语言。

全部图片均为本项目原创。

## 内容

| 系列 | 显示的套数 | 质检通过的机位 | 页面上 |
|---|---:|---:|---|
| 全身・标准（`std`，P###） | 50 / 73 | 208 / 365 | 默认显示 |
| 上半身（`upper`，U###） | 77 / 80 | 307 / 400 | 默认显示 |
| 全身・性感（`sexy`，S###） | 80 / 80 | 341 / 400 | 默认隐藏，开关可显示 |
| 双人（`duo`，D###） | 49 / 55 | 193 / 275 | 默认隐藏，开关可显示 |

标为 `suggestive` 的姿势（全身・性感、双人，上半身的性感系、胸线强调系）默认隐藏，不进首屏滚动方块、姿势页、分享卡和 sitemap，一个开关就能全部显示。

- **每个机位都过了质检**（[docs/qc/](../qc/README.md)）。有乳头标记、五官或头发、衣物、背景、结构畸形、机位不对、人物看起来像未成年，或者画的不是这个姿势的，都从 `images/` 和 catalog 里拿掉了，原因记在 `data/qc.json`。std 有 23 套画的姿势和名字对不上，重新命名之前先不显示。
- 没生成出来的机位宁可留空，也不放一张画错的。
- **103 张实拍**，覆盖 std 的 P001–P022 和 P050，和线稿一样过了质检，都是 AI 生成的成年人物，不对应任何真人。
- `data/catalog.json` 和 `catalog.csv` 里有系列、分级、四语分类和名称、std 的英文姿势描述、每个机位的文件，以及机位为空的原因。

## 怎么用

把某个机位的图上传到绘图工具的姿势参考或构图参考里。同一个姿势换几个机位连着用，人物姿态更一致。脸、服装和背景用提示词或别的参考图补。

| 档位 | 位置 | 尺寸 | 单张约 |
|---|---|---|---|
| `w300` | `images/*/w300/` | 宽 300 | 7 KB |
| `w600` | `images/*/w600/` | 600×800 | 17 KB |
| `w900` | `images/*/w900/` | 900×1200 | 29 KB |
| 原图 | [Releases](../../../../releases) 压缩包 | 1344×1792（实拍 1120×2240） | 100 KB |

仓库里只放网页用的三档，约 56 MB，克隆会快很多。每个 Release 附带画廊里的下载：w900 档按系列各一个压缩包、再加一个全系列包（推荐，体积约为原图的四分之一），以及原图包。只打包质检通过的机位，每个压缩包都带 LICENSE、LICENSE-images 和 NOTICE。

## 画廊

`web/` 是从 catalog 生成的零依赖静态画廊：分类标签、机位筛选、线稿 / 实拍切换、按套或单张浏览、支持键盘和滑动的大图灯箱、四种界面语言和深色模式。规格见 [DESIGN.md](../DESIGN.md)。

```bash
python3 tools/build_site.py --link-images      # 生成 site/（图片用符号链接，预览快）
python3 -m http.server 8000 -d site            # http://localhost:8000
python3 tools/build_site.py                    # 可部署的完整副本，约 17 MB
```

深链接直接打开大图：`#P001-diag`、`#P001-diag-photo`；筛选条件在查询串里（`?lang=zh&cat=5&angle=1&src=photo`）。

## 目录

```
data/       catalog.json、catalog.csv：唯一的数据源
images/     line/ 和 photo/，各有 w300/、w600/ 和 w900/ 三档
web/        静态画廊源码（index.html、app.js、app.css、i18n.js）
tools/      build_images.py、build_site.py、verify.py、qc_merge.py、review_sheets.py、pack_release.py
docs/       DESIGN、DECISIONS、GENERATION、LICENSING、各语言 README、logo、截图
```

检查 catalog 和图片是否一致：

```bash
python3 tools/verify.py
```

欢迎贡献：请先读 **[CONTRIBUTING.md](../../CONTRIBUTING.md)**（编程 agent 另外遵守 **[AGENTS.md](../../AGENTS.md)**）。安全问题请按 [SECURITY.md](../../SECURITY.md) 私下报告。

## 状态与路线

当前 **v0.1.0**：73 套标准姿势和 catalog 已稳定，编号不会变，画廊是新做的。发布说明见 [CHANGELOG.md](../../CHANGELOG.md)，待定事项见 [DECISIONS.md](../DECISIONS.md)。

| 里程碑 | 状态 |
|---|---|
| 73 套标准姿势 × 5 机位、catalog、两档网页图、校验 | ✅ 完成 |
| 从 catalog 生成的静态画廊 | ✅ 完成 |
| 公开画廊 shisei.indaloop.app（Cloudflare Pages） | ☐ 下一步 |
| 补上 P062 仰视 | ☐ 未解决 |
| 实拍图过质检后公开（D-03） | ✅ 公开 |

## 致谢

画廊使用 [Inter Tight](https://fonts.google.com/specimen/Inter+Tight)、[Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC) 和 [JetBrains Mono](https://www.jetbrains.com/lp/mono/)（SIL OFL 1.1，由 Google Fonts 提供），README 徽章来自 [shields.io](https://shields.io)。授权规则见 [LICENSING.md](../LICENSING.md)。

姿势目录（收录哪些姿势、编号 `orig_id`、名称和分类）沿用 [ギア (@giaaibusi)](https://x.com/giaaibusi) 的 [ai-pose-gallery](https://ai-pose-gallery.pages.dev/) 公开目录，中文、英文、韩文名是它的译名，在此致谢。沿用的只有目录，这里的图片全部是本项目自己制作的。本项目与原作者没有关联，也未获其背书。

## 说明

所有图片都是为本项目制作的，没有从其他姿势图库复制、描摹或派生。人物是素体或 AI 生成的成年人，不对应任何真人。请勿用这些图表现真实人物或未成年人，也不要用于露骨内容。图片元数据已清除。

## 许可证

- **图片**（`images/` 和 Release 里的压缩包）以及 `data/` 里本项目自己的数据，以 [CC0 1.0](../../LICENSE-images) 放弃权利：可以随意使用、修改和再分发，包括商用，不需要署名。
- **代码和文档**采用 [Apache License 2.0](../../LICENSE)。
- **姿势目录**（选题、编号、名称和分类）来自 ai-pose-gallery 的目录，这里只注明出处，不在上面两个许可证的范围内，见 [NOTICE](../../NOTICE)。

拿这些图当姿势参考生成的图片不受任何附加条件约束。
