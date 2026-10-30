"""
Frame-by-frame characters (docs/DECISIONS.md, "Characters drawn frame by
frame"): every pose is one of the generated drawings, played as it is.

    python3 -I scripts/cutout/frames.py scripts/cutout/ben_frames.py [--debug DIR]

A spec names the sheets and which figure on each is which frame. Figures are
found on the white page and numbered row by row, left to right. Every sheet
is scaled to the model sheet by the width of the character's hair (each
sheet is drawn at its own size), every frame is anchored at the middle of
the shirt and the floor under the lowest foot (minus a lift for frames in
the air), and the colours are pulled to the model sheet's so frames from
different sheets don't flicker. Writes public/assets/cast/<id>-frames.png and
src/scenes/preload/cartoon/cutout/<id>Frames.ts.
"""

import importlib.util
import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from cut import ROOT, figure_rgba, pack, to_png  # noqa: E402


def load_spec(path):
    spec = importlib.util.spec_from_file_location('frames_spec', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def read_sheet(path):
    raw = cv2.imread(os.path.join(ROOT, path), cv2.IMREAD_UNCHANGED)
    if raw.shape[2] == 4:
        a = raw[..., 3:].astype(np.float32) / 255
        raw = (raw[..., :3].astype(np.float32) * a + 255 * (1 - a)).astype(np.uint8)
    return cv2.cvtColor(raw, cv2.COLOR_BGR2RGB)


def figures(img, white, min_area=15000):
    """Every figure on the page (premultiplied RGBA crops), row by row, left to right."""
    H, W = img.shape[:2]
    fig = figure_rgba(img, (0, 0, W, H), white)
    solid = (fig[..., 3] > 0.3).astype(np.uint8)
    blob = cv2.dilate(solid, np.ones((7, 7), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(blob)
    found = [(i, stats[i]) for i in range(1, n) if stats[i][4] > min_area]
    rows = sorted(found, key=lambda f: f[1][1] + f[1][3] / 2)
    # Group into rows (centres within half a figure's height), then left to right.
    ordered, row = [], []
    for f in rows:
        if row and abs((f[1][1] + f[1][3] / 2) - (row[0][1][1] + row[0][1][3] / 2)) > row[0][1][3] / 2:
            ordered += sorted(row, key=lambda g: g[1][0])
            row = []
        row.append(f)
    ordered += sorted(row, key=lambda g: g[1][0])
    out = []
    for i, (x, y, w, h, _) in ordered:
        crop = fig[y:y + h, x:x + w] * (lab[y:y + h, x:x + w] == i)[..., None]
        out.append(crop)
    return out


def hair_width(rgba, hair):
    """Width of the largest blob of hair colour (the head's size, steady across poses)."""
    a = rgba[..., 3]
    rgb = np.where(a[..., None] > 0, rgba[..., :3] / np.maximum(a[..., None], 1e-6), 0)
    near = (np.linalg.norm(rgb - np.array(hair, np.float32), axis=2) < 42) & (a > 0.9)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(near.astype(np.uint8))
    if n < 2:
        return None
    k = 1 + int(np.argmax(stats[1:, 4]))
    return float(stats[k][2])


def anchor(rgba, shirt):
    """The middle of the shirt (x) and the lowest opaque pixel (y)."""
    a = rgba[..., 3]
    rgb = np.where(a[..., None] > 0, rgba[..., :3] / np.maximum(a[..., None], 1e-6), 0)
    near = (np.linalg.norm(rgb - np.array(shirt, np.float32), axis=2) < 40) & (a > 0.9)
    ys, xs = np.nonzero(near)
    cx = float(xs.mean()) if len(xs) else rgba.shape[1] / 2
    rows = np.nonzero((a > 0.5).any(axis=1))[0]
    return cx, float(rows.max())


def snap_colours(rgba, palette, strength):
    """Pulls every colour toward the nearest model-sheet colour (keeps shading steps, kills drift between sheets)."""
    if not palette or strength <= 0:
        return rgba
    a = rgba[..., 3:]
    rgb = np.where(a > 0, rgba[..., :3] / np.maximum(a, 1e-6), 0)
    pal = np.array(palette, np.float32)
    flat = rgb.reshape(-1, 3)
    d = np.linalg.norm(flat[:, None, :] - pal[None, :, :], axis=2)
    nearest = pal[np.argmin(d, axis=1)]
    close = (np.min(d, axis=1) < 38)[:, None]
    out = np.where(close, flat + (nearest - flat) * strength, flat).reshape(rgb.shape)
    return np.dstack([out * a, a[..., 0]])


def main():
    args = sys.argv[1:]
    debug = None
    if '--debug' in args:
        debug = args[args.index('--debug') + 1]
        args = [x for x in args if x not in ('--debug', debug)]
    S = load_spec(args[0])
    sheets = {}
    for name, (path, white) in S.SHEETS.items():
        sheets[name] = figures(read_sheet(path), white)
        print(f'{name}: {len(sheets[name])} figures')
    # Each sheet's scale: its median hair width against the model sheet's.
    ref = hair_width(sheets[S.REF[0]][S.REF[1]], S.HAIR)
    scale = {}
    for name, figs in sheets.items():
        # Only the figures used: a model sheet's close-ups are drawn bigger than its full figures.
        used = sorted({i for sh, i in S.FRAMES.values() if sh == name} | ({S.REF[1]} if name == S.REF[0] else set()))
        widths = [w for w in (hair_width(figs[i], S.HAIR) for i in used) if w]
        if not widths:
            continue
        scale[name] = ref / float(np.median(widths))
        print(f'{name}: hair {np.median(widths):.0f}px, x{scale[name]:.3f}')
    texel = S.TEXEL / S.SCALE
    images, pivots = {}, {}
    for frame, (sheet, index) in S.FRAMES.items():
        rgba = snap_colours(sheets[sheet][index], getattr(S, 'PALETTE', []), getattr(S, 'SNAP', 0.0))
        cx, floor = anchor(rgba, S.SHIRT)
        k = scale[sheet] * texel
        h, w = rgba.shape[:2]
        small = cv2.resize(rgba, (max(1, round(w * k)), max(1, round(h * k))), interpolation=cv2.INTER_AREA)
        lift = S.LIFT.get(frame, 0.0) * S.TEXEL
        images['body:' + frame] = small
        pivots['body:' + frame] = (cx * k, floor * k + lift)
    atlas, rects = pack(images)
    out_png = os.path.join(ROOT, 'public', 'assets', 'cast', S.ID + '-frames.png')
    cv2.imwrite(out_png, to_png(atlas), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    frames = {k: {'x': x, 'y': y, 'w': w, 'h': h, 'px': round(pivots[k][0], 2), 'py': round(pivots[k][1], 2)} for k, (x, y, w, h) in rects.items()}
    name = S.ID.upper() + '_FRAMES'
    out_ts = os.path.join(ROOT, 'src', 'scenes', 'preload', 'cartoon', 'cutout', S.ID + 'Frames.ts')
    with open(out_ts, 'w') as f:
        f.write(f'// Generated by scripts/cutout/frames.py from scripts/cutout/{os.path.basename(args[0])}: do not edit.\n')
        f.write("import type { CutoutMeta } from './cutout';\n\n")
        f.write(f'export const {name}: CutoutMeta = {{\n')
        for key, v in (('id', S.ID + '-frames'), ('image', f'assets/cast/{S.ID}-frames.png'), ('texel', S.TEXEL), ('scale', S.SCALE), ('headScale', 1), ('width', atlas.shape[1]), ('height', atlas.shape[0])):
            f.write(f'  {key}: {json.dumps(v)},\n')
        f.write('  joints: {},\n  frames: {\n')
        for k, v in sorted(frames.items()):
            f.write(f'    {json.dumps(k)}: {json.dumps(v, separators=(", ", ": "))},\n')
        f.write('  },\n  bends: {},\n};\n')
    print(f'{S.ID}: {len(frames)} frames, atlas {atlas.shape[1]}x{atlas.shape[0]} -> {os.path.relpath(out_png, ROOT)}')
    if debug:
        os.makedirs(debug, exist_ok=True)
        # Every frame on one floor line, pivots marked, for checking alignment.
        cell = max(v['w'] for v in frames.values()) + 20
        tall = max(v['h'] for v in frames.values()) + 40
        names = list(S.FRAMES.keys())
        sheet = np.full((tall, cell * len(names), 3), 245, np.float32)
        for i, fr in enumerate(names):
            v = frames['body:' + fr]
            img = images['body:' + fr]
            ox = int(i * cell + cell / 2 - v['px'])
            oy = int(tall - 20 - v['py'])
            reg = sheet[max(0, oy):oy + v['h'], ox:ox + v['w']]
            src = img[max(0, -oy):max(0, -oy) + reg.shape[0], :reg.shape[1]]
            reg[:] = reg * (1 - src[..., 3:]) + src[..., :3]
        sheet = sheet.astype(np.uint8)
        for i, fr in enumerate(names):
            cv2.line(sheet, (i * cell, tall - 20), ((i + 1) * cell - 4, tall - 20), (200, 60, 60), 1)
            cv2.putText(sheet, fr, (i * cell + 4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (40, 40, 160), 1)
        cv2.imwrite(os.path.join(debug, S.ID + '-frames.png'), cv2.cvtColor(sheet, cv2.COLOR_RGB2BGR))


if __name__ == '__main__':
    main()
