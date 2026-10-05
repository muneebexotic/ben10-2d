import { PALETTE as P } from '../../config/palette';
import { seeded, type PixelCanvas } from './PixelCanvas';

/**
 * Chapter 4's machines: security shutters and their keypads, laser turrets,
 * lift pads, the maintenance cart and its barrier, arcade cabinets, the
 * SUMO SLAMMERS cabinet, subway trains and the live track bed.
 */

// ---------------------------------------------------------------- Shutters

/** One tile of a corrugated steel security shutter. */
export function drawShutter(pc: PixelCanvas): void {
  pc.rect(0, 0, 16, 16, P.concrete2);
  for (let y = 0; y < 16; y += 4) {
    pc.hline(0, 15, y, P.concrete3);
    pc.hline(0, 15, y + 2, P.concrete1);
    pc.hline(0, 15, y + 3, P.concrete0);
  }
  pc.vline(0, 0, 15, P.concrete1).vline(15, 0, 15, P.concrete1);
}

/** The shutter's bottom bar: hazard stripes. 16x5. */
export function drawShutterBar(pc: PixelCanvas): void {
  pc.rect(0, 0, 16, 5, P.ink);
  for (let x = -4; x < 16; x += 6) pc.poly([[x, 4], [x + 3, 0], [x + 6, 0], [x + 3, 4]], P.hazard);
  pc.hline(0, 15, 0, P.concrete3);
}

/** A keypad box: red LED locked (0), green while Upgrade is inside (1). 10x16. */
export function drawKeypad(pc: PixelCanvas, frame: number): void {
  pc.rect(0, 0, 10, 16, P.concrete1);
  pc.rect(1, 1, 8, 14, P.concrete0);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) pc.rect(2 + x * 2, 6 + y * 2, 1, 1, P.concrete3);
  pc.rect(2, 2, 6, 2, frame === 0 ? P.enemy : P.upgrade);
  pc.px(3, 2, P.white);
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Turrets

/** Turret pedestal. 22x14. */
export function drawTurretBase(pc: PixelCanvas): void {
  pc.poly([[3, 14], [6, 5], [16, 5], [19, 14]], P.concrete1);
  pc.rect(7, 2, 8, 4, P.concrete2);
  pc.hline(4, 18, 13, P.concrete0);
  for (let x = 5; x < 18; x += 4) pc.px(x, 12, P.hazard);
  pc.rect(9, 6, 4, 2, P.concrete3);
  pc.outline(P.ink);
}

/**
 * The turret's head, pivoting at (8, 7): barrel pointing right. Frames: 0
 * hostile (red lens), 1 Upgrade's (green, circuit lines), 2 wrecked.
 */
export function drawTurretHead(pc: PixelCanvas, frame: number): void {
  const lens = frame === 0 ? P.enemy : frame === 1 ? P.upgrade : P.concrete0;
  const body = frame === 2 ? P.concrete0 : P.concrete2;
  pc.ellipse(8, 7, 7, 6, body);
  pc.rect(8, 5, 14, 4, frame === 2 ? P.concrete0 : P.concrete1);
  pc.rect(20, 4, 3, 6, body);
  pc.hline(9, 21, 5, frame === 2 ? P.concrete1 : P.concrete3);
  pc.circle(7, 7, 3, P.ink);
  pc.circle(7, 7, 2, lens);
  if (frame !== 2) pc.px(6, 6, P.white);
  if (frame === 1) {
    pc.line(2, 3, 5, 10, P.upgrade).hline(10, 18, 8, P.upgrade);
  }
  if (frame === 2) {
    pc.line(4, 2, 9, 11, P.ink).px(15, 6, P.fire2);
  }
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Lifts and carts

/** One tile of a lift pad's deck (yellow-edged diamond plate). 16x10. */
export function drawLiftDeck(pc: PixelCanvas): void {
  pc.rect(0, 0, 16, 10, P.concrete2);
  pc.rect(0, 0, 16, 2, P.hazard);
  for (let x = 0; x < 16; x += 4) pc.px(x + 1, 0, P.ink).px(x + 2, 1, P.ink);
  for (let y = 3; y < 9; y += 3) for (let x = (y % 2) * 2; x < 16; x += 4) pc.px(x + 1, y, P.concrete3);
  pc.hline(0, 15, 9, P.concrete0);
}

/** The maintenance cart: frame 0 parked (lamps dark), 1 powered (Upgrade at the controls). 48x30. */
export function drawCart(pc: PixelCanvas, frame: number): void {
  const lit = frame === 1;
  // Body: a boxy yellow work car.
  pc.rect(2, 6, 44, 16, 0xc8962a);
  pc.rect(2, 6, 44, 3, 0xe8b84a);
  pc.rect(2, 19, 44, 3, 0x7a5418);
  for (let x = 6; x < 44; x += 10) pc.rect(x, 11, 6, 5, lit ? 0x2a3a2e : P.concrete0);
  if (lit) for (let x = 6; x < 44; x += 10) pc.hline(x, x + 5, 13, P.upgrade);
  // Hazard stripes on the bumpers.
  for (const bx of [0, 44]) {
    pc.rect(bx, 9, 4, 11, P.ink);
    for (let y = 9; y < 20; y += 4) pc.rect(bx, y, 4, 2, P.hazard);
  }
  // Headlamp and a beacon on the roof.
  pc.rect(44, 10, 4, 4, lit ? P.white : P.concrete2);
  pc.rect(21, 2, 6, 4, lit ? P.upgrade : 0x8a5a1a);
  pc.rect(22, 3, 2, 1, P.white);
  // Wheels on the rail.
  for (const wx of [9, 37]) {
    pc.circle(wx, 25, 4, P.concrete0);
    pc.circle(wx, 25, 2, P.concrete2);
  }
  pc.rect(6, 22, 36, 2, P.concrete0);
  pc.outline(P.ink);
}

/** Boards nailed across the line at the end of the cart's run. 16x48. */
export function drawBarrier(pc: PixelCanvas): void {
  const rnd = seeded(41);
  pc.rect(2, 0, 3, 48, 0x5a3a1e).rect(11, 0, 3, 48, 0x5a3a1e);
  for (let y = 2; y < 46; y += 7) {
    const tilt = Math.round((rnd() - 0.5) * 3);
    pc.poly([[0, y + tilt], [16, y - tilt], [16, y + 5 - tilt], [0, y + 5 + tilt]], 0x8a5a2e);
    pc.hline(1, 14, y + 1, 0xa8723a);
    pc.px(3, y + 2, P.concrete3).px(12, y + 2, P.concrete3);
  }
  pc.rect(3, 18, 10, 8, P.enemy);
  pc.rect(4, 21, 8, 2, P.white);
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Arcade cabinets

const CABINET_ART: Array<{ body: number; trim: number; screen: number; art: number }> = [
  { body: 0x2a1e5a, trim: P.neonBlue, screen: 0x0a1a3a, art: P.neonBlue },
  { body: 0x5a1e3e, trim: P.neonPink, screen: 0x2a0a1a, art: P.neonPink },
  { body: 0x4a3a12, trim: P.gold, screen: 0x1a1406, art: P.gold },
  { body: 0x123a2a, trim: P.omnitrix, screen: 0x061a0e, art: P.omnitrix },
];

/** Cabinet variant `v` attract-mode frames are 2v and 2v+1; frame 8 is a spent one (screen cracked, dark). 28x46. */
export const CABINET_SPENT_FRAME = 8;

export function drawCabinet(pc: PixelCanvas, frame: number): void {
  const spent = frame === CABINET_SPENT_FRAME;
  const a = CABINET_ART[spent ? 0 : Math.floor(frame / 2) % CABINET_ART.length];
  const blink = frame % 2 === 1;
  // Cabinet: a marquee up top, the screen, the control deck, the coin door.
  pc.poly([[3, 46], [3, 8], [6, 2], [24, 2], [26, 8], [26, 46]], spent ? 0x1e1a2a : a.body);
  pc.rect(5, 3, 19, 6, spent ? 0x14101e : a.trim);
  if (!spent) for (let x = 7; x < 22; x += 3) pc.px(x, 5 + (blink ? 1 : 0), P.white);
  pc.rect(5, 11, 19, 15, P.ink);
  pc.rect(6, 12, 17, 13, spent ? 0x08080c : a.screen);
  if (spent) {
    pc.line(8, 13, 14, 20, 0x3a3a4a).line(14, 20, 12, 24, 0x3a3a4a).line(14, 20, 21, 17, 0x3a3a4a);
  } else {
    // Attract mode over faint scanlines: a little sprite bouncing and a score line.
    for (let y = 13; y < 25; y += 2) pc.hline(6, 22, y, 0x000000);
    pc.rect(blink ? 9 : 15, 16, 4, 4, a.art);
    pc.px(blink ? 10 : 16, 17, P.white);
    pc.hline(8, 20, 22, blink ? a.art : P.white);
  }
  pc.poly([[3, 28], [26, 28], [27, 32], [2, 32]], spent ? 0x2a2438 : a.trim);
  pc.circle(9, 30, 1, spent ? 0x3a3a4a : P.enemy).circle(14, 30, 1, spent ? 0x3a3a4a : P.gold).circle(19, 30, 1, spent ? 0x3a3a4a : P.omnitrix);
  pc.rect(10, 36, 9, 8, spent ? 0x14101e : 0x14101e);
  pc.rect(12, 38, 2, 3, spent ? 0x2a2438 : P.enemy).rect(16, 38, 2, 3, spent ? 0x2a2438 : P.enemy);
  pc.outline(P.ink);
}

/**
 * The SUMO SLAMMERS cabinet: wider, a sumo on the marquee. Frames 0-1 attract
 * mode (KEV's high score), 2 playing, 3 NEW HIGH SCORE (Ben's). 34x52.
 */
export function drawSumoCabinet(pc: PixelCanvas, frame: number): void {
  const body = 0x6a1e1e;
  pc.poly([[3, 52], [3, 10], [7, 2], [27, 2], [31, 10], [31, 52]], body);
  pc.rect(5, 3, 24, 8, P.gold);
  // The marquee's sumo: a round body and a topknot.
  pc.circle(17, 7, 3, 0xf2c29b);
  pc.rect(16, 3, 2, 2, P.ink);
  pc.rect(14, 9, 7, 2, P.enemy);
  pc.rect(5, 13, 24, 18, P.ink);
  pc.rect(6, 14, 22, 16, 0x1a0a2a);
  if (frame <= 1) {
    // Attract: KEV at the top of the table.
    pc.rect(9, 16, 16, 2, P.kevin);
    for (let y = 20; y < 29; y += 3) pc.hline(9, 24, y, frame === 0 ? P.uiDim : P.white);
  } else if (frame === 2) {
    // Two tiny sumos pushing.
    pc.rect(6, 25, 22, 2, 0xd8b878);
    pc.rect(11, 19, 5, 6, 0xf2c29b).rect(18, 19, 5, 6, 0xe8a070);
    pc.rect(11, 23, 5, 1, P.omnitrix).rect(18, 23, 5, 1, P.kevin);
  } else {
    pc.rect(9, 16, 16, 2, P.omnitrix);
    pc.hline(9, 24, 21, P.gold);
    pc.hline(11, 22, 24, P.gold);
    for (const [x, y] of [[8, 27], [26, 15], [12, 28], [24, 27]] as const) pc.px(x, y, P.white);
  }
  pc.poly([[3, 33], [31, 33], [32, 38], [2, 38]], P.gold);
  pc.circle(10, 35, 1, P.enemy).circle(17, 35, 1, P.white).circle(24, 35, 1, P.enemy);
  pc.rect(12, 42, 10, 8, 0x3a0e0e);
  pc.rect(14, 44, 2, 3, P.gold).rect(18, 44, 2, 3, P.gold);
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Subway

/** A subway car. Frame 0 the front car (cab on the right, headlight), 1 a middle car. 128x52. */
export function drawTrainCar(pc: PixelCanvas, frame: number): void {
  const front = frame === 0;
  pc.rect(2, 6, 124, 38, 0xb8bcc8);
  pc.rect(2, 6, 124, 4, 0xd8dce6);
  pc.rect(2, 30, 124, 4, P.subwayBand);
  pc.rect(2, 40, 124, 4, 0x6a6e7a);
  // Windows, lit from inside.
  for (let x = 10; x < 112; x += 22) {
    pc.rect(x, 13, 14, 12, 0x1a2230);
    pc.rect(x + 1, 14, 12, 4, 0xffe7a0);
    pc.rect(x + 1, 18, 12, 6, 0xc8a860);
  }
  // Doors.
  for (const dx of [34, 78]) {
    pc.rect(dx, 11, 10, 29, 0x9aa0ae);
    pc.vline(dx + 5, 11, 39, 0x5a5e6a);
    pc.rect(dx + 1, 14, 3, 8, 0x1a2230).rect(dx + 6, 14, 3, 8, 0x1a2230);
  }
  if (front) {
    pc.poly([[112, 6], [126, 10], [127, 44], [112, 44]], 0xc8ccd8);
    pc.rect(116, 13, 9, 11, 0x1a2230);
    pc.rect(122, 34, 5, 4, P.white);
    pc.rect(118, 8, 6, 2, P.enemy);
  }
  // Bogies.
  for (const wx of [18, 30, 98, 110]) {
    pc.circle(wx, 46, 4, P.concrete0);
    pc.circle(wx, 46, 1, P.concrete3);
  }
  pc.rect(10, 43, 108, 2, P.concrete0);
  pc.outline(P.ink);
}

/** The track bed under a live third rail: gravel, sleepers and the sparking rail. One "liquid" surface: 32x64. */
export function drawTrackBed(pc: PixelCanvas): void {
  const rnd = seeded(77);
  pc.rect(0, 0, 32, 64, 0x14141a);
  for (let i = 0; i < 70; i++) pc.px(Math.floor(rnd() * 32), 6 + Math.floor(rnd() * 58), rnd() < 0.5 ? 0x2a2a34 : 0x3a3a46);
  // Sleepers.
  for (let x = 2; x < 32; x += 10) pc.rect(x, 4, 6, 4, 0x3a2a1e);
  // Running rail and the live third rail with its glow.
  pc.rect(0, 2, 32, 2, P.concrete3);
  pc.rect(0, 9, 32, 2, 0x5a6a7a);
  pc.rect(0, 11, 32, 1, P.railGlow);
  for (let x = 3; x < 32; x += 11) pc.px(x, 8, P.white).px(x + 1, 7, P.railGlow);
}

/** A warning lamp on the platform edge that flashes before a train: 0 off, 1 on. 8x10. */
export function drawWarnLamp(pc: PixelCanvas, frame: number): void {
  pc.rect(2, 4, 4, 6, P.concrete1);
  pc.circle(4, 3, 3, frame === 1 ? P.hazard : 0x5a4a1e);
  if (frame === 1) pc.px(3, 2, P.white);
  pc.outline(P.ink);
}
