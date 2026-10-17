import { PALETTE as P } from '../../../config/palette';
import type { PixelCanvas } from '../PixelCanvas';
import { KARACHI as K } from './colors';

/**
 * Chapter 6's enemies: Charmcaster's rocklings (small stone critters that
 * curl into a ball and bowl at Ben) and stone golems (a rune glowing in the
 * chest: their weak point), the palace's enchanted armor (a round shield in
 * front), gargoyles (stone while they sit, beasts when they wake) and the
 * fair's bewitched kites. Every frame is outlined like the rest of the cast.
 */

// ---------------------------------------------------------------- Rockling (16x14)

export const ROCKLING_FRAMES = { idle: [0, 1], roll: [2, 3], windup: [4], dazed: [5] } as const;

/** Frames: 0-1 standing (blink), 2-3 rolling ball, 4 about to roll (seams flare), 5 dazed. */
export function drawRockling(pc: PixelCanvas, frame: number): void {
  if (frame === 2 || frame === 3) {
    pc.circle(8, 8, 5, K.rock1);
    pc.circle(7, 7, 3, K.rock2);
    const a = frame === 2 ? 0 : Math.PI / 4;
    for (let i = 0; i < 4; i++) {
      const t = a + (i * Math.PI) / 2;
      pc.px(8 + Math.round(Math.cos(t) * 4), 8 + Math.round(Math.sin(t) * 4), K.rune);
    }
    pc.outline(P.ink);
    return;
  }
  // Body: a lumpy boulder on stubby legs, two glowing eyes.
  pc.rect(4, 11, 2, 3, K.rock0).rect(10, 11, 2, 3, K.rock0);
  pc.ellipse(8, 7, 6, 5, K.rock1);
  pc.ellipse(7, 5, 4, 3, K.rock2);
  pc.px(4, 3, K.rock3).px(10, 2, K.rock3);
  const glow = frame === 4 ? P.white : K.rune;
  if (frame === 1) pc.rect(5, 7, 2, 1, K.rock0).rect(10, 7, 2, 1, K.rock0);
  else if (frame === 5) pc.px(5, 7, K.rune).px(6, 6, K.rune).px(10, 7, K.rune).px(11, 6, K.rune);
  else pc.rect(5, 6, 2, 2, glow).rect(10, 6, 2, 2, glow);
  if (frame === 4) pc.line(3, 9, 13, 9, K.charmGlow);
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Golem (44x52)

export const GOLEM_FRAMES = { idle: [0], walk: [1, 2], windup: [3], slam: [4], stunned: [5] } as const;

/** Frames: 0 idle, 1-2 walk, 3 fists raised (the tell), 4 slam, 5 stunned (kneeling, rune exposed). */
export function drawGolem(pc: PixelCanvas, frame: number): void {
  const kneel = frame === 5 ? 6 : 0;
  // Legs.
  const step = frame === 1 ? -2 : frame === 2 ? 2 : 0;
  pc.rect(12 + step, 38 + kneel, 8, 14 - kneel, K.rock0);
  pc.rect(25 - step, 38 + kneel, 8, 14 - kneel, K.rock0);
  // Torso: stacked boulders.
  pc.ellipse(22, 28 + kneel, 15, 12, K.rock1);
  pc.ellipse(20, 24 + kneel, 11, 8, K.rock2);
  pc.px(14, 20 + kneel, K.rock3).px(26, 18 + kneel, K.rock3).px(30, 26 + kneel, K.rock3);
  // The rune in its chest (its weak point) glows brighter when it's open.
  pc.circle(22, 29 + kneel, 4, frame === 5 ? P.white : K.charm1);
  pc.circle(22, 29 + kneel, 2, K.charmGlow);
  // Head.
  pc.ellipse(22, 12 + kneel, 7, 6, K.rock1);
  pc.rect(18, 11 + kneel, 3, 2, K.rune).rect(24, 11 + kneel, 3, 2, K.rune);
  // Arms: down, raised over the head, or slammed into the floor.
  if (frame === 3) {
    pc.ellipse(8, 8, 6, 6, K.rock1).ellipse(36, 8, 6, 6, K.rock1);
    pc.rect(6, 12, 6, 14, K.rock0).rect(33, 12, 6, 14, K.rock0);
  } else if (frame === 4) {
    pc.ellipse(6, 46, 6, 5, K.rock1).ellipse(38, 46, 6, 5, K.rock1);
    pc.rect(5, 26, 6, 18, K.rock0).rect(34, 26, 6, 18, K.rock0);
  } else {
    pc.rect(4, 22 + kneel, 6, 16, K.rock0).rect(34, 22 + kneel, 6, 16, K.rock0);
    pc.ellipse(7, 40 + kneel, 5, 4, K.rock1).ellipse(37, 40 + kneel, 5, 4, K.rock1);
  }
  if (frame === 5) for (let i = 0; i < 3; i++) pc.px(14 + i * 7, 4 + (i % 2), K.rock3);
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Enchanted armor (26x36)

export const ARMOR_FRAMES = { idle: [0], walk: [1, 2], windup: [3], strike: [4], staggered: [5] } as const;

/**
 * Frames: 0 idle (round shield in front), 1-2 walk, 3 sword raised, 4 strike,
 * 5 staggered (shield knocked aside). Faces right; a violet glow behind the visor.
 */
export function drawArmor(pc: PixelCanvas, frame: number): void {
  const step = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  pc.rect(8 + step, 26, 4, 10, K.steel0).rect(14 - step, 26, 4, 10, K.steel0);
  pc.rect(7 + step, 34, 6, 2, K.steel1).rect(13 - step, 34, 6, 2, K.steel1);
  // Breastplate and helm with a plume.
  pc.rect(7, 12, 12, 14, K.steel1);
  pc.rect(8, 13, 10, 3, K.steel2);
  pc.rect(9, 4, 9, 8, K.steel1);
  pc.rect(10, 5, 7, 2, K.steel2);
  pc.rect(10, 8, 8, 1, 0x0a0a10);
  pc.px(15, 8, K.hexGlow).px(16, 8, K.hexGlow);
  pc.rect(12, 1, 3, 3, K.truckRed);
  // Sword arm (behind) and shield arm (in front).
  if (frame === 3) {
    pc.rect(4, 4, 3, 10, K.steel0);
    pc.rect(4, -0, 2, 6, K.steel3);
    pc.rect(3, 2, 4, 1, K.brass1);
  } else if (frame === 4) {
    pc.rect(18, 14, 6, 3, K.steel0);
    pc.rect(20, 15, 6, 2, K.steel3);
  } else {
    pc.rect(5, 14, 3, 10, K.steel0);
    pc.rect(5, 20, 2, 10, K.steel3);
  }
  // The round shield (shoved aside when staggered).
  const sx = frame === 5 ? 3 : 20;
  const sy = frame === 5 ? 26 : 20;
  pc.circle(sx, sy, 6, K.steel2);
  pc.circle(sx, sy, 4, K.tile1);
  pc.circle(sx, sy, 1, K.brass2);
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Gargoyle (32x24)

export const GARGOYLE_FRAMES = { idle: [0], perch: [0], wake: [1], fly: [2, 3], dive: [4] } as const;

/** Frames: 0 perched stone (dull, invulnerable), 1 waking (eyes lit, cracks), 2-3 wings up/down, 4 diving. */
export function drawGargoyle(pc: PixelCanvas, frame: number): void {
  const stone = frame === 0;
  const body = stone ? K.garg1 : 0x5a5a6e;
  const dark = stone ? K.garg0 : 0x3a3a4e;
  if (frame === 4) {
    // Diving: wings swept back, claws out.
    pc.poly([[4, 6], [16, 10], [4, 14]], dark);
    pc.ellipse(18, 12, 8, 5, body);
    pc.ellipse(26, 11, 4, 3, body);
    pc.px(28, 10, K.rune).px(29, 10, K.rune);
    pc.line(16, 16, 20, 22, dark).line(20, 16, 24, 21, dark);
    pc.outline(P.ink);
    return;
  }
  // Body hunched; wings by state.
  if (stone || frame === 1) {
    pc.poly([[6, 6], [12, 2], [14, 16], [6, 18]], dark);
    pc.poly([[26, 6], [20, 2], [18, 16], [26, 18]], dark);
  } else if (frame === 2) {
    pc.poly([[14, 10], [0, 0], [4, 12]], dark);
    pc.poly([[18, 10], [32, 0], [28, 12]], dark);
  } else {
    pc.poly([[14, 12], [0, 20], [6, 10]], dark);
    pc.poly([[18, 12], [32, 20], [26, 10]], dark);
  }
  pc.ellipse(16, 14, 7, 6, body);
  pc.ellipse(16, 7, 5, 4, body);
  pc.poly([[12, 4], [11, 0], [14, 3]], dark).poly([[20, 4], [21, 0], [18, 3]], dark);
  pc.rect(12, 20, 3, 4, dark).rect(18, 20, 3, 4, dark);
  const eye = stone ? K.garg0 : frame === 1 ? P.white : K.rune;
  pc.px(14, 7, eye).px(18, 7, eye);
  pc.rect(14, 9, 5, 1, dark);
  if (frame === 1) pc.line(10, 12, 13, 16, K.rune).line(20, 10, 22, 14, K.rune);
  if (stone) for (const [x, y] of [[13, 13], [19, 15], [16, 18]] as const) pc.px(x, y, K.garg2);
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Bewitched kite (22x26)

export const KITE_FRAMES = { idle: [0, 1], hover: [0, 1], dive: [2] } as const;

/** Frames: 0-1 hovering (tail flutters), 2 diving. A paper patang with painted eyes glowing violet. */
export function drawKite(pc: PixelCanvas, frame: number): void {
  const tilt = frame === 2 ? 2 : 0;
  pc.poly([[11, 1 + tilt], [21, 10], [11, 19 - tilt], [1, 10]], K.truckRed);
  pc.poly([[11, 1 + tilt], [21, 10], [11, 10]], K.truckYellow);
  pc.poly([[11, 19 - tilt], [1, 10], [11, 10]], K.truckGreen);
  pc.line(11, 1 + tilt, 11, 19 - tilt, P.white).line(1, 10, 21, 10, P.white);
  // Eyes.
  pc.rect(7, 7, 3, 2, P.ink).rect(13, 7, 3, 2, P.ink);
  pc.px(8, 7, K.hexGlow).px(14, 7, K.hexGlow);
  // The tail.
  const sway = frame === 0 ? 1 : -1;
  for (let i = 0; i < 4; i++) pc.px(11 + (i % 2 === 0 ? sway : -sway), 20 + i, i % 2 ? K.truckPink : K.truckYellow);
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Spells

/** Hex's violet spell bolt (two frames). 10x10. */
export function drawSpellBolt(pc: PixelCanvas, frame: number): void {
  pc.circle(5, 5, 4, K.hex2, 0.6);
  pc.circle(5, 5, 2, K.hexGlow);
  pc.px(frame === 0 ? 2 : 8, frame === 0 ? 2 : 8, P.white).px(5, 5, P.white);
}

/** One of Charmcaster's spell bags: a pouch tied with a cord, sparks leaking out. 10x10. */
export function drawSpellBag(pc: PixelCanvas): void {
  pc.ellipse(5, 6, 4, 3, K.charm1);
  pc.rect(3, 2, 4, 2, K.charm0);
  pc.px(2, 1, K.charmGlow).px(8, 2, K.charmGlow).px(5, 0, P.white);
  pc.outline(P.ink);
}
