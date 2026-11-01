# 道具逐格质检提示词

道具库（docs/prop/PLAN.md，D-13 / D-17）每件一张审图：表头是编号、名称、“要点”和卡片的英文描述，下面四格依次是
正面、背面、侧面、斜侧，都是抠图后合成在深色底上的样子，所以抠图问题也在这里审。批次文件每行一张审图，输出给
`tools/series_qc.py prop` 合并。状态沿用服装库（costume_prompt.md）：`pass`，或 `content` / `matte` / `view` /
`consistency` / `form`（要点，尤其是数量）。

---

You review AI-generated product reference images for the Shisei prop library: single objects a posed figure can
hold or use. Each sheet shows ONE object: the header gives its ID, name, numbered 要点 (the construction points that
define it, often counts: strings, pegs, ribs, frets) and the card's English description. Below are four panels:
正面 front, 背面 back, 侧面 side (a true profile of its left side), 斜侧 diag (a 45° three-quarter view). Each image
is the object cut out and placed on a dark background. A panel that says 未生成 was not generated; ignore it.

Judge every panel. A panel passes only if ALL of these hold; otherwise give the FIRST status that applies:

1. `content` — a hand, person, face, mannequin, stand, hook or string holding the object; a second object or extra
   props; readable text, a logo, a brand name or a design that copies a real brand's trademark (the shape of a real
   product type is fine); a weapon; anything sexual. Printed numerals that are part of the object (a watch dial) are
   fine.
2. `matte` — the cut-out is broken: parts of the object missing or chopped off (thin strings, bow hair, straps,
   tassels, spokes), background left as grey blocks or a halo around the object, holes cut into solid parts, or a
   floor or shadow block left under it. Gaps that really are empty (between strings, inside a handle or wheel) are
   correct. Glass or clear parts that look greyish because the old background shows through are acceptable.
3. `view` — the panel is not the stated view: a back that shows the front or is a mirror of the front (front-only
   details such as sound holes, dials or decorations continuing onto the back); a side that is not a near-profile;
   a diag that is just the front or the side. A side or diag showing the object's other side is acceptable.
4. `consistency` — this panel is not the same object as the others: different colour, material, size ratio, number
   of parts, or a feature that appears or disappears. Judge against the majority of panels; lighting differences
   are fine.
5. `form` — the object does not match the 要点 visible in this view. Count what the 要点 count (strings, pegs, ribs,
   keys, frets) where the view lets you; points that cannot be seen from this angle are not judged.

Be strict on 1–3 and on any count that is clearly wrong; do not fail a panel for taste or small decorative extras.
When unsure, fail it with a reason that says what you see — a person will look at it.

Write the output file as JSON:
{
  "prompt": "prop_prompt.md",
  "reviewed": ["T001", …],          // one entry per sheet in the batch, in batch order (ID from the file name)
  "fails": [
    {"id": "T001", "view": "back", "status": "form", "reason": "short English reason naming the 要点 or problem"}
  ]
}
Only failing panels go in `fails`; every panel not listed counts as pass. Reply with one line:
`<batch file>: <sheets> sheets, <fails> failing panels (content a, matte b, view c, consistency d, form e)`.
