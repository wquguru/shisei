#!/usr/bin/env python3
"""Write the paste-ready Muse brief for the scene, prop, furniture, light or animal library (docs/<lib>/PLAN.md).

The counterpart of costume_brief.py. Either one category, or --probe: the first variant of every form marked
`probe`, across all categories, to test each category before the full run (the costume-probe01 step).

Usage: python3 -I tools/series_brief.py scene IN ~/Downloads/scene-IN-run01 [--only E001,E002] [--gate 10]
       python3 -I tools/series_brief.py prop --probe ~/Downloads/prop-probe01
Writes OUT/brief.md and OUT/manifest.json; items that already have every view are skipped. The animal library only
has its --probe brief, which draws every probe item in two styles to decide D-14 (docs/animal/PLAN.md).
"""
import argparse, json, pathlib, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))  # -I drops the script dir from sys.path
import series_kit as K  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEW_ZH = {"eye": "平视", "above": "俯视", "below": "仰视",
           "front": "正面", "back": "背面", "side": "侧面", "diag": "斜侧"}


def cat_rules(cats: dict, cat_list: list) -> str:
    return "\n".join(f"- {c}：rules = {cats[c]['rules']}\n  negatives = {cats[c]['negatives']}" for c in cat_list)


def scene_parts(cats: dict, cat_list: list) -> list:
    rules = cat_rules(cats, cat_list)
    return [
        "## 规则",
        "1. 一次一张图。每个场景的顺序固定：平视（文生图）→ 俯视（参考平视）→ 仰视（参考平视）。",
        "2. 平视最多 3 次，俯视、仰视各最多 2 次。每张按该场景的“要点”逐条自查；平视不过，这个场景后面两张不做。",
        "3. 画面中央约 4 米处必须留一块空地（以后合成人物站在那里），任何人、人影、雕像、人台都不行；"
        "有人就重画，不要修。",
        "4. 平视的地平线（室内是远墙的视平线）落在画面正中，竖线保持竖直；俯视要明显看到更多地面，仰视要明显看到"
        "更多天花板或天空，三张是同一个地方、同一个朝向、同一时刻。",
        "5. 不能有可读文字、招牌字、logo、车牌，不能是真实地标。招牌可以有，但上面没有字。",
        "6. 第 1 次没画对，把漏掉的那条要点改写成更具体的结构句再试，改写过的提示词记进 attempts.csv。",
        "",
        "## 平视模板（文生图；{desc} {light} 换成该场景的字段，{rules} {negatives} 换成所属大类的两行）",
        "```",
        K.SCENE_FRONT.replace("{view}", K.SCENE_VIEW_TEXT["eye"]).replace("{spot}", K.SCENE_SPOT),
        "```",
        "大类规则：",
        rules,
        "",
        "## 俯视 / 仰视模板（参考平视；{keep} 用该场景的“保持不变”）",
        "```",
        K.SCENE_TURN,
        "```",
        f"- 俯视的 {{view}}：{K.SCENE_VIEW_TEXT['above']}",
        f"- 仰视的 {{view}}：{K.SCENE_VIEW_TEXT['below']}",
    ]


def prop_parts(cats: dict, cat_list: list) -> list:
    rules = cat_rules(cats, cat_list)
    return [
        "## 规则",
        "1. 一次一张图。每件的顺序固定：正面 → 背面（参考正面）→ 侧面（参考正面 + 背面）→ 斜侧（参考正面 + 侧面）。",
        "2. 正面最多 3 次，其余视角各最多 2 次。每张按该件的“要点”逐条自查；正面不过，这件后面的视角不做。",
        "3. 画面里只有这一件东西：没有手、人、支架、挂钩、桌面，没有别的物件；家具类立在看不见的地面上，不画地板。",
        "4. 不能有文字、logo、品牌相似设计（手机不要做成某品牌的摄像头排布，乐器不要品牌头）。",
        "5. 背面不能是正面的镜像；侧面、斜侧如果画成了另一侧，图可以留，但在 note 里写 flipped。",
        "6. 第 1 次没画对，把漏掉的那条要点改写成更具体的结构句再试，改写过的提示词记进 attempts.csv。",
        "",
        "## 正面模板（每件把 {desc} {place} {fill} {bg} 换成该件的字段，{rules} {negatives} 换成所属大类的两行）",
        "```",
        K.PROP_FRONT,
        "```",
        f"- {{place}}：悬浮 = “{K.PROP_PLACE['float']}”；落地 = “{K.PROP_PLACE['stand']}”",
        f"- {{fill}}：小 = “{K.PROP_FILL['S']}”，中 = “{K.PROP_FILL['M']}”，大 = “{K.PROP_FILL['L']}”",
        f"- {{bg}}：浅灰 = “{K.BG['light']}”，中灰（白色、浅色物件用）= “{K.BG['dark']}”",
        "大类规则：",
        rules,
        "",
        "## 视角说明（转视角模板里的 {view}）",
        *[f"- {v}：{K.PROP_VIEW_TEXT[v]}" for v in ("back", "side", "diag")],
        "",
        "## 转视角模板（背面 / 侧面 / 斜侧通用，{keep} 用每件的“保持不变”）",
        "```",
        K.PROP_TURN,
        "```",
        f"- {{refs}}：背面用“{K.PROP_REFS['back']}”；侧面用“{K.PROP_REFS['side']}”；斜侧用“{K.PROP_REFS['diag']}”",
        f"- {{back_rule}}：只有背面加这句：{K.PROP_BACK_RULE.strip()}",
    ]


def furniture_parts(cats: dict, cat_list: list) -> list:
    return [
        "## 规则",
        "1. 一次一张图。每件的顺序固定：正面 → 背面（参考正面）→ 侧面（参考正面 + 背面）→ 斜侧（参考正面 + 侧面）"
        "→ 俯视（参考正面 + 斜侧）。",
        "2. 正面最多 3 次，其余视角各最多 2 次。每张按该件的“要点”逐条自查；正面不过，这件后面的视角不做。",
        "3. 画面里只有这一件家具：没有人、地板、地毯、墙、别的家具；卡片没写的靠垫、毯子、摆件都不加。",
        "4. 腿、横枨、靠背条、坐垫的数量和卡片一致，五张图之间也一致；比例按卡片写的尺寸（座高、桌高）。",
        "5. 背面不能是正面的镜像；侧面、斜侧如果画成了另一侧，图可以留，但在 note 里写 flipped。",
        "6. 俯视要看清座面 / 桌面 / 床面，像从站着的人眼高度往下看，不是正顶视。",
        "7. 第 1 次没画对，把漏掉的那条要点改写成更具体的结构句再试，改写过的提示词记进 attempts.csv。",
        "",
        "## 正面模板（每件把 {desc} {w} {d} {h} {bg} 换成该件的字段，{rules} {negatives} 换成所属大类的两行）",
        "```",
        K.FURN_FRONT,
        "```",
        f"- {{bg}}：浅灰 = “{K.BG['light']}”，中灰（白色、浅色家具用）= “{K.BG['dark']}”",
        "大类规则：",
        cat_rules(cats, cat_list),
        "",
        "## 视角说明（转视角模板里的 {view}）",
        *[f"- {v}：{K.FURN_VIEW_TEXT[v]}" for v in ("back", "side", "diag", "above")],
        "",
        "## 转视角模板（背面 / 侧面 / 斜侧 / 俯视通用，{keep} 用每件的“保持不变”）",
        "```",
        K.FURN_TURN,
        "```",
        "- {refs}：" + "；".join(f"{VIEW_ZH[v]}用“{K.FURN_REFS[v]}”" for v in ("back", "side", "diag", "above")),
        f"- {{back_rule}}：只有背面加这句：{K.FURN_BACK_RULE.strip()}",
    ]


def light_parts(cats: dict, cat_list: list) -> list:
    subj_zh = {"figure": "全身人台（浅灰无脸人台 + 25 cm 灰球）", "bust": "石膏胸像（无眼无嘴的头肩石膏像 + 15 cm 灰球）"}
    by_subj = {}
    for c in cat_list:
        by_subj.setdefault(cats[c].get("subject", "figure"), []).append(c)
    L = [
        "## 规则",
        "1. 一次一张图。每个光线预设的顺序固定：正面（文生图）→ 斜侧（参考正面）→ 侧面（参考正面）。",
        "2. 正面最多 3 次，斜侧、侧面各最多 2 次。每张按该预设的“要点”逐条自查；正面不过，后面两张不做。",
        "3. 主体在同一大类里永远不变，唯一的变量是光。每个预设标了用哪种主体："
        + "；".join(f"{subj_zh[k]} 用于 {'、'.join(v)}" for k, v in by_subj.items()) + "。"
        "人台有脸、有头发、穿衣服、换姿势，胸像长出眼睛、眉毛、嘴唇、头发或像某个真人，都重画。",
        "4. 光的方向按正面机位的画面左右写；转视角时灯不动、只有相机绕主体转，所以亮面和影子在画面里的位置会跟着变，"
        "这是对的，不要把光“摆回”原来的画面方向。",
        "5. 自查重点看灰球：高光在哪、明暗交界线是硬是软、投影朝哪，这三项和描述对上才算过；胸像还要看鼻影的形状和方向、"
        "暗侧脸颊有没有亮区。",
        "6. 第 1 次没画对，把漏掉的那条要点改写成更具体的句子再试，改写过的提示词记进 attempts.csv。",
    ]
    for subj, cs in by_subj.items():
        S = K.LIGHT_SUBJECTS[subj]
        L += [
            "",
            f"## 主体：{subj_zh[subj]}（{'、'.join(cs)}）",
            "### 正面模板（{setting} {desc} 换成该预设的字段，{rules} {negatives} 换成所属大类的两行）",
            "```",
            K.light_front(subj),
            "```",
            "大类规则：",
            cat_rules(cats, cs),
            "",
            "### 斜侧 / 侧面模板（参考正面；{keep} 用该预设的“保持不变”）",
            "```",
            K.light_turn(subj),
            "```",
            f"- 斜侧的 {{view}}：{S['views']['diag']}",
            f"- 侧面的 {{view}}：{S['views']['side']}",
        ]
    return L


def animal_parts(cats: dict, cat_list: list) -> list:
    return [
        "## 这轮要回答的问题",
        "动物库用哪种画风（D-14）：A = 和姿势库线稿同一种画法（平滑的解剖轮廓 + 浅结构线，不是机器人或木偶）；B = 写实照片。每个动作两种都画正面，"
        "A 再做全部五个机位。notes.md 最后给出你的判断：哪种更稳、哪种肢体更不容易错。",
        "",
        "## 规则",
        "1. 一次一张图。每个动作的顺序：A 正面 → B 正面 → A 斜侧 / 侧面 / 俯视 / 仰视（都参考 A 正面）。",
        "2. 正面最多 3 次，其余各最多 2 次。每张先数腿、尾巴、翅膀、耳朵，再对“要点”；多一条少一条都算错。",
        "3. 关节方向：猫狗的后腿在跗关节处向后弯，马的前膝向前弯；画反算错。",
        "4. 不要幼崽，不要项圈、衣服、道具、地面和背景元素；不要和任何作品里的角色像。",
        "5. A 风格沿用 pose_lineart_gallery 定稿线稿的线条粗细、留白和画法：一条平滑的外轮廓 + 少量浅色结构线，关节只画小圆；"
        "画成圆筒分节、螺栓、铰链、分节脖子或弹簧尾巴的都算错。",
        "",
        "## A 正面模板（线稿；{species} {tail} {desc} 换成该动作的字段）",
        "```",
        K.ANIMAL_LINE.replace("{view}", K.ANIMAL_VIEW_TEXT["front"]),
        "```",
        "## B 正面模板（照片；多一个 {coat}）",
        "```",
        K.ANIMAL_PHOTO.replace("{view}", K.ANIMAL_VIEW_TEXT["front"]),
        "```",
        "大类规则：",
        cat_rules(cats, cat_list),
        "",
        "## A 转机位模板（参考 A 正面；{keep} 用该动作的“保持不变”）",
        "```",
        K.ANIMAL_TURN,
        "```",
        *[f"- {v} 的 {{view}}：{K.ANIMAL_VIEW_TEXT[v]}" for v in ("diag", "side", "above", "below")],
    ]


def item_lines(lib: str, i: dict) -> list:
    head = f"### {i['id']} {i['cat']} · {i['group_zh']} · {i['name_zh']}"
    if lib == "scene":
        meta = [f"light：{i['light']}"]
    elif lib == "furniture":
        dm = i["dims"]
        meta = [f"尺寸：w = {dm['w']}，d = {dm['d']}，h = {dm['h']}" + (f"（座高 {dm['seat']}）" if dm.get("seat") else "")
                + f"；bg = {'中灰' if i.get('bg') == 'dark' else '浅灰'}"]
    elif lib == "light":
        meta = [f"主体：{'石膏胸像' if i.get('subject') == 'bust' else '全身人台'}", f"setting：{i['setting']}"]
    elif lib == "animal":
        meta = [f"species：{i['species']}", f"tail：{i['tail']}", f"coat（仅 B）：{i['coat']}"]
    else:
        meta = [f"place = {'落地' if i.get('place') == 'stand' else '悬浮'}；"
                f"fill = {dict(S='小', M='中', L='大')[i.get('size', 'M')]}；"
                f"bg = {'中灰' if i.get('bg') == 'dark' else '浅灰'}"]
    return ["", head, *meta, f"desc：{i['desc_en']}", f"keep：{i['keep_en']}",
            "要点：" + " ".join(f"{'①②③④⑤⑥'[k]} {t}" for k, t in enumerate(i["checks"]))]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("lib", choices=("scene", "prop", "furniture", "light", "animal"))
    ap.add_argument("cat", nargs="?", default="")
    ap.add_argument("out")
    ap.add_argument("--only", default="")
    ap.add_argument("--probe", action="store_true")
    ap.add_argument("--gate", type=int, default=10)
    a = ap.parse_args()
    if bool(a.cat) == a.probe:
        raise SystemExit("give either a category or --probe")
    if a.lib == "animal" and not a.probe:
        raise SystemExit("the animal library only has a --probe brief until D-14 decides its style")
    cfg = K.LIBS[a.lib]
    views = cfg["views"]
    cats = json.loads((ROOT / cfg["src"] / "_categories.json").read_text())
    only = set(filter(None, a.only.split(",")))
    items = [i for i in json.loads((ROOT / cfg["out"]).read_text())["items"]
             if (i.get("probe") if a.probe else i["cat"] == a.cat) and (not only or i["id"] in only)
             and not all(i["views"].get(v) for v in views)]
    if not items:
        raise SystemExit("nothing to brief")
    out = pathlib.Path(a.out).expanduser()
    out.mkdir(parents=True, exist_ok=True)
    run = out.name
    need = {i["id"]: [v for v in views if not i["views"].get(v)] for i in items}
    n_img = sum(len(v) for v in need.values()) + (len(items) if a.lib == "animal" else 0)  # + one B-style front each
    cat_list = sorted({i["cat"] for i in items}, key=lambda c: cats[c]["order"])
    title = "试验（每个大类挑几件，验证能不能稳定生成）" if a.probe else f"{cats[a.cat]['name']['zh']}（{a.cat}）"
    unit = {"scene": "个场景", "light": "个光线预设", "animal": "个动作"}.get(a.lib, "件")
    view_zh = "、".join(VIEW_ZH[v] for v in views)
    gate = ([] if a.probe else [
        f"**自检闸**：先做前 {a.gate} {unit}的第一张（{VIEW_ZH[views[0]]}）。通过少于 {round(a.gate * 0.7)} {unit}就停下，"
        "把问题写进 notes.md 交付，不要继续；达到了再做完其余。", ""])

    L = [f"# shisei {cfg['label']} · {title} · {run}", "",
         f"共 {len(items)} {unit}、{n_img} 张（视角：{view_zh}）。规格见下，每{unit}的字段已经给好，照模板拼即可。"
         + ("这是试验轮：每张都要认真自查，notes.md 写清楚哪类稳、哪类不稳、改写后怎样，这份记录决定正式生产的模板。"
            if a.probe else ""),
         "", *gate,
         *{"scene": scene_parts, "prop": prop_parts, "furniture": furniture_parts, "light": light_parts, "animal": animal_parts}[a.lib](cats, cat_list),
         "", "## 交付",
         f"打包成 {run}.zip（太大可以分成 {run}-part1.zip、part2…）：",
         f"- img/<ID>_<view>.png，view = {' / '.join(views)}，例如 img/{items[0]['id']}_{views[0]}.png；1344×1792 PNG"
         + ("；B 风格正面存为 img/<ID>_photo.png" if a.lib == "animal" else ""),
         "- attempts.csv：file,attempts,outcome,hits,note（outcome = ok / refused / wrong；hits = 要点命中数如 4/4）",
         "- notes.md：按大类总结一次就对的、改写才对的、怎么写都不对的，以及改写用过的句子",
         f"做完给我下载链接，回复最后一行写：DONE {run} ok=<数> refused=<数> wrong=<数>",
         "", f"## {len(items)} {unit}"]
    for i in items:
        L += item_lines(a.lib, i)
    (out / "brief.md").write_text("\n".join(L) + "\n")
    (out / "manifest.json").write_text(json.dumps({"run": run, "lib": a.lib, "cat": a.cat or "probe",
                                                   "need": need}, indent=1) + "\n")
    print(f"{out / 'brief.md'}: {len(items)} items, {n_img} images, {len(chr(10).join(L))} chars")


if __name__ == "__main__":
    main()
