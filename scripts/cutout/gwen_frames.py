# Gwen frame by frame: every pose is one of her generated drawings (see frames.py).
# Sheets: her model sheet (the three-quarter view, for standing) and her run cycle (8 frames; the fifth to eighth repeat the first four, so
# the legs never swap: with both legs alike it plays as a four-drawing stride).

ID = 'gwen'
TEXEL = 5
# Sheet pixels per game px on the model sheet: she stands as tall as Ben's idle drawing (32.4 px), as the cousins do in the show.
SCALE = 19.15

SHEETS = {
    # Her capris and sneakers are nearly white: only the page's own white is background.
    'model': ('docs/art-refs/gwen-model-sheet.webp', 247),
    'run': ('docs/art-refs/gwen-run-cycle.webp', 247),
}
REF = ('model', 1)
HAIR = (209, 71, 11)
SHIRT = (139, 170, 225)
SKIN = (249, 181, 132)
# The run sheet draws her stockier than the model sheet (a head 23% bigger for her body) and turned
# more to the side, so hair width misleads: scaled between her head's height (x1.30) and her height
# (x1.37 once a runner's crouch is allowed for), so neither jumps more than a few percent when she stops.
SHEET_SCALE = {'model': 1.0, 'run': 1.33}

FRAMES = {
    'stand': ('model', 1),
    'run0': ('run', 0), 'run1': ('run', 1), 'run2': ('run', 2), 'run3': ('run', 3),
    'run4': ('run', 4), 'run5': ('run', 5), 'run6': ('run', 6), 'run7': ('run', 7),
}
# Airborne run frames, by how far their lowest foot sits over the sheet's ground line (game px).
LIFT = {'run3': 1.70, 'run7': 1.28}

# Her model sheet's colours: frames from other sheets are pulled toward them.
PALETTE = [(237, 237, 238), (27, 66, 128), (249, 181, 132), (17, 12, 17), (209, 71, 11), (139, 170, 225), (183, 183, 191), (245, 119, 43), (106, 41, 15), (77, 126, 190)]
SNAP = 0.35
