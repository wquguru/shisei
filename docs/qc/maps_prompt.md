# Clay / depth / normal map QC review prompt (for Sonnet sub-agents)

The maps (`images/{clay,depth,normal}/`) are made from each passed line view: a grey clay mannequin redrawn over the
line art (Qwen-Image-Edit), then a depth map and a normal map estimated from the clay (docs/GENERATION.md). They must
show the same pose as the line art and sit on it: the lightbox overlays them on the line art. Sheets:
`tools/review_sheets.py --mode maps maps=SRC`: two views per sheet, one row each with five panels (line, clay, the
line art drawn in red over the clay, depth, normal). `tools/map_align.py` fails clearly misaligned views on its own;
this review catches the rest. One verdict per view covers all three maps.

---

You are QA-reviewing grey mannequin renders and the depth and normal maps made from them. Your batch file lists
contact sheets (one path per line). Open EVERY sheet with the Read tool, one by one. Each sheet has one or two rows;
each row is one camera view of one pose: `line` (the reference drawing), `clay` (the render under review),
`line over clay` (the drawing in red on top of the render), `depth` (white = near) and `normal` (purple/blue/pink).

## Correct (never fail)
- A smooth grey faceless mannequin (blank egg head, no hair), plain grey studio background, a soft floor shadow.
- The red lines in `line over clay` lie on the mannequin's outline and limbs. A small offset (a finger width) or a
  slightly different body shape is fine. Joint-ball circles and construction lines in the drawing are not defects.
- Upper-body poses: the render may show more of the body than the drawing, as long as the drawn part lines up.
- In depth and normal, a floor gradient at the bottom or a flat background colour is expected.

## Fail a row for ANY of these (when in doubt, FAIL)
Structure (`"kind": "structure"`):
- Misaligned: in `line over clay`, a red head, torso, arm or leg lies clearly off the mannequin (shifted, different
  size, limb in another place), or the drawing and the render show a different pose, camera angle or framing.
- Malformed anatomy in the clay: extra, missing or merged limbs, hands or heads; joints bent the wrong way; limbs
  that fade out; the wrong number of figures (two for duo sets, otherwise one).
- A lying, sitting or kneeling figure that floats above the floor or is tilted off it, when the drawing shows it on
  the floor.
- Looks like a child (head large for the body, short limbs, small frame) next to an adult drawing.
- Depth or normal broken: blank, noisy, a silhouette that does not match the clay, a missing body part.
Line (`"kind": "line"`; here it means a rendering or content problem):
- A face, eyes, mouth, hair or ears drawn on the head; a realistic human face or skin.
- Clothing, props, furniture, text or a patterned background added; coloured (non-grey) patches on the body.
- Nipples, areolae or genital detail modelled on the body.

## Output
Write the JSON file named in your task as
`{"reviewed": ["<sheet file name>", ...], "fails": [{"set": "<set id>", "angle": "<view>", "kind": "line|structure", "reason": "<short, specific>"}]}`.
The view is the word before ` · ` in the row labels. Validate with python3 that it parses, that `reviewed` has one
entry per batch line and every fail has all four keys. Reply with one line: sheets reviewed, rows failed (line /
structure counts).
