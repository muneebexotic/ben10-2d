# Kevin frame by frame: every pose is one of his generated drawings (see frames.py).
# Sheets: his model sheet (the three-quarter view and the absorbing pose with
# purple hands) and his run cycle (8 frames).

ID = 'kevin'
TEXEL = 5
# Sheet pixels per game px on the model sheet (as his cut-out: taller than Ben, shorter than Max).
SCALE = 17.0

SHEETS = {
    'model': ('docs/art-refs/kevin-model-sheet.webp', 235),
    'run': ('docs/art-refs/kevin-run-cycle.webp', 235),
}
REF = ('model', 1)
# His hair and shirt are both black: the shirt is looked for only between his chin and his waist,
# and the run sheet (drawn stockier, a head 20% bigger for his body) is scaled between his head's
# height (x1.61) and his height (x1.72 once a runner's crouch is allowed for).
HAIR = (16, 15, 17)
SHIRT = (16, 15, 17)
SHIRT_BAND = 1.3
SKIN = (249, 181, 139)
SHEET_SCALE = {'model': 1.0, 'run': 1.66}

FRAMES = {
    'stand': ('model', 1), 'absorb': ('model', 4),
    'run0': ('run', 0), 'run1': ('run', 1), 'run2': ('run', 2), 'run3': ('run', 3),
    'run4': ('run', 4), 'run5': ('run', 5), 'run6': ('run', 6), 'run7': ('run', 7),
}
# Airborne run frames, by how far their lowest foot sits over the sheet's ground line (game px).
LIFT = {'run3': 2.64, 'run7': 2.25}

PALETTE = [(16, 15, 17), (29, 44, 64), (5, 5, 6), (18, 29, 46), (249, 181, 139), (152, 148, 150), (197, 192, 192), (204, 130, 94)]
SNAP = 0.35
