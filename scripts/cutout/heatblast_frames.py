# Heatblast frame by frame: every pose is one of the owner's drawings (see frames.py).
# Sheets: his model sheet (the three-quarter view, standing), his run cycle (8 frames, flat out) and his action
# poses (jump, fall, land, the fireball throw, charging up, the rocket jump, hurt, down on one knee). The game draws
# his fire (the fireball, the charge's swirl, the rocket's jet, the embers off his head), so the drawings have none.

ID = 'heatblast'
TEXEL = 5
# Sheet pixels per game px on the model sheet: flame tip to feet he stands about 40 game px (the flame over Ben).
SCALE = 15.0

SHEETS = {
    'model': ('docs/art-refs/heatblast-model-sheet.webp', 245),
    'run': ('docs/art-refs/heatblast-run-cycle.webp', 245),
    'action': ('docs/art-refs/heatblast-action-poses.webp', 245),
}
REF = ('model', 1)
# The flame (scale is set by hand below: his flame is drawn in a new shape in every pose).
HAIR = (255, 239, 57)
# The magma rock anchors x.
SHIRT = (126, 52, 45)
# Each sheet against the model sheet by the Omnitrix on his chest (18 px tall there, 12.5 on the run, 13.5 in the
# action poses) and the length of his limbs.
SHEET_SCALE = {'model': 1.0, 'run': 1.40, 'action': 1.33}

FRAMES = {
    'stand': ('model', 1),
    **{f'run{i}': ('run', i) for i in range(8)},
    'jump': ('action', 0), 'fall': ('action', 1), 'land': ('action', 2), 'shoot': ('action', 3),
    'charge': ('action', 4), 'rocket': ('action', 5), 'hurt': ('action', 6), 'defeat': ('action', 7),
}
# The run's two flights (game px over the floor), so his chest rides as high as on the strides.
LIFT = {'run3': 6.0, 'run7': 5.0}
SNAP = 0.0
