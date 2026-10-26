import Phaser from 'phaser';
import { TILE } from '../../../../config/constants';
import { FRAME, TILESET_FRAME_COUNT } from '../../../../levels/tiles';
import { INK, LINE, mix, Paint, shadeOf } from '../paint';

/**
 * The Plumber base's HD tiles (Chapter 7): the same 24-frame layout as every
 * tileset (so the level's autotiling picks them), painted at `res`, twice:
 * frames 0-23 are the base (deck plating, bulkheads, catwalks), 24-47 the sea
 * floor outside the hull (sand over rock, coral catwalks). Tiles sit in
 * padded cells with their edges extruded, so smooth filtering never bleeds.
 */

export const HD_TILES_KEY = 'hd-tiles-plumber';
/** Texels of padding around each tile (filled with the tile's own edge). */
export const HD_TILE_PAD = 2;
/** Frames per material set (the sea set starts here). */
export const HD_SEA_OFFSET = TILESET_FRAME_COUNT;

const T = TILE;

interface Look {
  top: number;
  topLight: number;
  body: number;
  bodyDark: number;
  seam: number;
  bolt: number;
  trim: number;
}

const DECK: Look = { top: 0x8a9cba, topLight: 0xc8d6ea, body: 0x4a5874, bodyDark: 0x343f58, seam: 0x262e44, bolt: 0x7a8aa8, trim: 0xe8d040 };
const BULKHEAD: Look = { top: 0x5a6888, topLight: 0x95a6c6, body: 0x2c3650, bodyDark: 0x1e2740, seam: 0x141a2c, bolt: 0x56658a, trim: 0x5dff9a };
const SAND: Look = { top: 0xd8c690, topLight: 0xf4e6b8, body: 0x3c4c5c, bodyDark: 0x2a3644, seam: 0x1c2632, bolt: 0x5a6c7c, trim: 0xff8a6a };
const REEF: Look = { top: 0x5e7a6a, topLight: 0x9ac0a8, body: 0x30404c, bodyDark: 0x222e38, seam: 0x161e28, bolt: 0x4a5c68, trim: 0xff7aa8 };

type Edge = { top: boolean; left: boolean; right: boolean; bottom: boolean };
const E = (top: boolean, left: boolean, right: boolean, bottom: boolean): Edge => ({ top, left, right, bottom });

/** Which sides of each frame are open (the autotiler's meaning of every frame). */
function edgesOf(frame: number): Edge | 'platform' {
  switch (frame) {
    case FRAME.GRASS_TOP:
    case FRAME.GRASS_TOP_VAR:
    case FRAME.ROCK_TOP:
      return E(true, false, false, false);
    case FRAME.GRASS_TOP_L:
    case FRAME.ROCK_TOP_L:
      return E(true, true, false, false);
    case FRAME.GRASS_TOP_R:
    case FRAME.ROCK_TOP_R:
      return E(true, false, true, false);
    case FRAME.GRASS_TOP_S:
    case FRAME.ROCK_TOP_S:
      return E(true, true, true, false);
    case FRAME.DIRT_L:
    case FRAME.ROCK_L:
      return E(false, true, false, false);
    case FRAME.DIRT_R:
    case FRAME.ROCK_R:
      return E(false, false, true, false);
    case FRAME.DIRT_BOTTOM:
    case FRAME.ROCK_BOTTOM:
      return E(false, false, false, true);
    case FRAME.PLATFORM_L:
    case FRAME.PLATFORM_M:
    case FRAME.PLATFORM_R:
    case FRAME.PLATFORM_S:
      return 'platform';
    default:
      return E(false, false, false, false);
  }
}

const isRock = (frame: number) => (frame >= FRAME.ROCK_TOP && frame <= FRAME.ROCK_BOTTOM) || frame === FRAME.ROCK_VAR;

/** A plate of metal (or rock under sand): body, seams, bolts, then the open edges' caps and ink. */
function solidTile(p: Paint, look: Look, edge: Edge, frame: number, sea: boolean): void {
  // Body: a soft vertical gradient, darker toward the bottom of the tile.
  p.fill(p.rrect(0, 0, T, T, 0), { linear: [0, 0, 0, T], stops: [[0, look.body], [1, look.bodyDark]] });
  if (sea) {
    // Rock: rounded boulders with cracks.
    for (const [x, y, rx, ry] of [[4, 6, 5, 4], [12, 11, 5, 4.5], [3, 14, 4, 3]] as const) {
      p.fill(p.ellipse(x, y, rx, ry), mix(look.body, 0x6a8090, 0.25), 0.55);
      p.fill(p.ellipse(x - rx * 0.3, y - ry * 0.35, rx * 0.45, ry * 0.3), 0x8aa4b4, 0.18);
    }
    p.line([2, 9, 6, 10, 8, 13], LINE * 0.45, look.seam, true, 0.6);
    if (frame === FRAME.DIRT_VAR || frame === FRAME.ROCK_VAR) {
      // A tuft of glowing sea moss.
      for (let i = 0; i < 4; i++) p.fill(p.circle(9 + i * 1.4, 5 + (i % 2), 0.8), 0x7ff0c8, 0.6);
    }
  } else {
    // Riveted plates: a seam down the left and across the top of each tile, a highlight beside it.
    p.line([0.3, 0, 0.3, T], 0.6, look.seam, false, 0.9);
    p.line([1.0, 0, 1.0, T], 0.35, look.topLight, false, 0.18);
    const interior = !edge.top && !edge.left && !edge.right && !edge.bottom;
    if (isRock(frame) && interior) {
      // Deep inside the hull: one even, dark mass with faint seams (no busy pattern).
      p.fill(p.rrect(0, 0, T, T, 0), look.bodyDark, 0.6);
      p.line([0, 0.3, T, 0.3], 0.5, look.seam, false, 0.5);
    } else {
      for (const [x, y] of [[3, 3], [13, 3], [3, 13], [13, 13]] as const) {
        p.fill(p.circle(x, y, 0.85), look.seam, 0.9);
        p.fill(p.circle(x - 0.2, y - 0.25, 0.55), look.bolt);
      }
    }
    if (frame === FRAME.DIRT_VAR) {
      // A vent grille.
      p.fill(p.rrect(4, 5, 8, 6, 1), look.seam, 0.9);
      for (let i = 0; i < 4; i++) p.line([5, 6.2 + i * 1.3, 11, 6.2 + i * 1.3], 0.5, look.bolt, false, 0.6);
    }
  }
  if (edge.top) {
    // The deck's cap (or sand over the rock): bright, with a lit lip and the ink line on top.
    const capH = sea ? 4.4 : 4;
    const cap = sea ? p.smooth([0, 0.4, 4, 0.0, 8, 0.6, 12, 0.1, 16, 0.4, 16, capH + 0.6, 12, capH, 8, capH + 0.8, 4, capH, 0, capH + 0.6], true, 0.4) : p.rrect(0, 0, T, capH, 0);
    p.fill(cap, { linear: [0, 0, 0, capH], stops: [[0, look.topLight], [0.4, look.top], [1, shadeOf(look.top, 0.25)]] });
    if (sea) {
      for (const [x, y] of [[3, 2.4], [9, 1.8], [13, 2.8]] as const) p.fill(p.ellipse(x, y, 0.8, 0.5), shadeOf(look.top, 0.3), 0.7);
    } else {
      p.line([0, capH, T, capH], 0.7, look.seam, false, 0.9);
      // A Plumber trim stripe along the deck edge.
      p.fill(p.rrect(0, capH + 0.6, T, 0.9, 0), look.trim, isRock(frame) ? 0.35 : 0.75);
      if (frame === FRAME.GRASS_TOP_VAR) {
        // A floor light: a small glowing lens set in the deck.
        p.glow(8, 2, 3.5, 0x9affc8, 0.5);
        p.fill(p.ellipse(8, 2, 1.8, 0.8), 0xe8fff2);
      }
    }
    p.line([0, 0.35, T, 0.35], LINE * 1.15, INK, false);
    p.line([0, 1.1, T, 1.1], 0.4, 0xffffff, false, 0.45);
  }
  if (edge.left) {
    p.fill(p.rrect(0, 0, 2.2, T, 0), shadeOf(look.body, 0.15), 0.5);
    p.line([0.35, edge.top ? 0.35 : 0, 0.35, T], LINE * 1.15, INK, false);
    p.line([1.1, edge.top ? 1.2 : 0, 1.1, T], 0.4, look.topLight, false, 0.35);
  }
  if (edge.right) {
    p.fill(p.rrect(T - 3, 0, 3, T, 0), look.seam, 0.45);
    p.line([T - 0.35, edge.top ? 0.35 : 0, T - 0.35, T], LINE * 1.15, INK, false);
  }
  if (edge.bottom) {
    // Underside: in shadow, an ink line along the bottom.
    p.fill(p.rrect(0, T - 4, T, 4, 0), { linear: [0, T - 4, 0, T], stops: [[0, look.bodyDark, 0], [1, look.seam, 0.85]] });
    p.line([0, T - 0.35, T, T - 0.35], LINE * 1.15, INK, false);
    if (!sea) for (const x of [4, 12]) p.fill(p.rrect(x - 1.5, T - 3, 3, 1.4, 0.5), 0x1a2238, 0.9);
  }
}

/** A one-way catwalk: a grated walkway with a lit edge (a coral ledge outside). */
function platformTile(p: Paint, frame: number, sea: boolean): void {
  const left = frame === FRAME.PLATFORM_L || frame === FRAME.PLATFORM_S;
  const right = frame === FRAME.PLATFORM_R || frame === FRAME.PLATFORM_S;
  const x0 = left ? 1 : 0;
  const x1 = right ? T - 1 : T;
  if (sea) {
    const ledge = p.smooth([x0, 1.5, (x0 + x1) / 2, 0.6, x1, 1.5, x1 - 1, 5.4, (x0 + x1) / 2, 6.4, x0 + 1, 5.4], true, 0.45);
    p.shape(ledge, { fill: { linear: [0, 0, 0, 6], stops: [[0, 0xff9ac0], [1, 0xb04a78]] }, light: 0xffd8e8, lightDepth: 0.6, ink: LINE });
    for (const x of [x0 + 3, (x0 + x1) / 2, x1 - 3]) p.fill(p.circle(x, 3.2, 0.7), 0x6a1a40, 0.6);
    return;
  }
  const deck = p.rrect(x0, 0.5, x1 - x0, 4, left || right ? 1 : 0);
  p.shape(deck, { fill: { linear: [0, 0.5, 0, 4.5], stops: [[0, 0xa8b8d0], [1, 0x5a6a88]] }, ink: LINE });
  p.within(deck, () => {
    for (let x = -4; x < T + 4; x += 2.4) p.line([x, 4.5, x + 3, 1.4], 0.5, 0x2a3450, false, 0.75);
    p.line([0, 1.3, T, 1.3], 0.5, 0xffffff, false, 0.5);
  });
  // Struts under it.
  for (const x of [x0 + 3, x1 - 3]) {
    if ((x === x0 + 3 && !left) || (x === x1 - 3 && !right)) continue;
    p.fill(p.poly([x - 1, 4.5, x + 1, 4.5, x + 0.4, 9, x - 0.4, 9]), 0x3a4662);
    p.line([x - 1, 4.5, x - 0.4, 9], LINE * 0.6, INK);
    p.line([x + 1, 4.5, x + 0.4, 9], LINE * 0.6, INK);
  }
}

function paintFrame(p: Paint, frame: number): void {
  const sea = frame >= HD_SEA_OFFSET;
  const f = frame % HD_SEA_OFFSET;
  const edge = edgesOf(f);
  if (edge === 'platform') {
    platformTile(p, f, sea);
    return;
  }
  const look = sea ? (isRock(f) ? REEF : SAND) : isRock(f) ? BULKHEAD : DECK;
  solidTile(p, look, edge, f, sea);
}

/**
 * Paints the tileset: one row of padded cells, each tile `res` texels per
 * game pixel. Its tiles are TILE * res texels with HD_TILE_PAD spacing and
 * margin (for addTilesetImage). Made once.
 */
export function makePlumberTiles(scene: Phaser.Scene, res: number): string {
  if (scene.textures.exists(HD_TILES_KEY)) return HD_TILES_KEY;
  const size = T * res;
  const cell = size + HD_TILE_PAD * 2;
  const count = HD_SEA_OFFSET * 2;
  // Two rows keep the atlas narrow enough for every phone.
  const perRow = HD_SEA_OFFSET;
  const rows = Math.ceil(count / perRow);
  const tex = scene.textures.createCanvas(HD_TILES_KEY, perRow * cell, rows * cell);
  if (!tex) return HD_TILES_KEY;
  const ctx = tex.getContext();
  for (let i = 0; i < count; i++) {
    const cx = (i % perRow) * cell;
    const cy = Math.floor(i / perRow) * cell;
    const ox = cx + HD_TILE_PAD;
    const oy = cy + HD_TILE_PAD;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, size, size);
    ctx.clip();
    paintFrame(new Paint(ctx, res, ox / res, oy / res), i);
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Extrude the edges into the padding.
    const P = HD_TILE_PAD;
    ctx.drawImage(tex.getSourceImage() as HTMLCanvasElement, ox, oy, size, 1, ox, oy - P, size, P);
    ctx.drawImage(tex.getSourceImage() as HTMLCanvasElement, ox, oy + size - 1, size, 1, ox, oy + size, size, P);
    ctx.drawImage(tex.getSourceImage() as HTMLCanvasElement, ox, oy - P, 1, size + P * 2, ox - P, oy - P, P, size + P * 2);
    ctx.drawImage(tex.getSourceImage() as HTMLCanvasElement, ox + size - 1, oy - P, 1, size + P * 2, ox + size, oy - P, P, size + P * 2);
  }
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return HD_TILES_KEY;
}

