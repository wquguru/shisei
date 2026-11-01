# 光线逐格质检提示词

光线库（docs/light/PLAN.md，D-15）每个预设一张审图：表头是编号、名称、“要点”（光从哪来、影子往哪去、球的高光在哪）
和卡片的英文描述，下面三格依次是正面、斜侧、侧面。不抠图。主体是灰色人台（TD / SN / AR / FX）或石膏胸像（PO），
旁边有一个灰球。批次文件每行一张审图，输出给 `tools/series_qc.py light` 合并。状态：`pass`，或 `content` /
`subject`（主体变了）/ `light`（光和描述不符）/ `turn`（转机位时光跟着相机走了，或是正面的镜像）。

---

You review AI-generated lighting reference photos for the Shisei light library. Each preset shows ONE lighting
set-up on a neutral subject: either a faceless smooth matte-grey fashion mannequin standing full length, or a grey
plaster head-and-shoulders cast; a matte grey reference sphere on a stand sits beside it. The header gives the ID,
name, numbered 要点 (where the light comes from, where shadows fall, where the sphere's highlight sits) and the
card's English description. Below are three panels of the same moment: 正面 front, 斜侧 diag (camera moved 45°
around toward the subject's left) and 侧面 side (camera moved 90° to the subject's left, subject in profile facing
image-left). A panel that says 未生成 was not generated; ignore it.

Judge every panel. A panel passes only if ALL of these hold; otherwise give the FIRST status that applies:

1. `content` — the subject reads as a real person: a face with eyes, brows, lips, hair, skin texture, make-up or
   clothing; nipples, genital detail or any sexualised body; a figure that reads as a child; readable text or a logo;
   other people. Small spherical joints on the mannequin and a simplified smooth torso are expected.
2. `subject` — the subject changed between panels or against the description: a different pose, body proportions or
   head shape, the bust became a full figure (or the reverse), the sphere is missing or moved to another place, or
   the subject became a wooden or blocky jointed dummy.
3. `light` — the light does not match the 要点 and description in this view: read the sphere's highlight and shadow
   side, the softness of the shadow edge, the direction of cast shadows and the colour of the light. On the front
   panel, check each 要点 directly. On the diag and side panels, check that the light comes from where that same
   light would now appear after the camera moved (see 4), and that colour temperature and hardness are unchanged.
4. `turn` — the light "followed the camera": the lit side, sphere highlight and shadows sit in the same place in the
   frame on all three panels even though the camera moved 45° and 90°; or a panel is a mirror of the front; or the
   diag or side panel is not actually a new camera angle (subject still facing the camera full-on).

Be strict on 1 and on light that clearly contradicts the 要点; do not fail a panel for small exposure differences,
background tone or the exact shape of a soft shadow. When unsure, fail it with a reason that says what you see — a
person will look at it.

Write the output file as JSON:
{
  "prompt": "light_prompt.md",
  "reviewed": ["L001", …],          // one entry per sheet in the batch, in batch order (ID from the file name)
  "fails": [
    {"id": "L001", "view": "diag", "status": "turn", "reason": "short English reason naming the 要点 or problem"}
  ]
}
Only failing panels go in `fails`; every panel not listed counts as pass. Reply with one line:
`<batch file>: <sheets> sheets, <fails> failing panels (content a, subject b, light c, turn d)`.
