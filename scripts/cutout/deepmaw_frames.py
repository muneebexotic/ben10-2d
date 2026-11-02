# DEEPMAW frame by frame: every pose is one of the owner's drawings (see frames.py).
# Sheets: his model sheet (the three-quarter view; grin, laugh and glare), his swim cycle (8, side on),
# his poses in the water (hang, bait, the flare, the lunge, the flash, stunned, flinch, roar) and on the
# drained pool floor (gasp, flop, rearing for the slam, the slam, the roll, the leap, the maelstrom gulp, beaten).

ID = 'deepmaw'
# He's drawn 1.5 times his rig's size in the game: 4 texels a rig px is about 1:1 with the swim sheet.
TEXEL = 4
# Sheet pixels per rig px on the model sheet: lure to feet he's about 70 rig px, as his painted rig.
SCALE = 6.5

SHEETS = {
    'model': ('docs/art-refs/deepmaw-model-sheet.webp', 248),
    # (Its compression noise bridges two of the fish at 248.)
    'swim': ('docs/art-refs/deepmaw-swim-cycle.webp', 240),
    'water': ('docs/art-refs/deepmaw-water-poses.webp', 248),
    'dry': ('docs/art-refs/deepmaw-dry-poses.webp', 248),
}
# The swim sheet's drawings nearly touch.
GAP = {'swim': 3}
REF = ('model', 1)
HAIR = (54, 54, 30)
# His pale belly: every drawing hangs from its middle (the fight places him by the middle of his body).
SHIRT = (186, 174, 138)
# Scaled to the middle of his eye's size and his belly's: swim x1.62 / x1.87, water x1.55 / x1.79, dry x1.62 / x1.28
# (stranded, he's drawn fatter).
SHEET_SCALE = {'model': 1.0, 'swim': 1.74, 'water': 1.67, 'dry': 1.44}

FRAMES = {
    'stand': ('model', 1), 'grin': ('model', 4), 'laugh': ('model', 6), 'glare': ('model', 7),
    'swim0': ('swim', 0), 'swim1': ('swim', 1), 'swim2': ('swim', 2), 'swim3': ('swim', 3),
    'swim4': ('swim', 4), 'swim5': ('swim', 5), 'swim6': ('swim', 6), 'swim7': ('swim', 7),
    'hang': ('water', 0), 'bait': ('water', 1), 'flare': ('water', 2), 'lunge': ('water', 3),
    'flash': ('water', 4), 'stunned': ('water', 5), 'flinch': ('water', 6), 'roar': ('water', 7),
    'gasp': ('dry', 0), 'flop': ('dry', 1), 'rear': ('dry', 2), 'slam': ('dry', 3),
    'roll': ('dry', 4), 'leap': ('dry', 5), 'swallow': ('dry', 6), 'beaten': ('dry', 7),
}
CENTRED = set(FRAMES)
LIFT = {}
# The lure's bulb (the fight's weak point follows it) and his eye (the portrait centres on it).
MARKERS = {'bulb': (74, 241, 224), 'eye': (246, 224, 67)}

PALETTE = [(186, 174, 138), (102, 18, 18), (54, 54, 30), (18, 18, 18), (138, 126, 102), (102, 102, 54), (74, 241, 224), (246, 224, 67)]
SNAP = 0.25
