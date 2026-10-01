import { PALETTE as P, lerpColor } from '../../config/palette';
import { FRAME } from '../../levels/tiles';
import { seeded, type PixelCanvas } from './PixelCanvas';

// ---------------------------------------------------------------- Tileset

function speckle(pc: PixelCanvas, seed: number, colors: number[], count: number, top = 0): void {
  const rnd = seeded(seed);
  for (let i = 0; i < count; i++) {
    pc.px(Math.floor(rnd() * 16), top + Math.floor(rnd() * (16 - top)), colors[i % colors.length]);
  }
}

function dirtBase(pc: PixelCanvas, seed: number, deep = false): void {
  pc.rect(0, 0, 16, 16, deep ? P.dirt0 : P.dirt1);
  speckle(pc, seed, deep ? [P.dirt1, 0x221620] : [P.dirt2, P.dirt0, P.dirt0], deep ? 10 : 14);
  if (!deep) {
    const rnd = seeded(seed + 1);
    const sx = Math.floor(rnd() * 10) + 2;
    const sy = Math.floor(rnd() * 10) + 3;
    pc.rect(sx, sy, 3, 2, P.rock1).px(sx, sy, P.rock2);
  }
}

function rockBase(pc: PixelCanvas, seed: number): void {
  pc.rect(0, 0, 16, 16, P.rock1);
  const rnd = seeded(seed);
  // Chunky stones with dark cracks.
  pc.line(0, 5 + Math.floor(rnd() * 3), 16, 4 + Math.floor(rnd() * 4), P.rock0);
  pc.line(5 + Math.floor(rnd() * 6), 0, 3 + Math.floor(rnd() * 8), 16, P.rock0);
  pc.line(8, 10, 16, 12 + Math.floor(rnd() * 3), P.rock0);
  speckle(pc, seed + 5, [P.rock2, P.rock0], 8);
}

function grassTop(pc: PixelCanvas, seed: number, left: boolean, right: boolean, variant = false): void {
  pc.rect(0, 0, 16, 5, P.grass0);
  pc.rect(0, 0, 16, 2, P.grass1);
  pc.rect(0, 0, 16, 1, P.grass2);
  const rnd = seeded(seed);
  for (let x = 0; x < 16; x++) {
    const drop = rnd() > 0.55 ? 1 : 0;
    pc.px(x, 5 + drop, P.grass0);
    if (rnd() > 0.7) pc.px(x, 5 + drop + 1, 0x24573e);
  }
  if (variant) pc.px(4, 0, 0xffe07a).px(11, 1, 0xff8fb8);
  if (left) {
    pc.rect(0, 0, 2, 16, P.dirt0);
    pc.rect(0, 0, 3, 3, P.grass1);
  }
  if (right) {
    pc.rect(14, 0, 2, 16, P.dirt0);
    pc.rect(13, 0, 3, 3, P.grass1);
  }
}

function rockTop(pc: PixelCanvas, left: boolean, right: boolean): void {
  pc.rect(0, 0, 16, 3, P.rock2);
  pc.rect(0, 0, 16, 1, 0x7c86b0);
  pc.rect(0, 3, 16, 1, P.rock0);
  if (left) pc.rect(0, 0, 2, 16, P.rock0).rect(0, 0, 3, 2, P.rock2);
  if (right) pc.rect(14, 0, 2, 16, P.rock0).rect(13, 0, 3, 2, P.rock2);
}

function platform(pc: PixelCanvas, left: boolean, right: boolean): void {
  // A thick branch / plank: one-way, so it reads clearly as "stand on top".
  pc.rect(0, 0, 16, 5, P.wood1);
  pc.rect(0, 0, 16, 1, P.wood2);
  pc.rect(0, 4, 16, 1, P.wood0);
  pc.px(4, 2, P.wood0).px(11, 2, P.wood0).px(12, 3, P.wood0);
  if (left) {
    pc.rect(0, 0, 1, 5, P.wood0);
    pc.rect(2, 5, 2, 3, P.wood0);
  }
  if (right) {
    pc.rect(15, 0, 1, 5, P.wood0);
    pc.rect(12, 5, 2, 3, P.wood0);
  }
}

export function drawTile(pc: PixelCanvas, frame: number): void {
  const seed = frame * 97 + 13;
  switch (frame) {
    case FRAME.GRASS_TOP:
    case FRAME.GRASS_TOP_VAR:
    case FRAME.GRASS_TOP_L:
    case FRAME.GRASS_TOP_R:
    case FRAME.GRASS_TOP_S: {
      dirtBase(pc, seed);
      const l = frame === FRAME.GRASS_TOP_L || frame === FRAME.GRASS_TOP_S;
      const r = frame === FRAME.GRASS_TOP_R || frame === FRAME.GRASS_TOP_S;
      grassTop(pc, seed, l, r, frame === FRAME.GRASS_TOP_VAR);
      return;
    }
    case FRAME.DIRT:
    case FRAME.DIRT_VAR:
      dirtBase(pc, seed);
      return;
    case FRAME.DIRT_DEEP:
      dirtBase(pc, seed, true);
      return;
    case FRAME.DIRT_L:
      dirtBase(pc, seed);
      pc.rect(0, 0, 2, 16, P.dirt0);
      return;
    case FRAME.DIRT_R:
      dirtBase(pc, seed);
      pc.rect(14, 0, 2, 16, P.dirt0);
      return;
    case FRAME.DIRT_BOTTOM:
      dirtBase(pc, seed);
      pc.rect(0, 13, 16, 3, P.dirt0);
      pc.px(3, 15, 0x3a5a2a).px(9, 15, 0x3a5a2a);
      return;
    case FRAME.ROCK:
    case FRAME.ROCK_VAR:
      rockBase(pc, seed);
      if (frame === FRAME.ROCK_VAR) pc.rect(6, 6, 3, 2, 0x5ee6ff, 0.7);
      return;
    case FRAME.ROCK_TOP:
    case FRAME.ROCK_TOP_L:
    case FRAME.ROCK_TOP_R:
    case FRAME.ROCK_TOP_S:
      rockBase(pc, seed);
      rockTop(
        pc,
        frame === FRAME.ROCK_TOP_L || frame === FRAME.ROCK_TOP_S,
        frame === FRAME.ROCK_TOP_R || frame === FRAME.ROCK_TOP_S,
      );
      return;
    case FRAME.ROCK_L:
      rockBase(pc, seed);
      pc.rect(0, 0, 2, 16, P.rock0);
      return;
    case FRAME.ROCK_R:
      rockBase(pc, seed);
      pc.rect(14, 0, 2, 16, P.rock0);
      return;
    case FRAME.ROCK_BOTTOM:
      rockBase(pc, seed);
      pc.rect(0, 14, 16, 2, P.rock0);
      return;
    case FRAME.PLATFORM_L:
      platform(pc, true, false);
      return;
    case FRAME.PLATFORM_M:
      platform(pc, false, false);
      return;
    case FRAME.PLATFORM_R:
      platform(pc, false, true);
      return;
    case FRAME.PLATFORM_S:
      platform(pc, true, true);
      return;
  }
}

// ---------------------------------------------------------------- Backgrounds

export function drawSky(pc: PixelCanvas): void {
  pc.verticalGradient(0, 0, pc.width, pc.height, [
    [0, P.sky0],
    [0.45, P.sky1],
    [0.75, P.sky2],
    [0.92, P.sky3],
    [1, P.horizonGlow],
  ]);
}

export function drawStars(pc: PixelCanvas): void {
  const rnd = seeded(2024);
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rnd() * pc.width);
    const y = Math.floor(rnd() * pc.height);
    const bright = rnd();
    pc.px(x, y, P.star, bright > 0.85 ? 1 : 0.35 + bright * 0.4);
    if (bright > 0.96) {
      pc.px(x - 1, y, P.star, 0.4).px(x + 1, y, P.star, 0.4).px(x, y - 1, P.star, 0.4).px(x, y + 1, P.star, 0.4);
    }
  }
}

export function drawMoon(pc: PixelCanvas): void {
  const c = pc.width / 2;
  pc.circle(c, c, c - 3, P.moon);
  pc.circle(c - 5, c - 4, 4, 0xc9d6f0);
  pc.circle(c + 6, c + 3, 3, 0xc9d6f0);
  pc.circle(c + 1, c + 9, 2, 0xd6e0f5);
}

function ridge(pc: PixelCanvas, seed: number, base: number, amp: number, color: number, freq: number): void {
  const rnd = seeded(seed);
  const phases = [rnd() * 6, rnd() * 6, rnd() * 6];
  const w = pc.width;
  for (let x = 0; x < w; x++) {
    const t = (x / w) * Math.PI * 2;
    const h =
      Math.sin(t * freq + phases[0]) * 0.5 + Math.sin(t * freq * 2 + phases[1]) * 0.3 + Math.sin(t * freq * 5 + phases[2]) * 0.2;
    const top = Math.round(base - h * amp);
    pc.vline(x, top, pc.height - 1, color);
  }
}

export function drawMountains(pc: PixelCanvas): void {
  ridge(pc, 11, pc.height * 0.55, pc.height * 0.4, lerpColor(P.mountain, P.sky2, 0.35), 2);
  ridge(pc, 12, pc.height * 0.7, pc.height * 0.3, P.mountain, 3);
}

function pine(pc: PixelCanvas, x: number, baseY: number, height: number, color: number, highlight?: number): void {
  const w = Math.max(3, Math.round(height * 0.34));
  const tiers = Math.max(3, Math.round(height / 9));
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers;
    const y0 = Math.round(baseY - height + t0 * height * 0.85);
    const tierH = Math.round(height / tiers + 4);
    const halfW = Math.round(w * (0.35 + t0 * 0.75));
    pc.poly(
      [
        [x, y0],
        [x + halfW, y0 + tierH],
        [x - halfW, y0 + tierH],
      ],
      color,
    );
    if (highlight !== undefined) pc.px(x, y0 + 1, highlight);
  }
  pc.rect(x - 1, baseY - 4, 2, 4, color);
}

export function drawPines(pc: PixelCanvas, frame: number): void {
  const far = frame === 0;
  const rnd = seeded(far ? 77 : 78);
  const color = far ? P.pineFar : P.pineMid;
  const highlight = far ? undefined : lerpColor(P.pineMid, P.sky2, 0.4);
  const count = far ? 26 : 16;
  const base = pc.height;
  pc.rect(0, base - (far ? 16 : 22), pc.width, far ? 16 : 22, color);
  for (let i = 0; i < count; i++) {
    const x = Math.floor((i / count) * pc.width + rnd() * 12);
    const h = far ? 40 + rnd() * 50 : 70 + rnd() * 80;
    pine(pc, x, base - (far ? 10 : 14), h, color, highlight);
    // Wrap so the texture tiles seamlessly.
    if (x < 30) pine(pc, x + pc.width, base - (far ? 10 : 14), h, color, highlight);
    if (x > pc.width - 30) pine(pc, x - pc.width, base - (far ? 10 : 14), h, color, highlight);
  }
}

export function drawFog(pc: PixelCanvas): void {
  const rnd = seeded(5);
  for (let i = 0; i < 18; i++) {
    const x = rnd() * pc.width;
    const y = pc.height * (0.3 + rnd() * 0.5);
    const r = 14 + rnd() * 22;
    for (const dx of [0, -pc.width, pc.width]) {
      pc.radial(x + dx, y, r, [
        [0, P.fog, 0.22],
        [1, P.fog, 0],
      ]);
    }
  }
}

export function drawTrunks(pc: PixelCanvas): void {
  // Near-foreground ferns and grass along the bottom edge; scroll faster than the world for depth.
  const rnd = seeded(404);
  const base = pc.height;
  for (let x = 0; x < pc.width; x += 2) {
    const h = 3 + Math.floor(rnd() * 7) + (Math.sin(x * 0.05) + 1) * 3;
    pc.vline(x, base - h, base - 1, 0x05070f);
    pc.vline(x + 1, base - h + 2, base - 1, 0x05070f);
  }
  for (let i = 0; i < 7; i++) {
    const cx = Math.floor(rnd() * pc.width);
    const size = 10 + Math.floor(rnd() * 12);
    for (let k = -3; k <= 3; k++) {
      pc.line(cx, base, cx + k * size * 0.35, base - size + Math.abs(k) * 2, 0x05070f, 2);
    }
  }
}

export function drawCrashGlow(pc: PixelCanvas): void {
  pc.radial(pc.width / 2, pc.height, pc.height, [
    [0, P.fire3, 0.55],
    [0.5, P.enemyDark, 0.25],
    [1, P.enemyDark, 0],
  ]);
}

// ---------------------------------------------------------------- Omnitrix Training simulation

const SIM = {
  base: 0x0e1b1e,
  panel: 0x15282b,
  seam: 0x203d40,
  deep: 0x0a1416,
  rim: P.omnitrix,
  rimDark: P.omnitrixDark,
} as const;

function simPanel(pc: PixelCanvas, deep = false): void {
  pc.rect(0, 0, 16, 16, deep ? SIM.deep : SIM.panel);
  pc.hline(0, 15, 7, SIM.seam);
  pc.vline(7, 0, 15, SIM.seam);
  pc.px(2, 2, SIM.seam).px(12, 2, SIM.seam).px(2, 12, SIM.seam).px(12, 12, SIM.seam);
  for (let y = 1; y < 16; y += 3) pc.rect(0, y, 16, 1, 0x000000, 0.12);
}

/** Training tileset: dark metal panels with glowing Omnitrix-green rims (same frame layout as the forest). */
export function drawSimTile(pc: PixelCanvas, frame: number): void {
  const F = FRAME;
  const top: number[] = [F.GRASS_TOP, F.GRASS_TOP_VAR, F.GRASS_TOP_L, F.GRASS_TOP_R, F.GRASS_TOP_S, F.ROCK_TOP, F.ROCK_TOP_L, F.ROCK_TOP_R, F.ROCK_TOP_S];
  const left: number[] = [F.GRASS_TOP_L, F.GRASS_TOP_S, F.ROCK_TOP_L, F.ROCK_TOP_S, F.DIRT_L, F.ROCK_L];
  const right: number[] = [F.GRASS_TOP_R, F.GRASS_TOP_S, F.ROCK_TOP_R, F.ROCK_TOP_S, F.DIRT_R, F.ROCK_R];
  const platform: number[] = [F.PLATFORM_L, F.PLATFORM_M, F.PLATFORM_R, F.PLATFORM_S];
  if (platform.includes(frame)) {
    pc.rect(0, 0, 16, 4, SIM.rimDark, 0.85);
    pc.rect(0, 0, 16, 1, SIM.rim);
    pc.rect(0, 3, 16, 1, P.omnitrixDeep);
    for (let x = 1; x < 16; x += 4) pc.px(x, 2, P.omnitrixGlow);
    if (frame === F.PLATFORM_L || frame === F.PLATFORM_S) pc.rect(0, 0, 1, 4, SIM.rim);
    if (frame === F.PLATFORM_R || frame === F.PLATFORM_S) pc.rect(15, 0, 1, 4, SIM.rim);
    return;
  }
  simPanel(pc, frame === F.DIRT_DEEP);
  if (top.includes(frame)) {
    pc.rect(0, 0, 16, 2, SIM.rim);
    pc.rect(0, 2, 16, 1, SIM.rimDark);
    pc.px(4, 0, P.omnitrixGlow).px(11, 0, P.omnitrixGlow);
  }
  if (left.includes(frame)) pc.rect(0, 0, 1, 16, SIM.rimDark);
  if (right.includes(frame)) pc.rect(15, 0, 1, 16, SIM.rimDark);
  if (frame === F.DIRT_BOTTOM || frame === F.ROCK_BOTTOM) pc.rect(0, 15, 16, 1, SIM.rimDark);
}

export function drawSimSky(pc: PixelCanvas): void {
  pc.verticalGradient(0, 0, pc.width, pc.height, [
    [0, 0x030a0b],
    [0.55, 0x0a1d1f],
    [1, 0x123331],
  ]);
}

/** A faint holographic grid, tiled behind the arena. 64x64. */
export function drawSimGrid(pc: PixelCanvas): void {
  pc.rect(0, 0, 64, 1, P.omnitrix, 0.5).rect(0, 0, 1, 64, P.omnitrix, 0.5);
  pc.rect(32, 0, 1, 64, P.omnitrix, 0.18).rect(0, 32, 64, 1, P.omnitrix, 0.18);
  pc.px(0, 0, P.omnitrixGlow);
}

/** Blocky "data towers" on the horizon of the simulation. 256x120. */
export function drawSimTowers(pc: PixelCanvas): void {
  const rnd = seeded(71);
  let x = 0;
  while (x < pc.width) {
    const w = 10 + Math.floor(rnd() * 22);
    const h = 30 + Math.floor(rnd() * 80);
    pc.rect(x, pc.height - h, w, h, 0x0c2224);
    pc.rect(x, pc.height - h, w, 1, P.omnitrixDark);
    for (let y = pc.height - h + 6; y < pc.height; y += 7) {
      if (rnd() < 0.35) pc.rect(x + 2 + Math.floor(rnd() * Math.max(1, w - 5)), y, 2, 1, P.omnitrix, 0.6);
    }
    x += w + 2 + Math.floor(rnd() * 8);
  }
}
