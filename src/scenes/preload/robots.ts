import { PALETTE as P } from '../../config/palette';
import { PixelCanvas } from './PixelCanvas';

/**
 * Chapter 4's enemies: the TOKEN TOON mascot (an animatronic mouse from the
 * arcade's band, costume torn, cymbals in hand), the subway's track-bot and
 * Kevin's sparks.
 */

export const MASCOT_FRAME = { w: 30, h: 36 } as const;

/** Frames: 0-1 lurching walk, 2 cymbals raised (the tell), 3 the smash. Drawn 2px down so the ears and cymbals clear the top. */
export function drawMascot(frameCanvas: PixelCanvas, frame: number): void {
  const pc = new PixelCanvas(frameCanvas.ctx, frameCanvas.ox, frameCanvas.oy + 2, frameCanvas.width, frameCanvas.height - 2);
  drawMascotBody(pc, frame);
  frameCanvas.outline(P.ink);
}

function drawMascotBody(pc: PixelCanvas, frame: number): void {
  const fur = 0x8a52b8;
  const furDark = 0x5a2e80;
  const belly = 0xf2e2c2;
  const vest = 0xd8323e;
  const metal = 0x8a8fa8;
  const step = frame === 0 ? 2 : frame === 1 ? -2 : 0;
  const crouch = frame === 3 ? 3 : 0;
  // Legs: one costume leg, one bare servo leg where the fur tore off.
  pc.rect(10 + step, 24 + crouch, 4, 9 - crouch, fur);
  pc.rect(9 + step, 32, 6, 2, P.ink);
  pc.line(18 - step, 24 + crouch, 18 - step, 32, metal, 2);
  pc.rect(16 - step, 32, 6, 2, P.ink);
  pc.px(18 - step, 28, P.white);
  // Body: round belly, red vest.
  pc.ellipse(15, 19 + crouch, 7, 7, fur);
  pc.ellipse(15, 20 + crouch, 4, 5, belly);
  pc.rect(8, 14 + crouch, 3, 9, vest).rect(19, 14 + crouch, 3, 9, vest);
  pc.px(10, 17 + crouch, P.gold).px(20, 17 + crouch, P.gold);
  // Head: big mouse head with round ears, one eye socket showing the endoskeleton.
  const hy = 7 + crouch + (frame === 2 ? -1 : 0);
  pc.circle(8, hy - 4, 4, fur).circle(22, hy - 4, 4, fur);
  pc.circle(8, hy - 4, 2, 0xd890b8).circle(22, hy - 4, 2, 0xd890b8);
  pc.ellipse(15, hy, 7, 6, fur);
  pc.ellipse(17, hy + 3, 4, 3, belly);
  pc.rect(20, hy + 2, 3, 2, P.ink);
  // Eyes: one wide plastic eye, one exposed camera eye (glows red when angry).
  const angry = frame === 2 || frame === 3;
  pc.circle(13, hy - 1, 2, P.white);
  pc.px(14, hy - 1, angry ? P.enemy : P.ink);
  pc.rect(17, hy - 3, 4, 4, furDark);
  pc.rect(18, hy - 2, 2, 2, angry ? P.enemy : 0xffb050);
  pc.line(16, hy - 4, 21, hy + 1, metal);
  // Arms and cymbals: at the sides, raised high (tell), or slammed down.
  if (frame === 2) {
    pc.line(9, 15, 4, 4, fur, 3).line(21, 15, 26, 4, fur, 3);
    pc.ellipse(4, 2, 4, 1, P.gold).ellipse(26, 2, 4, 1, P.gold);
    pc.px(4, 1, P.white).px(26, 1, P.white);
  } else if (frame === 3) {
    pc.line(9, 17 + crouch, 3, 30, fur, 3).line(21, 17 + crouch, 27, 30, fur, 3);
    pc.ellipse(3, 32, 4, 1, P.gold).ellipse(27, 32, 4, 1, P.gold);
  } else {
    pc.line(9, 15, 6, 23 + step, fur, 3).line(21, 15, 24, 23 - step, fur, 3);
    pc.ellipse(5, 24 + step, 3, 3, P.gold).ellipse(25, 24 - step, 3, 3, P.gold);
    pc.px(5, 23 + step, P.white).px(25, 23 - step, P.white);
  }
}

export const TRACKBOT_FRAME = { w: 28, h: 18 } as const;

/** Frames: 0-1 rolling, 2 revving (grinder sparking), 3 skidding. */
export function drawTrackbot(pc: PixelCanvas, frame: number): void {
  const body = 0xd8a030;
  const dark = 0x6a4a18;
  // Treads.
  pc.rect(2, 12, 22, 5, P.concrete0);
  for (let x = 3 + (frame % 2) * 2; x < 23; x += 4) pc.rect(x, 13, 2, 3, P.concrete2);
  pc.circle(5, 14, 2, P.concrete1).circle(21, 14, 2, P.concrete1);
  // Chassis with hazard stripes and a warning beacon.
  pc.rect(4, 5, 18, 8, body);
  pc.rect(4, 5, 18, 2, 0xf0c050);
  for (let x = 5; x < 21; x += 4) pc.rect(x, 10, 2, 2, P.ink);
  pc.rect(9, 1, 5, 4, dark);
  pc.rect(10, 2, 3, 2, frame === 2 ? P.enemy : 0xffb050);
  // Camera eye on a stalk.
  pc.rect(16, 2, 2, 3, P.concrete1);
  pc.rect(16, 0, 4, 3, P.concrete2);
  pc.px(19, 1, frame === 2 ? P.enemy : P.white);
  // The grinder disc at the front.
  const spin = frame === 2 ? 1 : 0;
  pc.circle(24, 9, 4, P.concrete3);
  pc.circle(24, 9, 2, P.concrete1);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + spin * 0.4 + frame * 0.6;
    pc.px(24 + Math.round(Math.cos(a) * 4), 9 + Math.round(Math.sin(a) * 4), P.white);
  }
  if (frame === 3) pc.line(1, 15, 0, 17, P.concrete2);
  pc.outline(P.ink);
}

/** One of Kevin's sparks: a crackling ball of stolen power. Two flicker frames. 14x14. */
export function drawSparkWisp(pc: PixelCanvas, frame: number): void {
  pc.circle(7, 7, 4, P.kevinDark);
  pc.circle(7, 7, 3, P.kevin);
  pc.circle(7, 7, 1, P.white);
  const arms = frame === 0 ? [[0, 3], [13, 9], [6, 0], [8, 13]] : [[1, 11], [13, 4], [11, 0], [3, 13]];
  for (const [x, y] of arms) pc.line(7, 7, x, y, frame === 0 ? P.kevin : P.white);
}
