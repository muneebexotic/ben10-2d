# Kevin frame by frame: every pose is one of his generated drawings (see frames.py).
# Sheets: his model sheet (the three-quarter view and the absorbing pose with
# purple hands) and his run cycle (8 frames, the owner's second run sheet: drawn nearer his model sheet's
# proportions; frames 5-8 repeat 1-4's stride, which reads as the other leg with both legs alike).

ID = 'kevin'
TEXEL = 5
# Sheet pixels per game px on the model sheet (as his cut-out: taller than Ben, shorter than Max).
SCALE = 17.0

SHEETS = {
    'model': ('docs/art-refs/kevin-model-sheet.webp', 235),
    'run': ('docs/art-refs/kevin-run-cycle.webp', 235),
    'action': ('docs/art-refs/kevin-action-poses.webp', 235),
}
REF = ('model', 1)
# His hair and shirt are both black: the shirt is looked for only between his chin and his waist,
# and the run sheet (a head 15% bigger for his body than the model sheet's) is scaled between his head's
# height (x1.40) and his height (x1.38 once a runner's crouch is allowed for).
HAIR = (16, 15, 17)
SHIRT = (16, 15, 17)
SHIRT_BAND = 1.3
SKIN = (249, 181, 139)
# The action sheet draws him bigger, his head 16% bigger for his body: scaled between his head (x1.08) and height (x1.26).
SHEET_SCALE = {'model': 1.0, 'run': 1.39, 'action': 1.17}

FRAMES = {
    'stand': ('model', 1),
    'smirk': ('action', 0), 'absorb': ('action', 1), 'windup': ('action', 2), 'throw': ('action', 3),
    'lunge': ('action', 4), 'laugh': ('action', 5), 'hurt': ('action', 6), 'jump': ('action', 7),
    'run0': ('run', 0), 'run1': ('run', 1), 'run2': ('run', 2), 'run3': ('run', 3),
    'run4': ('run', 4), 'run5': ('run', 5), 'run6': ('run', 6), 'run7': ('run', 7),
}
# Airborne run frames (game px over the floor): the sheet floats him 3.6 and 3.4, evened out a touch lower.
LIFT = {'run3': 3.0, 'run7': 3.0}

PALETTE = [(16, 15, 17), (29, 44, 64), (5, 5, 6), (18, 29, 46), (249, 181, 139), (152, 148, 150), (197, 192, 192), (204, 130, 94)]
SNAP = 0.35
