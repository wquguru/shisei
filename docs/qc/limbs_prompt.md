# Limb-count check prompt (for Sonnet sub-agents)

A focused pass over views that already passed QC: count every arm, hand, leg and foot before judging. The panel review
missed P006 front (three arms: one hand on the hip, a second arm from the same shoulder propped on the floor) because
both hands matched the pose name, and a re-review of that sheet alone passed it again — so this prompt makes the
reviewer trace each limb to a shoulder or hip and write the counts down first. Flags are suggestions: a person looks
at every one and the confirmed ones go into `data/qc-input/fail_manual.json` as `structure`.
Sheets: `tools/review_sheets.py --mode limbs --passed`. Output files are `limbs_*.json`, which `qc_merge.py` ignores.

---

You are checking AI-generated pose-reference line art (faceless ball-jointed mannequins) for extra or missing limbs.
Each sheet in your batch file (one path per line) holds up to 2 panels from one pose set; the title line is
`set id | pose name | expected: <figures>` and each panel is labelled front/diag/side/above/below in red. Open EVERY
sheet with the Read tool and check every panel. Ignore style, background, nipples, faces and pose names: only limbs.

For each panel, before deciding anything:
1. Find each shoulder. Follow every arm from its shoulder ball joint through the elbow and wrist to its hand. Write
   down where each hand ends up (e.g. "R hand on hip, L hand on floor behind").
2. Find each hip. Follow every leg from the hip through the knee and ankle to its foot.
3. Then look for any arm, forearm, hand, leg or foot you did NOT reach from a shoulder or hip — including one
   partly hidden behind the body or another limb, or a second limb leaving the same shoulder or hip. Each of those is
   an extra limb. A hand or foot drawn twice (two hands on one wrist) also counts.
4. Count: arms, hands, legs, feet. One figure must give 2 / 2 / 2 / 2; `duo` (two figures) 4 / 4 / 4 / 4.
   A limb hidden by the body in this view, or cut by the frame edge on an `upper` set, is fine — say so in `note`.

Flag the panel if any count is off without a visible reason (hidden or cropped), if a limb connects to nothing, or if a
limb cannot be traced to one body. When unsure whether a stray line is a limb, flag it and say why; a person decides.

## Output
Write the JSON file named in your task:
`{"reviewed": ["<sheet file name>", ...], "panels": [{"set": "<id>", "angle": "<view>", "arms": n, "hands": n, "legs": n, "feet": n, "trace": "<where each hand and foot ends up>", "note": "<hidden/cropped limbs, or empty>"}], "flags": [{"set": "<id>", "angle": "<view>", "reason": "<which limb is extra or missing and where>"}]}`
Every panel on every sheet gets one `panels` entry. Validate with python3 that the JSON parses, that `reviewed` has one
entry per batch line and that `panels` has one entry per panel. Reply with one line: sheets reviewed, panels, flags.
