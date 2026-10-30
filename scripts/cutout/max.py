# Grandpa Max's cut-out parts, from his model sheet (docs/art-refs/max-model-sheet.webp):
# the body from the three-quarter view (the second figure), the heads from the
# six expression close-ups. Coordinates are sheet pixels. See cut.py and ben.py.

ID = 'max'
SHEET = 'docs/art-refs/max-model-sheet.webp'
SCALE = 17.7
TEXEL = 10
FAR_SHADE = 0.13
SKIN = (253, 173, 120)
LID_WIDTH = 4.5

BODY_BOX = (425, 5, 795, 690)

FLOOR = 672
JOINTS = {
    'hip': (612, 420),
    'hipF': (575, 425), 'kneeF': (551, 531.5), 'ankleF': (527, 638),
    'hipB': (655, 425), 'kneeB': (661.5, 528.5), 'ankleB': (668, 632),
    'shoulderF': (492, 185), 'elbowF': (478, 292), 'wristF': (485, 382),
    'shoulderB': (695, 195), 'elbowB': (722, 300), 'wristB': (733, 390),
    'neck': (608, 143),
    'eyes': (634, 62), 'mouth': (632, 91),
    'shoe': (668, 632), 'floor': (668, FLOOR),
}
J = JOINTS

SHIRT = (193, 48, 44)
PANTS = (163, 145, 114)
BOOT = (88, 52, 32)
NEAR_FIST = [(448, 376), (526, 376), (528, 432), (516, 452), (490, 456), (460, 448), (448, 420)]
FAR_FIST = [(706, 386), (754, 386), (762, 405), (760, 440), (745, 455), (720, 455), (706, 435)]
FAR_ARM = [(700, 255), (760, 255), (762, 455), (700, 455)]
NEAR_SLEEVE = [(505, 138), (480, 150), (465, 190), (445, 240), (448, 252), (480, 258), (530, 268), (536, 250), (532, 210), (522, 160)]
HOLSTER = [(512, 300), (540, 298), (556, 305), (566, 330), (561, 360), (553, 380), (554, 422), (530, 426), (514, 410), (510, 360)]
# The page between his arms and his sides.
HOLES = [[(503, 268), (518, 268), (520, 388), (503, 388)], [(696, 258), (714, 258), (716, 398), (700, 398)]]
WAIST = [(530, 318), (688, 318), (696, 345), (692, 372), (528, 372), (522, 345)]
SEAT = [(520, 392), (705, 392), (700, 425), (660, 450), (613, 458), (565, 450), (525, 425)]

PARTS = {
    'torso': {
        'poly': [(520, 137), (553, 105), (567, 113), (587, 137), (607, 157), (620, 160), (637, 140), (647, 133), (660, 140), (668, 158), (680, 210), (690, 240), (700, 268), (705, 300), (707, 340), (600, 345), (510, 342), (510, 300), (518, 272), (530, 266), (534, 230), (528, 180)],
        'cover': [NEAR_SLEEVE, HOLSTER],
        'fill': SHIRT,
        'ink': [[(553, 106), (536, 122), (528, 160), (532, 210), (536, 250), (532, 268)]],
        'pivot': (612, 412.9),
    },
    'pelvis': {
        'poly': [(508, 338), (600, 345), (708, 338), (712, 362), (712, 398), (612, 400), (512, 398), (506, 365)],
        'cover': [HOLSTER, NEAR_FIST],
        'fill': PANTS,
        'pivot': J['hip'],
    },
    # On his near hip, over the shirt and the pants: its own piece, so it stays on the belt as the leg swings.
    'holster': {
        'poly': HOLSTER,
        'pivot': J['hip'],
    },
    'waist': {
        'poly': WAIST, 'cover': [WAIST], 'fill': SHIRT, 'grow': 0,
        'pivot': J['hip'],
    },
    'seat': {
        'poly': SEAT, 'cover': [SEAT], 'fill': PANTS, 'grow': 0,
        'pivot': J['hip'],
    },
    'legF': {
        'poly': [(512, 368), (612, 368), (613, 420), (613, 463), (597, 524), (580, 563), (586, 597), (569, 619), (558, 624), (474, 630), (483, 608), (472, 569), (497, 497), (508, 441), (510, 400)],
        'cover': [NEAR_FIST, HOLSTER],
        'fill': PANTS,
        'ink': [[(512, 372), (510, 405), (508, 441)]],
        'pivot': J['hipF'],
        'bend': {'pivot': J['hipF'], 'bones': [None, (J['hipF'], J['kneeF']), (J['kneeF'], J['ankleF'])], 'joints': [J['hipF'], J['kneeF']], 'blend': [1.0, 1.7]},
    },
    'legB': {
        'poly': [(613, 368), (708, 362), (712, 395), (708, 441), (716, 502), (711, 563), (722, 586), (724, 613), (700, 621), (680, 624), (624, 641), (622, 620), (624, 608), (610, 569), (613, 469), (613, 420)],
        'cover': [FAR_FIST, FAR_ARM],
        'fill': PANTS,
        'ink': [[(710, 362), (712, 395), (709, 441), (714, 470)]],
        'pivot': J['hipB'], 'far': True,
        'bend': {'pivot': J['hipB'], 'bones': [None, (J['hipB'], J['kneeB']), (J['kneeB'], J['ankleB'])], 'joints': [J['hipB'], J['kneeB']], 'blend': [1.0, 1.7]},
    },
    # Both feet are the far boot (side on), its top under the turn-up filled in.
    'footF': {
        'poly': [(622, 640), (624, 615), (660, 612), (700, 612), (725, 615), (750, 625), (775, 640), (784, 655), (780, 670), (700, 674), (640, 673), (624, 665)],
        'cover': [[(615, 600), (730, 600), (724, 616), (680, 624), (624, 643), (615, 643)]],
        'fill': BOOT,
        'ink': [[(623, 642), (624, 618), (660, 613), (700, 613), (724, 616)]],
        'pivot': J['shoe'],
    },
    'armF': {
        'poly': [(505, 138), (480, 150), (465, 190), (445, 240), (444, 300), (448, 360), (452, 385), (520, 385), (512, 370), (512, 300), (520, 272), (532, 266), (536, 250), (532, 210), (522, 160)],
        'pivot': J['shoulderF'],
        'bend': {'pivot': J['shoulderF'], 'bones': [(J['shoulderF'], J['elbowF']), (J['elbowF'], J['wristF'])], 'joints': [J['elbowF']], 'blend': [0.9]},
    },
    'handF': {
        'poly': [(450, 380), (515, 378), (522, 392), (523, 430), (515, 448), (490, 453), (462, 445), (452, 420)],
        'pivot': J['wristF'], 'turnFrom': (J['elbowF'], J['wristF']),
        'drop': [(PANTS, 30)],
    },
    'armB': {
        'poly': [(668, 160), (690, 172), (705, 192), (720, 230), (726, 256), (733, 282), (745, 330), (752, 375), (752, 392), (712, 392), (708, 370), (703, 320), (700, 268), (690, 240), (680, 210), (670, 185)],
        'cover': [[(640, 150), (668, 158), (680, 210), (690, 240), (700, 268), (640, 268)]],
        'fill': SHIRT,
        'ink': [[(668, 160), (672, 190), (682, 222), (694, 252), (700, 268)]],
        'pivot': J['shoulderB'], 'far': True,
        'bend': {'pivot': J['shoulderB'], 'bones': [(J['shoulderB'], J['elbowB']), (J['elbowB'], J['wristB'])], 'joints': [J['elbowB']], 'blend': [0.9]},
    },
    'handB': {
        'poly': [(708, 390), (750, 388), (760, 405), (758, 438), (745, 452), (722, 452), (710, 435)],
        'pivot': J['wristB'], 'turnFrom': (J['elbowB'], J['wristB']), 'far': True,
        'drop': [(PANTS, 30)],
    },
}
PARTS['footB'] = dict(PARTS['footF'], far=True)

# His close-ups are drawn much bigger than his body's head.
HEAD_SCALE = 0.66
_HEAD_BOX = (5, 690, 268, 935)
_HEAD_POLY = [(22, 690), (262, 690), (262, 878), (212, 878), (192, 888), (178, 922), (160, 932), (128, 930), (95, 893), (66, 860), (40, 846), (22, 846)]
_HEAD_PIVOT = (140, 905)
_EYES = [
    {'poly': [(149, 778), (156, 772), (168, 771), (177, 776), (178, 786), (170, 793), (157, 793), (150, 787)],
     'lid': [(150, 783), (162, 787), (177, 782)]},
    {'poly': [(194, 777), (200, 772), (207, 774), (209, 784), (205, 793), (198, 792), (194, 785)],
     'lid': [(194, 783), (201, 786), (208, 782)]},
]


def _head(dx, dy=0, blink=False, mouth=None):
    shift = lambda pts: [(x + dx, y + dy) for x, y in pts]
    h = {'box': (_HEAD_BOX[0] + dx, _HEAD_BOX[1] + dy, _HEAD_BOX[2] + dx, _HEAD_BOX[3] + dy), 'poly': shift(_HEAD_POLY), 'pivot': (_HEAD_PIVOT[0] + dx, _HEAD_PIVOT[1] + dy)}
    if blink:
        h['blink'] = [{'poly': shift(e['poly']), 'lid': shift(e['lid'])} for e in _EYES]
    if mouth:
        h['mouth'] = mouth
    return h


HEADS = {
    'neutral': _head(0, blink=True),
    'open': _head(0, blink=True, mouth={'erase': (176, 826, 26, 7), 'from': (1261, -5), 'at': (177, 833), 'rx': 30, 'ry': 16}),
    'grin': _head(257),
    'shout': _head(514),
    'wide': _head(750, 1),
    'pain': _head(1010, 1),
    'talk': _head(1265, -2),
}
