import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from './PixelCanvas';

export const DRONE_FRAMES = { idle: [0, 1], charge: [2] } as const;

export function drawScout(pc: PixelCanvas, frame: number): void {
  const charging = frame === 2;
  // Side fins.
  pc.poly([[1, 4], [5, 5], [5, 10], [1, 9]], P.metal0);
  pc.poly([[19, 4], [15, 5], [15, 10], [19, 9]], P.metal0);
  pc.px(2, 6, P.enemy).px(17, 6, P.enemy);
  // Round hull.
  pc.circle(10, 7, 6, P.metal1);
  pc.rect(6, 10, 9, 3, P.metal0);
  pc.rect(6, 3, 4, 2, P.metal2);
  pc.px(7, 2, P.metal3).px(6, 3, P.metal3);
  // Antenna.
  pc.vline(10, 0, 1, P.metal2);
  pc.px(10, 0, charging ? P.enemyGlow : P.enemy);
  // Eye.
  pc.rect(7, 5, 6, 5, P.ink);
  pc.rect(8, 6, 4, 3, charging ? P.enemyGlow : P.enemy);
  if (charging) pc.rect(9, 6, 2, 3, P.white);
  else pc.px(8, 6, P.white);
  // Thruster.
  pc.rect(8, 13, 5, 1, P.metal0);
  pc.rect(9, 14, 3, 1, frame === 1 ? P.enemyGlow : P.enemy);
  if (frame !== 1) pc.px(10, 15, P.enemyGlow);
  pc.outline(P.ink);
}

export function drawStriker(pc: PixelCanvas, frame: number): void {
  const diving = frame === 2;
  // Blades.
  if (diving) {
    pc.poly([[4, 2], [8, 6], [7, 10], [3, 7]], P.metal2);
    pc.poly([[18, 2], [14, 6], [15, 10], [19, 7]], P.metal2);
  } else {
    const lift = frame === 1 ? 1 : 0;
    pc.poly([[0, 6 - lift], [7, 7], [7, 10], [1, 10 + lift]], P.metal2);
    pc.poly([[22, 6 - lift], [15, 7], [15, 10], [21, 10 + lift]], P.metal2);
    pc.px(1, 7 - lift, P.metal3).px(20, 7 - lift, P.metal3);
  }
  // Kite-shaped hull pointing down.
  pc.poly([[11, 0], [18, 7], [11, 17], [4, 7]], P.metal1);
  pc.poly([[11, 0], [14, 4], [11, 5], [8, 4]], P.metal2);
  pc.line(11, 11, 11, 16, P.enemy);
  pc.rect(9, 6, 5, 4, P.ink);
  pc.rect(10, 7, 3, 2, diving ? P.enemyGlow : P.enemy);
  pc.px(10, 7, P.white);
  pc.outline(P.ink);
}

export function drawGunner(pc: PixelCanvas, frame: number): void {
  const charging = frame === 2;
  // Side thrusters.
  pc.rect(0, 6, 4, 6, P.metal0);
  pc.rect(24, 6, 4, 6, P.metal0);
  pc.px(1, 11, frame === 1 ? P.enemyGlow : P.enemy).px(26, 11, frame === 1 ? P.enemyGlow : P.enemy);
  // Hull.
  pc.rect(4, 3, 20, 11, P.metal1);
  pc.rect(5, 2, 18, 1, P.metal1);
  pc.rect(5, 3, 18, 2, P.metal2);
  pc.rect(6, 2, 6, 1, P.metal3);
  pc.rect(4, 12, 20, 2, P.metal0);
  // Visor with a scanning light.
  pc.rect(7, 6, 14, 4, P.ink);
  const scan = frame === 0 ? 8 : 15;
  pc.rect(8, 7, 12, 2, charging ? P.enemyGlow : P.enemyDark);
  if (charging) pc.rect(8, 7, 12, 2, P.enemy).rect(9, 7, 10, 1, P.white);
  else pc.rect(scan, 7, 4, 2, P.enemy);
  // Triple barrel.
  for (const bx of [7, 13, 19]) {
    pc.rect(bx, 14, 2, bx === 13 ? 5 : 4, P.metal0);
    pc.px(bx, bx === 13 ? 18 : 17, charging ? P.enemyGlow : P.metal2);
  }
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Boss parts

export const BOSS_HULL = { w: 112, h: 64 } as const;

export function drawBossHull(pc: PixelCanvas): void {
  // Cannon pods.
  pc.rect(0, 24, 10, 14, P.metal0);
  pc.rect(102, 24, 10, 14, P.metal0);
  pc.rect(2, 36, 4, 6, P.metal1).rect(106, 36, 4, 6, P.metal1);
  pc.px(3, 41, P.enemy).px(107, 41, P.enemy);
  // Main body.
  pc.poly(
    [
      [22, 8],
      [90, 8],
      [106, 26],
      [98, 52],
      [14, 52],
      [6, 26],
    ],
    P.metal1,
  );
  pc.ellipse(56, 10, 28, 8, P.metal2);
  pc.ellipse(56, 8, 18, 4, P.metal3);
  pc.poly([[14, 52], [98, 52], [90, 58], [22, 58]], P.metal0);
  // Panel seams and rivets.
  pc.line(22, 20, 36, 46, P.metal0);
  pc.line(90, 20, 76, 46, P.metal0);
  pc.hline(16, 96, 47, P.metal0);
  for (const [x, y] of [[18, 28], [94, 28], [30, 44], [82, 44], [44, 14], [68, 14]]) pc.px(x, y, P.metal3);
  // Exposed wiring (hidden under armor plates in phase 1).
  for (let i = 0; i < 5; i++) {
    pc.line(12 + i * 3, 24, 16 + i * 3, 42, i % 2 ? P.enemyDark : P.fire3);
    pc.line(100 - i * 3, 24, 96 - i * 3, 42, i % 2 ? P.enemyDark : P.fire3);
  }
  // Red vents.
  for (const x of [28, 36, 76, 84]) pc.rect(x, 50, 5, 2, P.enemy);
  // Eye socket.
  pc.circle(56, 30, 15, P.metal0);
  pc.circle(56, 30, 13, P.ink);
  // Bottom hatch.
  pc.rect(46, 56, 20, 4, P.metal0);
  pc.rect(48, 58, 16, 2, P.enemyDark);
  pc.outline(P.ink);
}

export function drawBossPlate(pc: PixelCanvas): void {
  pc.poly([[2, 0], [30, 4], [26, 22], [0, 18]], P.metal2);
  pc.poly([[4, 2], [26, 5], [24, 8], [4, 6]], P.metal3);
  pc.line(6, 12, 22, 14, P.metal1);
  pc.px(6, 4, P.white).px(24, 18, P.metal1).px(5, 16, P.metal1);
  pc.rect(12, 16, 6, 2, P.enemy);
  pc.outline(P.ink);
}

export function drawBossTopPlate(pc: PixelCanvas): void {
  pc.poly([[4, 0], [40, 0], [44, 10], [0, 10]], P.metal2);
  pc.rect(8, 1, 28, 2, P.metal3);
  pc.rect(18, 6, 8, 2, P.enemy);
  pc.outline(P.ink);
}

export const BOSS_EYE_FRAMES = { idle: 0, charge: 1, vulnerable: 2, closed: 3 } as const;

export function drawBossEye(pc: PixelCanvas, frame: number): void {
  const c = 13;
  if (frame === 3) {
    pc.circle(c, c, 11, P.metal1);
    pc.hline(3, 23, c, P.metal0);
    pc.rect(6, c - 3, 14, 1, P.metal2);
    pc.outline(P.ink);
    return;
  }
  pc.circle(c, c, 11, frame === 2 ? P.fire4 : P.enemyDark);
  pc.circle(c, c, 8, frame === 1 ? P.enemyGlow : P.enemy);
  if (frame === 2) {
    pc.circle(c, c, 6, P.fire1);
    pc.circle(c, c, 3, P.fire0);
    pc.line(4, 6, 10, 11, P.ink);
    pc.line(20, 18, 16, 14, P.ink);
    pc.line(18, 4, 15, 9, P.ink);
  } else {
    pc.circle(c, c, 4, frame === 1 ? P.white : P.ink);
    pc.circle(c, c, 1, frame === 1 ? P.enemyGlow : P.enemy);
    pc.rect(8, 7, 3, 2, P.white);
  }
  pc.outline(P.ink);
}

export function drawBossArm(pc: PixelCanvas, frame: number): void {
  // Segmented arm hanging from the top, claw at the bottom.
  pc.rect(5, 0, 5, 8, P.metal0);
  pc.rect(4, 8, 7, 3, P.metal2);
  pc.rect(5, 11, 5, 9, P.metal1);
  pc.rect(4, 20, 7, 3, P.metal2);
  pc.px(7, 9, P.enemy).px(7, 21, P.enemy);
  const open = frame === 0;
  if (open) {
    pc.line(4, 23, 0, 31, P.metal2, 2);
    pc.line(10, 23, 13, 31, P.metal2, 2);
    pc.line(7, 23, 7, 32, P.metal3, 2);
  } else {
    pc.line(4, 23, 5, 31, P.metal2, 2);
    pc.line(10, 23, 9, 31, P.metal2, 2);
    pc.line(7, 23, 7, 30, P.metal3, 2);
  }
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Milestone 2 drones

/**
 * Armored Drone, 30x24. Frames: 0-1 intact, 2 charging, 3-4 cracked plating,
 * 5-6 armour blown off with the core exposed.
 */
export function drawArmored(pc: PixelCanvas, frame: number): void {
  const charging = frame === 2;
  const cracked = frame === 3 || frame === 4;
  const exposed = frame === 5 || frame === 6;
  const flicker = frame % 2 === 1;
  // Thrusters and the cannon slung underneath.
  pc.rect(5, 18, 5, 3, P.metal0).rect(20, 18, 5, 3, P.metal0);
  pc.rect(6, 21, 3, 1, flicker ? P.enemyGlow : P.enemy).rect(21, 21, 3, 1, flicker ? P.enemyGlow : P.enemy);
  pc.rect(12, 18, 6, 4, P.metal1);
  pc.rect(13, 21, 4, 2, P.metal0);
  pc.px(14, 22, charging ? P.white : P.enemy).px(15, 22, charging ? P.enemyGlow : P.enemyDark);
  // Heavy hull.
  pc.rect(3, 5, 24, 13, P.metal1);
  pc.rect(4, 4, 22, 1, P.metal2);
  pc.rect(3, 15, 24, 3, P.metal0);
  if (exposed) {
    // Plating gone: wiring and a hot reactor core.
    for (let i = 0; i < 5; i++) pc.line(5 + i * 5, 6, 7 + i * 4, 15, i % 2 ? P.fire3 : P.enemyDark);
    pc.circle(15, 10, 4, P.fire3);
    pc.circle(15, 10, 3, flicker ? P.fire1 : P.fire2);
    pc.circle(15, 10, 1, P.fire0);
    pc.rect(9, 8, 3, 1, P.metal3).rect(19, 13, 3, 1, P.metal3);
  } else {
    // Overlapping front plates with a slit visor.
    pc.poly([[2, 4], [15, 2], [15, 16], [1, 15]], P.metal2);
    pc.poly([[28, 4], [15, 2], [15, 16], [29, 15]], P.metal2);
    pc.rect(3, 3, 11, 1, P.metal3).rect(16, 3, 11, 1, P.metal3);
    pc.vline(15, 2, 16, P.metal1);
    for (const [x, y] of [[4, 6], [26, 6], [4, 13], [26, 13]]) pc.px(x, y, P.metal1);
    pc.rect(6, 8, 18, 3, P.ink);
    pc.rect(7, 9, 16, 1, charging ? P.enemyGlow : P.enemyDark);
    if (charging) pc.rect(9, 9, 12, 1, P.white);
    else pc.rect(flicker ? 16 : 9, 9, 5, 1, P.enemy);
    if (cracked) {
      pc.line(5, 4, 9, 9, P.ink).line(9, 9, 7, 14, P.ink);
      pc.line(24, 5, 21, 12, P.ink).line(21, 12, 25, 15, P.ink);
      pc.px(8, 8, P.fire2).px(22, 10, P.fire2);
      pc.rect(17, 13, 3, 2, P.metal1);
    }
  }
  pc.outline(P.ink);
}

/** Hornet, 18x12. Frames: 0-1 wings, 2 charging. */
export function drawHornet(pc: PixelCanvas, frame: number): void {
  const charging = frame === 2;
  // Wing blur above the body.
  const lift = frame === 1 ? 1 : 0;
  pc.rect(2, 1 + lift, 6, 2, P.metal3, 0.55).rect(10, 1 + lift, 6, 2, P.metal3, 0.55);
  pc.rect(3, 1 + lift, 4, 1, P.white, 0.5).rect(11, 1 + lift, 4, 1, P.white, 0.5);
  // Slim body with red stripes and a stinger.
  pc.ellipse(9, 6, 6, 3, P.metal1);
  pc.rect(5, 5, 1, 3, P.enemy).rect(12, 5, 1, 3, P.enemy);
  pc.rect(7, 4, 4, 4, P.ink);
  pc.rect(8, 5, 2, 2, charging ? P.white : P.enemyGlow);
  pc.line(9, 9, 9, 11, charging ? P.enemyGlow : P.metal2);
  pc.px(9, 11, charging ? P.white : P.enemy);
  pc.outline(P.ink);
}
