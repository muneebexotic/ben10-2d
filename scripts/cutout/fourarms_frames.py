# Four Arms frame by frame: every pose is one of the owner's drawings (see frames.py).
# Sheets: his model sheet (the three-quarter view, standing), his run cycle (8 frames), his fighting poses (the two
# jabs, the haymaker's wind-up and swing, the overhead clap, the leap and the ground slam, the meteor drop), his
# movement poses (fighting stance, jump, fall, land, carrying overhead, the throw, hurt, down) and a last sheet of
# a 4-drawing run with something held overhead and his water poses (he sinks: two strides along the bottom, standing
# paddling, out of air). The game draws his shockwaves, dust and whatever he carries.

ID = 'fourarms'
TEXEL = 5
# Sheet pixels per game px on the model sheet: topknot to feet he stands about 46 game px (a head and more over Ben).
SCALE = 13.9

SHEETS = {
    'model': ('docs/art-refs/fourarms-model-sheet.webp', 245),
    'run': ('docs/art-refs/fourarms-run-cycle.webp', 245),
    'fight': ('docs/art-refs/fourarms-fight-poses.webp', 245),
    'move': ('docs/art-refs/fourarms-move-poses.webp', 245),
    'carry': ('docs/art-refs/fourarms-carry-water.webp', 245),
}
REF = ('model', 1)
# Scale is set by hand below (his head turns in every pose): the black topknot only stands in.
HAIR = (9, 10, 7)
# The red skin anchors x.
SHIRT = (130, 22, 26)
# Each sheet against the model sheet by his height, topknot to feet, in the drawings where he stands up straight
# (the carry, the clap, treading water) and how much a run or a lunge lowers him.
SHEET_SCALE = {'model': 1.0, 'run': 1.72, 'fight': 1.55, 'move': 1.55, 'carry': 1.52}

FRAMES = {
    'stand': ('model', 1),
    **{f'run{i}': ('run', i) for i in range(8)},
    'punchA': ('fight', 0), 'punchB': ('fight', 1), 'haymakerUp': ('fight', 2), 'haymaker': ('fight', 3),
    'clap': ('fight', 4), 'slamUp': ('fight', 5), 'slam': ('fight', 6), 'meteor': ('fight', 7),
    'stance': ('move', 0), 'jump': ('move', 1), 'fall': ('move', 2), 'land': ('move', 3),
    'carry': ('move', 4), 'throw': ('move', 5), 'hurt': ('move', 6), 'defeat': ('move', 7),
    **{f'carryRun{i}': ('carry', i) for i in range(4)},
    'wade0': ('carry', 4), 'wade1': ('carry', 5), 'tread': ('carry', 6), 'gasp': ('carry', 7),
}
LIFT = {}
SNAP = 0.0
