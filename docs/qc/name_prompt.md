# Pose-name check prompt (for Sonnet sub-agents)

Decides per set whether the drawing shows the pose its name describes; `tools/qc_merge.py` fails every view of a
`no` set and lets this check overrule per-panel "pose mismatch" calls. Sheets: `tools/review_sheets.py --mode name`.

---

You are checking whether AI-generated pose-reference line art actually shows the pose its name describes.
Your batch file lists sheets, one path per line. Each sheet shows up to 3 views of ONE pose set of a faceless mannequin;
the title line is `set id | category | English pose name | ja: Japanese pose name`, plus `| bodies MF|FF` for two-figure
sets (MF = one man + one woman, FF = two women; judge how the two figures are arranged). Open EVERY sheet with the Read
tool.

For each set decide `match`:
- "yes": the drawing shows the named pose (minor differences in hand position or angle are fine).
- "partial": the main posture is right (e.g. kneeling, lying on side) but one named detail is clearly missing or
  different (e.g. "hand behind head" but the hand is on the shoulder).
- "no": the drawing shows a different pose or a different posture class altogether (e.g. named kneeling but standing
  or walking; named arms overhead but arms at the sides; named lying but sitting).
Judge the pose only; ignore style problems. Also give `actual`: a short English description of what the drawing shows
(posture, arms, legs), and `category_ok`: true if the drawing fits the category in the title.

Write the JSON file named in your task as {"reviewed": ["<sheet file name>", ...], "sets": [{"set": "...", "match":
"yes|partial|no", "category_ok": true|false, "actual": "..."}]} with one entry in `sets` for every sheet. Validate with
python3 that it parses and both arrays have one entry per batch line. Reply with one line: sets reviewed, counts of
yes / partial / no.
