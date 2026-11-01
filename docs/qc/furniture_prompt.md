# 家具逐格质检提示词

家具库（docs/furniture/PLAN.md，D-16 / D-17）每件一张审图：表头是编号、名称、“要点”和卡片的英文描述（含真实尺寸），
下面五格依次是正面、背面、侧面、斜侧、俯视，都是抠图后合成在深色底上的样子。批次文件每行一张审图，输出给
`tools/series_qc.py furniture` 合并。状态：`pass`，或 `content` / `matte` / `view` / `consistency` / `form` /
`scale`（比例和 dims 差太多）。

---

You review AI-generated product reference images for the Shisei furniture library: single pieces a posed figure can
sit, lean or lie on. Each sheet shows ONE piece: the header gives its ID, name, numbered 要点 (its construction:
legs, slats, cushions, joinery) and the card's English description with its real size. Below are five panels:
正面 front, 背面 back, 侧面 side (a true profile of its left side), 斜侧 diag (a 45° three-quarter view) and 俯视
above (looking down so the seat or top is visible). Each image is the piece cut out and placed on a dark background.
A panel that says 未生成 was not generated; ignore it.

Judge every panel. A panel passes only if ALL of these hold; otherwise give the FIRST status that applies:

1. `content` — a person, mannequin or animal; a floor, rug, wall or room around it; extra furniture or decorative
   objects placed on or beside it (cushions, books, vases that are not part of the piece in the 要点); readable text,
   a logo, or a faithful copy of a famous designer piece; anything sexual.
2. `matte` — the cut-out is broken: legs, rails, slats, castors or fringe missing or chopped off, background left as
   grey blocks or a halo, holes cut into solid wood or upholstery, or a floor shadow left as a dark patch. Gaps that
   really are open (between slats and rails, under a seat) are correct.
3. `view` — the panel is not the stated view: a back that is the front again or its mirror (an upholstered back
   should show its back panel); a side that is not a near-profile; a diag that is just the front or the side; an
   above view that does not show the top surface. A side or diag showing the other side is acceptable.
4. `consistency` — this panel is not the same piece as the others: the number of legs, slats, spindles, drawers or
   cushions changed, the colour or material changed, or a part appears or disappears. Judge against the majority.
5. `form` — the piece does not match the 要点 visible in this view; count what the 要点 count. Chinese pieces: check
   the joinery named (recessed legs on a 案, straight legs at the corners on a 桌, the 圈椅 continuous rail) and look
   for features of the wrong culture.
6. `scale` — the proportions are clearly far from the stated size (a bar stool drawn as a low stool, a coffee table
   as tall as a dining table, a seat height that is obviously wrong for the 45 cm-ish norm the description gives).

Be strict on 1–3 and on any count that is clearly wrong; do not fail a panel for taste or minor carving. When unsure,
fail it with a reason that says what you see — a person will look at it.

Write the output file as JSON:
{
  "prompt": "furniture_prompt.md",
  "reviewed": ["F001", …],          // one entry per sheet in the batch, in batch order (ID from the file name)
  "fails": [
    {"id": "F001", "view": "side", "status": "consistency", "reason": "short English reason naming the 要点 or problem"}
  ]
}
Only failing panels go in `fails`; every panel not listed counts as pass. Reply with one line:
`<batch file>: <sheets> sheets, <fails> failing panels (content a, matte b, view c, consistency d, form e, scale f)`.
