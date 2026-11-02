# The Plumber security drone (the sentry, `warden`), frame by frame from the owner's model sheet (see frames.py).
# The game draws its scan light (it sweeps with the aim) and its stun bolt, so the drawings it plays are the ones
# without them: the side view on its beat (the game's green light glows in the lens) and the red lens, locked on.

ID = 'warden'
TEXEL = 5
# Sheet pixels per game px: the ball is about 19 px across, as the painted drone.
SCALE = 14.0

SHEETS = {
    'model': ('docs/art-refs/drone-model-sheet.webp', 248),
}
REF = ('model', 0)
HAIR = (90, 126, 150)
# The blue-grey shell: every drawing hangs from its middle (the drone's sprite has its origin there).
SHIRT = (90, 126, 150)
SHEET_SCALE = {'model': 1.0}

FRAMES = {'idle': ('model', 0), 'lock': ('model', 5)}
CENTRED = set(FRAMES)
LIFT = {}
SNAP = 0.0
