# Ripjaws frame by frame: every pose is one of the owner's drawings (see frames.py).
# Sheets: his model sheet (the three-quarter view, standing on his tail), his swim cycle (8 frames, side on),
# his hop cycle on land (8), his action poses (on land: balanced, jump, fall, land, bite, CHOMP, tail whip, hurt)
# and his poses in the water and out of it (tread, RIP DASH, swim bite, gasp, flop, thrash, the discovery, talk).

ID = 'ripjaws'
TEXEL = 5
# Sheet pixels per game px on the model sheet: lure to tail he stands about 40 game px (a head over Ben).
SCALE = 15.5

# His chest panel is white: only the page's own white is background.
SHEETS = {
    'model': ('docs/art-refs/ripjaws-model-sheet.webp', 248),
    'swim': ('docs/art-refs/ripjaws-swim-cycle.webp', 248),
    'hop': ('docs/art-refs/ripjaws-hop-cycle.webp', 248),
    'action': ('docs/art-refs/ripjaws-action-poses.webp', 248),
    'water': ('docs/art-refs/ripjaws-water-poses.webp', 248),
}
# The swim sheet's drawings are small and nearly touch.
GAP = {'swim': 3}
MIN_AREA = {'swim': 8000}
REF = ('model', 1)
# His fins (scale only matters for the model sheet: the others are set by hand below).
HAIR = (88, 104, 56)
# The black wetsuit (and tail) anchors x; for the side-on drawings, the middle of the body.
SHIRT = (24, 24, 24)
# Each sheet scaled to the middle of its lure bulb's size (drawn bigger than the model sheet's, like a head)
# and its body's: swim x1.87 / x2.3, hop x1.47 / x1.65, action x1.21 / x1.36, water x1.26 / x1.45.
SHEET_SCALE = {'model': 1.0, 'swim': 2.07, 'hop': 1.56, 'action': 1.28, 'water': 1.35}

FRAMES = {
    'stand': ('model', 1),
    'swim0': ('swim', 0), 'swim1': ('swim', 1), 'swim2': ('swim', 2), 'swim3': ('swim', 3),
    'swim4': ('swim', 4), 'swim5': ('swim', 5), 'swim6': ('swim', 6), 'swim7': ('swim', 7),
    'hop0': ('hop', 0), 'hop1': ('hop', 1), 'hop2': ('hop', 2), 'hop3': ('hop', 3),
    'hop4': ('hop', 4), 'hop5': ('hop', 5), 'hop6': ('hop', 6), 'hop7': ('hop', 7),
    'idle': ('action', 0), 'jump': ('action', 1), 'fall': ('action', 2), 'land': ('action', 3),
    'biteA': ('action', 4), 'biteB': ('action', 5), 'whip': ('action', 6), 'hurt': ('action', 7),
    'tread': ('water', 0), 'dash': ('water', 1), 'swimBite': ('water', 2), 'gasp': ('water', 3),
    'flop': ('water', 4), 'drown': ('water', 5), 'roar': ('water', 6), 'talk': ('water', 7),
}
# Side-on in the water: they hang from the middle of the body (the clip places it).
CENTRED = {'swim0', 'swim1', 'swim2', 'swim3', 'swim4', 'swim5', 'swim6', 'swim7', 'dash', 'swimBite'}
# The hop's two airborne drawings (game px over the floor): the sheet's 6.7 and 11.7, at 70% so he bounds without floating.
LIFT = {'hop2': 4.7, 'hop3': 8.2}

# His model sheet's colours: frames from other sheets are pulled toward them.
PALETTE = [(200, 200, 184), (24, 24, 24), (248, 248, 248), (88, 104, 56), (104, 104, 56), (200, 216, 200), (232, 232, 232), (88, 88, 40)]
SNAP = 0.35
