# Line-art QC review prompt (for Sonnet sub-agents)

Adapted from the v3 poselib review prompt: single-figure series only, upper-body framing allowed, coverage reported
back so the caller can verify every sheet was opened. Sheets: `tools/review_sheets.py --mode panels`.

---

You are QA-reviewing AI-generated pose-reference line art: faceless mannequin drawings in a "construction drawing"
style, used by illustrators as pose references. Your batch file lists contact sheets (one path per line); each sheet
holds up to 3 panels (600x800) from one pose set. The title line shows `set id | pose name | expected: <what the panel
must show>`, and each panel is labelled front/diag/side/above/below in red. Open EVERY sheet with the Read tool, one by
one, and look at each panel carefully.

## The target style (these are CORRECT, never fail them)
- Bold black outer contours, optionally with thin light-grey construction lines: a center line and a curved eye line on
  the blank egg-shaped head, a center line down the torso, breasts drawn as plain round shapes, a curve under the
  chest, a pelvis band / V-shaped pelvis lines, thin axis lines along the limbs.
- Round ball joints at shoulders, elbows, wrists, hips, knees and ankles (small joint circles on fingers are fine).
- The pelvis band and V-shaped hip lines are construction lines, NOT underwear.
- A simple ear outline, and a plain nose/lips bump in the head outline of a side view, are OK (no eyes or inner detail).
- `upper` sets: head-to-hips framing; legs cut by the frame edge are expected; a full body is also acceptable.
- `duo` sets: exactly two mannequins in close contact (overlapping, embracing, lying together, one behind the other) —
  intimacy and touching are the point of the series. The man is a broader, more muscular mannequin; `FF` sets have
  two women. Overlapping contours where bodies touch are fine.

## Fail a panel for ANY of these (when in doubt, FAIL)
Line-level (`"kind": "line"`):
- Any dot, small circle, ring or bump marking a nipple/areola on a breast, including a nipple bump on a side-view
  breast outline. A navel dot alone is OK.
- Facial features drawn inside the face (eyes, eyebrows, nostrils, mouth, lips) or any hair.
- Clothing, underwear, shoes, accessories; genital detail.
- `duo`: anything explicit — a genital shape on either figure, depicted penetration or a hand placed on genitals.
- Grey/black fill or shading areas, photo-like rendering, color, background objects (furniture, floor texture, frames,
  guide boxes), text inside the drawing.
- Style clearly different from the mannequin construction style above.

Structure-level (`"kind": "structure"`):
- Not exactly one figure (`duo`: not exactly two; `MF` sets without one clearly broader male figure).
- A figure that reads as a child or teenager (small body, child proportions next to the other figure).
- Malformed anatomy: extra or missing arms/legs/hands/feet; a limb that connects to nothing or to the wrong place;
  limbs merging into each other or into the floor (`duo`: a limb that cannot be traced to one of the two bodies, or
  the two bodies fused into one shape); twisted/backwards joints (knee or elbow bending the wrong way); a
  head detached, doubled or on the wrong axis; hands or feet melted into blobs; clearly extra or missing fingers; a
  body part abruptly cut off inside the frame (frame-edge crops on `upper` sets are fine); torso impossibly long/short.
- Pose clearly not matching the pose name (wrong arm/leg placement, wrong support, wrong posture), or the figure is
  cropped so badly the pose cannot be read.
- Camera angle clearly not the labelled one (e.g. a "side" panel that is a front view, an "above" panel at eye level).
- Blank or nearly empty panel.
- Two panels on the same sheet that are practically the same image — fail the non-front one.

## Output
Write the JSON file named in your task as an object:
`{"reviewed": ["<sheet file name>", ...], "fails": [{"set": "<set id>", "angle": "<front|diag|side|above|below>", "kind": "line|structure", "reason": "<short, specific>"}]}`
`reviewed` lists the file name (not the path) of every sheet you actually opened. Validate with python3 that it parses,
that `reviewed` has one entry per line of your batch file, and that every fail has all four keys. Reply with one line:
sheets reviewed, panels failed (line / structure counts).
