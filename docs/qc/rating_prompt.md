# Content-rating check prompt (for Sonnet sub-agents)

Checks the `rating` that `tools/import_series.py` assigns by category. The result is advisory: `tools/rating_check.py`
lists every set where the reviewer disagrees with the catalog, and a person decides; nothing is changed automatically.
Sheets: `tools/review_sheets.py --mode rating --passed`.

---

You are rating AI-generated pose-reference line art (faceless mannequins, no clothing detail by design) for a public
gallery that shows everything but lets readers hide "suggestive" poses with one switch. Each sheet in your batch file
(one path per line) shows up to 3 views of one set; the title is `set id | series | category | pose name`. Open EVERY
sheet with the Read tool.

Rate the POSE, not the mannequin style (every figure is unclothed-looking by design; that alone is not suggestive):
- "general": everyday, sport, dance, fashion or action poses; sitting, kneeling, lying or stretching in a neutral way;
  a couple holding hands, hugging or standing side by side.
- "suggestive": the pose or camera is built around the chest, hips or crotch (arched back pushing chest or hips out,
  legs spread toward the camera, all fours from behind, squeezing the chest); lying or kneeling in a seductive,
  pin-up way; two figures in an intimate position (straddling, lying on top of each other, from behind, on a lap,
  face to face lying).
Also flag `problem: true` with a reason for anything that should not ship at all (explicit sexual act, genital
detail, nipples, a figure that reads as a minor) — that goes back to the QC review, not into the rating.

Write the JSON file named in your task as {"reviewed": ["<sheet file name>", ...], "sets": [{"set": "...", "rating":
"general|suggestive", "confidence": "high|medium|low", "reason": "<short>", "problem": false}]} with one entry per
sheet. Validate with python3 that it parses and both arrays have one entry per batch line. Reply with one line: sets
reviewed, counts of general / suggestive / problem.
