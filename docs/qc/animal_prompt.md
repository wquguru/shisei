# 动物逐格质检提示词

动物库（docs/animal/PLAN.md，D-14）每个动作一张审图：表头是编号、名称（体型·动作）、主图机位、“要点”和卡片的英文描述；
五格从主图开始（四足多为侧面，鸟和部分幻想生物为正面），依次是另一张平视图、斜侧、俯视、仰视。线稿不抠图。以
limbs_prompt.md 的逐肢追踪为底，扩展到四足、尾、翅、耳、角。批次文件每行一张审图，输出给 `tools/series_qc.py animal`
合并。状态：`pass`，或 `content` / `style`（画风不对：机器人、木偶、上色、加背景）/ `limbs`（肢体、尾、翅数目或连接不对）/
`view`（机位不对或镜像）/ `consistency`（和主图不是同一个姿势）/ `form`（和要点不符）。
小眼眶、鼻头轮廓、一条很淡的地面线不算失败（执行者已按此放行，人再定是否收紧）。

---

You review AI-generated pose-reference line art of animals for the Shisei animal library. Each sheet shows ONE
action of one animal: the header gives its ID, name (build · action), its main view (主图), numbered 要点 and the
card's English description of the pose. The style is an artist's anatomy construction sketch: one smooth organic
outer contour, thin light construction lines inside (spine, cross-contours) and small light circles at the joints,
black lines on white, no fur, no eyes, no colour, no ground. Panels: the first is the main view, then the other flat
view, then 斜侧 diag (45° toward the animal's left), 俯视 above (about 30° above, in front and to the left, the back
visible) and 仰视 below (about 45° below, in front and to the left, jaw, chest and belly visible, near paws large).
Side means the animal's left side with the head toward image-left; front faces its chest. A panel that says 未生成
was not generated; ignore it.

Before judging a panel, trace it like limbs_prompt.md: follow each leg from its shoulder or hip through every joint
to its paw or hoof, then each wing from the shoulder to the tip, the tail from its base, the ears and horns. Note
what you reached; anything left over is extra. Count: quadrupeds 4 legs, 4 paws or hooves, 1 tail (unless the 要点
say otherwise: a nine-tailed fox has nine, a bird 2 legs and 2 wings, a dragon as described). A limb hidden by the
body in this view is fine.

Judge every panel. A panel passes only if ALL of these hold; otherwise give the FIRST status that applies:

1. `content` — a person, hand or second animal; prey, a collar, harness, saddle or clothing; readable text; a young
   animal (kitten, puppy, foal, chick proportions); anything sexual or violent.
2. `style` — not the construction-sketch style: mechanical parts (tube or cylinder segments, bolts, pins, hinges, a
   ribbed or segmented neck or tail, a coiled-spring tail), a wooden toy look, fur rendering, shading or colour, a
   background or a solid floor. Small eye outlines, a nose outline or one very faint ground line are tolerated.
3. `limbs` — a leg, paw, wing, tail, ear or horn extra, missing without a visible reason, merged into another, or
   connected to nothing; two paws drawn on one leg; a joint bending the wrong way (a cat or dog hock bends backward,
   a horse's knee forward).
4. `view` — the panel is not its stated camera: a front that is a side or three-quarter, a diag that stays a flat
   profile or flat front, an above that does not show the back, a below that does not show the underside, or a panel
   that is the main view mirrored.
5. `consistency` — not the same pose as the main view: legs in a different phase or position, lying became sitting,
   the head turned the other way, the tail moved to a different position, or the build changed (short legs became
   long, a drop ear became a prick ear).
6. `form` — the 要点 visible in this view are not met (e.g. the paw is not behind the ear, the tail does not cover
   the nose).

Be strict on 1–3; for 4–5 compare carefully with the main view. Do not fail a panel for line weight or for slightly
different proportions. When unsure, fail it with a reason that says what you see — a person will look at it.

Write the output file as JSON:
{
  "prompt": "animal_prompt.md",
  "reviewed": ["A001", …],          // one entry per sheet in the batch, in batch order (ID from the file name)
  "fails": [
    {"id": "A001", "view": "above", "status": "limbs", "reason": "short English reason naming the 要点 or problem"}
  ]
}
Only failing panels go in `fails`; every panel not listed counts as pass. Reply with one line:
`<batch file>: <sheets> sheets, <fails> failing panels (content a, style b, limbs c, view d, consistency e, form f)`.
