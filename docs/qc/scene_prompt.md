# 场景逐格质检提示词

场景库（docs/scene/PLAN.md，D-12 / D-17）每件一张审图：表头是编号、名称、“要点”和卡片的英文描述，下面三格依次是
平视 eye、俯视 above、仰视 below。场景不抠图，看的是交付原图。批次文件每行一张审图，输出给 `tools/series_qc.py scene`
合并。状态：`pass`，或 `content`（人、动物、文字、标识等）/ `spot`（中央站位被占）/ `view`（机位不对）/
`consistency`（三张不是同一地点同一时刻）/ `form`（和要点不符）。

---

You review AI-generated location reference photos for the Shisei scene library: empty places a pose or a person can
later be composited into. Each sheet shows ONE location: the header gives its ID, name, numbered 要点 (what must be in
the scene) and the card's English description. Below are three panels of the same place from the same spot facing
the same direction: 平视 eye (camera 1.6 m, level, horizon or the far wall's eye line at the vertical centre), 俯视
above (camera about 3.5 m, tilted about 30° down, more ground visible, the empty spot near the centre) and 仰视 below
(camera about 0.4 m, tilted up, ground only along the bottom edge, the rest walls and ceiling or trees and sky). A
panel that says 未生成 was not generated; ignore it.

Judge every panel. A panel passes only if ALL of these hold; otherwise give the FIRST status that applies:

1. `content` — any person, silhouette, reflection of a person, animal or bird, readable text or numbers, a logo or
   brand, a licence plate, a recognisable real landmark, or a religious figure or symbol used as decoration. Unreadable
   texture that only suggests signage at a distance is fine. Anything sexual or that sets a scene for minors fails too.
2. `spot` — the clear patch of ground in the centre of the frame (where one standing adult would go, about 4 m from
   the camera) is occupied: furniture, a vehicle, a plant, a puddle of light effects or any object stands there.
   Below views only show its edge; judge them on whether something now stands in front of the camera.
3. `view` — the panel is not its stated camera: an eye view with the horizon clearly far from the middle (outside
   roughly the middle third) or strongly tilted verticals; an above view that does not look down or shows no more
   ground than the eye view; a below view that does not look up, or where the ground fills more than about a third of
   the frame. Be lenient on exact angles; fail only when the view clearly does not read as that camera.
4. `consistency` — the panel is not the same place at the same moment as the eye view: windows, doors or the main
   furniture moved to another wall, the layout or architecture changed, a key element of the 要点 vanished, or the
   time of day, weather or season changed (day became night, rain appeared). Things that are simply out of frame
   from a new angle are fine.
5. `form` — the scene does not match the 要点 that are visible from this angle (historical and regional scenes:
   check the architecture and materials named, and look for features of the wrong culture or era).

Be strict on 1–2 and on any 要点 that is clearly wrong; do not fail a panel for taste, colour grading or small
props added at the edges. When unsure, fail it with a reason that says what you see — a person will look at it.

Write the output file as JSON:
{
  "prompt": "scene_prompt.md",
  "reviewed": ["E001", …],          // one entry per sheet in the batch, in batch order (ID from the file name)
  "fails": [
    {"id": "E001", "view": "below", "status": "view", "reason": "short English reason naming the 要点 or problem"}
  ]
}
Only failing panels go in `fails`; every panel not listed counts as pass. Reply with one line:
`<batch file>: <sheets> sheets, <fails> failing panels (content a, spot b, view c, consistency d, form e)`.
