import { PALETTE as P } from '../../../config/palette';
import type { PixelCanvas } from '../PixelCanvas';
import { KARACHI as K } from './colors';

/**
 * The Spell Engine puzzle's pieces, seen from Grey Matter's size: brass pipe
 * tiles (dry and full of mana), gears, empty gear slots, the Charm's inlet,
 * the drain, the Engine's core and the escapement lever. Pipes are drawn at
 * their base rotation; the scene turns them.
 */

/** Pipe tiles, 40x40: 0 straight (east-west), 1 elbow (north-east), 2 tee (north-east-south); 3-5 the same full of mana. */
export function drawPipeTile(pc: PixelCanvas, frame: number): void {
  const wet = frame >= 3;
  const kind = frame % 3;
  pc.rect(0, 0, 40, 40, 0x1a1420);
  pc.rect(1, 1, 38, 38, 0x241c2a);
  for (const [x, y] of [[3, 3], [36, 3], [3, 36], [36, 36]] as const) pc.rect(x - 1, y - 1, 2, 2, K.brass0);
  const pipe = wet ? K.charm2 : K.brass1;
  const core = wet ? K.charmGlow : K.brass2;
  const arm = (d: number) => {
    if (d === 0) pc.rect(15, 0, 10, 22, pipe).rect(18, 0, 4, 22, core);
    if (d === 1) pc.rect(18, 15, 22, 10, pipe).rect(18, 18, 22, 4, core);
    if (d === 2) pc.rect(15, 18, 10, 22, pipe).rect(18, 18, 4, 22, core);
    if (d === 3) pc.rect(0, 15, 22, 10, pipe).rect(0, 18, 22, 4, core);
  };
  const arms = kind === 0 ? [1, 3] : kind === 1 ? [0, 1] : [0, 1, 2];
  for (const d of arms) arm(d);
  pc.circle(20, 20, 6, pipe);
  pc.circle(20, 20, 3, core);
  // Flanges where the pipes meet the tile edge.
  for (const d of arms) {
    if (d === 0) pc.rect(13, 0, 14, 2, K.brass0);
    if (d === 1) pc.rect(38, 13, 2, 14, K.brass0);
    if (d === 2) pc.rect(13, 38, 14, 2, K.brass0);
    if (d === 3) pc.rect(0, 13, 2, 14, K.brass0);
  }
}

/** A brass gear, 48x48 (scaled per slot): frame 0 brass, 1 the spare one (glowing green: Grey Matter's). */
export function drawGear(pc: PixelCanvas, frame: number): void {
  const c = frame === 1 ? P.greymatter : K.brass1;
  const hi = frame === 1 ? P.greymatterGlow : K.brass2;
  const lo = frame === 1 ? P.greymatterDark : K.brass0;
  const teeth = 12;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const x = 24 + Math.cos(a) * 20;
    const y = 24 + Math.sin(a) * 20;
    pc.rect(x - 3, y - 3, 6, 6, c);
  }
  pc.circle(24, 24, 19, c);
  pc.circle(24, 24, 15, lo);
  pc.circle(24, 24, 13, c);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    pc.line(24, 24, 24 + Math.cos(a) * 12, 24 + Math.sin(a) * 12, hi, 2);
  }
  pc.circle(24, 24, 4, lo);
  pc.circle(24, 24, 2, hi);
  pc.px(18, 12, hi).px(17, 13, hi);
}

/** An empty axle where a gear could go: a dashed ring. 48x48. */
export function drawGearSlot(pc: PixelCanvas): void {
  for (let i = 0; i < 24; i++) {
    if (i % 2) continue;
    const a = (i / 24) * Math.PI * 2;
    pc.rect(24 + Math.cos(a) * 18 - 1, 24 + Math.sin(a) * 18 - 1, 2, 2, P.greymatter);
  }
  pc.circle(24, 24, 3, K.brass1);
}

/** The Engine's heart: a caged orb of violet mana. 48x48. */
export function drawEngineCore(pc: PixelCanvas): void {
  pc.circle(24, 24, 20, K.brass0);
  pc.circle(24, 24, 17, K.hex1);
  pc.circle(24, 24, 11, K.hex2);
  pc.circle(24, 24, 5, K.hexGlow);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    pc.line(24 + Math.cos(a) * 9, 24 + Math.sin(a) * 9, 24 + Math.cos(a) * 20, 24 + Math.sin(a) * 20, K.brass2, 2);
  }
}

/** The drain the mana should go down: a brass funnel into the ground. 40x40. */
export function drawDrain(pc: PixelCanvas): void {
  pc.poly([[4, 6], [36, 6], [26, 26], [14, 26]], K.brass1);
  pc.poly([[8, 8], [32, 8], [24, 24], [16, 24]], 0x1a1420);
  pc.rect(16, 26, 8, 14, K.brass0);
  pc.rect(2, 4, 36, 3, K.brass2);
}

/** The escapement lever Grey Matter pulls to drop a pin. 24x40. */
export function drawLever(pc: PixelCanvas, frame: number): void {
  pc.rect(4, 34, 16, 6, K.brass0);
  pc.circle(12, 34, 4, K.brass1);
  const tx = frame === 0 ? 4 : 20;
  pc.line(12, 34, tx, 6, K.brass2, 3);
  pc.circle(tx, 6, 4, P.enemy);
}

/** One locking pin (the escapement fills up with them). 8x14. */
export function drawPin(pc: PixelCanvas): void {
  pc.rect(2, 0, 4, 12, K.brass2);
  pc.rect(0, 0, 8, 3, K.brass1);
  pc.px(3, 13, K.brass0).px(4, 13, K.brass0);
}
