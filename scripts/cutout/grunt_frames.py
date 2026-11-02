# Deepmaw's fishbowl grunt, frame by frame from the owner's model sheet (see frames.py).
# The model sheet's bottom row is every move the fight needs: standing guard (the harpoon on his shoulder),
# the wind-up (the tell), the throw (empty-handed: the game flies the harpoon) and the bowl smashed (flopping);
# his walk sheet is an 8-drawing trudge with the harpoon on his shoulder; the broken-bowl sheet is the same moves (and a
# 4-drawing trudge) with the bowl smashed, for when it breaks in water and he fights on.

ID = 'grunt'
TEXEL = 5
# Sheet pixels per game px: he stands about 32 game px tall to the top of the bowl, a little under Ben.
SCALE = 14.4

SHEETS = {
    'model': ('docs/art-refs/grunt-model-sheet.webp', 245),
    'walk': ('docs/art-refs/grunt-walk-cycle.webp', 245),
    'bare': ('docs/art-refs/grunt-bare-poses.webp', 245),
}
# The bowl's glass sets every sheet's scale (it's the same round bowl in every pose).
REF = ('model', 4)
HAIR = (122, 225, 238)
# The khaki canvas suit: every frame is anchored at its middle and the floor under the boots.
SHIRT = (217, 198, 148)
# The walk sheet is drawn smaller: its bowls are about 1.2x narrower than the model sheet's (1.20 stands him as tall as on guard).
# The broken-bowl sheet is drawn a hair bigger (its neck ring and collar-to-boot height against the others').
SHEET_SCALE = {'model': 1.0, 'walk': 1.20, 'bare': 0.97}

FRAMES = {
    'guard': ('model', 4),
    'windup': ('model', 5),
    'throw': ('model', 6),
    'flop': ('model', 7),
    **{f'walk{i}': ('walk', i) for i in range(8)},
    'guardBare': ('bare', 0),
    'windupBare': ('bare', 1),
    'throwBare': ('bare', 2),
    **{f'walkBare{i}': ('bare', 3 + i) for i in range(4)},
}
LIFT = {}
SNAP = 0.0
