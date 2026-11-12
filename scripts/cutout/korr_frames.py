# Magister Korr's dialogue portrait (Chapter 7's ending, on the hologram): the owner's portrait sheet, one drawing
# of it as it is: the stern three-quarter close-up (bottom row, first). The game tints it as a hologram
# (cartoon/plumber/korr.ts).

ID = 'korr'
TEXEL = 8
# Sheet pixels per game px on the close-ups: the bust stands about 52 game px, its head filling the 48-px portrait
# (drawn at 8 texels a game px, the sharpest the HD presentation renders).
SCALE = 7.9

SHEETS = {
    'sheet': ('docs/art-refs/korr-portrait-sheet.webp', 245),
}
REF = ('sheet', 4)
# Nothing measures him (one sheet, one drawing): a colour he hasn't got.
HAIR = (255, 0, 255)
# His coat anchors x.
SHIRT = (88, 88, 96)
SHEET_SCALE = {'sheet': 1.0}

FRAMES = {
    'bust': ('sheet', 4),
}
CENTRED = set()
LIFT = {}
SNAP = 0.0
