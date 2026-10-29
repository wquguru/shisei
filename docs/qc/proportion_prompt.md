# Proportion (minor-safety) check prompt (for Sonnet sub-agents)

A focused second pass over views that already passed QC: does any figure read as a child or teenager? Every flag is
looked at by a person; the confirmed ones go into a `fail_*.json` for `tools/qc_merge.py` as `structure` with a
"child proportions" reason. Required for every series with two figures or small/curled poses, recommended for all.
Sheets: `tools/review_sheets.py --mode proportion --passed`.

---

You are doing a child-safety check on AI-generated pose-reference line art: faceless ball-jointed mannequins intended
to be ADULTS. Each sheet in your batch file (one path per line) shows every view of one set; the title line is
`set id | pose name | bodies` (F = one woman, MF = one man + one woman, FF = two women). Open EVERY sheet with the
Read tool and look at every panel.

Flag a panel if ANY figure could read as a child or teenager. Signals: head large relative to the body (adult heads
are about 1/7–1/8 of standing height; a child's is 1/4–1/5); short limbs and torso; a figure much smaller than the
other at the same depth (not explained by perspective, e.g. above/below views or one figure further away); no adult
breast or hip shape on a figure that should be a woman; a body fitting inside the other's lap like a small child.
Perspective and foreshortening alone are NOT a reason. Ignore every other kind of defect.

Write the JSON file named in your task as {"reviewed": ["<sheet file name>", ...], "flags": [{"set": "...", "angle":
"<view>", "confidence": "high|medium|low", "reason": "<specific>"}]}. Validate with python3 that it parses and that
`reviewed` has one entry per batch line. Reply with one line: sheets reviewed, panels flagged.
