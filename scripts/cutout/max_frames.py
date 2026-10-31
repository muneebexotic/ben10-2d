# Grandpa Max frame by frame: every pose is one of his generated drawings (see frames.py).
# Sheets: his model sheet (the three-quarter view, for standing; the side view)
# and his walk cycle (8 frames).

ID = 'max'
TEXEL = 5
# Sheet pixels per game px on the model sheet (as his cut-out: the tallest of the family).
SCALE = 17.7

SHEETS = {
    'model': ('docs/art-refs/max-model-sheet.webp', 235),
    'walk': ('docs/art-refs/max-walk-cycle.webp', 235),
}
REF = ('model', 1)
HAIR = (146, 138, 134)
SHIRT = (189, 49, 43)
SKIN = (250, 173, 121)
# The walk sheet draws him stockier than the model sheet (a head 13% bigger for his body), and his
# grey hair matches the gun on his belt: scaled between his head (x1.32) and his height (x1.49), so
# neither jumps more than 6% when he stops walking.
SHEET_SCALE = {'model': 1.0, 'walk': 1.40}

FRAMES = {
    'stand': ('model', 1), 'side': ('model', 2),
    'walk0': ('walk', 0), 'walk1': ('walk', 1), 'walk2': ('walk', 2), 'walk3': ('walk', 3),
    'walk4': ('walk', 4), 'walk5': ('walk', 5), 'walk6': ('walk', 6), 'walk7': ('walk', 7),
}
LIFT = {}

PALETTE = [(157, 134, 92), (250, 173, 121), (189, 49, 43), (116, 105, 66), (32, 20, 17), (87, 49, 31), (247, 209, 194), (45, 41, 37), (152, 50, 38), (218, 133, 81), (146, 138, 134)]
SNAP = 0.35
