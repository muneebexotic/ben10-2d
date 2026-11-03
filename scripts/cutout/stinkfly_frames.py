# Stinkfly frame by frame: every pose is one of the owner's drawings (see frames.py).
# Sheets: his model sheet (the three-quarter view, standing), his 4-drawing wingbeat and 4-drawing scuttle, his action
# poses (the buzzing hop, fall, touchdown, glide, spit, venting stink, hurt, on his back) and a last sheet (the swim
# twice, thrashing, floating, talking, a happy buzz; of the owner's two copies, the second, whose talking pose has all
# six legs). The game draws his slime and stink.

ID = 'stinkfly'
TEXEL = 5
# Sheet pixels per game px on the model sheet: eyestalks to feet he stands about 36 game px.
SCALE = 12.2

SHEETS = {
    'model': ('docs/art-refs/stinkfly-model-sheet.webp', 245),
    'cycles': ('docs/art-refs/stinkfly-fly-scuttle.webp', 245),
    'action': ('docs/art-refs/stinkfly-action-poses.webp', 245),
    'more': ('docs/art-refs/stinkfly-more-poses.webp', 245),
}
REF = ('model', 1)
# Scale is set by hand below, by the size of his eyes (16 px on the model sheet, 14.5 in the action poses, 17 on the last
# sheet; the cycles' side-on eyes read small, so they go by his head).
HAIR = (233, 243, 149)
# The green legs and stalks anchor x.
SHIRT = (110, 140, 40)
SHEET_SCALE = {'model': 1.0, 'cycles': 1.35, 'action': 1.12, 'more': 0.97}

FRAMES = {
    'stand': ('model', 1),
    **{f'fly{i}': ('cycles', i) for i in range(4)},
    **{f'scuttle{i}': ('cycles', 4 + i) for i in range(4)},
    'jump': ('action', 0), 'fall': ('action', 1), 'land': ('action', 2), 'glide': ('action', 3),
    'spit': ('action', 4), 'vent': ('action', 5), 'hurt': ('action', 6), 'defeat': ('action', 7),
    'swim0': ('more', 0), 'swim1': ('more', 1), 'drown': ('more', 2), 'tread': ('more', 3), 'talk': ('more', 4),
    'cheer': ('more', 5),
}
# Side-on in the water: the swim hangs from the middle of the body (the clip places it).
CENTRED = {'swim0', 'swim1'}
LIFT = {}
SNAP = 0.0
