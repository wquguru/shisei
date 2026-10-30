"""Shared definitions for the planned scene, prop and animal libraries (docs/scene, docs/prop, docs/animal).

Each library follows the costume method (docs/costume/PLAN.md): category rules in data/<lib>-src/_categories.json,
one <CAT>.json of forms × variants, expanded by series_cards.py into data/<lib>s.json and turned into paste-ready
Muse briefs by series_brief.py. What differs per library lives here: ID letter, views and prompt templates.
"""

LANGS = ("zh", "ja", "en", "ko")

# Backgrounds shared with the costume library: generation only asks for a flat colour, intake re-composites it.
BG = {"light": "uniform flat light grey background with no gradient, no vignette and no floor shadow",
      "dark": "uniform flat mid grey background with no gradient, no vignette and no floor shadow"}

# ---- scenes (E###): an empty location seen from the pose library's three camera heights ----------------------
# Poses are drawn front / diag / side at eye level, above at about 30° down and below at about 45° up
# (docs/GENERATION.md), so one scene needs only those three heights; the camera never turns away from the spot.
SCENE_VIEWS = ("eye", "above", "below")
SCENE_SPOT = ("a clear, unobstructed patch of ground in the centre of the frame about 4 metres from the camera, "
              "big enough for one standing adult, with nothing standing, lying or hanging there")
SCENE_VIEW_TEXT = {
    "eye": "eye-level view: the camera 1.6 metres above the ground, perfectly level, the horizon or the far "
           "wall's eye line exactly at the vertical centre of the image, vertical lines vertical",
    "above": "a high-angle view: the camera raised to 3.5 metres above the ground and tilted 30 degrees downward, "
             "still facing the same direction, the empty standing spot now at the centre of the image and more of "
             "the ground visible",
    "below": "a low-angle view: the camera 0.4 metres above the ground and tilted 35 degrees upward, still facing "
             "the same direction, the ground at the standing spot visible only along the bottom edge and the rest "
             "of the frame showing what rises behind it (walls and ceiling, or trees and sky)",
}
SCENE_FRONT = (
    "Photograph of {desc}. An empty location with nobody in it, {view}, 35 mm lens, deep focus so the whole scene "
    "is sharp, {spot}. {light}. Realistic materials and scale, natural colour, 3:4 vertical, location-scouting "
    "reference photo.\n{rules}\n"
    "No people, no figures, no silhouettes, no mannequins, no statues, no animals, no reflections of people, no "
    "readable text, no signs with lettering, no logos, no brand names, no licence plates, no real landmark, no "
    "watermark. {negatives}")
SCENE_TURN = (
    "Image 1 is the eye-level view of a location. Show exactly the same location, facing the same direction from "
    "the same spot, as {view}. Keep these identical: {keep}; same time of day, light, weather and season, same "
    "colours and materials. The empty standing spot stays empty. Add nothing image 1 does not support beyond what "
    "the new camera height reveals (more floor from above, more ceiling or sky from below). 35 mm lens, 3:4 "
    "vertical. No people, no figures, no animals, no readable text, no logos.")

# ---- props (T###): one object, product photograph, same four views as costumes -------------------------------
PROP_VIEWS = ("front", "back", "side", "diag")
PROP_VIEW_TEXT = {
    "back": "a straight back view showing the full back of the object",
    "side": "a true 90-degree side profile showing the object's left side, with its front pointing toward "
            "image-left, showing its depth and thickness",
    "diag": "a three-quarter view with the camera moved 45 degrees around toward the object's left side, so the "
            "front and the left side are both visible and the front turns slightly toward image-left",
}
PROP_REFS = {"back": "Image 1 is the front view.",
             "side": "Image 1 is the front view and image 2 is the back view.",
             "diag": "Image 1 is the front view and image 2 is the side view."}
# float: held or worn objects hang in mid-air in their natural orientation; stand: furniture and other things that
# rest on the ground stand upright on an invisible floor, so the bottom edge is level.
PROP_PLACE = {"float": "floating in mid-air in its natural upright orientation with nothing holding it",
              "stand": "resting in its natural position on an invisible level floor (upright, or lying flat where "
                       "stated), its feet or base on a flat line, with no visible floor"}
PROP_FILL = {"S": "about 50%", "M": "about 65%", "L": "about 80%"}
PROP_FRONT = (
    "Product photograph of {desc}, a single object {place}, straight front view, camera level with the middle of "
    "the object, centered, the object filling {fill} of the frame height, soft even studio lighting, {bg}, "
    "accurate material colour and texture, visible construction details such as joints, seams, hardware and "
    "edges, 3:4 vertical, catalogue style.\n{rules}\n"
    "No person, no hands, no mannequin, no display stand or hook (the object's own built-in stand or tripod stays), "
    "no objects other than those stated, no text, no logo, no brand mark, no watermark. {negatives}")
PROP_TURN = (
    "{refs} They are product photographs of one object. Show exactly the same object from {view}. Keep these "
    "identical: {keep}; same proportions, colours, materials and details. Add nothing the reference images do not "
    "support. {back_rule}Same background, lighting, scale and framing, 3:4 vertical. No person, no hands, no "
    "text, no logo.")
PROP_BACK_RULE = ("The back is the object's real back, not a mirror of the front: front-only details such as "
                  "screens, dials or decorations do not continue onto the back. ")

# ---- animals (A###): probe only until the style is decided (docs/animal/PLAN.md, D-14) -----------------------
# Same five camera positions as the pose library, so an animal reference can sit beside a pose reference.
ANIMAL_VIEWS = ("front", "diag", "side", "above", "below")
ANIMAL_VIEW_TEXT = {
    "front": "straight front view, the camera level with the animal's shoulder and facing its chest",
    "diag": "three-quarter view, the camera moved 45 degrees around toward the animal's left side, level with "
            "the shoulder",
    "side": "true side profile of the animal's left side, the head pointing toward image-left, camera level with "
            "the shoulder",
    "above": "high-angle view from about 30 degrees above, in front and slightly to the left, so the top of the "
             "head and the whole back are visible",
    "below": "low-angle view from about 45 degrees below, in front and slightly to the left, so the underside of "
             "the jaw, chest and belly are visible and the nearest paws look larger than the head",
}
# Style A follows the pose library: a featureless articulated mannequin in black construction lines, so one card
# serves every breed and coat. Style B is a photograph, only tried in the probe to decide D-14.
ANIMAL_LINE = (
    "Clean black-line construction drawing for a pose reference: a smooth featureless wooden artist's mannequin "
    "of an adult {species}, with the real anatomy and proportions of the animal, ball joints at the shoulders, "
    "elbows, wrists, hips, knees and hocks, a segmented neck and {tail}, no fur, no eyes, no mouth detail, no "
    "markings. Pose: {desc}. {view}. Whole body in frame with even margins, thin even black lines with light "
    "construction lines on pure white, no shading, no colour, no ground, no background, 3:4 vertical.\n{rules}\n"
    "No people, no hands, no other animals, no text, no watermark. {negatives}")
ANIMAL_PHOTO = (
    "Realistic photograph of an adult {species} with {coat}. Pose: {desc}. {view}. Whole body in frame with even "
    "margins, soft even studio lighting, uniform flat light grey background with no gradient, no floor shadow, "
    "3:4 vertical.\n{rules}\nNo people, no hands, no collar, no clothing, no props, no other animals, no text, no "
    "watermark. {negatives}")
ANIMAL_TURN = (
    "Image 1 is the front view of a pose reference. Draw exactly the same animal in exactly the same pose from "
    "{view}. Keep these identical: {keep}; the same style, line weight and proportions. The pose must not change, "
    "only the camera moves; do not mirror image 1. No people, no text.")

# ---- light presets (L###): one light setup on a fixed neutral subject, three eye-level camera positions ---------
# Light is an attribute, not an object: the subject never changes (the pose library's faceless mannequin and a grey
# sphere), so the only variable is the light. The light stays fixed in the world while the camera moves, which
# shows how it wraps the figure; each preset's `desc` is also the sentence scenes and the combinator reuse.
LIGHT_VIEWS = ("front", "diag", "side")
LIGHT_SUBJECT = ("a life-size matte light-grey faceless artist's mannequin with a smooth egg-shaped head, ball "
                 "joints and neutral adult proportions, standing upright facing the camera with arms relaxed at its "
                 "sides, and a matte mid-grey sphere 25 cm across on a slim grey pedestal at hip height, placed one "
                 "metre in front of it and one metre to its right (image-left), so the sphere stays visible from the "
                 "front, three-quarter and side views")
LIGHT_VIEW_TEXT = {
    "front": "straight front view, camera at chest height 4 metres away, 50 mm lens",
    "diag": "the camera moved 45 degrees around toward the mannequin's left side (it now stands three-quarter to "
            "the camera), same height and distance",
    "side": "the camera moved 90 degrees around to the mannequin's left side, showing it in profile facing "
            "image-left, same height and distance",
}
LIGHT_FRONT = (
    "Lighting reference photograph: {subject}, {setting}. Lighting: {desc}. {view}. Whole figure and sphere in "
    "frame, deep focus, true-to-life exposure with no added grading, 3:4 vertical. The light must read clearly on "
    "the mannequin and the sphere: which side is lit, where the highlight sits on the sphere, how soft the shadow "
    "edge is and which way the cast shadow falls.\n{rules}\n"
    "No people, no real face, no hair, no clothing, no text, no logo, no watermark. {negatives}")
LIGHT_TURN = (
    "Image 1 is a lighting reference photograph of a grey mannequin and a grey sphere. Show exactly the same moment "
    "from a new camera position: {view}. The lights, the mannequin, the sphere and the surroundings do not move; "
    "only the camera moves, so the lit side, highlight and cast shadow now appear where that light would fall from "
    "the new angle. Keep these identical: {keep}. Same exposure and colour, 3:4 vertical. No people, no text. "
    "Do not mirror image 1.")

LIBS = {
    "scene": {"letter": "E", "src": "data/scene-src", "out": "data/scenes.json", "views": SCENE_VIEWS,
              "label": "场景库", "plan": "docs/scene/PLAN.md"},
    "prop": {"letter": "T", "src": "data/prop-src", "out": "data/props.json", "views": PROP_VIEWS,
             "label": "道具库", "plan": "docs/prop/PLAN.md"},
    "light": {"letter": "L", "src": "data/light-src", "out": "data/lights.json", "views": LIGHT_VIEWS,
              "label": "光线库", "plan": "docs/light/PLAN.md"},
    "animal": {"letter": "A", "src": "data/animal-src", "out": "data/animals.json", "views": ANIMAL_VIEWS,
               "label": "动物库", "plan": "docs/animal/PLAN.md"},
}
