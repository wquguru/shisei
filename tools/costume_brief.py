#!/usr/bin/env python3
"""Write the paste-ready Muse brief for one costume category (docs/costume/PLAN.md §10).

Usage: python3 -I tools/costume_brief.py HC ~/Downloads/costume-HC-run01 [--only C001,C002] [--gate 10]
Writes OUT/brief.md and OUT/manifest.json. Items that already have all four views are skipped, so a re-run
after intake produces the brief for what is still missing.
"""
import argparse, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWS = ("front", "back", "side", "diag")  # generation order: each later view uses the earlier ones as references
BG = {"light": "uniform flat light grey background with no gradient, no vignette and no floor shadow",
      "dark": "uniform flat mid grey background with no gradient, no vignette and no floor shadow"}
LOWER = {"hem": "the hem", "shoes": "the shoes, shown as worn at the bottom"}
GENDER = {"F": "standard adult female form", "M": "standard adult male form", "U": "standard adult female form"}
VIEW_TEXT = {
    "back": "a straight back view showing the full back of the garment",
    "side": "a true 90-degree side profile showing the garment's left side, with the front of the garment pointing "
            "toward image-left, showing garment length, slits and layering",
    "diag": "a three-quarter view with the camera moved 45 degrees around toward the garment's left side, so the "
            "front and the left side are both visible and the front turns slightly toward image-left",
}
REFS = {"back": "Image 1 is the front view.",
        "side": "Image 1 is the front view and image 2 is the back view.",
        "diag": "Image 1 is the front view and image 2 is the side view."}

FRONT_TMPL = (
    "Product photograph of {desc}, displayed on an invisible ghost mannequin ({form}) so the garment keeps a natural "
    "three-dimensional worn shape with nobody inside, straight front view, camera at chest height, the complete "
    "outfit from collar to {lower}, centered, the garment filling about 85% of the frame height, soft even studio "
    "lighting, {bg}, accurate fabric colour and texture, visible construction details such as seams, closures, hems "
    "and trims, 3:4 vertical, catalogue style.\n{rules}\n"
    "No person, no face, no head, no hair, no skin, no hands, no visible mannequin body, no hanger, no props, no "
    "text, no logo, no badge, no watermark. {negatives}")
TURN_TMPL = (
    "{refs} They are product photographs of one garment on an invisible ghost mannequin. Show exactly the same "
    "garment from {view}. Keep these identical: {keep}; same sleeve volume, lengths, colours, pattern and trims. "
    "Add nothing the reference images do not support. {back_rule}Same background, lighting, scale and framing, "
    "3:4 vertical. No person, no face, no head, no skin, no hands, no text, no logo.")
BACK_RULE = ("The back is closed: no opening or cut-out, no inner garment visible from behind, and front-only "
             "details do not continue onto the back. ")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("cat")
    ap.add_argument("out")
    ap.add_argument("--only", default="")
    ap.add_argument("--gate", type=int, default=10)
    a = ap.parse_args()
    cats = json.loads((ROOT / "data/costume-src/_categories.json").read_text())
    c = cats[a.cat]
    only = set(filter(None, a.only.split(",")))
    items = [i for i in json.loads((ROOT / "data/costumes.json").read_text())["items"]
             if i["cat"] == a.cat and (not only or i["id"] in only)
             and not all(i["views"].get(v) for v in VIEWS)]
    out = pathlib.Path(a.out).expanduser()
    out.mkdir(parents=True, exist_ok=True)
    run = out.name

    L = [f"# shisei 服装库 · {c['name']['zh']}（{a.cat}）· {run}",
         "",
         f"这是 shisei 服装库的正式生产，共 {len(items)} 件，每件 4 个视角（正面、背面、侧面、斜侧），"
         f"共 {len(items) * 4} 张。规格和上两轮试验（costume-pilot01、costume-probe01）一样，下面每件的提示词已经拼好，照抄即可。",
         "",
         "## 规则",
         "1. 一次一张图。每件的顺序固定：正面 → 背面（参考正面）→ 侧面（参考正面 + 背面）→ 斜侧（参考正面 + 侧面）。",
         "2. 正面最多 3 次，其余视角各最多 2 次。每张按该件的“要点”逐条自查；正面不过，这件后面的视角不做。",
         "3. 第 1 次没画对，把漏掉的那条要点改写成更具体的结构句再试（位置写成相对锁骨、胸、腰、膝的位置并加否定句；"
         "交领方向用画面左右写）。改写过的提示词记进 attempts.csv。",
         "4. 背面不能是正面的镜像；侧面、斜侧如果画成了另一侧，图可以留，但在 note 里写 flipped。",
         "5. 背景只要求均匀纯色，不用追求精确色值（入库时会统一换底）。",
         f"6. **自检闸**：先做前 {a.gate} 件的正面。正面通过少于 {round(a.gate * 0.7)} 件就停下，把问题写进 notes.md 交付，"
         "不要继续；达到了再把这些件的其他视角和剩下的件做完。",
         "7. 可以分波派子代理并行，但每张都要自查。被拒或画错如实记录，不要拿别的形制凑。",
         "",
         "## 正面模板（每件把 {desc} {form} {lower} {bg} 换成该件的字段）",
         "```",
         FRONT_TMPL.replace("{rules}", c["rules"]).replace("{negatives}", c["negatives"]),
         "```",
         f"- {{form}}：女 = {GENDER['F']}，男 = {GENDER['M']}，中性 = {GENDER['U']}",
         f"- {{lower}}：到下摆 = “{LOWER['hem']}”，到鞋 = “{LOWER['shoes']}”",
         f"- {{bg}}：浅灰 = “{BG['light']}”，中灰（白色衣服用）= “{BG['dark']}”",
         "",
         "## 视角说明（转视角模板里的 {view}）",
         *[f"- {v}：{VIEW_TEXT[v]}" for v in ("back", "side", "diag")],
         "",
         "## 转视角模板（背面 / 侧面 / 斜侧通用，{keep} 用每件的“保持不变”）",
         "```",
         TURN_TMPL.replace("{back_rule}", "{back_rule}"),
         "```",
         f"- {{refs}}：背面用“{REFS['back']}”；侧面用“{REFS['side']}”；斜侧用“{REFS['diag']}”",
         f"- {{back_rule}}：只有背面加这句：{BACK_RULE.strip()}",
         "",
         "## 交付",
         f"打包成 {run}.zip（太大可以分成 {run}-part1.zip、part2…）：",
         "- img/<ID>_<view>.png，view = front / back / side / diag，例如 img/C001_front.png；1344×1792 PNG",
         "- attempts.csv：file,attempts,outcome,hits,note（outcome = ok / refused / wrong；hits = 要点命中数如 4/4）",
         "- notes.md：按朝代 / 小类总结一次就对的、改写才对的、怎么写都不对的，以及改写用过的句子",
         f"做完给我下载链接，回复最后一行写：DONE {run} ok=<数> refused=<数> wrong=<数>",
         "",
         f"## {len(items)} 件"]
    zh = {"F": "女", "M": "男", "U": "中性"}
    for i in items:
        era = f"{i['era_zh']} · " if i.get("era_zh") else ""
        L += ["", f"### {i['id']} {era}{i['name_zh']}",
              f"form = {zh[i['gender']]}；lower = {'到鞋' if i['lower'] == 'shoes' else '到下摆'}；"
              f"bg = {'中灰' if i['bg'] == 'dark' else '浅灰'}",
              f"desc：{i['desc_en']}",
              f"keep：{i['keep_en']}",
              "要点：" + " ".join(f"{'①②③④⑤⑥'[k]} {t}" for k, t in enumerate(i["checks"]))]
    (out / "brief.md").write_text("\n".join(L) + "\n")
    (out / "manifest.json").write_text(json.dumps(
        {"run": run, "cat": a.cat, "ids": [i["id"] for i in items], "views": list(VIEWS)}, indent=1) + "\n")
    print(f"{out / 'brief.md'}: {len(items)} items, {len(chr(10).join(L))} chars")


if __name__ == "__main__":
    main()
