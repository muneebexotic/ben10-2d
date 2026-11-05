# Ghostfreak frame by frame: every pose is one of the owner's drawings (see frames.py).
# Sheets: his model sheet, his two floating cycles (hovering in place, drifting fast; 4 frames each), his action poses
# (rising, drifting down, settling, hurt, both tentacle lashes, phasing, the scream, down, talking, pointing,
# cheering; of the owner's two copies, the larger) and a last sheet (surprise, thinking, thrashing). His chest
# tentacles are in his drawings.

ID = 'ghostfreak'
TEXEL = 5
# Sheet pixels per game px on the model sheet: hood to tail tip he floats about 36 game px tall.
SCALE = 17.0

SHEETS = {
    'model': ('docs/art-refs/ghostfreak-model-sheet.webp', 245),
    'cycles': ('docs/art-refs/ghostfreak-float-cycles.webp', 245),
    'action': ('docs/art-refs/ghostfreak-action-poses.webp', 245),
    'more': ('docs/art-refs/ghostfreak-more-poses.webp', 245),
}
# Some of his action poses are small (hurt, phasing).
MIN_AREA = {'action': 8000}
REF = ('model', 1)
# Nothing on him measures his head alone (scale is set by hand below): a colour he hasn't got.
HAIR = (255, 0, 255)
# The Omnitrix on his chest anchors x (and the middle of the drifting drawings).
SHIRT = (136, 198, 21)
# Each sheet against the model sheet by the Omnitrix's height on his chest and the size of his hood.
SHEET_SCALE = {'model': 1.0, 'cycles': 1.05, 'action': 1.68, 'more': 0.78}

FRAMES = {
    **{f'hover{i}': ('cycles', i) for i in range(4)},
    **{f'drift{i}': ('cycles', 4 + i) for i in range(4)},
    'jump': ('action', 0), 'fall': ('action', 1), 'land': ('action', 2), 'hurt': ('action', 3),
    'lash': ('action', 4), 'lashLong': ('action', 5), 'phase': ('action', 6), 'scream': ('action', 7),
    'defeat': ('action', 8), 'talk': ('action', 9), 'point': ('action', 10), 'cheer': ('action', 11),
    'surprise': ('more', 0), 'think': ('more', 1), 'drown': ('more', 2),
}
# Drifting, his tail streams out behind: those drawings hang from the Omnitrix (the clip holds it at his hovering
# height). The rest hang from the tip of his tail, which floats just off the floor.
CENTRED = {'drift0', 'drift1', 'drift2', 'drift3'}
LIFT = {}
SNAP = 0.0
