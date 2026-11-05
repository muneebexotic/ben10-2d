# Diamondhead frame by frame: every pose is one of the owner's drawings (see frames.py).
# Sheets: his model sheet (the three-quarter view, standing), his run cycle (8 frames; of the owner's two copies, the
# second, his pick), his action poses (stance, jump, fall, landing, both shard shots, growing crystal, ground spikes,
# the shield level, up and down, hurt) and a last sheet (down, wading along the sea floor twice, standing on the
# bottom, thrashing, talking, pointing, cheering, surprise, thinking). The game draws his shards and ground spikes;
# his shield is in his drawings.

ID = 'diamondhead'
TEXEL = 5
# Sheet pixels per game px on the model sheet: gem tip to feet he stands about 40 game px (a head over Ben).
SCALE = 15.6

SHEETS = {
    'model': ('docs/art-refs/diamondhead-model-sheet.webp', 245),
    'run': ('docs/art-refs/diamondhead-run-cycle.webp', 245),
    'action': ('docs/art-refs/diamondhead-action-poses.webp', 245),
    'more': ('docs/art-refs/diamondhead-more-poses.webp', 245),
}
# The chips knocked off his shoulder when he's hurt sit a little apart from him.
GAP = {'action': 20}
REF = ('model', 1)
# Scale is set by hand below: his head is crystal like his arms, so nothing measures it alone.
HAIR = (206, 206, 208)
# The grey panels down the sides of his suit anchor x.
SHIRT = (206, 206, 208)
# Each sheet against the model sheet by his height standing (talking, pointing, thinking) and the size of his head.
SHEET_SCALE = {'model': 1.0, 'run': 1.63, 'action': 1.75, 'more': 1.60}

FRAMES = {
    'stand': ('model', 1),
    **{f'run{i}': ('run', i) for i in range(8)},
    'stance': ('action', 0), 'jump': ('action', 1), 'fall': ('action', 2), 'land': ('action', 3),
    'shoot': ('action', 4), 'shootUp': ('action', 5), 'grow': ('action', 6), 'spikes': ('action', 7),
    'shield': ('action', 8), 'shieldUp': ('action', 9), 'shieldDown': ('action', 10), 'hurt': ('action', 11),
    'defeat': ('more', 0), 'wade0': ('more', 1), 'wade1': ('more', 2), 'tread': ('more', 3), 'drown': ('more', 4),
    'talk': ('more', 5), 'point': ('more', 6), 'cheer': ('more', 7), 'surprise': ('more', 8), 'think': ('more', 9),
}
CENTRED = set()
LIFT = {}
SNAP = 0.0
