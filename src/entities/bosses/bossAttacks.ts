import { BOSS } from '../../config/boss';
import { FX } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { playSfx } from '../../systems/audio/Sfx';
import type { BossWorld, HunterDrone } from './HunterDrone';
import { blinkOn } from '../../systems/Accessibility';
import { pace } from '../../systems/Difficulty';
import { chance } from '../../systems/Pacing';

export type AttackKind = 'volley' | 'slam' | 'summon' | 'beam' | 'rain';

export interface AttackState {
  kind: AttackKind;
  t: number;
  step: number;
  count: number;
  x: number;
  y: number;
  dir: 1 | -1;
  started: boolean;
}

export function newAttack(kind: AttackKind): AttackState {
  return { kind, t: 0, step: 0, count: 0, x: 0, y: 0, dir: 1, started: false };
}

type AttackFn = (b: HunterDrone, w: BossWorld, a: AttackState, dt: number) => boolean;

function next(a: AttackState): void {
  a.step++;
  a.t = 0;
}

const DEG = Math.PI / 180;

/** Eye charges, reticles lock on Ben, then aimed bolts (a wide spread in phase 2). */
const volley: AttackFn = (b, w, a) => {
  const p = b.phase;
  const cfg = BOSS.volley;
  const p0 = w.player;
  if (!a.started) {
    a.started = true;
    w.threat(w.now + cfg.telegraphMs[p]);
    playSfx('laserCharge', 1, 0.6);
  }
  if (a.step === 0) {
    b.eye = 'charge';
    b.setTarget(Math.max(w.arena.left + 80, Math.min(w.arena.right - 80, p0.x + (b.x < p0.x ? -120 : 120))), b.hoverY, 1.5);
    const t = a.t / cfg.telegraphMs[p];
    const locks = Math.min(3, Math.floor(t * 3) + 1);
    for (let i = 0; i < locks; i++) w.telegraph.reticle(p0.x, p0.centerY, i === locks - 1 ? PALETTE.enemy : 0xffffff, 1.4 - i * 0.25, a.t * 0.5 + i * 30);
    w.lighting.add(b.x, b.eyeY, 50 + t * 70, PALETTE.enemy, 1);
    if (a.t >= cfg.telegraphMs[p]) next(a);
    return false;
  }
  if (a.step === 1) {
    if (a.t >= cfg.intervalMs[p] || a.count === 0) {
      a.t = 0;
      const base = Math.atan2(p0.centerY - b.eyeY, p0.x - b.x);
      const n = cfg.spread[p];
      for (let i = 0; i < n; i++) {
        const angle = base + (i - (n - 1) / 2) * cfg.spreadDeg * DEG;
        w.projectiles.spawn('bolt', 'enemy', b.x + Math.cos(angle) * 14, b.eyeY + Math.sin(angle) * 14, Math.cos(angle) * cfg.speed[p], Math.sin(angle) * cfg.speed[p], cfg.damage, 3000, 4);
      }
      w.fx.flash(b.x, b.eyeY, PALETTE.enemy, 18, 150);
      w.lighting.flash(b.x, b.eyeY, 90, PALETTE.enemy, 150);
      w.threat(w.now);
      playSfx('laser', 1, 0.6);
      b.jolt(-Math.cos(base) * 6, -Math.sin(base) * 4);
      a.count++;
      if (a.count >= cfg.shots[p]) next(a);
    }
    return false;
  }
  b.eye = 'idle';
  return a.t > 450;
};

/** Rises, hunts Ben with a growing shadow, drops like a hammer, then sits stunned: the punish window. */
const slam: AttackFn = (b, w, a, dt) => {
  const p = b.phase;
  const cfg = BOSS.slam;
  const floor = w.arena.floorY;
  const lastInChain = a.count >= cfg.chain[p] - 1;
  switch (a.step) {
    case 0:
      b.eye = 'charge';
      b.setTarget(b.x, b.hoverY - 40, 4);
      if (a.t >= cfg.riseMs) {
        next(a);
        playSfx('alarm', 0.4);
      }
      return false;
    case 1: {
      const track = cfg.trackMs[p];
      const locked = a.t >= track - cfg.lockMs;
      if (!locked) a.x = Math.max(w.arena.left + 60, Math.min(w.arena.right - 60, w.player.x));
      b.setTarget(a.x, b.hoverY - 40, locked ? 0.5 : 6);
      const t = a.t / track;
      const pulse = blinkOn(a.t, locked ? 50 : 110);
      w.telegraph.rect(a.x - 44, floor - 3, 88, 3, PALETTE.enemy, pulse ? 0.9 : 0.35);
      w.telegraph.zone(a.x - 44, floor - 60, 88, 57, PALETTE.enemy, (pulse ? 0.7 : 0.35) * (0.5 + t * 0.5), a.t * 0.03);
      b.shake = 1 + t * 2;
      if (a.t >= track) {
        next(a);
        w.threat(w.now + (Math.max(0, floor - 30 - b.y) / cfg.dropSpeed) * 1000);
        playSfx('whistle', 1, 0.5);
      }
      return false;
    }
    case 2: {
      b.shake = 0;
      b.setTarget(a.x, floor - 30, 0);
      b.y += cfg.dropSpeed * (dt / 1000);
      b.x = a.x;
      if (b.y >= floor - 30) {
        b.y = floor - 30;
        w.fx.explosion(b.x, floor - 4, 'medium');
        w.fx.burst('dust', b.x, floor - 2, 26);
        w.fx.burst('debris', b.x, floor - 4, 14);
        w.fx.shake(FX.shakeHeavy, 380);
        w.fx.hitStop(FX.hitStopHeavyMs);
        playSfx('slam');
        w.hazards.spawnShockwave(b.x - 36, -1);
        w.hazards.spawnShockwave(b.x + 36, 1);
        next(a);
      }
      return false;
    }
    case 3: {
      const stuck = lastInChain ? pace.punish(cfg.stuckMs[p]) : 380;
      b.stuck = lastInChain;
      b.eye = lastInChain ? 'vulnerable' : 'charge';
      b.setTarget(b.x, floor - 30, 0);
      if (lastInChain && chance(0.15)) w.fx.burst('spark', b.x + (Math.random() - 0.5) * 60, b.y - 10, 3);
      if (a.t >= stuck) {
        b.stuck = false;
        a.count++;
        if (a.count < cfg.chain[p]) {
          a.step = 0;
          a.t = 0;
        } else next(a);
      }
      return false;
    }
    default:
      b.eye = 'idle';
      b.setTarget(b.x, b.hoverY, 2.5);
      return a.t > 700;
  }
};

/** Opens its hatch and launches escort drones. */
const summon: AttackFn = (b, w, a) => {
  const p = b.phase;
  const cfg = BOSS.summon;
  if (a.step === 0) {
    b.eye = 'closed';
    b.setTarget((w.arena.left + w.arena.right) / 2, b.hoverY - 20, 2);
    if (blinkOn(a.t, 120)) w.lighting.add(b.x, b.y + 26, 50, PALETTE.enemy, 1);
    if (a.t >= cfg.telegraphMs) next(a);
    return false;
  }
  if (a.step === 1) {
    const room = BOSS.maxAdds[p] - w.aliveAdds();
    const count = Math.max(0, Math.min(cfg.count[p], room));
    for (let i = 0; i < count; i++) {
      const dx = (i - (count - 1) / 2) * 40;
      w.spawnAdd(p === 0 ? 'scout' : 'striker', b.x + dx, b.y + 30);
    }
    w.fx.burst('red', b.x, b.y + 28, 16);
    w.fx.flash(b.x, b.y + 28, PALETTE.enemy, 24, 200);
    playSfx('clamp', 0.8);
    next(a);
    return false;
  }
  b.eye = 'idle';
  return a.t > 500;
};

/** Drops low at one edge and sweeps the floor with a beam at knee height. Countdown blinks make the timing readable. */
const beam: AttackFn = (b, w, a) => {
  const cfg = BOSS.beam;
  const floor = w.arena.floorY;
  const beamY = floor - cfg.groundOffset - cfg.height / 2;
  if (!a.started) {
    a.started = true;
    a.dir = w.player.x > (w.arena.left + w.arena.right) / 2 ? -1 : 1;
  }
  if (a.step === 0) {
    const edge = a.dir > 0 ? w.arena.left + 70 : w.arena.right - 70;
    b.setTarget(edge, floor - 48, 3);
    b.eye = 'charge';
    if (a.t >= cfg.moveMs) {
      next(a);
      w.threat(w.now + cfg.telegraphMs);
      playSfx('beamCharge');
    }
    return false;
  }
  const from = b.x + a.dir * 40;
  const to = a.dir > 0 ? w.arena.right : w.arena.left;
  if (a.step === 1) {
    b.setTarget(b.x, floor - 48, 3);
    const t = a.t / cfg.telegraphMs;
    // Three beats that speed up; the line turns solid white just before firing.
    const beat = t < 0.45 ? 200 : t < 0.8 ? 110 : 50;
    const on = blinkOn(a.t, beat);
    w.telegraph.line(from, beamY, to, beamY, t > 0.9 ? 0xffffff : PALETTE.enemy, on ? 0.95 : 0.3, t > 0.9 ? 3 : 1);
    w.telegraph.zone(Math.min(from, to), beamY - cfg.height / 2, Math.abs(to - from), cfg.height, PALETTE.enemy, 0.3 + t * 0.6, a.t * 0.06, a.dir);
    w.lighting.add(from, beamY, 40 + t * 60, PALETTE.enemy, 1);
    if (a.t >= cfg.telegraphMs) {
      w.hazards.fireBeam(from, to, beamY);
      playSfx('beamFire');
      w.fx.shake(FX.shakeMedium, cfg.fireMs);
      next(a);
    }
    return false;
  }
  if (a.step === 2) {
    b.jolt(-a.dir * 1.5, 0);
    if (a.t >= cfg.fireMs) next(a);
    return false;
  }
  b.eye = 'idle';
  b.setTarget(b.x, b.hoverY, 2);
  return a.t > 600;
};

/** Climbs out of reach and carpet-bombs the arena; every impact point is marked first. */
const rain: AttackFn = (b, w, a) => {
  const cfg = BOSS.rain;
  if (a.step === 0) {
    b.eye = 'closed';
    b.setTarget((w.arena.left + w.arena.right) / 2, w.arena.top + 30, 2.5);
    if (a.t > 700) next(a);
    return false;
  }
  if (a.step === 1) {
    b.shake = 1;
    if (a.t >= cfg.intervalMs || a.count === 0) {
      a.t = 0;
      const width = w.arena.right - w.arena.left - 40;
      const x = a.count % 3 === 0 ? w.player.x : w.arena.left + 20 + ((a.count * 0.618) % 1) * width;
      w.hazards.dropBomb(Math.max(w.arena.left + 16, Math.min(w.arena.right - 16, x)), cfg.warnMs);
      a.count++;
      if (a.count >= cfg.count) next(a);
    }
    return false;
  }
  b.shake = 0;
  b.eye = 'idle';
  b.setTarget(b.x, b.hoverY, 1.5);
  return a.t > cfg.warnMs + 700;
};

export const ATTACKS: Record<AttackKind, AttackFn> = { volley, slam, summon, beam, rain };
