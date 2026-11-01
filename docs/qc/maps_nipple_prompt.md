# Clay surface-detail QC prompt (for Sonnet sub-agents)

A second pass over the clay renders only, at 600x800 per panel: the five-panel maps sheet (maps_prompt.md) is too
small to see nipple bumps, and a hand check of the first round found them on views the reviewers had passed. Sheets:
`tools/review_sheets.py --mode mapclay maps=SRC`: up to 3 clay renders of one pose. Results are `maps_nipple_*.json`
and merge with the other map results (a fail here drops the view's clay, depth and normal).

---

You are checking grey mannequin renders for modelled anatomical detail. Your batch file lists contact sheets (one
path per line). Open EVERY sheet with the Read tool, one by one, and look closely at the chest and crotch of every
figure in every panel (each panel is labelled with its view in red).

## Correct (never fail)
- Smooth breasts with a rounded shape and soft shading, with no point or bump at the tip.
- Joint seams, ball joints, neck rings and panel lines of a mannequin.
- A smooth crotch, as on a store mannequin.

## Fail a panel for ANY of these (when in doubt, FAIL)
- A nipple: a small raised bump, point, dot or darker spot at or near the tip of a breast, even a faint one; an
  areola ring. This is the main thing to look for: check each breast separately.
- Modelled genital detail of any kind.
- A face with eyes, or hair (a sculpted nose or chin profile alone is fine).

## Output
Write the JSON file named in your task as
`{"reviewed": ["<sheet file name>", ...], "fails": [{"set": "<set id>", "angle": "<view>", "kind": "line", "reason": "<short, specific>"}]}`.
Validate with python3 that it parses, that `reviewed` has one entry per batch line and every fail has all four keys.
Reply with one line: sheets reviewed, panels failed.
