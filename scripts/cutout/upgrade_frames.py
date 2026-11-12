# Upgrade frame by frame: every pose is one of the owner's drawings (see frames.py).
# Sheets: his model sheet (the three-quarter view, standing), his run cycle (8 frames), his action poses (ready
# stance, jump, fall, landing, the eye beam ahead, up and down, hurt) and a last sheet (melting, the puddle, down,
# dazed, the swim twice, thrashing, treading water, talking, pointing, cheering, surprise). The game draws his beam.

ID = 'upgrade'
TEXEL = 5
# Sheet pixels per game px on the model sheet: dome to feet he stands about 43 game px, tall and slim over Ben (his
# ready stance about 34: at Ben's height his bent-kneed stance stood shorter than Ben).
SCALE = 14.1

SHEETS = {
    'model': ('docs/art-refs/upgrade-model-sheet.webp', 245),
    'run': ('docs/art-refs/upgrade-run-cycle.webp', 245),
    'action': ('docs/art-refs/upgrade-action-poses.webp', 245),
    'more': ('docs/art-refs/upgrade-more-poses.webp', 245),
}
REF = ('model', 1)
# Scale is set by hand below: his head is black like his body, so nothing measures it alone.
HAIR = (128, 220, 20)
# His green circuits run all over him: their middle anchors x.
SHIRT = (128, 220, 20)
# Each sheet against the model sheet by the width of his dome and his height standing (talking, pointing).
SHEET_SCALE = {'model': 1.0, 'run': 1.18, 'action': 1.30, 'more': 1.68}

FRAMES = {
    'stand': ('model', 1),
    **{f'run{i}': ('run', i) for i in range(8)},
    'stance': ('action', 0), 'jump': ('action', 1), 'fall': ('action', 2), 'land': ('action', 3),
    'laser': ('action', 4), 'laserUp': ('action', 5), 'laserDown': ('action', 6), 'hurt': ('action', 7),
    'melt': ('more', 0), 'puddle': ('more', 1), 'defeat': ('more', 2), 'dazed': ('more', 3),
    'swim0': ('more', 4), 'swim1': ('more', 5), 'drown': ('more', 6), 'tread': ('more', 7),
    'talk': ('more', 8), 'point': ('more', 9), 'cheer': ('more', 10), 'surprise': ('more', 11),
}
# Side-on in the water: the swim hangs from the middle of the body (the clip places it).
CENTRED = {'swim0', 'swim1'}
LIFT = {}
SNAP = 0.0
