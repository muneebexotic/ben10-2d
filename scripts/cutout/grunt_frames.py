# Deepmaw's fishbowl grunt, frame by frame from the owner's model sheet (see frames.py).
# The model sheet's bottom row is every move the fight needs: standing guard (the harpoon on his shoulder),
# the wind-up (the tell), the throw (empty-handed: the game flies the harpoon) and the bowl smashed (flopping).

ID = 'grunt'
TEXEL = 5
# Sheet pixels per game px: he stands about 32 game px tall to the top of the bowl, a little under Ben.
SCALE = 14.4

SHEETS = {
    'model': ('docs/art-refs/grunt-model-sheet.webp', 245),
}
# The bowl's glass sets every sheet's scale (it's the same round bowl in every pose).
REF = ('model', 4)
HAIR = (122, 225, 238)
# The khaki canvas suit: every frame is anchored at its middle and the floor under the boots.
SHIRT = (217, 198, 148)
SHEET_SCALE = {'model': 1.0}

FRAMES = {
    'guard': ('model', 4),
    'windup': ('model', 5),
    'throw': ('model', 6),
    'flop': ('model', 7),
}
LIFT = {}
SNAP = 0.0
