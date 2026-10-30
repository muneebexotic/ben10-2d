# Kevin's cut-out parts, from his model sheet (docs/art-refs/kevin-model-sheet.webp):
# the body from the three-quarter view (the second figure), the heads from the
# six expression close-ups. Coordinates are sheet pixels. See cut.py and ben.py.
# His shirt and hair are as black as the ink, so hidden areas fill black with no new outline.

ID = 'kevin'
SHEET = 'docs/art-refs/kevin-model-sheet.webp'
SCALE = 17.0
TEXEL = 10
FAR_SHADE = 0.13
SKIN = (255, 183, 146)
LID_WIDTH = 4.5

BODY_BOX = (355, 15, 640, 660)

FLOOR = 641
JOINTS = {
    'hip': (480, 400),
    'hipF': (457, 400), 'kneeF': (432, 500), 'ankleF': (410, 598),
    'hipB': (507, 400), 'kneeB': (518, 500), 'ankleB': (530, 598),
    'shoulderF': (420, 232), 'elbowF': (405, 320), 'wristF': (400, 388),
    'shoulderB': (530, 232), 'elbowB': (540, 320), 'wristB': (558, 388),
    'neck': (472, 202),
    'eyes': (506, 130), 'mouth': (495, 168),
    'shoe': (530, 598), 'floor': (530, FLOOR),
}
J = JOINTS

SHIRT = (15, 15, 15)
JEANS = (30, 45, 67)
SHOE = (16, 12, 18)
NEAR_FIST = [(375, 383), (437, 380), (445, 405), (442, 440), (420, 448), (392, 446), (376, 430)]
FAR_FIST = [(540, 380), (585, 378), (592, 410), (588, 440), (568, 447), (548, 440), (540, 415)]
NEAR_ARM = [(445, 203), (425, 205), (405, 212), (390, 230), (383, 255), (386, 290), (382, 330), (376, 388), (418, 388), (422, 340), (427, 300), (434, 285), (440, 255), (442, 225)]
FAR_ARM = [(520, 203), (534, 210), (545, 226), (548, 260), (552, 290), (560, 330), (566, 388), (540, 390), (533, 350), (527, 310), (524, 290), (522, 260), (520, 232)]
# The page between his arms and his sides.
HOLES = [[(416, 296), (436, 296), (436, 386), (414, 386)], [(522, 296), (540, 296), (542, 386), (524, 386)]]
WAIST = [(442, 320), (522, 320), (528, 345), (526, 372), (440, 372), (434, 345)]
SEAT = [(440, 392), (530, 392), (528, 425), (505, 445), (480, 452), (455, 445), (438, 425)]

PARTS = {
    'torso': {
        'poly': [(445, 198), (455, 205), (472, 210), (490, 205), (500, 198), (518, 204), (528, 212), (532, 235), (530, 280), (528, 320), (532, 352), (480, 356), (430, 352), (428, 320), (426, 290), (430, 260), (432, 230), (438, 210)],
        'cover': [NEAR_ARM, FAR_ARM],
        'fill': SHIRT,
        'pivot': (480, 393.2),
    },
    'pelvis': {
        'poly': [(430, 348), (480, 354), (532, 348), (535, 362), (535, 376), (480, 379), (428, 376)],
        'pivot': J['hip'],
    },
    'waist': {'poly': WAIST, 'cover': [WAIST], 'fill': SHIRT, 'grow': 0, 'pivot': J['hip']},
    'seat': {'poly': SEAT, 'cover': [SEAT], 'fill': JEANS, 'grow': 0, 'pivot': J['hip']},
    'legF': {
        'poly': [(430, 362), (481, 362), (482, 400), (478, 440), (466, 480), (456, 520), (452, 560), (458, 590), (456, 602), (368, 602), (368, 560), (388, 500), (406, 440), (420, 400), (430, 380)],
        'cover': [NEAR_FIST],
        'fill': JEANS,
        'ink': [[(430, 380), (420, 400), (406, 440)]],
        'pivot': J['hipF'],
        'bend': {'pivot': J['hipF'], 'bones': [None, (J['hipF'], J['kneeF']), (J['kneeF'], J['ankleF'])], 'joints': [J['hipF'], J['kneeF']], 'blend': [1.0, 1.6]},
    },
    'legB': {
        'poly': [(481, 362), (535, 362), (540, 390), (548, 440), (555, 500), (562, 540), (572, 580), (576, 603), (488, 605), (488, 560), (485, 500), (482, 440), (481, 400)],
        'cover': [FAR_FIST],
        'fill': JEANS,
        'ink': [[(538, 380), (545, 410), (550, 445)]],
        'pivot': J['hipB'], 'far': True,
        'bend': {'pivot': J['hipB'], 'bones': [None, (J['hipB'], J['kneeB']), (J['kneeB'], J['ankleB'])], 'joints': [J['hipB'], J['kneeB']], 'blend': [1.0, 1.6]},
    },
    # Both feet are the far sneaker (side on), its top under the jeans' cuff filled in.
    'footF': {
        'poly': [(493, 606), (497, 597), (540, 596), (566, 599), (592, 609), (616, 619), (623, 632), (616, 643), (560, 645), (505, 641), (494, 626)],
        'cover': [[(485, 585), (582, 585), (580, 604), (488, 607)]],
        'fill': SHOE,
        'pivot': J['shoe'],
    },
    'armF': {
        'poly': NEAR_ARM,
        'pivot': J['shoulderF'],
        'bend': {'pivot': J['shoulderF'], 'bones': [(J['shoulderF'], J['elbowF']), (J['elbowF'], J['wristF'])], 'joints': [J['elbowF']], 'blend': [0.7]},
    },
    'handF': {
        'poly': [(377, 384), (428, 382), (436, 395), (437, 430), (430, 446), (405, 449), (385, 443), (376, 420)],
        'pivot': J['wristF'], 'turnFrom': (J['elbowF'], J['wristF']),
        'drop': [(JEANS, 34), ((22, 32, 50), 20)],
    },
    'armB': {
        'poly': FAR_ARM,
        'cover': [[(500, 195), (520, 203), (528, 240), (528, 288), (500, 288)]],
        'fill': SHIRT,
        'pivot': J['shoulderB'], 'far': True,
        'bend': {'pivot': J['shoulderB'], 'bones': [(J['shoulderB'], J['elbowB']), (J['elbowB'], J['wristB'])], 'joints': [J['elbowB']], 'blend': [0.7]},
    },
    'handB': {
        'poly': [(541, 384), (584, 380), (592, 405), (590, 436), (572, 448), (550, 444), (541, 420)],
        'pivot': J['wristB'], 'turnFrom': (J['elbowB'], J['wristB']), 'far': True,
        'drop': [(JEANS, 34), ((22, 32, 50), 20)],
    },
}
PARTS['footB'] = dict(PARTS['footF'], far=True)

HEAD_SCALE = 0.8
_HEAD_BOX = (15, 680, 245, 935)
_HEAD_POLY = [(15, 680), (245, 680), (245, 890), (205, 890), (180, 896), (150, 905), (112, 905), (90, 895), (60, 895), (15, 890)]
_HEAD_PIVOT = (130, 903)
_EYES = [
    {'poly': [(119, 812), (126, 805), (138, 803), (149, 806), (152, 815), (147, 825), (135, 829), (124, 826), (119, 819)],
     'lid': [(119, 817), (130, 821), (142, 822), (152, 816)]},
    {'poly': [(173, 810), (179, 805), (187, 806), (191, 814), (189, 824), (182, 828), (175, 825), (172, 817)],
     'lid': [(173, 816), (182, 820), (191, 815)]},
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
    'open': _head(0, blink=True, mouth={'erase': (153, 845, 18, 6), 'from': (1272, 1), 'at': (158, 848), 'rx': 23, 'ry': 12}),
    'grin': _head(257),
    'shout': _head(513, 1),
    'wide': _head(762, 3),
    'pain': _head(1018, 5),
    'talk': _head(1272, 1),
}
