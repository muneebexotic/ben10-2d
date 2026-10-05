import { COILS, KEVIN } from '../../../config/kevin';
import { PALETTE } from '../../../config/palette';
import { blinkOn } from '../../../systems/Accessibility';
import { pace } from '../../../systems/Difficulty';
import { chance } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Coil } from './Coil';
import type { CopyBody, MoveFn, MoveState } from './copyMoves';
import { HUMAN } from './rules';

/** Kevin as himself: everything his own moves need beyond a copy's. */
export interface KevinBody extends CopyBody {
  readonly phase: number;
  readonly coils: readonly Coil[];
  /** Ben's form right now ('ben' when human). */
  playerForm(): string;
  /** The lunge caught Ben as `form`. */
  absorb(form: string): void;
  /** The scan finished on Ben as `form` (human: Kevin falls back on what he remembers). */
  scanned(form: string): void;
}

const DEG = Math.PI / 180;

function handY(k: KevinBody): number {
  return k.floorY - k.lift - 22;
}

/** Winds up a fistful of stolen power and throws it as a fan of bolts. More bolts each phase. */
export const volley: MoveFn = (kb, m) => {
  const k = kb as KevinBody;
  const V = KEVIN.volley;
  if (!m.started) {
    m.started = true;
    m.count = 0;
    k.pose('tell');
    k.w.threat(k.w.now + V.windupMs);
    playSfx('absorb', 0.5, 1.6);
  }
  const p = k.w.player;
  k.facing = p.x < k.x ? -1 : 1;
  if (m.step === 0) {
    k.w.lighting.add(k.x - k.facing * 8, handY(k) - 6, 16 + (m.t / V.windupMs) * 30, PALETTE.kevin, 1);
    if (chance(0.5)) k.w.fx.burst('volt', k.x - k.facing * 8, handY(k) - 6, 1);
    if (m.t < V.windupMs) return false;
    k.pose('attack');
    m.step = 1;
    m.t = V.intervalMs;
  }
  if (m.step === 1) {
    const shots = V.shots[Math.min(2, k.phase)];
    if (m.t >= V.intervalMs) {
      m.t = 0;
      const sx = k.x + k.facing * 10;
      const sy = handY(k);
      const base = Math.atan2(p.centerY - sy, p.x - sx) + (m.count - (shots - 1) / 2) * V.spreadDeg * DEG;
      k.w.projectiles.spawn('bolt', 'enemy', sx, sy, Math.cos(base) * V.speed, Math.sin(base) * V.speed, V.damage, 3000, 4, { tint: PALETTE.kevin });
      k.w.fx.flash(sx, sy, PALETTE.kevin, 14, 120);
      k.w.threat(k.w.now);
      playSfx('kevinBolt', 0.8, 1 + m.count * 0.05);
      m.count++;
      if (m.count >= shots) {
        m.step = 2;
        m.t = 0;
      }
    }
    return false;
  }
  if (m.t > 200) k.pose('idle');
  return m.t >= 450;
};

/**
 * The absorb lunge: he crouches with a crackling hand and a line marks his
 * path (the tell), then dives along it. Catching Ben as an alien drains his
 * time and levels up Kevin's copy of that alien on the spot.
 */
export const lunge: MoveFn = (kb, m, _level, dtMs) => {
  const k = kb as KevinBody;
  const L = KEVIN.lunge;
  const a = k.w.arena;
  if (!m.started) {
    m.started = true;
    m.dir = k.w.player.x < k.x ? -1 : 1;
    k.facing = m.dir;
    k.pose('absorb');
    k.w.threat(k.w.now + L.tellMs + 120);
    playSfx('coilCharge', 0.6, 1.4);
  }
  if (m.step === 0) {
    const y = k.floorY - 18;
    const reach = L.speed * (L.durationMs / 1000);
    const end = Math.max(a.left, Math.min(a.right, k.x + m.dir * reach));
    k.w.telegraph.dashed(k.x, y, end, y, PALETTE.kevin, blinkOn(m.t, 80) ? 0.95 : 0.45, m.t * 0.1, 2);
    k.w.lighting.add(k.x + m.dir * 10, y - 4, 20 + (m.t / L.tellMs) * 26, PALETTE.kevin, 1);
    if (m.t < L.tellMs) return false;
    k.pose('lunge');
    playSfx('whoosh', 0.9, 0.8);
    m.step = 1;
    m.t = 0;
    m.wait = 0;
  }
  if (m.step === 1) {
    k.x = k.clampX(k.x + m.dir * L.speed * (dtMs / 1000));
    k.strike = L.damage;
    if (chance(0.6)) k.w.fx.speedLine(k.x - m.dir * 10, k.floorY - 10 - Math.random() * 14, m.dir, PALETTE.kevin);
    const p = k.w.player;
    const form = k.playerForm();
    if (m.wait === 0 && !p.dead && Math.abs(p.x - k.x) < L.catchWidth && Math.abs(p.centerY - (k.floorY - 18)) < 30) {
      m.wait = 1;
      if (form !== HUMAN) {
        k.strike = 0;
        k.absorb(form);
        return true;
      }
    }
    if (m.t < L.durationMs) return false;
    k.strike = 0;
    k.pose('hurt');
    k.w.cancelThreat();
    m.step = 2;
    m.t = 0;
    m.wait = pace.punish(L.recoverMs);
    return false;
  }
  if (m.t >= m.wait) {
    k.pose('idle');
    return true;
  }
  return false;
};

/**
 * The scan: his eyes lock a beam onto Ben for most of a second (the tell),
 * then he becomes a copy of whatever Ben is when it ends. Switching during
 * the scan picks what he copies.
 */
export const scan: MoveFn = (kb, m) => {
  const k = kb as KevinBody;
  const S = KEVIN.scan;
  const p = k.w.player;
  if (!m.started) {
    m.started = true;
    k.pose('absorb');
    playSfx('dnaScan', 0.7, 0.7);
  }
  k.facing = p.x < k.x ? -1 : 1;
  const ex = k.x + k.facing * 3;
  const ey = k.floorY - k.lift - 29;
  const on = blinkOn(m.t, 60);
  k.w.telegraph.line(ex, ey, p.x, p.centerY, PALETTE.kevin, on ? 0.9 : 0.5, 2);
  k.w.telegraph.reticle(p.x, p.centerY, PALETTE.kevin, 1.2 - (m.t / S.lockMs) * 0.4, m.t * 0.4);
  k.w.lighting.add(p.x, p.centerY, 26, PALETTE.kevin, 0.7);
  if (m.t < S.lockMs) return false;
  k.scanned(k.playerForm());
  return true;
};

/**
 * Phase 2: he drains a coil (a crackling beam from its top to his hands),
 * then arcs rake the floor: striped danger bands, then the lightning.
 */
export const coilDrain: MoveFn = (kb, m) => {
  const k = kb as KevinBody;
  const C = COILS;
  if (!m.started) {
    m.started = true;
    const free = k.coils.filter((c) => !c.possessed);
    if (free.length === 0) return true;
    // The coil nearer Ben: the arcs start on his side.
    const coil = free.reduce((best, c) => (Math.abs(c.topX - k.w.player.x) < Math.abs(best.topX - k.w.player.x) ? c : best));
    m.tx = k.coils.indexOf(coil);
    coil.draining = true;
    k.pose('absorb');
    playSfx('powerSurge', 0.7, 0.8);
    m.count = C.arcsPerDrain[Math.min(1, Math.max(0, k.phase - 1))];
  }
  const coil = k.coils[m.tx];
  if (m.step === 0) {
    k.facing = coil.topX < k.x ? -1 : 1;
    if (chance(0.7)) k.w.fx.beam(coil.topX, coil.topY, k.x, k.floorY - k.lift - 20, PALETTE.kevin, 2, 50);
    if (m.t < C.drainMs) return false;
    coil.draining = false;
    k.pose('attack');
    m.step = 1;
    m.t = C.arcGapMs;
  }
  if (m.step === 1) {
    if (m.t < C.arcGapMs) return false;
    m.t = 0;
    const p = k.w.player;
    const x = Math.max(k.w.arena.left + C.arcWidth / 2, Math.min(k.w.arena.right - C.arcWidth / 2, p.x));
    k.kh.erupt(x, C.arcWidth, k.floorY - k.w.arena.top, C.arcWarnMs, C.arcLiveMs, C.arcDamage, 'arc', PALETTE.kevin);
    k.w.threat(k.w.now + C.arcWarnMs);
    playSfx('coilCharge', 0.5, 1.2);
    m.count--;
    if (m.count <= 0) {
      m.step = 2;
      m.t = 0;
    }
    return false;
  }
  if (m.t > 300) k.pose('idle');
  return m.t >= C.arcWarnMs + C.arcLiveMs;
};

export function freshMove(m: MoveState): MoveState {
  m.t = 0;
  m.step = 0;
  m.count = 0;
  m.started = false;
  m.wait = 0;
  return m;
}
