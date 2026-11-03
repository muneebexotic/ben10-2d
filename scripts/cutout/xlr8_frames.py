# XLR8 frame by frame: every pose is one of the owner's drawings (see frames.py).
# Sheets: his model sheet (the three-quarter view, standing), his run cycle (8 frames, flat out), his action poses
# (ready stance, jump, fall, the skid, both claw slashes, the high kick, the dash) and a last sheet (hurt, down, the
# torpedo swim twice, thrashing, running on water, talking, pointing, cheering, surprise; of the owner's two copies,
# the first, whose second swim drawing kicks the other way). The game draws his speed streaks.

ID = 'xlr8'
TEXEL = 5
# Sheet pixels per game px on the model sheet: helmet to feet he stands about 32 game px (about Ben's height).
SCALE = 19.0

SHEETS = {
    'model': ('docs/art-refs/xlr8-model-sheet.webp', 245),
    'run': ('docs/art-refs/xlr8-run-cycle.webp', 245),
    'action': ('docs/art-refs/xlr8-action-poses.webp', 245),
    'more': ('docs/art-refs/xlr8-more-poses.webp', 245),
}
# The run sheet's drawings are small and their tails nearly touch the next one.
MIN_AREA = {'run': 8000}
REF = ('model', 1)
# Scale is set by hand below: his helmet is black like his body, so nothing measures his head alone.
HAIR = (66, 169, 195)
# The blue anchors x.
SHIRT = (66, 169, 195)
# Each sheet against the model sheet by the width of his helmet and his height standing (talking, pointing).
SHEET_SCALE = {'model': 1.0, 'run': 2.15, 'action': 1.42, 'more': 1.62}

FRAMES = {
    'stand': ('model', 1),
    **{f'run{i}': ('run', i) for i in range(8)},
    'stance': ('action', 0), 'jump': ('action', 1), 'fall': ('action', 2), 'land': ('action', 3),
    'strikeA': ('action', 4), 'strikeB': ('action', 5), 'kick': ('action', 6), 'dash': ('action', 7),
    'hurt': ('more', 0), 'defeat': ('more', 1), 'swim0': ('more', 2), 'swim1': ('more', 3), 'drown': ('more', 4),
    'tread': ('more', 5), 'talk': ('more', 6), 'point': ('more', 7), 'cheer': ('more', 8), 'surprise': ('more', 9),
}
# Side-on in the water: the swim hangs from the middle of the body (the clip places it).
CENTRED = {'swim0', 'swim1'}
LIFT = {}
SNAP = 0.0
