# Ben's cut-out parts, from his model sheet (docs/art-refs/ben-model-sheet.webp):
# the body from the three-quarter view (the second figure), the heads from the
# six expression close-ups. Coordinates are sheet pixels. See cut.py.

ID = 'ben'
SHEET = 'docs/art-refs/ben-model-sheet.webp'
# Sheet pixels per game pixel (he stands about 34 game px tall), and texels per game pixel in the atlas.
SCALE = 18.5
TEXEL = 10
FAR_SHADE = 0.13
SKIN = (250, 180, 128)
LID_WIDTH = 4.5

BODY_BOX = (470, 20, 770, 680)

FLOOR = 661
JOINTS = {
    'hip': (604, 418),
    'hipF': (578, 418), 'kneeF': (554, 520), 'ankleF': (530, 622),
    'hipB': (630, 418), 'kneeB': (645, 518), 'ankleB': (650, 618),
    'shoulderF': (540, 236), 'elbowF': (514, 335), 'wristF': (512, 398),
    'shoulderB': (652, 236), 'elbowB': (661, 325), 'wristB': (686, 392),
    'neck': (598, 203),
    # Where the head's eyes and mouth sit (for effects): the neutral close-up's, scaled onto the body.
    'eyes': (637, 142), 'mouth': (638, 175),
    # The shoe's ankle (both feet use the far shoe, which is in profile) and the floor under it.
    'shoe': (650, 618), 'floor': (650, FLOOR),
}

NEAR_FIST = [(489, 394), (543, 392), (546, 430), (530, 450), (495, 447), (488, 420)]
FAR_FIST = [(663, 386), (712, 386), (713, 440), (690, 450), (665, 444)]
NEAR_SLEEVE = [(575, 196), (548, 202), (530, 213), (520, 237), (512, 258), (503, 272), (506, 280), (530, 285), (552, 291), (562, 291), (566, 272), (571, 250), (574, 228), (576, 210)]

J = JOINTS

# Legs and arms are one piece each, straightened along their bones; the rig bends them back
# smoothly at the hip, knee and elbow (a mesh: RigActor's skins), so the pants and sleeves
# fold like cloth instead of turning as separate pieces. Blend: half-widths of the bends (game px).
PARTS = {
    'torso': {
        'poly': [(569, 196), (582, 205), (598, 213), (612, 205), (620, 196), (636, 202), (645, 211), (646, 235), (647, 260), (649, 285), (651, 330), (658, 368), (600, 369), (548, 363), (550, 345), (556, 320), (562, 291), (558, 280), (552, 255), (551, 225), (556, 207)],
        'cover': [NEAR_SLEEVE],
        'ink': [[(569, 198), (557, 207), (551, 225), (552, 255), (558, 280), (562, 292)]],
        'pivot': (604, 410.6),
    },
    # Just the waistband: below it the legs' tops stay with the hips and bend round the hip joints.
    'pelvis': {
        'poly': [(548, 361), (600, 367), (658, 366), (662, 385), (663, 397), (604, 399), (544, 395), (546, 380)],
        'pivot': (604, 418),
    },
    'legF': {
        'poly': [(550, 373), (600, 373), (601, 440), (603, 475), (597, 498), (590, 520), (585, 536), (580, 559), (574, 567), (578, 590), (571, 606), (566, 614), (545, 608), (512, 609), (496, 617), (487, 625), (484, 600), (485, 571), (501, 540), (508, 520), (514, 498), (516, 478), (522, 450), (532, 430), (540, 410), (546, 390)],
        'cover': [NEAR_FIST],
        'ink': [[(547, 388), (541, 410), (532, 430), (523, 450)]],
        'pivot': J['hipF'],
        'bend': {'pivot': J['hipF'], 'bones': [None, (J['hipF'], J['kneeF']), (J['kneeF'], J['ankleF'])], 'joints': [J['hipF'], J['kneeF']], 'blend': [1.0, 1.6]},
    },
    'legB': {
        'poly': [(604, 373), (658, 373), (662, 385), (665, 410), (668, 440), (676, 450), (680, 470), (683, 498), (685, 520), (685, 544), (701, 571), (702, 590), (697, 602), (662, 618), (640, 628), (616, 640), (611, 620), (612, 590), (608, 578), (610, 545), (610, 520), (609, 500), (607, 475), (604, 440)],
        'cover': [FAR_FIST],
        'ink': [[(662, 385), (665, 410), (669, 438), (677, 452)]],
        'pivot': J['hipB'], 'far': True,
        'bend': {'pivot': J['hipB'], 'bones': [None, (J['hipB'], J['kneeB']), (J['kneeB'], J['ankleB'])], 'joints': [J['hipB'], J['kneeB']], 'blend': [1.0, 1.6]},
    },
    # Behind both legs: the seat of the pants, so a leg swinging away never opens a gap at the crotch.
    'seat': {
        'poly': [(560, 392), (650, 392), (646, 422), (626, 440), (606, 446), (586, 440), (564, 422)],
        'cover': [[(560, 392), (650, 392), (646, 422), (626, 440), (606, 446), (586, 440), (564, 422)]],
        'fill': (82, 86, 36),
        'grow': 0,
        'pivot': (604, 418),
    },
    'footF': {
        'poly': [(611, 640), (613, 615), (618, 600), (660, 595), (700, 598), (712, 607), (730, 618), (746, 630), (750, 645), (742, 658), (700, 662), (640, 662), (614, 656)],
        'cover': [[(600, 588), (708, 588), (700, 603), (662, 619), (640, 629), (616, 641), (600, 641)]],
        'fill': (30, 28, 32),
        'ink': [[(612, 640), (613, 615), (620, 600), (660, 595), (700, 598)]],
        'pivot': J['shoe'],
    },
    'armF': {
        'poly': [(562, 205), (548, 203), (532, 211), (521, 235), (512, 258), (503, 272), (506, 281), (501, 300), (497, 335), (495, 355), (494, 380), (500, 404), (520, 408), (532, 398), (528, 385), (530, 360), (531, 335), (531, 325), (537, 305), (552, 292), (562, 292), (566, 272), (571, 250), (570, 225)],
        'pivot': J['shoulderF'],
        'bend': {'pivot': J['shoulderF'], 'bones': [(J['shoulderF'], J['elbowF']), (J['elbowF'], J['wristF'])], 'joints': [J['elbowF']], 'blend': [0.75]},
    },
    'handF': {
        'poly': [(491, 394), (530, 392), (540, 396), (542, 410), (542, 428), (532, 447), (512, 449), (496, 441), (489, 420)],
        'pivot': J['wristF'], 'turnFrom': (J['elbowF'], J['wristF']),
        'drop': [((86, 90, 36), 40), ((60, 63, 28), 30)],
    },
    'armB': {
        'poly': [(628, 200), (645, 205), (656, 215), (664, 240), (671, 262), (675, 277), (669, 285), (667, 300), (670, 320), (676, 335), (692, 340), (708, 344), (713, 370), (708, 392), (690, 400), (668, 396), (656, 386), (652, 360), (648, 338), (648, 320), (649, 300), (645, 286), (638, 270), (630, 240), (627, 215)],
        'cover': [[(600, 190), (620, 195), (636, 201), (645, 210), (646, 235), (647, 260), (649, 285), (640, 300), (600, 300)]],
        'grow': 2,
        'ink': [[(645, 205), (630, 201), (627, 225), (632, 255), (640, 278), (646, 287)]],
        'pivot': J['shoulderB'], 'far': True,
        'bend': {'pivot': J['shoulderB'], 'bones': [(J['shoulderB'], J['elbowB']), (J['elbowB'], J['wristB'])], 'joints': [J['elbowB']], 'blend': [0.7]},
    },
    'handB': {
        'poly': [(664, 388), (708, 386), (713, 410), (710, 432), (692, 446), (672, 442), (663, 420)],
        'pivot': J['wristB'], 'turnFrom': (J['elbowB'], J['wristB']), 'far': True,
        'drop': [((86, 90, 36), 40), ((60, 63, 28), 30)],
    },
}
# Both feet are the far shoe (in profile); the far one a touch darker.
PARTS['footB'] = dict(PARTS['footF'], far=True)

# Heads: the close-ups, scaled onto the body (a touch bigger than the body's own head, for play size).
HEAD_SCALE = 0.88
# The neutral close-up (the others are the same framing, shifted along the row).
_HEAD_BOX = (8, 680, 258, 912)
_HEAD_POLY = [(8, 680), (258, 680), (258, 888), (150, 888), (140, 896), (134, 906), (98, 906), (90, 896), (8, 893)]
_HEAD_PIVOT = (116, 893)
_EYES = [
    {'poly': [(117, 816), (127, 809), (145, 808), (160, 812), (163, 822), (157, 833), (140, 838), (125, 834), (116, 825)],
     'lid': [(117, 823), (129, 828), (145, 829), (161, 822)]},
    {'poly': [(173, 818), (180, 811), (190, 811), (196, 818), (195, 832), (187, 840), (177, 837), (172, 827)],
     'lid': [(173, 826), (184, 830), (195, 825)]},
]


def _head(dx, dy=0, blink=False, mouth=None):
    shift = lambda pts: [(x + dx, y + dy) for x, y in pts]
    h = {
        'box': (_HEAD_BOX[0] + dx, _HEAD_BOX[1] + dy, _HEAD_BOX[2] + dx, _HEAD_BOX[3] + dy),
        'poly': shift(_HEAD_POLY),
        'pivot': (_HEAD_PIVOT[0] + dx, _HEAD_PIVOT[1] + dy),
    }
    if blink:
        h['blink'] = [{'poly': shift(e['poly']), 'lid': shift(e['lid'])} for e in _EYES]
    if mouth:
        h['mouth'] = mouth
    return h


HEADS = {
    'neutral': _head(0, blink=True),
    # Talking: the neutral head with the talking close-up's open mouth.
    'open': _head(0, blink=True, mouth={'erase': (163, 861, 20, 7), 'from': (1278 - 5, -2), 'at': (162, 864), 'rx': 23, 'ry': 15}),
    'grin': _head(259),
    'shout': _head(511),
    'wide': _head(758),
    'pain': _head(1010, -1),
    'talk': _head(1278),
}
