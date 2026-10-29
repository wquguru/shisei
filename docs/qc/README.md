# 质检（QC）

每个机位入库前都要过质检，结论写在 `data/qc.json`。只有 `pass` 的机位进 `data/catalog.json` 和 `images/`；
没过的机位在 catalog 里是 `null`，`gaps` 里记原因类别，`qc.json` 里留原文件名和理由，以后复审通过可以放回。

## 状态（每个机位一个）
| 状态 | 含义 | 页面上 |
|---|---|---|
| `pass` | 通过 | 正常显示 |
| `line` | 线条问题：乳头标记、五官或头发、衣物鞋子、灰色填充或背景纹理、家具、风格不符 | 「质检未通过」虚线框，点不了 |
| `structure` | 结构问题：肢体多少或畸形、关节反折、手脚糊成团、机位不对、和别的机位几乎同一张、画的不是这个姿势 | 同上 |
| `missing` | 生成阶段就没画出来 | 「暂未收录」虚线框 |

一套里一个 `pass` 都没有的姿势整套不显示。

## 流程（2026-10-28 第一轮）
1. `tools/review_sheets.py` 用全尺寸源图拼审图：每张最多 3 个机位、每格 600×800，标题写编号、姿势名和应有内容（上半身系列允许出框）。
2. 7 个 Sonnet 子代理并行审 448 张审图，按 [review_prompt.md](review_prompt.md) 判 `line` / `structure`，输出里带 `reviewed` 清单，逐张核对没有漏看。
3. 3 个 Sonnet 子代理做「姿势名对不对」检查（每套一张、前三个机位）：`yes` / `partial` / `no`，并写下实际画的是什么。
4. `tools/line_dups.py` 在本地查同一套里几乎一样的两个机位（本轮 0 个）。
5. 人工抽查约 10 张有争议的审图校准规则，然后 `tools/qc_merge.py` 合并：
   - 姿势名检查为 `no` 的整套判 `structure`（画得干净，但不是这个姿势）；
   - 姿势名检查为 `yes` / `partial` 时，丢弃逐格审图里的「pose mismatch」，以整套检查为准；
   - 只有一条细地平线不算问题（各代理判法不一，统一放行）；有纹理、阴影、家具的照样不通过；
   - 同一格既有 `line` 又有 `structure` 时记 `structure`。
6. `tools/build_images.py` 只为 `pass` 的机位出图，并删掉 `images/` 里其余文件；`tools/verify.py` 三方核对 catalog、qc.json 和图片。

## 本轮结果
| 系列 | 显示的套数 | 通过的机位 | line | structure | missing |
|---|---:|---:|---:|---:|---:|
| std 全身・标准 | 50 / 73 | 208 / 365 | 26 | 130 | 1 |
| upper 上半身 | 77 / 80 | 307 / 400 | 11 | 36 | 46 |
| sexy 全身・性感 | 80 / 80 | 341 / 400 | 16 | 25 | 18 |

std 的 130 个 structure 里有 115 个来自 23 套姿势名不符（P019–P052 一段集中出现，画的多是站立或行走），见 DECISIONS D-07。

## 复审
```bash
python3 tools/review_sheets.py <sheets_dir> std=<src>/img sexy=<src>/img upper=<src>/img
# 按 review_prompt.md 派审图子代理，输出 fail_*.json；姿势名检查输出 name_*.json
python3 tools/line_dups.py <qc_dir>/dups.json std=<src>/img sexy=<src>/img upper=<src>/img
python3 tools/qc_merge.py <qc_dir> --date YYYY-MM-DD
python3 tools/build_images.py std=<std_src> sexy=<sexy_src> upper=<upper_src>
python3 tools/verify.py
```
复审时 `qc_merge.py` 会从 `qc.json` 取回被拿掉机位的文件名，所以可以对全部机位重审。
