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
    'action': ('docs/art-refs/gwen-action-poses.webp', 247),
    'story': ('docs/art-refs/gwen-story-poses.webp', 247),
    # The water and last poses (of the owner's two copies, the first: its two rows are drawn at one size).
    'last': ('docs/art-refs/gwen-last-poses.webp', 247),
}
REF = ('model', 1)
HAIR = (209, 71, 11)
SHIRT = (139, 170, 225)
SKIN = (249, 181, 132)
# The run sheet draws her turned more to the side, so hair width misleads: scaled between her head's height
# (x1.38) and her height (x1.31 once a runner's crouch is allowed for), so neither jumps more than a few percent when she stops.
# The pose sheets draw her head about 13% bigger for her body than the model sheet: scaled to the middle of her head's
# height (action x1.14, story x1.20) and her height (x1.27, x1.30), so neither jumps more than about 6% when she changes pose.
# The last sheet: between her head's size and her height standing (x2.3, x2.16) against the story sheet's talk.
SHEET_SCALE = {'model': 1.0, 'run': 1.34, 'action': 1.20, 'story': 1.25, 'last': 2.15}

FRAMES = {
    'stand': ('model', 1),
    'run0': ('run', 0), 'run1': ('run', 1), 'run2': ('run', 2), 'run3': ('run', 3),
    'run4': ('run', 4), 'run5': ('run', 5), 'run6': ('run', 6), 'run7': ('run', 7),
    # Action poses (the sheet's standing drawing and its talk are left out: the model sheet's stand and the story sheet's talk are used).
    'jump': ('action', 1), 'fall': ('action', 2), 'land': ('action', 3), 'hurt': ('action', 4), 'cast': ('action', 5), 'folded': ('action', 6),
    'talk': ('story', 0), 'point': ('story', 1), 'shrug': ('story', 2), 'surprise': ('story', 3),
    'cheer': ('story', 4), 'think': ('story', 5), 'wave': ('story', 6), 'worried': ('story', 7),
    **{f'swim{i}': ('last', i) for i in range(6)},
    'tread': ('last', 6), 'drown': ('last', 7), 'hands': ('last', 8), 'defeat': ('last', 9), 'angry': ('last', 10),
}
# Airborne run frames (game px over the floor). The sheet hops her 4.1 in the fourth drawing and 2.2 in the eighth:
# evened out so both strides float the same.
LIFT = {'run3': 2.6, 'run7': 2.6}
# Side-on in the water: the swim hangs from the middle of her body (the clip places it).
CENTRED = {'swim0', 'swim1', 'swim2', 'swim3', 'swim4', 'swim5'}
# The last sheet draws her small.
MIN_AREA = {'last': 8000}

# Her model sheet's colours: frames from other sheets are pulled toward them.
PALETTE = [(237, 237, 238), (27, 66, 128), (249, 181, 132), (17, 12, 17), (209, 71, 11), (139, 170, 225), (183, 183, 191), (245, 119, 43), (106, 41, 15), (77, 126, 190)]
SNAP = 0.35
