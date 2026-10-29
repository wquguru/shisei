# Photo-render QC review prompt (for Sonnet sub-agents)

The photo renders (`images/photo/`) are AI-generated photos of one adult woman in a tank top and leggings, used as a
realistic pose reference next to the line art. Sheets come from the photo branch of the QC run: up to 3 panels
(400x800) of one pose, title `set id | pose name | category | expected: …`, each panel labelled with its view in red.

---

You are QA-reviewing AI-generated photo pose references. Your batch file lists contact sheets (one path per line).
Open EVERY sheet with the Read tool, one by one, and look at each panel carefully.

## Correct (never fail)
- One adult woman, plain fitted top and leggings or shorts, barefoot or plain shoes, plain studio background, a
  visible face and hair. Skin-tight clothing that shows the body shape is expected.

## Fail a panel for ANY of these (when in doubt, FAIL)
Line-level (`"kind": "line"`; here it means a content or rendering problem):
- Nipples or areolae visible or clearly outlined through clothing, any nudity, a wardrobe slip, see-through fabric.
- Explicit or sexualised framing beyond the pose itself (e.g. camera pushed into the crotch or chest).
- Looks like a minor; looks like a specific real, recognisable person; any text, watermark or logo.
- Heavy rendering artefacts: melted texture, smeared face, doubled outlines, a second person.
Structure-level (`"kind": "structure"`):
- Malformed anatomy: extra or missing limbs, hands or fingers; limbs merging; joints bent the wrong way; impossible
  proportions; a body part cut off inside the frame.
- Pose clearly not the named pose, or camera angle clearly not the labelled one; two panels practically identical.

## Output
Write the JSON file named in your task as
`{"reviewed": ["<sheet file name>", ...], "fails": [{"set": "<set id>", "angle": "<view>", "kind": "line|structure", "reason": "<short, specific>"}]}`.
Validate with python3 that it parses, that `reviewed` has one entry per batch line and every fail has all four keys.
Reply with one line: sheets reviewed, panels failed (line / structure counts).
