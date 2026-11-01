# Gwen frame by frame: every pose is one of her generated drawings (see frames.py).
# Sheets: her model sheet (the three-quarter view, for standing) and her run cycle (8 frames, the owner's second run sheet: the legs swap
# between frames 1 and 5 and 3 and 7, her body doesn't twist; 2 and 6, 4 and 8 share a leg, which reads fine with both legs alike).

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
# The run sheet draws her turned more to the side, so hair width misleads: scaled between her head's height
# (x1.38) and her height (x1.31 once a runner's crouch is allowed for), so neither jumps more than a few percent when she stops.
SHEET_SCALE = {'model': 1.0, 'run': 1.34}

FRAMES = {
    'stand': ('model', 1),
    'run0': ('run', 0), 'run1': ('run', 1), 'run2': ('run', 2), 'run3': ('run', 3),
    'run4': ('run', 4), 'run5': ('run', 5), 'run6': ('run', 6), 'run7': ('run', 7),
}
# Airborne run frames (game px over the floor). The sheet hops her 4.1 in the fourth drawing and 2.2 in the eighth:
# evened out so both strides float the same.
LIFT = {'run3': 2.6, 'run7': 2.6}

# Her model sheet's colours: frames from other sheets are pulled toward them.
PALETTE = [(237, 237, 238), (27, 66, 128), (249, 181, 132), (17, 12, 17), (209, 71, 11), (139, 170, 225), (183, 183, 191), (245, 119, 43), (106, 41, 15), (77, 126, 190)]
SNAP = 0.35
