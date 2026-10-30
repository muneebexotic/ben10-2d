# Gwen's cut-out parts, from her model sheet (docs/art-refs/gwen-model-sheet.webp):
# the body from the three-quarter view (the second figure), the heads from the
# six expression close-ups. Coordinates are sheet pixels. See cut.py and ben.py.

ID = 'gwen'
SHEET = 'docs/art-refs/gwen-model-sheet.webp'
SCALE = 18.2
TEXEL = 10
FAR_SHADE = 0.13
SKIN = (255, 186, 138)
LID_WIDTH = 4.5
# Her capris and sneakers are nearly white: only the page's own white is background.
WHITE = 247

BODY_BOX = (470, 20, 770, 680)

FLOOR = 647
JOINTS = {
    'hip': (608, 388),
    'hipF': (584, 390), 'kneeF': (558.5, 494), 'ankleF': (533, 598),
    'hipB': (634, 390), 'kneeB': (641.5, 494), 'ankleB': (649, 596),
    'shoulderF': (548, 240), 'elbowF': (532, 318), 'wristF': (527, 388),
    'shoulderB': (655, 240), 'elbowB': (668, 318), 'wristB': (680, 390),
    'neck': (607, 207),
    'eyes': (646, 135), 'mouth': (647, 170),
    'shoe': (645, 598), 'floor': (645, FLOOR),
}
J = JOINTS

NEAR_FIST = [(505, 383), (552, 382), (553, 430), (545, 445), (520, 446), (503, 432)]
FAR_FIST = [(664, 382), (704, 382), (705, 432), (690, 440), (668, 438)]
NEAR_ARM = [(575, 204), (560, 205), (548, 208), (537, 222), (531, 250), (522, 300), (515, 340), (510, 385), (512, 391), (543, 390), (550, 350), (554, 317), (557, 295), (562, 272), (564, 252), (565, 232), (570, 210)]
FAR_ARM = [(642, 225), (647, 250), (650, 275), (652, 300), (656, 325), (662, 350), (666, 375), (680, 375), (672, 312), (665, 275), (660, 237), (650, 210), (640, 203)]
PANTS = [((238, 237, 240), 26), ((205, 205, 212), 20)]
# The page between her arms and her sides (closed in by the fists).
HOLES = [[(548, 300), (556, 300), (560, 345), (555, 380), (545, 380)], [(652, 330), (662, 330), (667, 385), (660, 385)]]
NAVY = (26, 68, 133)
PANTS_FILL = (236, 234, 236)
SHIRT = (140, 172, 227)
SEAT = [(560, 368), (664, 368), (660, 396), (636, 410), (610, 414), (584, 410), (560, 396)]

PARTS = {
    'torso': {
        'poly': [(578, 199), (584, 202), (595, 210), (603, 215), (615, 214), (626, 210), (638, 201), (642, 225), (647, 250), (650, 275), (652, 300), (656, 325), (659, 347), (600, 350), (552, 346), (551, 320), (553, 295), (558, 262), (563, 235), (570, 212)],
        'cover': [NEAR_ARM, FAR_ARM],
        'fill': SHIRT,
        'ink': [[(578, 201), (568, 212), (562, 235), (557, 262), (553, 295), (551, 320)]],
        'pivot': (608, 380.4),
    },
    'pelvis': {
        'poly': [(558, 344), (610, 349), (662, 346), (664, 362), (664, 372), (610, 374), (556, 370)],
        'cover': [FAR_ARM], 'fill': PANTS_FILL,
        'ink': [[(661, 346), (663, 372)]],
        'pivot': J['hip'],
    },
    'seat': {
        'poly': SEAT, 'cover': [SEAT], 'fill': (232, 232, 236), 'grow': 0,
        'pivot': J['hip'],
    },
    'legF': {
        'poly': [(560, 352), (607, 352), (609, 400), (604, 420), (600, 450), (595, 462), (582, 503), (572, 541), (553, 546), (549, 560), (546, 583), (512, 584), (512, 560), (516, 546), (510, 532), (516, 507), (526, 482), (532, 440), (541, 425), (549, 405), (553, 397), (558, 375)],
        'cover': [NEAR_FIST],
        'fill': PANTS_FILL,
        'ink': [[(553, 397), (546, 412), (538, 428), (533, 440)]],
        'pivot': J['hipF'],
        'bend': {'pivot': J['hipF'], 'bones': [None, (J['hipF'], J['kneeF']), (J['kneeF'], J['ankleF'])], 'joints': [J['hipF'], J['kneeF']], 'blend': [1.0, 1.5]},
    },
    'legB': {
        'poly': [(610, 352), (666, 352), (667, 370), (667, 387), (670, 420), (674, 470), (682, 524), (678, 531), (670, 537), (666, 578), (662, 586), (635, 586), (632, 545), (620, 537), (616, 503), (612, 462), (610, 430), (611, 400)],
        'cover': [FAR_FIST, FAR_ARM],
        'fill': PANTS_FILL,
        'ink': [[(664, 352), (666, 385), (668, 405), (670, 425)]],
        'pivot': J['hipB'], 'far': True,
        'bend': {'pivot': J['hipB'], 'bones': [None, (J['hipB'], J['kneeB']), (J['kneeB'], J['ankleB'])], 'joints': [J['hipB'], J['kneeB']], 'blend': [1.0, 1.5]},
    },
    # Both feet are the far sneaker (side on, nothing over it).
    'footF': {
        'poly': [(624, 600), (629, 584), (652, 586), (660, 576), (690, 574), (705, 592), (730, 607), (747, 622), (748, 640), (705, 649), (655, 645), (627, 640)],
        'pivot': J['shoe'],
    },
    'armF': {
        'poly': NEAR_ARM,
        'pivot': J['shoulderF'],
        'bend': {'pivot': J['shoulderF'], 'bones': [(J['shoulderF'], J['elbowF']), (J['elbowF'], J['wristF'])], 'joints': [J['elbowF']], 'blend': [0.7]},
    },
    'handF': {
        'poly': [(507, 386), (545, 384), (551, 398), (551, 425), (543, 440), (522, 443), (509, 432), (504, 410)],
        'pivot': J['wristF'], 'turnFrom': (J['elbowF'], J['wristF']),
        'drop': PANTS,
    },
    'armB': {
        'poly': [(638, 201), (650, 208), (660, 237), (665, 275), (672, 312), (685, 350), (692, 390), (668, 392), (666, 375), (662, 350), (656, 325), (651, 300), (646, 270), (640, 235), (639, 212)],
        'cover': [[(600, 195), (638, 199), (642, 225), (647, 250), (650, 275), (652, 300), (656, 325), (600, 325)]],
        'fill': NAVY,
        'grow': 2,
        'ink': [[(649, 205), (640, 205), (639, 235), (643, 268), (650, 300)]],
        'pivot': J['shoulderB'], 'far': True,
        'bend': {'pivot': J['shoulderB'], 'bones': [(J['shoulderB'], J['elbowB']), (J['elbowB'], J['wristB'])], 'joints': [J['elbowB']], 'blend': [0.7]},
    },
    'handB': {
        'poly': [(667, 388), (696, 386), (702, 400), (700, 425), (688, 434), (672, 432), (665, 415)],
        'pivot': J['wristB'], 'turnFrom': (J['elbowB'], J['wristB']), 'far': True,
        'drop': PANTS,
    },
}
PARTS['footB'] = dict(PARTS['footF'], far=True)

HEAD_SCALE = 0.85
_HEAD_BOX = (5, 680, 250, 912)
_HEAD_POLY = [(5, 680), (250, 680), (250, 884), (175, 884), (150, 890), (144, 904), (100, 904), (96, 888), (5, 884)]
_HEAD_PIVOT = (120, 895)
_EYES = [
    {'poly': [(121, 803), (130, 797), (146, 795), (159, 800), (162, 810), (156, 820), (143, 824), (128, 821), (121, 813)],
     'lid': [(121, 811), (133, 816), (147, 817), (161, 810)]},
    {'poly': [(181, 802), (189, 796), (199, 797), (203, 806), (201, 818), (193, 824), (185, 821), (180, 812)],
     'lid': [(181, 811), (191, 815), (202, 810)]},
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
    'open': _head(0, blink=True, mouth={'erase': (167, 850, 18, 6), 'from': (1267, -3), 'at': (169, 853), 'rx': 23, 'ry': 13}),
    'grin': _head(257),
    'shout': _head(506),
    'wide': _head(759),
    'pain': _head(1009, 1),
    'talk': _head(1267),
}
