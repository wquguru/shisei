# 服装逐格质检提示词

服装库（docs/costume/PLAN.md，D-10）每件一张审图：表头是编号、名称、应有性别和“要点”（形制检查清单），下面四格依次是
正面、背面、侧面、斜侧，都是抠图后合成在深色底上的样子，所以抠图问题也在这里审。批次文件每行一张审图，输出给
`tools/costume_qc.py` 合并。状态：`pass`，或 `form`（形制不对）/ `consistency`（和本件其他视角不是同一件）/
`view`（视角不对或镜像）/ `content`（出现人、皮肤、文字、标识等）/ `matte`（抠图坏了）。

---

You review AI-generated costume reference images for the Shisei costume library. Each sheet shows ONE costume:
the header gives its ID, name, the expected gender of the cut, and numbered 要点 (the construction points that define
this garment). Below are four panels: 正面 front, 背面 back, 侧面 side, 斜侧 diag (a 45° three-quarter view). Each
image is a garment on an invisible ghost mannequin, cut out and placed on a dark background. A panel that says 未生成
was not generated; ignore it.

Judge every panel. A panel passes only if ALL of these hold; otherwise give the FIRST status that applies:

1. `content` — any person, face, head, hair, skin, hands, a visible mannequin body or stand, a hanger, props, weapons,
   readable text, a logo, a brand mark, a flag or a real institution's badge. (Embroidered rank badges and patterns
   that are part of the garment named in the header are fine.) Anything that sexualises the garment also fails here.
2. `matte` — the cut-out is broken: parts of the garment missing or chopped off (sleeve ends, hems, shoes, sheer
   panels gone), background left as grey blocks or a grey halo/outline around the garment, or holes cut into solid
   fabric. Gaps that really are empty (between trouser legs, inside an open sleeve or collar) are correct.
   A sheer fabric that looks lighter or greyish because the old background shows through it is acceptable.
3. `view` — the panel is not the stated view: a "back" that shows the front or is a mirror of the front (the front's
   overlap or fastenings simply flipped), a "side" that is not a near-profile, a "diag" that is just front or side.
   A side or diag showing the garment's other side (turned the opposite way) is acceptable.
4. `consistency` — this panel is not the same garment as the others on the sheet: different colour, pattern, length,
   sleeve shape, layers, or a trim that appears or disappears. Judge against the majority of the panels; small
   lighting or fold differences are fine.
5. `form` — the garment does not match the header's 要点: check each numbered point that is visible in this view.
   Points that cannot be seen from this angle (e.g. a front closure on the back view) are not judged here. For
   cross collars, 交领右衽 means: seen from the front, the overlapping edge runs from the neck diagonally down toward
   IMAGE-LEFT (the collar looks like a y whose stem slants to the lower left); the opposite direction is `form`.
   Look for features of the wrong culture too: a wide obi belt or obi bow (Japanese), a very short jacket with a
   long ribbon tie (Korean), zippers or lace on Chinese historical garments.

Be strict on 1–3 and on any 要点 that is clearly wrong; do not fail a panel for taste, minor added piping or
embroidery, or slightly different proportions. When unsure whether a 要点 is met, fail it with a reason that says
what you see — a person will look at it.

Write the output file as JSON:
{
  "prompt": "costume_prompt.md",
  "reviewed": ["C001", "C002", …],          // one entry per sheet in the batch, in batch order (ID from the file name)
  "fails": [
    {"id": "C001", "view": "side", "status": "form", "reason": "short English reason naming the 要点 or problem"}
  ]
}
Only failing panels go in `fails`; every panel not listed counts as pass. Reply with one line:
`<batch file>: <sheets> sheets, <fails> failing panels (form x, consistency y, view z, content w, matte v)`.
