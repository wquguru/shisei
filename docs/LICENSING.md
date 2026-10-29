# 授权规则

非法律意见。D-01（2026-10-28）定下的规则，依据见 [DECISIONS.md](DECISIONS.md)。

## 本仓库自己的许可证
**Apache-2.0**（`LICENSE` 全文 + `NOTICE`），覆盖代码、`data/` 里的 catalog、文档和 `images/` 里的全部图片，以及 Release 里的原尺寸图包。外部贡献按 Apache-2.0 §5 入站即出站，不另签 CLA。画廊零运行时依赖。网页字体 Inter Tight、Noto Sans SC、JetBrains Mono（均为 SIL OFL 1.1）由 Google Fonts 加载，不进仓库、不随站点分发；以后改成自托管时要附 OFL.txt。

## 规则（硬性）
1. **不用外部图片。** 不下载、缓存、镜像、重新编码或描摹 ai-pose-gallery（ギア @giaaibusi）、其中文镜像 anhao/ai-pose-gallery-zh 或其他姿势站的图片：它们的条款禁止再分发图片数据，加工后的副本也算；镜像的 MIT 只覆盖其前端代码。界面思路可以参考，代码和文案不抄。
2. **再分发带声明。** 任何打包或镜像（Release zip、未来的 Pages 站点下载）都要带 `LICENSE` 和 `NOTICE`；`pack_release.py` 已把两者打进每个 zip。
3. **AI 生成图片的权利。** 图片由 AI 模型生成后经人工挑选、整理。部分法域对纯 AI 生成内容不承认著作权；Apache-2.0 授予的是我们实际享有的权利，不对此作额外承诺。新增图片前要确认所用生成工具的条款允许再分发输出，并把工具和条款写进 GENERATION.md；v0.1.0 这批图的工具与条款还没记录，公开前补上。
4. **内容安全。** 只收素体和 AI 生成的成年人物；看起来像未成年人、真实人物或露骨内容的图片不进仓库。元数据一律清除。
5. **实拍图是否公开**另由 D-03 决定；在定之前，仓库保持私有或发布前先处理 `images/photo/`。

## 名称
产品名 Shisei（姿勢）。不使用其他姿势站或 AI 绘图工具的名称、logo 作为本项目的名称或标识；README 里提到工具名只作描述性使用。
