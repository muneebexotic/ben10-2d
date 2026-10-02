import { BOSS } from '../../../config/boss';
import { FX } from '../../../config/constants';
import { PALETTE } from '../../../config/palette';
import { ROADBREAKER as RB } from '../../../config/roadbreaker';
import { blinkOn } from '../../../systems/Accessibility';
import { pace } from '../../../systems/Difficulty';
import { playSfx } from '../../../systems/audio/Sfx';
import { crunch, engineRev, horn } from '../../vehicles/audio';
import type { BossWorld } from '../HunterDrone';
import type { Roadbreaker } from './Roadbreaker';

export type RbAttackKind = 'ram' | 'lob' | 'dispatch' | 'slam' | 'saw' | 'beam';

export interface RbAttackState {
  kind: RbAttackKind;
  t: number;
  step: number;
  count: number;
  x: number;
  dir: 1 | -1;
  started: boolean;
  /** Mid-ram: if both tires pop now the ram skids to a stall itself. */
  skids: boolean;
}

export function newRbAttack(kind: RbAttackKind): RbAttackState {
  return { kind, t: 0, step: 0, count: 0, x: 0, dir: 1, started: false, skids: false };
}

type AttackFn = (b: Roadbreaker, w: BossWorld, a: RbAttackState, dtMs: number) => boolean;

function next(a: RbAttackState): void {
  a.step++;
  a.t = 0;
}

// ------------------------------------------------------------ Truck mode

/**
 * Drives to the far side, revs (chevrons along the floor the whole way across),
 * charges and slams into the arena wall, dazed for a moment. XLR8 can dash
 * straight through it, slashing tires; everyone else jumps or climbs.
 */
const ram: AttackFn = (b, w, a, dtMs) => {
  const R = RB.truck.ram;
  const { arena } = w;
  const floor = arena.floorY;
  switch (a.step) {
    case 0: {
      if (!a.started) {
        a.started = true;
        const mid = (arena.left + arena.right) / 2;
        a.x = w.player.x < mid ? arena.right - 80 : arena.left + 80;
      }
      const gap = a.x - b.x;
      b.facing = gap < 0 ? -1 : 1;
      const speed = RB.truck.driveSpeed * (b.tiresPopped > 0 ? 0.7 : 1);
      b.vx = Math.abs(gap) < 8 ? 0 : Math.sign(gap) * speed;
      if (Math.abs(gap) < 8 || a.t >= R.repositionMs) {
        b.vx = 0;
        a.dir = w.player.x < b.x ? -1 : 1;
        b.facing = a.dir;
        b.revving = true;
        w.tip('rbRam', 'JUMP THE RAM... OR DASH THROUGH IT AS XLR8 AND SLASH ITS TIRES!', 3500);
        playSfx(engineRev, 1, 0.8);
        playSfx(horn, 0.9);
        const dist = Math.abs((a.dir > 0 ? arena.right : arena.left) - b.x) - 60;
        w.threat(w.now + R.revMs + (dist / R.speed) * 1000);
        next(a);
      }
      return false;
    }
    case 1: {
      // The tell: engine roar, headlights, chevrons racing across the floor.
      const k = a.t / R.revMs;
      b.shake = 1 + k * 1.5;
      const from = b.x + a.dir * 60;
      const to = a.dir > 0 ? arena.right : arena.left;
      w.telegraph.zone(Math.min(from, to), floor - R.height, Math.abs(to - from), R.height, PALETTE.enemy, 0.3 + k * 0.7, a.t * 0.08, a.dir);
      if (Math.random() < 0.7) w.fx.trail('fire', b.x - a.dir * 4, floor - 58);
      w.lighting.add(b.x + a.dir * 80, floor - 34, 90 + k * 80, 0xfff0c0, 1);
      if (a.t >= R.revMs) {
        b.revving = false;
        b.shake = 0;
        b.ramming = true;
        a.skids = true;
        playSfx('dive', 0.8, 0.5);
        next(a);
      }
      return false;
    }
    case 2: {
      // Full speed. Both tires gone mid-charge: it skids out instead.
      const speed = R.speed * (b.tiresPopped > 0 ? 0.85 : 1);
      if (b.tiresPopped === 2) {
        b.ramming = false;
        a.step = 4;
        a.t = 0;
        w.cancelThreat();
        playSfx(crunch, 0.8, 1.2);
        return false;
      }
      b.vx = a.dir * speed;
      if (Math.random() < 0.6) w.fx.speedLine(b.x - a.dir * 40, floor - 10 - Math.random() * 40, -a.dir as 1 | -1, PALETTE.white);
      if (Math.random() < 0.5) w.fx.burst('dust', b.x - a.dir * 50, floor - 2, 2);
      const wall = a.dir > 0 ? arena.right - 62 : arena.left + 62;
      if ((a.dir > 0 && b.x >= wall) || (a.dir < 0 && b.x <= wall)) {
        b.x = wall;
        b.vx = 0;
        b.ramming = false;
        a.skids = false;
        b.dazed = true;
        w.fx.explosion(wall + a.dir * 60, floor - 30, 'small');
        w.fx.burst('debris', wall + a.dir * 60, floor - 30, 14);
        w.fx.shake(FX.shakeHeavy, 360);
        w.fx.hitStop(FX.hitStopHeavyMs);
        playSfx(crunch);
        next(a);
      }
      return false;
    }
    case 3: {
      // Dazed against the wall: the punish window.
      if (Math.random() < 0.3) w.fx.burst('spark', b.x + a.dir * 60, floor - 20 - Math.random() * 30, 2);
      return a.t >= pace.punish(R.crashStunMs);
    }
    default: {
      // Skidding out on shredded tires.
      b.vx *= Math.exp(-3.2 * (dtMs / 1000));
      b.shake = 2;
      if (Math.random() < 0.8) w.fx.burst('spark', b.x + (Math.random() - 0.5) * 80, floor - 2, 2);
      if (Math.random() < 0.4) w.fx.trail('smoke', b.x, floor - 20);
      if (Math.abs(b.vx) < 25 || a.t > 1400) {
        a.skids = false;
        b.stall();
      }
      return false;
    }
  }
};

/** The crane on its bed lobs fuel barrels; every landing spot is marked first. */
const lob: AttackFn = (b, w, a) => {
  const L = RB.truck.lob;
  const n = L.count[b.phase === 0 ? 0 : 1];
  if (a.step === 0) {
    b.vx = 0;
    b.facing = w.player.x < b.x ? -1 : 1;
    if (blinkOn(a.t, 120)) w.lighting.add(b.x - b.facing * 40, w.arena.floorY - 54, 40, PALETTE.enemy, 1);
    if (a.t >= 500) next(a);
    return false;
  }
  if (a.step === 1) {
    if (a.count === 0 || a.t >= L.intervalMs) {
      a.t = 0;
      const spread = [0, -70, 70, 140][a.count] ?? 0;
      const x = Math.max(w.arena.left + 20, Math.min(w.arena.right - 20, w.player.x + spread * (a.count % 2 ? 1 : -1)));
      w.hazards.dropBomb(x, L.warnMs);
      w.fx.burst('smoke', b.x - b.facing * 40, w.arena.floorY - 60, 4);
      playSfx('cannon', 0.6, 0.8);
      a.count++;
      if (a.count >= n) next(a);
    }
    return false;
  }
  return a.t >= L.warnMs + L.settleMs;
};

/** Pops the hood and launches escort drones (fewer if some are still up). */
const dispatch: AttackFn = (b, w, a) => {
  const D = RB.truck.dispatch;
  if (a.step === 0) {
    b.vx = 0;
    if (blinkOn(a.t, 110)) w.lighting.add(b.x, b.mode === 'truck' ? w.arena.floorY - 50 : b.torsoTop, 50, PALETTE.enemy, 1);
    if (a.t >= D.telegraphMs) next(a);
    return false;
  }
  if (a.step === 1) {
    const room = RB.maxAdds[b.phase] - w.aliveAdds();
    const count = Math.max(0, Math.min(D.count, room));
    const y = b.mode === 'truck' ? w.arena.floorY - 60 : b.torsoTop - 10;
    for (let i = 0; i < count; i++) w.spawnAdd(b.phase === 0 ? 'scout' : 'striker', b.x + (i - (count - 1) / 2) * 40, y);
    w.fx.burst('red', b.x, y, 16);
    playSfx('clamp', 0.8);
    next(a);
    return false;
  }
  return a.t > 500;
};

// ------------------------------------------------------------ Robot mode

/** Walks up, raises both fists (the landing zone striped on the floor), slams, sticks, vents. */
const slam: AttackFn = (b, w, a, dtMs) => {
  const S = RB.robot.slam;
  const floor = w.arena.floorY;
  const dt = dtMs / 1000;
  switch (a.step) {
    case 0: {
      const gap = w.player.x - b.x;
      b.facing = gap < 0 ? -1 : 1;
      b.vx = Math.abs(gap) > 70 ? Math.sign(gap) * RB.robot.walkSpeed * 1.4 : 0;
      if (Math.abs(gap) <= 70 || a.t >= S.approachMs) {
        b.vx = 0;
        w.threat(w.now + S.raiseMs + 100);
        playSfx('alarm', 0.4);
        next(a);
      }
      return false;
    }
    case 1: {
      const k = Math.min(1, a.t / S.raiseMs);
      b.armAngle = -160 * Math.min(1, k * 1.6);
      b.crouch = -4 * k;
      a.x = b.x + b.facing * 56;
      const pulse = blinkOn(a.t, k > 0.7 ? 60 : 120);
      w.telegraph.zone(a.x - S.width / 2, floor - 60, S.width, 60, PALETTE.enemy, (pulse ? 0.8 : 0.4) * (0.4 + 0.6 * k), a.t * 0.04);
      w.telegraph.rect(a.x - S.width / 2, floor - 3, S.width, 3, PALETTE.enemy, pulse ? 0.9 : 0.4);
      b.shake = k * 2;
      if (a.t >= S.raiseMs) {
        b.shake = 0;
        next(a);
      }
      return false;
    }
    case 2: {
      // Down they come.
      b.armAngle = Math.min(-30, b.armAngle + 1700 * dt);
      b.crouch = Math.min(16, b.crouch + 160 * dt);
      if (b.armAngle >= -30) {
        b.slamFloor(a.x);
        next(a);
      }
      return false;
    }
    case 3: {
      // Fists stuck in the asphalt, chest within reach (touching it is safe). Vents open as it strains.
      if (!a.started) {
        a.started = true;
        b.openVents();
      }
      b.dazed = true;
      b.crouch = 16;
      if (Math.random() < 0.15) w.fx.burst('spark', a.x + (Math.random() - 0.5) * 40, floor - 4, 2);
      if (a.t >= pace.punish(S.stuckMs)) {
        b.dazed = false;
        next(a);
      }
      return false;
    }
    default:
      b.armAngle *= Math.exp(-8 * dt);
      b.crouch *= Math.exp(-6 * dt);
      return a.t > 450;
  }
};

/** Rips a wheel off its shoulder and bowls it across the floor. Jump it or hit it back. */
const saw: AttackFn = (b, w, a, dtMs) => {
  const S = RB.robot.saw;
  const floor = w.arena.floorY;
  const dt = dtMs / 1000;
  const throws = b.hp < b.maxHp * 0.3 ? 2 : 1;
  if (a.step === 0) {
    if (!a.started) {
      a.started = true;
      b.vx = 0;
      b.facing = w.player.x < b.x ? -1 : 1;
      w.threat(w.now + S.windMs + 300);
      playSfx('ramCharge', 0.8);
    }
    const k = Math.min(1, a.t / S.windMs);
    // Reaches up for the wheel and winds back.
    b.armAngle = 50 * k;
    const from = b.x + b.facing * 40;
    const to = b.facing > 0 ? w.arena.right : w.arena.left;
    w.telegraph.zone(Math.min(from, to), floor - S.radius * 2 - 4, Math.abs(to - from), S.radius * 2 + 4, PALETTE.enemy, 0.3 + 0.6 * k, a.t * 0.07, b.facing);
    if (a.t >= S.windMs) next(a);
    return false;
  }
  if (a.step === 1) {
    b.armAngle = Math.max(-100, b.armAngle - 1500 * dt);
    if (b.armAngle <= -100) {
      b.throwWheel();
      a.count++;
      w.fx.burst('spark', b.x + b.facing * 40, floor - 10, 10);
      playSfx('throw', 1, 0.6);
      if (a.count < throws) {
        a.step = 0;
        a.t = 0;
        a.started = false;
      } else next(a);
    }
    return false;
  }
  b.armAngle *= Math.exp(-6 * dt);
  return a.t > 500;
};

/** Kneels and fires its core along the floor at knee height: jump, roll, or get above it. */
const beam: AttackFn = (b, w, a, dtMs) => {
  const C = RB.robot.beam;
  const floor = w.arena.floorY;
  const beamY = floor - BOSS.beam.groundOffset - BOSS.beam.height / 2;
  const dt = dtMs / 1000;
  if (a.step === 0) {
    if (!a.started) {
      a.started = true;
      b.vx = 0;
      b.facing = w.player.x < b.x ? -1 : 1;
      a.dir = b.facing;
    }
    b.crouch = Math.min(12, b.crouch + 40 * dt);
    if (a.t >= C.moveMs) {
      w.threat(w.now + C.telegraphMs);
      playSfx('beamCharge');
      next(a);
    }
    return false;
  }
  const from = b.x + a.dir * 34;
  const to = a.dir > 0 ? w.arena.right : w.arena.left;
  if (a.step === 1) {
    const t = a.t / C.telegraphMs;
    const beat = t < 0.45 ? 200 : t < 0.8 ? 110 : 50;
    const on = blinkOn(a.t, beat);
    w.telegraph.line(from, beamY, to, beamY, t > 0.9 ? 0xffffff : PALETTE.enemy, on ? 0.95 : 0.3, t > 0.9 ? 3 : 1);
    w.telegraph.zone(Math.min(from, to), beamY - BOSS.beam.height / 2, Math.abs(to - from), BOSS.beam.height, PALETTE.enemy, 0.3 + t * 0.6, a.t * 0.06, a.dir);
    w.lighting.add(b.x, b.coreY, 40 + t * 60, PALETTE.enemy, 1);
    if (a.t >= C.telegraphMs) {
      w.hazards.fireBeam(from, to, beamY);
      playSfx('beamFire');
      w.fx.shake(FX.shakeMedium, C.fireMs);
      next(a);
    }
    return false;
  }
  if (a.step === 2) {
    if (a.t >= C.fireMs) next(a);
    return false;
  }
  b.crouch *= Math.exp(-6 * dt);
  return a.t > 500;
};

export const RB_ATTACKS: Record<RbAttackKind, AttackFn> = { ram, lob, dispatch, slam, saw, beam };
