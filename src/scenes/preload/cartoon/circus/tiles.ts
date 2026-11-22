import Phaser from 'phaser';
import { TILE } from '../../../../config/constants';
import { FRAME, TILESET_FRAME_COUNT } from '../../../../levels/tiles';
import { INK, LINE, mix, Paint, shadeOf } from '../paint';

/**
 * The circus's HD tiles (Chapter 8), in the same 24-frame layout as every
 * tileset, painted twice: frames 0-23 are the boardwalk outdoors (weathered
 * planks over dark pilings, stacked crates for rock), 24-47 the inside of the
 * funhouse and the big top (a checkerboard floor over harlequin-painted
 * walls, striped beams for platforms). Padded cells, edges extruded.
 */

export const CIRCUS_TILES_KEY = 'hd-tiles-circus';
export const CIRCUS_TILE_PAD = 2;
/** Frames per material set (the indoor set starts here). */
export const CIRCUS_INDOOR_OFFSET = TILESET_FRAME_COUNT;

const T = TILE;

type Edge = { top: boolean; left: boolean; right: boolean; bottom: boolean };
const E = (top: boolean, left: boolean, right: boolean, bottom: boolean): Edge => ({ top, left, right, bottom });

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

const WOOD = { plank: 0xb08a62, plankLight: 0xe0c094, plankDark: 0x6e4e34, under: 0x2c2230, underDark: 0x1c1620, brace: 0x46363e, nail: 0xd8d0c4 } as const;
const CRATE = { face: 0x8a5a3a, light: 0xc48a5a, dark: 0x4e3020, band: 0x2a1a14 } as const;
const FUN = { checkA: 0xf2e6cc, checkB: 0x2a1e3a, trim: 0xe83a5a, trimLight: 0xff8aa0, wall: 0x4a2a6a, wallDark: 0x30184a, diamond: 0x6a3a8e, gold: 0xf2c24a } as const;

/** Outdoors: boardwalk planks on top, the dark underside of the pier (or stacked crates for rock). */
function boardwalk(p: Paint, edge: Edge, frame: number): void {
  if (isRock(frame)) {
    // Stacked crates: a face, its planks and a dark band.
    p.fill(p.rrect(0, 0, T, T, 0), { linear: [0, 0, 0, T], stops: [[0, CRATE.light], [0.4, CRATE.face], [1, CRATE.dark]] });
    for (const y of [5.3, 10.6]) p.line([0, y, T, y], 0.5, CRATE.dark, false, 0.8);
    p.line([0.4, 0, 0.4, T], 0.7, CRATE.band, false);
    p.line([T - 0.4, 0, T - 0.4, T], 0.7, CRATE.band, false, 0.6);
    p.line([1, 1, T - 1, T - 1], 0.8, CRATE.dark, false, 0.5);
  } else {
    // Under the pier: shadow, cross-braces, a piling.
    p.fill(p.rrect(0, 0, T, T, 0), { linear: [0, 0, 0, T], stops: [[0, WOOD.under], [1, WOOD.underDark]] });
    const interior = !edge.top && !edge.left && !edge.right && !edge.bottom;
    if (!interior || frame === FRAME.DIRT_VAR) {
      p.line([0, 3, T, 13], 1.2, WOOD.brace, false, 0.9);
      p.line([0, 13, T, 3], 1.2, WOOD.brace, false, 0.6);
    }
    p.fill(p.rrect(6, 0, 4, T, 0), mix(WOOD.under, WOOD.brace, 0.5), 0.7);
  }
  if (edge.top) {
    // Weathered planks, gaps between them, nail heads.
    const capH = 4.6;
    p.fill(p.rrect(0, 0, T, capH, 0), { linear: [0, 0, 0, capH], stops: [[0, WOOD.plankLight], [0.35, WOOD.plank], [1, WOOD.plankDark]] });
    p.line([8, 0, 8, capH], 0.6, WOOD.plankDark, false, 0.9);
    for (const x of [2.4, 13.6]) p.fill(p.circle(x, 2.4, 0.45), WOOD.nail, 0.9);
    p.line([1, 1.6, 6, 1.4], 0.35, WOOD.plankDark, false, 0.6);
    if (frame === FRAME.GRASS_TOP_VAR) p.fill(p.ellipse(11, 2.2, 1.6, 0.6), shadeOf(WOOD.plank, 0.3), 0.6);
    p.line([0, 0.35, T, 0.35], LINE * 1.15, INK, false);
    p.line([0, capH, T, capH], 0.8, INK, false, 0.8);
  }
  edges(p, edge, WOOD.under);
}

/** Indoors: a checkerboard floor with a red trim over harlequin-painted walls. */
function funhouse(p: Paint, edge: Edge, frame: number): void {
  p.fill(p.rrect(0, 0, T, T, 0), { linear: [0, 0, 0, T], stops: [[0, FUN.wall], [1, FUN.wallDark]] });
  const interior = !edge.top && !edge.left && !edge.right && !edge.bottom;
  if (!(isRock(frame) && interior)) {
    // Harlequin diamonds with gold studs where they meet.
    const d = p.poly([8, 0.5, 15.5, 8, 8, 15.5, 0.5, 8]);
    p.fill(d, FUN.diamond, 0.85);
    p.stroke(d, FUN.wallDark, 0.6, 0.7);
    for (const [x, y] of [[0, 0], [T, 0], [0, T], [T, T]] as const) p.fill(p.circle(x, y, 1.2), FUN.gold, 0.8);
  } else {
    p.fill(p.rrect(0, 0, T, T, 0), FUN.wallDark, 0.5);
  }
  if (edge.top) {
    const capH = 4.2;
    // Two rows of checks, then the red trim with its light line.
    for (let x = 0; x < 4; x++) {
      p.fill(p.rrect(x * 4, 0, 4, 2.2, 0), x % 2 ? FUN.checkB : FUN.checkA);
      p.fill(p.rrect(x * 4, 2.2, 4, 1.4, 0), x % 2 ? FUN.checkA : FUN.checkB);
    }
    p.fill(p.rrect(0, 0, T, 0.9, 0), 0xffffff, 0.18);
    p.fill(p.rrect(0, capH - 0.6, T, 1.4, 0), FUN.trim);
    p.line([0, capH - 0.3, T, capH - 0.3], 0.35, FUN.trimLight, false, 0.8);
    p.line([0, 0.35, T, 0.35], LINE * 1.15, INK, false);
    p.line([0, capH + 0.8, T, capH + 0.8], 0.7, INK, false, 0.8);
  }
  edges(p, edge, FUN.wallDark);
}

function edges(p: Paint, edge: Edge, body: number): void {
  if (edge.left) {
    p.fill(p.rrect(0, 0, 2.2, T, 0), shadeOf(body, 0.2), 0.5);
    p.line([0.35, edge.top ? 0.35 : 0, 0.35, T], LINE * 1.15, INK, false);
  }
  if (edge.right) {
    p.fill(p.rrect(T - 3, 0, 3, T, 0), shadeOf(body, 0.35), 0.5);
    p.line([T - 0.35, edge.top ? 0.35 : 0, T - 0.35, T], LINE * 1.15, INK, false);
  }
  if (edge.bottom) {
    p.fill(p.rrect(0, T - 4, T, 4, 0), { linear: [0, T - 4, 0, T], stops: [[0, body, 0], [1, 0x0c0810, 0.85]] });
    p.line([0, T - 0.35, T, T - 0.35], LINE * 1.15, INK, false);
  }
}

/** A one-way ledge: a rope-slung plank outdoors, a red-and-white striped beam indoors. */
function platformTile(p: Paint, frame: number, indoor: boolean): void {
  const left = frame === FRAME.PLATFORM_L || frame === FRAME.PLATFORM_S;
  const right = frame === FRAME.PLATFORM_R || frame === FRAME.PLATFORM_S;
  const x0 = left ? 1 : 0;
  const x1 = right ? T - 1 : T;
  const beam = p.rrect(x0, 0.5, x1 - x0, 4, left || right ? 1.2 : 0);
  if (indoor) {
    p.shape(beam, { fill: 0xf4ecdc, ink: LINE });
    p.within(beam, () => {
      for (let x = -6; x < T + 6; x += 5) p.fill(p.poly([x, 4.5, x + 2.5, 4.5, x + 5.5, 0.5, x + 3, 0.5]), FUN.trim, 0.95);
      p.line([0, 1.3, T, 1.3], 0.5, 0xffffff, false, 0.6);
    });
    for (const x of [x0 + 3, x1 - 3]) {
      if ((x === x0 + 3 && !left) || (x === x1 - 3 && !right)) continue;
      p.fill(p.circle(x, 6.4, 1.2), FUN.gold);
      p.stroke(p.circle(x, 6.4, 1.2), INK, LINE * 0.6);
    }
    return;
  }
  p.shape(beam, { fill: { linear: [0, 0.5, 0, 4.5], stops: [[0, WOOD.plankLight], [1, WOOD.plankDark]] }, ink: LINE });
  p.within(beam, () => p.line([0, 1.4, T, 1.4], 0.4, 0xffffff, false, 0.4));
  // Rope lashings.
  for (const x of [x0 + 3, x1 - 3]) {
    if ((x === x0 + 3 && !left) || (x === x1 - 3 && !right)) continue;
    p.line([x, 0.2, x, 4.8], 1.1, 0xd8c28a, false);
    p.line([x, 0.2, x, 4.8], 0.4, 0x6a5430, false);
  }
}

function paintFrame(p: Paint, frame: number): void {
  const indoor = frame >= CIRCUS_INDOOR_OFFSET;
  const f = frame % CIRCUS_INDOOR_OFFSET;
  const edge = edgesOf(f);
  if (edge === 'platform') platformTile(p, f, indoor);
  else if (indoor) funhouse(p, edge, f);
  else boardwalk(p, edge, f);
}

/** Paints the tileset (both sets, two rows of padded cells), once. */
export function makeCircusTiles(scene: Phaser.Scene, res: number): string {
  if (scene.textures.exists(CIRCUS_TILES_KEY)) return CIRCUS_TILES_KEY;
  const size = T * res;
  const cell = size + CIRCUS_TILE_PAD * 2;
  const perRow = CIRCUS_INDOOR_OFFSET;
  const count = perRow * 2;
  const tex = scene.textures.createCanvas(CIRCUS_TILES_KEY, perRow * cell, 2 * cell);
  if (!tex) return CIRCUS_TILES_KEY;
  const ctx = tex.getContext();
  const src = tex.getSourceImage() as HTMLCanvasElement;
  const P = CIRCUS_TILE_PAD;
  for (let i = 0; i < count; i++) {
    const ox = (i % perRow) * cell + P;
    const oy = Math.floor(i / perRow) * cell + P;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, size, size);
    ctx.clip();
    paintFrame(new Paint(ctx, res, ox / res, oy / res), i);
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(src, ox, oy, size, 1, ox, oy - P, size, P);
    ctx.drawImage(src, ox, oy + size - 1, size, 1, ox, oy + size, size, P);
    ctx.drawImage(src, ox, oy - P, 1, size + P * 2, ox - P, oy - P, P, size + P * 2);
    ctx.drawImage(src, ox + size - 1, oy - P, 1, size + P * 2, ox + size, oy - P, P, size + P * 2);
  }
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return CIRCUS_TILES_KEY;
}
