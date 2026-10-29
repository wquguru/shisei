# 质检（QC）

每个机位入库前都要过质检，结论写在 `data/qc.json`。只有 `pass` 的机位进 `data/catalog.json` 和 `images/`；
没过的机位在 catalog 里是 `null`，`gaps` 里记原因类别，`qc.json` 里留原文件名和理由，以后复审通过可以放回。

## 状态（每个机位一个）
| 状态 | 含义 | 页面上 |
|---|---|---|
| `pass` | 通过 | 正常显示 |
| `line` | 线条问题：乳头标记、五官或头发、衣物鞋子、灰色填充或背景纹理、家具、风格不符 | 「质检未通过」虚线框，点不了 |
| `structure` | 结构问题：人数不对、肢体多少或畸形、关节反折、手脚糊成团、机位不对、和别的机位几乎同一张、画的不是这个姿势、人物看起来像未成年 | 同上 |
| `missing` | 生成阶段就没画出来 | 「暂未收录」虚线框 |

一套里一个 `pass` 都没有的姿势整套不显示。

露点、生殖器细节、像未成年的人物属于生成错误，一律不通过（DECISIONS D-06）；其余通过的内容全部公开。

## 检查项和提示词
每项检查都是「`tools/review_sheets.py` 拼审图 → `qc-reviewer` 子代理按提示词审 → 结果 JSON 放进 `data/qc-input/`」。
提示词 `---` 以上是给维护者的说明，以下原样给审图代理。

| 检查 | 提示词 | 审图 `--mode` | 输出 | 怎么用 |
|---|---|---|---|---|
| 逐格质检（线条 / 结构 / 露点 / 未成年 / 露骨） | [review_prompt.md](review_prompt.md) | `panels` | `fail_*.json` | `qc_merge.py` 直接生效 |
| 姿势名对不对 | [name_prompt.md](name_prompt.md) | `name` | `name_*.json` | `no` 整套不通过；以它为准处理「pose mismatch」 |
| 同一套里重复的机位 | 本地脚本 `tools/line_dups.py` | — | `dups.json` | `qc_merge.py` 直接生效 |
| 儿童比例专项（只看比例） | [proportion_prompt.md](proportion_prompt.md) | `proportion --passed` | `flags`（建议） | 人工逐张确认后写进 `fail_proportion.json` |
| 实拍 | [photo_prompt.md](photo_prompt.md) | `photo` | `photo_*.json` | `qc_merge.py` 直接生效（qc.json `photos`） |
| 内容分级 | [rating_prompt.md](rating_prompt.md) | `rating --passed` | `rating_*.json`（建议） | `tools/rating_check.py` 列出分歧，人定，不自动改 |

规则：
- 审图代理统一用 [`.claude/agents/qc-reviewer.md`](../../.claude/agents/qc-reviewer.md)（Sonnet，只写自己的输出文件）。每批 30–65 张审图，
  输出必须带 `reviewed` 清单；合并前核对它和批次文件一一对应，缺了就重派，不要补猜。
- 会删内容的结论（不通过）由 `fail_*.json` / `name_*.json` / `photo_*.json` 产生；只给建议的检查（比例、分级）先人工看，再落到文件。
- `data/qc-input/` 是当前 `qc.json` 的全部输入，`qc_merge.py data/qc-input` 能原样重算出 `qc.json`。新一轮的结果用新前缀加进去
  （`fail_r3_*.json`），不要覆盖旧文件；要推翻旧结论就删掉对应文件里的那条并在提交说明里写原因。

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
| duo 双人（第二轮） | 49 / 55 | 193 / 275 | 8 | 51 | 23 |

std 的 130 个 structure 里有 115 个来自 23 套姿势名不符（P019–P052 一段集中出现，画的多是站立或行走），见 DECISIONS D-07。

## 第二轮（2026-10-29）：双人系列和实拍
- **双人**：同样的流程。`review_prompt.md` 加了双人条款：必须正好两个人、MF 组要有明显更宽的男性体型、不能有任何露骨内容、
  分不清属于谁的肢体算结构问题。3 个 Sonnet 审 104 张审图，2 个做姿势名检查，`line_dups.py` 查出 2 个重复机位。
  不显示的 6 套：D022（生成阶段就没有）、D014 和 D050（女方画成儿童比例，人工复核确认）、D016（画的不是这个姿势）、
  D018 和 D029（剩下的机位全没过）。
- **实拍**：专用提示词 [photo_prompt.md](photo_prompt.md)（外露、透视、像未成年、像真人、结构、机位）。2 个 Sonnet 审 46 张
  审图（每格 400×800），103/112 通过；9 张都是结构问题（肢体被画框切掉、多一只脚）。结果写在 `qc.json` 的 `photos`，
  `qc_merge.py` 从 `photo_*.json` 读，`verify.py` 检查每张进 catalog 的实拍都有 `pass`。
- **儿童比例专项**：用户要求「判定像儿童比例的一律删除」。2 个 Sonnet 只看比例，复查全部通过的双人机位，标出 11 格，另一个会话目视复查又报了 5 套；人工逐张看后
  删掉 8 格（D010 正面，D024 正面 / 俯视 / 仰视，D034 俯视，D045 俯视，D052 正面 / 侧面：女方比同一深度的男方小得多），其余是透视造成的，保留。
  理由写在 `qc.json`，审图结果放在合并目录的 `fail_child.json`。
- 合并时把第一轮的 fail / name / dups 和第二轮的放在同一个目录跑 `qc_merge.py`，第一轮三个系列的结果逐行比对没有变化。

## 人工发现的问题（2026-10-29）
P006 正面画了三条手臂（右肩同时伸出叉腰和撑地两条），逐格审图和姿势名检查都放过了：姿势名检查写的是
「一手叉腰、一手撑地」，两只手都对上了名字，就没再数肢体。单独重审这一张审图也照样通过，说明问题出在方法上，不是批次太大。
人工确认的不通过写在 `data/qc-input/fail_manual.json`。查这件事时还发现 `qc_merge.py` 的「只有地平线不算问题」规则匹配的是 `floor|ground`，而 back**ground** 里就有 ground，
审图代理判成背景物、墙、横线的条目一直被放行，结构问题提到「手撑地」也会被放行。现在只对 `line` 生效，
理由里出现 wall / table / background / ruled / nipple / crop 等词照常不通过。修正后下架 8 格：S006 斜侧 / 侧面 / 仰视（画了墙），
S068 正面 / 侧面 / 仰视（顶部横线），U032 仰视（桌沿线），D048 侧面（腿出框）。P024 的 4 条「没有抬腿」本质是姿势名不符，
补了 `pose mismatch:` 前缀，仍由姿势名检查决定（partial，保留）。

## 分级复核（2026-10-29）
`rating_prompt.md` 逐套审了站上 256 套：0 个问题，74 套和按分类定的分级不一致。人定（用户）：只改把握大的，加上 P057、P071，共 15 套，
记在 `data/rating_overrides.json`（`import_series.py` 重导入时也优先用它，`verify.py` 检查已生效）：
- 改成全年龄：S012、S014、S030、S035、S062，U035、U040，D001、D026、D030、D042、D043、D046；
- 改成性感：P057、P071（因此不再有静态姿势页和分享卡）。
其余 59 处保持按分类分级。

## 复审 / 新系列
```bash
SRC="std=$HOME/Downloads/pose-gallery-std73 sexy=$HOME/Downloads/pose-gallery-sexy80 upper=$HOME/Downloads/pose-gallery-upper80 duo=$HOME/Downloads/pose-gallery-duo55"
python3 tools/review_sheets.py /tmp/qc/panels --mode panels ${=SRC}          # zsh: ${=SRC} 才会按空格拆开；只给要审的系列
ls /tmp/qc/panels/*.jpg | split -l 35 - /tmp/qc/panels/batch_
# 每个批次派一个 qc-reviewer：提示词 docs/qc/review_prompt.md，输出 data/qc-input/fail_r3_<批次>.json
python3 tools/review_sheets.py /tmp/qc/name --mode name ${=SRC}              # → name_prompt.md → name_r3_*.json
python3 tools/line_dups.py data/qc-input/dups.json std=<src>/img …           # 一次覆盖全部系列
python3 tools/qc_merge.py data/qc-input --date YYYY-MM-DD
python3 tools/review_sheets.py /tmp/qc/prop --mode proportion --passed ${=SRC}   # → proportion_prompt.md，人工确认
python3 tools/review_sheets.py /tmp/qc/rating --mode rating --passed ${=SRC}     # → rating_prompt.md → rating_*.json
python3 tools/rating_check.py /tmp/qc/rating
python3 tools/build_images.py ${=SRC} && python3 tools/verify.py && python3 tools/export_csv.py
```
`qc_merge.py` 会从 `qc.json` 取回被拿掉机位的文件名，所以可以对全部机位重审；它每次按目录里的全部结果重算，所以一定对
`data/qc-input/` 整个目录跑。没有 `photo_*.json` 时实拍结果沿用上一轮。
