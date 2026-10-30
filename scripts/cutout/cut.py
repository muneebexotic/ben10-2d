"""
Cuts a character's model sheet into the parts of their Chapter 7 rig
(cut-out animation, docs/DECISIONS.md "Characters drawn from the art"):

    python3 -I scripts/cutout/cut.py scripts/cutout/ben.py [--debug DIR]

A spec (a Python file) names the sheet, how many sheet pixels make one game
pixel, the joints, and for every part: the polygon to take, what lies in
front of it there (filled with the part's own colour), new outline strokes
where its edge was hidden, and how to turn it so its bone points straight up
or down. Heads come whole from the expression close-ups, each with a painted
blink. Writes the packed atlas to public/assets/cast/<id>.png and its frames
and joints to src/scenes/preload/cartoon/cutout/<id>.ts.

Needs numpy and opencv-python-headless.
"""

import importlib.util
import json
import math
import os
import sys

import cv2
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
INK = np.array([24, 18, 20], dtype=np.float32)
PAD = 2


def load_spec(path):
    spec = importlib.util.spec_from_file_location('cut_spec', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def poly_mask(shape, polys, offset=(0, 0)):
    m = np.zeros(shape[:2], np.uint8)
    for poly in polys:
        pts = np.array(poly, np.float32).reshape(-1, 2) - np.array(offset, np.float32)
        cv2.fillPoly(m, [np.round(pts * 4).astype(np.int32)], 255, cv2.LINE_AA, shift=2)
    return m.astype(np.float32) / 255.0


def figure_rgba(img, box, white=232, holes=()):
    """
    The figures in `box` cut from the white page: premultiplied RGBA floats,
    the outline's soft edge kept. `holes` mark gaps the page shows through
    that are closed all round (between an arm and the body): the white inside
    each is page too.
    """
    x0, y0, x1, y1 = box
    crop = img[y0:y1, x0:x1].astype(np.float32)
    lo = crop.min(axis=2)
    near_white = (lo > white).astype(np.uint8)
    n, lab = cv2.connectedComponents(near_white, connectivity=4)
    edge_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge_labels)) & (near_white > 0)
    if holes:
        gap = (lo >= 238).astype(np.uint8)
        _, glab = cv2.connectedComponents(gap, connectivity=4)
        inside = poly_mask(crop.shape, holes, (x0, y0)) > 0.5
        ids = set(np.unique(glab[inside & (gap > 0)])) - {0}
        bg |= np.isin(glab, list(ids))
    alpha = np.where(bg, 0.0, 1.0).astype(np.float32)
    # The outline's outer pixels fade into the page: there the colour is ink and the darkness is the cover.
    band = (cv2.dilate(bg.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0) & ~bg
    soft = np.clip((255.0 - lo) / 200.0, 0, 1)
    alpha[band] = soft[band]
    rgb = crop.copy()
    rgb[band] = INK
    return np.dstack([rgb * alpha[..., None], alpha])


def nearest_fill(rgb, source, target):
    """Colours `target` pixels from the nearest `source` pixel (flat cartoon colour: no blur)."""
    if not target.any() or not source.any():
        return rgb
    inv = (~source).astype(np.uint8)
    _, labels = cv2.distanceTransformWithLabels(inv, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ys, xs = np.nonzero(source)
    # Each source pixel got its own label, in scan order.
    lut = np.zeros((labels.max() + 1, 3), np.float32)
    lut[labels[ys, xs]] = rgb[ys, xs]
    out = rgb.copy()
    out[target] = lut[labels[target]]
    return out


def stroke(rgba, lines, offset, width):
    """Ink strokes (new outline where the art's edge was hidden)."""
    if not lines:
        return rgba
    h, w = rgba.shape[:2]
    m = np.zeros((h * 4, w * 4), np.uint8)
    for line in lines:
        pts = (np.array(line, np.float32).reshape(-1, 2) - np.array(offset, np.float32)) * 4
        cv2.polylines(m, [np.round(pts * 4).astype(np.int32)], False, 255, int(round(width * 4)), cv2.LINE_AA, shift=2)
    a = cv2.resize(m, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    out = rgba.copy()
    out[..., :3] = out[..., :3] * (1 - a[..., None]) + INK * a[..., None]
    out[..., 3] = out[..., 3] * (1 - a) + a
    return out


def cut_part(fig, box, part, sheet_rgb):
    """One part: its polygon taken from the figure, hidden areas filled, new outline stroked (premultiplied RGBA, sheet scale)."""
    x0, y0 = box[0], box[1]
    take = poly_mask(fig.shape, [part['poly']], (x0, y0))
    a = fig[..., 3] * take
    rgb = np.where(fig[..., 3:] > 0, fig[..., :3] / np.maximum(fig[..., 3:], 1e-6), 0)
    covers = part.get('cover', [])
    hidden = poly_mask(fig.shape, covers, (x0, y0)) if covers else np.zeros(fig.shape[:2], np.float32)
    grow = part.get('grow', 3)
    if covers and grow > 0:
        hidden = cv2.dilate(hidden, np.ones((grow * 2 + 1, grow * 2 + 1), np.uint8))
    hidden = (hidden > 0.5) & (take > 0.5)
    # The hidden area belongs to the part wherever the polygon says (inside the figure or not).
    lum = rgb.mean(axis=2)
    own = (take > 0.5) & ~hidden & (fig[..., 3] > 0.9)
    colour = part.get('fill')
    if colour is not None:
        rgb[hidden] = np.array(colour, np.float32)
    else:
        source = own & (lum > part.get('fillMinLum', 70))
        rgb = nearest_fill(rgb, source, hidden)
    a = np.where(hidden, take, a)
    # Colours that belong to what's behind (the pants under a fist): dropped, the outline between kept.
    for colour, tol in part.get('drop', []):
        near = np.linalg.norm(rgb - np.array(colour, np.float32), axis=2) < tol
        a = np.where(near & ~hidden, 0.0, a)
    out = np.dstack([rgb * a[..., None], a])
    out = np.dstack([out[..., :3] / np.maximum(out[..., 3:], 1e-6), out[..., 3]])
    out = stroke(out, part.get('ink', []), (x0, y0), part.get('inkWidth', 5))
    return np.dstack([out[..., :3] * out[..., 3:], out[..., 3]])


def shade_far(rgba, k):
    """Far-side limbs a touch darker (toward a warm dark), like the show's far arm."""
    dark = np.array([42, 20, 12], np.float32)
    out = rgba.copy()
    out[..., :3] = out[..., :3] * (1 - k) + dark * out[..., 3:] * k
    return out


def place(rgba, origin, pivot, angle_deg, scale):
    """Turns the part about its pivot and scales it to texels: returns (image, pivot in it)."""
    h, w = rgba.shape[:2]
    px, py = pivot[0] - origin[0], pivot[1] - origin[1]
    th = math.radians(angle_deg)
    c, s = math.cos(th), math.sin(th)
    corners = np.array([[0, 0], [w, 0], [0, h], [w, h]], np.float32) - [px, py]
    rx = corners[:, 0] * c - corners[:, 1] * s
    ry = corners[:, 0] * s + corners[:, 1] * c
    ox, oy = -rx.min() + 2, -ry.min() + 2
    W, H = int(math.ceil(rx.max() - rx.min() + 4)), int(math.ceil(ry.max() - ry.min() + 4))
    M = np.array([[c, -s, ox - (c * px - s * py)], [s, c, oy - (s * px + c * py)]], np.float32)
    big = cv2.warpAffine(rgba, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    big = np.clip(big, 0, None)
    big[..., :3] = np.minimum(big[..., :3], big[..., 3:] * 255)
    small = cv2.resize(big, (max(1, round(W * scale)), max(1, round(H * scale))), interpolation=cv2.INTER_AREA)
    ky, kx = small.shape[0] / H, small.shape[1] / W
    pv = (ox * kx, oy * ky)
    # Trim to what's drawn.
    ys, xs = np.nonzero(small[..., 3] > 0.004)
    if len(xs) == 0:
        return small[:1, :1], (0.0, 0.0)
    x0, x1, y0, y1 = max(0, xs.min() - 1), min(small.shape[1], xs.max() + 2), max(0, ys.min() - 1), min(small.shape[0], ys.max() + 2)
    return small[y0:y1, x0:x1], (pv[0] - x0, pv[1] - y0)


def angle_to(pivot, aim, up):
    """The turn (degrees) that points pivot -> aim straight down (limbs) or straight up (torso, neck)."""
    vx, vy = aim[0] - pivot[0], aim[1] - pivot[1]
    if up:
        vx, vy = -vx, -vy
    return math.degrees(math.atan2(vx, vy))


def smoothstep(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3 - 2 * t)


def bone_angle(a, b):
    """The rig's rotation (radians) that turns a bone hanging straight down to point from a to b."""
    return -math.atan2(b[0] - a[0], b[1] - a[1])


def unbend(rgba, origin, bend, scale):
    """
    A limb straightened along its bones (the runtime bends it back): the
    output pixel at d below the top joint comes from the art by the same
    angle-blended bend the rig uses (RigActor's skins), so the rig posed like
    the sheet shows the sheet exactly. `bend`: 'pivot' (the limb's top joint),
    'bones' (each a pair of points, or None for an upright bone above the
    first joint), 'joints' (between bones), 'blend' (half-widths, sheet px).
    """
    pivot = np.array(bend['pivot'], np.float64)
    joints = [np.array(j, np.float64) for j in bend['joints']]
    angles = [0.0 if b is None else bone_angle(*b) for b in bend['bones']]
    # Joints along the straight limb: the first bone that hangs from the pivot sets the offsets.
    straight = []
    for k, j in enumerate(joints):
        if k == 0:
            straight.append(np.linalg.norm(j - pivot) * (1 if j[1] >= pivot[1] else -1))
        else:
            straight.append(straight[-1] + np.linalg.norm(j - joints[k - 1]))
    h, w = rgba.shape[:2]
    reach = math.hypot(max(pivot[0] - origin[0], origin[0] + w - pivot[0]), max(pivot[1] - origin[1], origin[1] + h - pivot[1])) + 4
    R = int(math.ceil(reach))
    ys, xs = np.mgrid[-R:R + 1, -R:R + 1].astype(np.float64)
    # Nearest joint by height; the weight toward the bone below it.
    dist = np.stack([np.abs(ys - sy) for sy in straight])
    k = np.argmin(dist, axis=0)
    sy = np.array(straight)[k]
    b = np.array(bend['blend'], np.float64)[k]
    wgt = smoothstep((ys - (sy - b)) / (2 * b))
    a0 = np.array(angles)[k]
    a1 = np.array(angles)[k + 1]
    alpha = a0 + wgt * (a1 - a0)
    jx = np.array([j[0] for j in joints])[k]
    jy = np.array([j[1] for j in joints])[k]
    dx, dy = xs, ys - sy
    c, s_ = np.cos(alpha), np.sin(alpha)
    srcx = jx + c * dx - s_ * dy - origin[0]
    srcy = jy + s_ * dx + c * dy - origin[1]
    out = cv2.remap(rgba, srcx.astype(np.float32), srcy.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    out = np.clip(out, 0, None)
    out[..., :3] = np.minimum(out[..., :3], out[..., 3:] * 255)
    return out, (R, R)


def eye_blink(rgba, eyes, offset, skin, lid_width):
    """Paints the eyes shut: each eye (a polygon, sheet coords) filled with skin and a lid line drawn across it."""
    m = poly_mask(rgba.shape, [e['poly'] for e in eyes], offset)[..., None]
    out = rgba.copy()
    out[..., :3] = out[..., :3] * (1 - m) + np.array(skin, np.float32) * out[..., 3:] * m
    straight = np.dstack([out[..., :3] / np.maximum(out[..., 3:], 1e-6), out[..., 3]])
    straight = stroke(straight, [e['lid'] for e in eyes], offset, lid_width)
    return np.dstack([straight[..., :3] * straight[..., 3:], straight[..., 3]])


def ellipse_mask(shape, cx, cy, rx, ry, offset, feather=0):
    m = np.zeros(shape[:2], np.float32)
    cv2.ellipse(m, (int(round((cx - offset[0]) * 4)), int(round((cy - offset[1]) * 4))), (int(round(rx * 4)), int(round(ry * 4))), 0, 0, 360, 1.0, -1, cv2.LINE_AA, shift=2)
    if feather > 0:
        m = cv2.GaussianBlur(m, (0, 0), feather)
    return m


def paste_mouth(rgba, sheet, box, mouth, skin):
    """Another close-up's mouth on this head: the old mouth painted over with skin, the new one blended in (soft edge)."""
    out = rgba.copy()
    a = out[..., 3:]
    ex, ey, erx, ery = mouth['erase']
    e = ellipse_mask(out.shape, ex, ey, erx, ery, box, 1.0)[..., None]
    out[..., :3] = out[..., :3] * (1 - e) + np.array(skin, np.float32) * a * e
    fx, fy = mouth['from']
    x0, y0, x1, y1 = box
    src = sheet[y0 + fy:y1 + fy, x0 + fx:x1 + fx].astype(np.float32)
    cx, cy = mouth['at']
    m = ellipse_mask(out.shape, cx, cy, mouth['rx'] - 2, mouth['ry'] - 2, box, 2.0)[..., None]
    out[..., :3] = out[..., :3] * (1 - m) + src * a * m
    return out


def pack(images):
    order = sorted(images.keys(), key=lambda k: (-images[k].shape[0], -images[k].shape[1]))
    maxw = 1024
    x = y = PAD
    shelf = 0
    rects = {}
    width = 0
    for k in order:
        h, w = images[k].shape[:2]
        if x + w + PAD > maxw and x > PAD:
            x = PAD
            y += shelf + PAD
            shelf = 0
        rects[k] = (x, y, w, h)
        x += w + PAD
        shelf = max(shelf, h)
        width = max(width, x)
    height = y + shelf + PAD
    atlas = np.zeros((height, width, 4), np.float32)
    for k, (x, y, w, h) in rects.items():
        atlas[y:y + h, x:x + w] = images[k]
    return atlas, rects


def to_png(rgba):
    a = np.clip(rgba[..., 3:], 0, 1)
    rgb = np.where(a > 0, rgba[..., :3] / np.maximum(a, 1e-6), 0)
    out = np.dstack([np.clip(rgb, 0, 255), a * 255]).round().astype(np.uint8)
    return cv2.cvtColor(out, cv2.COLOR_RGBA2BGRA)


def main():
    args = sys.argv[1:]
    debug = None
    if '--debug' in args:
        debug = args[args.index('--debug') + 1]
        args = [a for a in args if a not in ('--debug', debug)]
    S = load_spec(args[0])
    sheet = cv2.cvtColor(cv2.imread(os.path.join(ROOT, S.SHEET), cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)
    texel = S.TEXEL / S.SCALE
    box = S.BODY_BOX
    white = getattr(S, 'WHITE', 232)
    fig = figure_rgba(sheet, box, white, getattr(S, 'HOLES', ()))
    images, pivots, bends = {}, {}, {}

    for name, part in S.PARTS.items():
        rgba = cut_part(fig, box, part, sheet)
        if part.get('far'):
            rgba = shade_far(rgba, S.FAR_SHADE)
        if 'bend' in part:
            bend = dict(part['bend'], blend=[b * S.SCALE for b in part['bend']['blend']])
            straight, pv0 = unbend(rgba, (box[0], box[1]), bend, 1.0)
            img, pv = place(straight, (0, 0), pv0, 0.0, texel)
            images[name] = img
            pivots[name] = pv
            bends[name] = list(part['bend']['blend'])
            continue
        turn = 0.0
        if 'turnFrom' in part:
            turn = angle_to(*part['turnFrom'], False)
        elif 'aim' in part:
            turn = angle_to(part['pivot'], part['aim'], part.get('up', False))
        elif 'turnLike' in part:
            p2 = S.PARTS[part['turnLike']]
            turn = angle_to(p2['pivot'], p2['aim'], p2.get('up', False))
        img, pv = place(rgba, (box[0], box[1]), part['pivot'], turn, texel)
        for frame in part.get('frames', [name]):
            images[frame] = img
            pivots[frame] = pv

    for name, head in S.HEADS.items():
        hb = head['box']
        hf = figure_rgba(sheet, hb, white)
        take = poly_mask(hf.shape, [head['poly']], (hb[0], hb[1]))
        rgba = hf * take[..., None]
        if 'mouth' in head:
            rgba = paste_mouth(rgba, sheet, hb, head['mouth'], S.SKIN)
        k = texel * S.HEAD_SCALE
        img, pv = place(rgba, (hb[0], hb[1]), head['pivot'], head.get('turn', 0.0), k)
        images['head:' + name] = img
        pivots['head:' + name] = pv
        if 'blink' in head:
            shut = eye_blink(rgba, head['blink'], (hb[0], hb[1]), S.SKIN, S.LID_WIDTH)
            img, pv = place(shut, (hb[0], hb[1]), head['pivot'], head.get('turn', 0.0), k)
            images['head:' + name + '-blink'] = img
            pivots['head:' + name + '-blink'] = pv

    atlas, rects = pack(images)
    out_png = os.path.join(ROOT, 'public', 'assets', 'cast', S.ID + '.png')
    os.makedirs(os.path.dirname(out_png), exist_ok=True)
    cv2.imwrite(out_png, to_png(atlas), [cv2.IMWRITE_PNG_COMPRESSION, 9])

    frames = {}
    for k, (x, y, w, h) in rects.items():
        px, py = pivots[k]
        frames[k] = {'x': x, 'y': y, 'w': w, 'h': h, 'px': round(px, 2), 'py': round(py, 2)}
    joints = {k: [round(v[0], 1), round(v[1], 1)] for k, v in S.JOINTS.items()}
    meta = {
        'id': S.ID,
        'image': 'assets/cast/' + S.ID + '.png',
        'texel': S.TEXEL,
        'scale': S.SCALE,
        'headScale': S.HEAD_SCALE,
        'width': atlas.shape[1],
        'height': atlas.shape[0],
        'joints': joints,
        'frames': dict(sorted(frames.items())),
        'bends': bends,
    }
    out_ts = os.path.join(ROOT, 'src', 'scenes', 'preload', 'cartoon', 'cutout', S.ID + '.ts')
    os.makedirs(os.path.dirname(out_ts), exist_ok=True)
    const = S.ID.upper() + '_CUT'
    with open(out_ts, 'w') as f:
        f.write('// Generated by scripts/cutout/cut.py from scripts/cutout/' + S.ID + '.py: do not edit.\n')
        f.write("import type { CutoutMeta } from './cutout';\n\n")
        f.write('export const ' + const + ': CutoutMeta = {\n')
        for key in ('id', 'image', 'texel', 'scale', 'headScale', 'width', 'height'):
            f.write('  ' + key + ': ' + json.dumps(meta[key]) + ',\n')
        for key in ('joints', 'frames', 'bends'):
            f.write('  ' + key + ': {\n')
            for name, v in meta[key].items():
                f.write('    ' + json.dumps(name) + ': ' + json.dumps(v, separators=(', ', ': ')) + ',\n')
            f.write('  },\n')
        f.write('};\n')
    print(f'{S.ID}: {len(frames)} frames, atlas {atlas.shape[1]}x{atlas.shape[0]} -> {os.path.relpath(out_png, ROOT)}')

    if debug:
        os.makedirs(debug, exist_ok=True)
        over = sheet.copy()
        colours = [(255, 0, 0), (0, 160, 255), (0, 200, 0), (255, 0, 255), (255, 140, 0), (0, 200, 200)]
        for i, (name, part) in enumerate(S.PARTS.items()):
            col = colours[i % len(colours)]
            pts = np.array(part['poly'], np.float32).reshape(-1, 2)
            cv2.polylines(over, [np.round(pts).astype(np.int32)], True, col, 1, cv2.LINE_AA)
            for c in part.get('cover', []):
                cp = np.array(c, np.float32).reshape(-1, 2)
                cv2.polylines(over, [np.round(cp).astype(np.int32)], True, (120, 120, 120), 1, cv2.LINE_AA)
            cv2.circle(over, tuple(int(v) for v in part['pivot']), 3, col, -1)
        for name, head in S.HEADS.items():
            pts = np.array(head['poly'], np.float32).reshape(-1, 2)
            cv2.polylines(over, [np.round(pts).astype(np.int32)], True, (255, 0, 0), 1, cv2.LINE_AA)
            cv2.circle(over, tuple(int(v) for v in head['pivot']), 3, (255, 0, 0), -1)
            for e in head.get('blink', []):
                ep = np.array(e['poly'], np.float32).reshape(-1, 2)
                cv2.polylines(over, [np.round(ep).astype(np.int32)], True, (0, 0, 255), 1, cv2.LINE_AA)
        cv2.imwrite(os.path.join(debug, S.ID + '-polys.png'), cv2.cvtColor(over, cv2.COLOR_RGB2BGR))
        # The atlas on grey, big, to check edges.
        bgc = np.full(atlas.shape[:2] + (3,), 150, np.float32)
        comp = bgc * (1 - atlas[..., 3:]) + atlas[..., :3]
        comp = cv2.resize(comp, (comp.shape[1] * 3, comp.shape[0] * 3), interpolation=cv2.INTER_NEAREST)
        cv2.imwrite(os.path.join(debug, S.ID + '-atlas.png'), cv2.cvtColor(comp.astype(np.uint8), cv2.COLOR_RGB2BGR))


if __name__ == '__main__':
    main()
