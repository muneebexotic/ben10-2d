# Ben frame by frame: every pose is one of his generated drawings (see frames.py).
# Sheets: his model sheet (the three-quarter view, for scale and standing), the
# idle/run sheet (idle), the action sheet (jump, fall, land, punch, hurt, swim,
# the slam), the run cycle sheet (8 frames).

ID = 'ben'
TEXEL = 5
# Sheet pixels per game pixel on the model sheet (he stands about 34 game px tall).
SCALE = 18.5

SHEETS = {
    'model': ('docs/art-refs/ben-model-sheet.webp', 235),
    'idle': ('docs/art-refs/ben-idle-run.webp', 235),
    'act': ('docs/art-refs/ben-action-poses.webp', 235),
    'run': ('docs/art-refs/ben-run-cycle.webp', 235),
}
# The model sheet's three-quarter view sets the scale for every sheet.
REF = ('model', 1)
HAIR = (90, 47, 18)
SHIRT = (222, 218, 216)

FRAMES = {
    'stand': ('model', 1),
    'idle0': ('idle', 0), 'idle1': ('idle', 1), 'idle2': ('idle', 2), 'idle3': ('idle', 3),
    'run0': ('run', 0), 'run1': ('run', 1), 'run2': ('run', 2), 'run3': ('run', 3),
    'run4': ('run', 4), 'run5': ('run', 5), 'run6': ('run', 6), 'run7': ('run', 7),
    'dash': ('act', 0), 'jump': ('act', 1), 'fall': ('act', 2), 'land': ('act', 3),
    'punch': ('act', 4), 'hurt': ('act', 5), 'swim': ('act', 6), 'slam': ('act', 7),
}
# The airborne run frames float this far (game px) over the floor.
LIFT = {'run3': 1.4, 'run7': 1.4}

# His model sheet's colours: frames from other sheets are pulled toward them.
PALETTE = [(251, 181, 131), (90, 47, 18), (140, 90, 50), (222, 218, 216), (20, 18, 16), (84, 87, 37), (61, 66, 30), (243, 242, 241), (92, 196, 58)]
SNAP = 0.35
