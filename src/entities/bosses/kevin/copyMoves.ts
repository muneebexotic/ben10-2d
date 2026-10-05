import type { CopyStyle } from '../../../aliens/types';
import { COPY_MOVES } from '../../../config/kevin';
import { PALETTE } from '../../../config/palette';
import { blinkOn } from '../../../systems/Accessibility';
import { pace } from '../../../systems/Difficulty';
import { chance } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import type { BossWorld } from '../HunterDrone';
import type { KevinHazards } from './KevinHazards';
import type { KevinPose } from './KevinLook';

/** What a copy move can do to Kevin's body and the arena. */
export interface CopyBody {
  x: number;
  /** Feet above the floor. */
  lift: number;
  facing: 1 | -1;
  /** Contact damage while the move is striking (0: his normal touch). */
  strike: number;
  readonly floorY: number;
  readonly w: BossWorld;
  readonly kh: KevinHazards;
  /** The copied alien's colour (his shots glow in it, purple-shifted). */
  readonly shotTint: number;
  pose(p: KevinPose): void;
  clampX(x: number): number;
  /** Height of his body (where shots leave from). */
  readonly bodyH: number;
}

export interface MoveState {
  t: number;
  step: number;
  count: number;
  tx: number;
  from: number;
  dir: 1 | -1;
  started: boolean;
  wait: number;
}

export function newMove(): MoveState {
  return { t: 0, step: 0, count: 0, tx: 0, from: 0, dir: 1, started: false, wait: 0 };
}

/** Advances a move; returns true when it's finished. `level` is the copy level, 1-3. */
export type MoveFn = (k: CopyBody, m: MoveState, level: 1 | 2 | 3, dtMs: number) => boolean;

const DEG = Math.PI / 180;

function next(m: MoveState): void {
  m.step++;
  m.t = 0;
}

function faceBen(k: CopyBody): void {
  k.facing = k.w.player.x < k.x ? -1 : 1;
}

/** Aimed shots at Ben from his hands. */
function volleyAt(k: CopyBody, kind: 'fireball' | 'bolt', n: number, spreadDeg: number, speed: number, damage: number): void {
  const p = k.w.player;
  const sx = k.x + k.facing * 10;
  const sy = k.w.arena.floorY - k.lift - k.bodyH * 0.6;
  const base = Math.atan2(p.centerY - sy, p.x - sx);
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * spreadDeg * DEG;
    k.w.projectiles.spawn(kind, 'enemy', sx, sy, Math.cos(a) * speed, Math.sin(a) * speed, damage, 3000, 5, { tint: k.shotTint });
  }
  k.w.fx.flash(sx, sy, k.shotTint, 16, 140);
  k.w.threat(k.w.now);
}

/** Copy-Heatblast: a charged fireball (II: a spread of three; III: and a fire pillar under Ben). */
const fire: MoveFn = (k, m, level) => {
  const C = COPY_MOVES.fire;
  if (!m.started) {
    m.started = true;
    k.pose('tell');
    k.w.threat(k.w.now + C.tellMs);
    playSfx('transformCharge', 0.5, 1.5);
  }
  if (m.step === 0) {
    faceBen(k);
    const t = m.t / C.tellMs;
    k.w.lighting.add(k.x + k.facing * 10, k.floorY - k.lift - k.bodyH * 0.6, 20 + t * 40, k.shotTint, 1);
    if (chance(0.5)) k.w.fx.burst('fire', k.x + k.facing * 10, k.floorY - k.lift - k.bodyH * 0.6, 1);
    if (m.t < C.tellMs) return false;
    k.pose('attack');
    volleyAt(k, 'fireball', C.shots[level - 1], C.spreadDeg, C.speed, C.damage);
    playSfx('fireball', 0.9, 0.8);
    if (level >= 3) {
      const P = C.pillar;
      k.kh.erupt(k.w.player.x, P.width, P.height, P.warnMs, P.liveMs, P.damage, 'fire', PALETTE.kevin);
    }
    next(m);
    return false;
  }
  return m.t >= (level >= 3 ? C.pillar.warnMs + C.pillar.liveMs : 380);
};

/** Copy-Four Arms: leaps onto a marked spot and slams the floor, shockwaves both ways (II: twice, III: three times). */
const slam: MoveFn = (k, m, level, dtMs) => {
  const C = COPY_MOVES.slam;
  if (!m.started) {
    m.started = true;
    m.count = C.leaps[level - 1];
    m.step = 0;
    startLeap(k, m, C.crouchMs);
  }
  if (m.step === 0) {
    // Crouched, a target on the landing spot.
    k.w.telegraph.target(m.tx, k.floorY - 4, 34, PALETTE.kevin, blinkOn(m.t, 90) ? 0.9 : 0.5);
    if (m.t < C.crouchMs) return false;
    k.pose('air');
    playSfx('jump', 0.8, 0.6);
    next(m);
    return false;
  }
  if (m.step === 1) {
    const t = Math.min(1, m.t / C.airMs);
    k.x = m.from + (m.tx - m.from) * t;
    k.lift = Math.sin(t * Math.PI) * C.height;
    k.w.telegraph.target(m.tx, k.floorY - 4, 40, PALETTE.kevin, 0.9);
    k.strike = t > 0.7 ? C.landDamage : 0;
    if (t < 1) return false;
    k.lift = 0;
    k.pose('attack');
    k.w.fx.shake(0.012, 280);
    k.w.fx.burst('dust', k.x, k.floorY - 2, 16);
    k.w.fx.crack(k.x, k.floorY, 0.8);
    playSfx('slam', 1, 0.8);
    for (const dir of [-1, 1] as const) k.w.hazards.spawnShockwave(k.x + dir * 14, dir, PALETTE.kevin);
    k.w.cancelThreat();
    m.count--;
    if (m.count > 0) {
      startLeap(k, m, C.crouchMs);
      m.step = 0;
      return false;
    }
    m.wait = pace.punish(C.recoverMs);
    next(m);
    return false;
  }
  k.strike = 0;
  void dtMs;
  return m.t >= m.wait;
};

function startLeap(k: CopyBody, m: MoveState, crouchMs: number): void {
  m.t = 0;
  m.from = k.x;
  m.tx = k.clampX(k.w.player.x);
  k.facing = m.tx < k.x ? -1 : 1;
  k.pose('tell');
  k.w.threat(k.w.now + crouchMs + COPY_MOVES.slam.airMs);
}

/** Copy-XLR8: a dashed line along the floor (the tell), then a streak across the arena (II: there and back, III: three). */
const dash: MoveFn = (k, m, level, dtMs) => {
  const C = COPY_MOVES.dash;
  const a = k.w.arena;
  if (!m.started) {
    m.started = true;
    m.count = C.dashes[level - 1];
    beginDash(k, m);
  }
  if (m.step === 0) {
    const y = k.floorY - 14;
    const end = m.dir > 0 ? a.right - 20 : a.left + 20;
    k.w.telegraph.dashed(k.x, y, end, y, PALETTE.kevin, blinkOn(m.t, 80) ? 0.95 : 0.45, m.t * 0.1, 2);
    if (m.t < C.tellMs) return false;
    k.pose('attack');
    playSfx('whoosh', 1, 1.4);
    next(m);
    return false;
  }
  if (m.step === 1) {
    const boost = m.count === 1 && level >= 3 ? C.lastBoost : 1;
    k.x += m.dir * C.speed * boost * (dtMs / 1000);
    k.strike = C.damage;
    if (chance(0.9)) k.w.fx.speedLine(k.x - m.dir * 12, k.floorY - 6 - Math.random() * 20, m.dir, PALETTE.kevin);
    const end = m.dir > 0 ? a.right - 30 : a.left + 30;
    if ((m.dir > 0 && k.x < end) || (m.dir < 0 && k.x > end)) return false;
    k.x = end;
    k.strike = 0;
    k.w.fx.burst('dust', k.x, k.floorY - 2, 10);
    k.w.cancelThreat();
    m.count--;
    if (m.count > 0) {
      m.step = 2;
      m.t = 0;
      return false;
    }
    m.step = 3;
    m.t = 0;
    k.pose('idle');
    return false;
  }
  if (m.step === 2) {
    if (m.t < C.pauseMs) return false;
    beginDash(k, m);
    return false;
  }
  return m.t >= pace.punish(450);
};

function beginDash(k: CopyBody, m: MoveState): void {
  const a = k.w.arena;
  // Always toward the far side from where he stands (through Ben).
  m.dir = k.x < (a.left + a.right) / 2 ? 1 : -1;
  k.facing = m.dir;
  m.step = 0;
  m.t = 0;
  k.pose('tell');
  k.w.threat(k.w.now + COPY_MOVES.dash.tellMs + 150);
}

/** Copy-Wildmutt: a target on Ben, then a pounce onto it (III: a roar ring where he lands). */
const pounce: MoveFn = (k, m, level) => {
  const C = COPY_MOVES.pounce;
  if (!m.started) {
    m.started = true;
    m.count = C.pounces[level - 1];
    aimPounce(k, m);
  }
  if (m.step === 0) {
    k.w.telegraph.target(m.tx, k.floorY - 4, 26, PALETTE.kevin, blinkOn(m.t, 90) ? 0.95 : 0.5);
    if (m.t < C.tellMs) return false;
    k.pose('attack');
    playSfx('growl', 0.9, 1.1);
    next(m);
    return false;
  }
  if (m.step === 1) {
    const t = Math.min(1, m.t / C.airMs);
    k.x = m.from + (m.tx - m.from) * t;
    k.lift = Math.sin(t * Math.PI) * C.height;
    k.strike = C.damage;
    if (t < 1) return false;
    k.lift = 0;
    k.strike = 0;
    k.w.fx.burst('dust', k.x, k.floorY - 2, 10);
    playSfx('land', 0.9, 0.7);
    k.w.cancelThreat();
    if (level >= 3) k.kh.erupt(k.x, C.roarRadius * 2, C.roarRadius, 220, 200, 1, 'roar', PALETTE.kevin);
    m.count--;
    if (m.count > 0) {
      aimPounce(k, m);
      return false;
    }
    m.wait = pace.punish(C.recoverMs);
    k.pose('idle');
    next(m);
    return false;
  }
  return m.t >= m.wait;
};

function aimPounce(k: CopyBody, m: MoveState): void {
  m.step = 0;
  m.t = 0;
  m.from = k.x;
  m.tx = k.clampX(k.w.player.x);
  k.facing = m.tx < k.x ? -1 : 1;
  k.pose('tell');
  k.w.threat(k.w.now + COPY_MOVES.pounce.tellMs + COPY_MOVES.pounce.airMs);
}

/** Copy-Stinkfly: rises, hovers over Ben and rains slime (II: more globs, III: two volleys), then lands. */
const flyer: MoveFn = (k, m, level, dtMs) => {
  const C = COPY_MOVES.flyer;
  if (!m.started) {
    m.started = true;
    m.count = C.volleys[level - 1];
    k.pose('air');
    playSfx('buzz', 0.7, 1.3);
  }
  const p = k.w.player;
  if (m.step === 0) {
    k.lift = Math.min(C.hoverY, (m.t / C.riseMs) * C.hoverY);
    if (m.t < C.riseMs) return false;
    next(m);
    k.w.threat(k.w.now + C.tellMs + C.flightMs);
    return false;
  }
  if (m.step === 1) {
    // Drifts over Ben while the abdomen swells (the tell).
    k.x = k.clampX(k.x + Math.sign(p.x - k.x) * Math.min(Math.abs(p.x - k.x), 90 * (dtMs / 1000)));
    faceBen(k);
    k.pose('tell');
    k.w.lighting.add(k.x, k.floorY - k.lift - 10, 20 + (m.t / C.tellMs) * 30, PALETTE.kevin, 1);
    if (m.t < C.tellMs) return false;
    const n = C.globs[level - 1];
    const sy = k.floorY - k.lift - 6;
    for (let i = 0; i < n; i++) {
      const tx = p.x + (i - (n - 1) / 2) * C.spreadPx;
      const t = C.flightMs / 1000;
      const vx = (tx - k.x) / t;
      const vy = (k.floorY - 8 - sy) / t - 0.5 * C.gravity * t;
      k.w.projectiles.spawn('slime', 'enemy', k.x, sy, vx, vy, C.damage, 2400, 5, { gravity: C.gravity, tint: PALETTE.kevin });
    }
    playSfx('splat', 0.8, 1.2);
    k.pose('air');
    m.count--;
    if (m.count > 0) {
      m.t = 0;
      k.w.threat(k.w.now + C.tellMs + C.flightMs);
      return false;
    }
    next(m);
    return false;
  }
  // Comes back down (open while he lands).
  k.lift = Math.max(0, k.lift - 160 * (dtMs / 1000));
  if (k.lift > 0) return false;
  k.pose('idle');
  return m.t >= pace.punish(400);
};

/** Copy-Upgrade: his eye lines up a floor-skimming beam (the tell), then fires (II: two, III: three in a row). */
const beam: MoveFn = (k, m, level) => {
  const C = COPY_MOVES.beam;
  const a = k.w.arena;
  if (!m.started) {
    m.started = true;
    m.count = C.beams[level - 1];
    m.step = 0;
    m.t = 0;
    faceBen(k);
    k.pose('tell');
    k.w.threat(k.w.now + C.tellMs);
    playSfx('laserCharge', 0.8, 1.3);
  }
  const y = k.floorY - C.lowY;
  const end = k.facing > 0 ? a.right : a.left;
  if (m.step === 0) {
    k.w.telegraph.dashed(k.x + k.facing * 10, y, end, y, PALETTE.kevin, blinkOn(m.t, 70) ? 0.95 : 0.4, m.t * 0.08, 2);
    if (m.t < C.tellMs) return false;
    k.pose('attack');
    k.w.hazards.fireBeam(k.x + k.facing * 10, end, y, PALETTE.kevin);
    playSfx('beamFire', 0.8, 1.4);
    k.w.fx.shake(0.004, 160);
    m.count--;
    next(m);
    return false;
  }
  if (m.t < C.gapMs) return false;
  if (m.count > 0) {
    m.step = 0;
    m.t = 0;
    faceBen(k);
    k.pose('tell');
    k.w.threat(k.w.now + C.tellMs);
    return false;
  }
  k.pose('idle');
  return true;
};

/** Any other alien: plain energy volleys in its colour. */
const bolt: MoveFn = (k, m, level) => {
  const C = COPY_MOVES.bolt;
  if (!m.started) {
    m.started = true;
    k.pose('tell');
    k.w.threat(k.w.now + C.tellMs);
    playSfx('kevinBolt', 0.6, 0.8);
  }
  if (m.step === 0) {
    faceBen(k);
    if (m.t < C.tellMs) return false;
    k.pose('attack');
    volleyAt(k, 'bolt', C.shots[level - 1], C.spreadDeg, C.speed, C.damage);
    playSfx('kevinBolt', 0.9);
    next(m);
    return false;
  }
  return m.t >= 400;
};

export const COPY_MOVE_FNS: Record<CopyStyle, MoveFn> = { fire, slam, dash, pounce, flyer, beam, bolt };
