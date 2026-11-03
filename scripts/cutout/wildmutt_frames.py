# Wildmutt frame by frame: every pose is one of the owner's drawings (see frames.py).
# Sheets: his model sheet (the side view, on all fours), his 8-drawing gallop, his action poses (jump, fall, land, the
# two rakes, rearing up for the double rake, the pounce, hurt) and a last sheet (climbing a wall twice, clinging, down
# on his side, the dog-paddle twice, paddling in place, thrashing, growling, sniffing, howling, bouncing).

ID = 'wildmutt'
TEXEL = 5
# Sheet pixels per game px on the model sheet: nose to tail about 42 game px, the spine's fur about 34 up.
SCALE = 10.5

SHEETS = {
    'model': ('docs/art-refs/wildmutt-model-sheet.webp', 245),
    'run': ('docs/art-refs/wildmutt-run-cycle.webp', 245),
    'action': ('docs/art-refs/wildmutt-action-poses.webp', 245),
    'more': ('docs/art-refs/wildmutt-more-poses.webp', 245),
}
MIN_AREA = {'run': 8000}
REF = ('model', 0)
# Scale is set by hand below, by the Omnitrix on his shoulder (30 px tall on the model sheet, 17 on the gallop, 23 in
# the action poses, 20-24 on the last sheet).
HAIR = (131, 196, 4)
# The orange hide anchors x.
SHIRT = (178, 80, 9)
SHEET_SCALE = {'model': 1.0, 'run': 1.76, 'action': 1.30, 'more': 1.40}

FRAMES = {
    'stand': ('model', 0),
    **{f'run{i}': ('run', i) for i in range(8)},
    'jump': ('action', 0), 'fall': ('action', 1), 'land': ('action', 2), 'clawA': ('action', 3),
    'clawB': ('action', 4), 'clawC': ('action', 5), 'pounce': ('action', 6), 'hurt': ('action', 7),
    'climb0': ('more', 0), 'climb1': ('more', 1), 'cling': ('more', 2), 'defeat': ('more', 3),
    'swim0': ('more', 4), 'swim1': ('more', 5), 'tread': ('more', 6), 'drown': ('more', 7),
    'talk': ('more', 8), 'sniff': ('more', 9), 'howl': ('more', 10), 'cheer': ('more', 11),
}
# Side-on in the water: the dog-paddle hangs from the middle of the body (the clip places it).
CENTRED = {'swim0', 'swim1'}
LIFT = {}
SNAP = 0.0
