# The jelly mine, frame by frame from the owner's pulse sheet (see frames.py): its bell squeezing tall and opening
# wide again as it drifts.

ID = 'jelly'
TEXEL = 5
# Sheet pixels per game px: the relaxed bell about 20 game px across, as the painted mine.
SCALE = 15.0

SHEETS = {
    'pulse': ('docs/art-refs/jelly-pulse-cycle.webp', 245),
}
REF = ('pulse', 0)
# The glowing core: the same size in every drawing (it sets the scale), and every drawing hangs from it (the mine's
# sprite has its origin in the middle of the bell).
HAIR = (254, 252, 152)
SHIRT = (254, 252, 152)
SHEET_SCALE = {'pulse': 1.0}

FRAMES = {f'pulse{i}': ('pulse', i) for i in range(8)}
CENTRED = set(FRAMES)
LIFT = {}
SNAP = 0.0
