# Grey Matter frame by frame: every pose is one of the owner's drawings (see frames.py).
# Sheets: his model sheet (the three-quarter view, standing), his run cycle (8 frames, a scurry; of the owner's two
# near-identical copies, the first), his action poses (the know-it-all stance, hop, fall, landing, the nip and the
# lunging chomp, analysing, hurt, down, cheering, the shrug, thinking) and a last sheet (the breaststroke twice,
# treading water, out of air, lecturing, pointing, surprise).

ID = 'greymatter'
TEXEL = 5
# Sheet pixels per game px on the model sheet: head to feet he stands about 18.5 game px (knee-high to Ben).
SCALE = 30.5

SHEETS = {
    'model': ('docs/art-refs/greymatter-model-sheet.webp', 245),
    'run': ('docs/art-refs/greymatter-run-cycle.webp', 245),
    'action': ('docs/art-refs/greymatter-action-poses.webp', 245),
    'more': ('docs/art-refs/greymatter-more-poses.webp', 245),
}
REF = ('model', 1)
# His eyes change shape with every expression, so they don't measure the sheets: the scale is set by hand below.
HAIR = (162, 215, 29)
# His black suit anchors x (his head is grey like his arms and legs).
SHIRT = (15, 15, 15)
# Each sheet against the model sheet by the width of his head (side-on for the run) and his height standing.
SHEET_SCALE = {'model': 1.0, 'run': 1.34, 'action': 1.92, 'more': 1.33}

FRAMES = {
    'stand': ('model', 1),
    **{f'run{i}': ('run', i) for i in range(8)},
    'stance': ('action', 0), 'jump': ('action', 1), 'fall': ('action', 2), 'land': ('action', 3),
    'biteA': ('action', 4), 'biteB': ('action', 5), 'scan': ('action', 6), 'hurt': ('action', 7),
    'defeat': ('action', 8), 'cheer': ('action', 9), 'shrug': ('action', 10), 'think': ('action', 11),
    'swim0': ('more', 0), 'swim1': ('more', 1), 'tread': ('more', 2), 'drown': ('more', 3),
    'talk': ('more', 4), 'point': ('more', 5), 'surprise': ('more', 6),
}
# Side-on in the water: the swim hangs from the middle of the body (the clip places it).
CENTRED = {'swim0', 'swim1'}
LIFT = {}
SNAP = 0.0
