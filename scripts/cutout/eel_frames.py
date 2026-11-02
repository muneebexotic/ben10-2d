# The zapper eel, frame by frame from the owner's model sheet (see frames.py): swimming straight and in an S-curve,
# coiled to charge (the tell), the zap, and flopping both ways on a drained floor.

ID = 'eel'
TEXEL = 5
# Sheet pixels per game px: about 36 game px from nose to tail, as the painted eel.
SCALE = 12.0

SHEETS = {
    'model': ('docs/art-refs/eel-model-sheet.webp', 245),
}
REF = ('model', 0)
# The dark-blue back sets every sheet's scale; every drawing hangs from its middle (the eel's sprite has its origin there).
HAIR = (17, 42, 80)
SHIRT = (17, 42, 80)
SHEET_SCALE = {'model': 1.0}

FRAMES = {
    'straight': ('model', 0),
    'curve': ('model', 1),
    'charge': ('model', 3),
    'zap': ('model', 4),
    'flopUp': ('model', 5),
    'flopDown': ('model', 6),
}
CENTRED = {'straight', 'curve', 'charge', 'zap'}
# On a drained floor it lies on its belly: the drawing's lowest point sits on the floor, 8.3 px under its middle (measured in the game).
LIFT = {'flopUp': -8.3, 'flopDown': -8.3}
SNAP = 0.0
