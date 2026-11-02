# The gnasher swarm, frame by frame from the owner's sheet of one gnasher (see frames.py): a 4-drawing swim, the
# dart (jaws wide), the bite, and flopping both ways. The game makes the school from seven of them.

ID = 'gnasher'
TEXEL = 5
# Sheet pixels per game px: each fish about 10 game px long, as the painted school's.
SCALE = 32.0

SHEETS = {
    'model': ('docs/art-refs/gnasher-model-sheet.webp', 245),
}
REF = ('model', 0)
# The orange body sets the scale; every drawing hangs from its middle (each fish is placed by its middle).
HAIR = (212, 89, 17)
SHIRT = (212, 89, 17)
SHEET_SCALE = {'model': 1.0}

FRAMES = {
    **{f'swim{i}': ('model', i) for i in range(4)},
    'dart': ('model', 4),
    'bite': ('model', 5),
    'flopUp': ('model', 6),
    'flopDown': ('model', 7),
}
CENTRED = set(FRAMES)
LIFT = {}
SNAP = 0.0
