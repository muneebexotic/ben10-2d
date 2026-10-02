import { COMBAT } from '../../config/combat';
import type { CombatApi, HeldObject, ShotSpec, WaveSpec } from '../../aliens/types';
import type { DamageOutcome, Player } from '../../entities/Player';
import type { Projectile, Projectiles } from '../../entities/Projectiles';
import {
  circleRect,
  overlaps,
  rectCenterX,
  rectCenterY,
  type Damageable,
  type Hazard,
  type Hit,
  type HitKind,
  type HitResult,
  type Liftable,
  type Rect,
} from '../../entities/types';

export interface CombatHooks {
  onTargetHit(target: Damageable, result: HitResult, hit: Hit): void;
  onPlayerHurt(outcome: DamageOutcome): void;
  onParry(count: number): void;
  /** A thrown object came down after bowling over `hits` enemies (STRIKE! at two or more). */
  onThrowLanded?(hits: number, x: number, y: number): void;
}

/** Level queries Combat needs to fly thrown objects. */
export interface CombatWorld {
  isSolid(x: number, y: number): boolean;
}

interface Thrown {
  obj: Liftable;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hit: Hit;
  splash: number;
  age: number;
  angle: number;
  /** Enemies it already bowled over on the way (each is hit once). */
  pins: Damageable[];
}

/** Resolves every hit in the level: melee, projectiles, blasts, contact hazards, thrown objects. */
export class Combat implements CombatApi {
  private readonly targets: Damageable[] = [];
  private readonly hazards: Hazard[] = [];
  private readonly liftables: Liftable[] = [];
  private readonly thrown: Thrown[] = [];
  private readonly marks = new Map<object, Set<Damageable>>();
  private player: Player | null = null;
  private readonly a: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private readonly b: Rect = { x: 0, y: 0, w: 0, h: 0 };

  constructor(
    private readonly projectiles: Projectiles,
    private readonly hooks: CombatHooks,
    private readonly world: CombatWorld,
  ) {}

  setPlayer(player: Player): void {
    this.player = player;
  }

  addTarget(t: Damageable): void {
    this.targets.push(t);
  }

  addHazard(h: Hazard): void {
    this.hazards.push(h);
  }

  addLiftable(l: Liftable): void {
    this.liftables.push(l);
  }

  removeTarget(t: Damageable): void {
    const i = this.targets.indexOf(t);
    if (i >= 0) this.targets.splice(i, 1);
  }

  removeHazard(h: Hazard): void {
    const i = this.hazards.indexOf(h);
    if (i >= 0) this.hazards.splice(i, 1);
  }

  removeLiftable(l: Liftable): void {
    const i = this.liftables.indexOf(l);
    if (i >= 0) this.liftables.splice(i, 1);
  }

  // ------------------------------------------------------------ CombatApi

  melee(area: Rect, hit: Hit): number {
    let count = 0;
    for (const t of [...this.targets]) {
      if (!t.alive || !t.hurtbox(this.b) || !overlaps(area, this.b)) continue;
      if (this.apply(t, hit)) count++;
    }
    return count;
  }

  parry(area: Rect, facing: 1 | -1, speedMultiplier: number, damage: number): number {
    let count = 0;
    this.projectiles.forEachActive('enemy', (p) => {
      if (!circleRect(p.x, p.y, p.radius + 4, area)) return;
      this.projectiles.reflect(p, facing, speedMultiplier, damage);
      count++;
    });
    if (count > 0) this.hooks.onParry(count);
    return count;
  }

  shoot(spec: ShotSpec, x: number, y: number, angle: number): void {
    this.projectiles.spawn(spec.kind, 'player', x, y, Math.cos(angle) * spec.speed, Math.sin(angle) * spec.speed, spec.damage, spec.lifetimeMs, spec.radius, {
      hitKind: spec.hitKind,
      knockback: spec.knockback,
    });
  }

  aimAssist(x: number, y: number, angle: number, cone: number, range: number): number {
    let best = angle;
    let bestScore = Infinity;
    for (const t of this.targets) {
      if (!t.alive || !t.countsAsEnemy || t.evasive || !t.hurtbox(this.b)) continue;
      const tx = this.b.x + this.b.w / 2;
      const ty = this.b.y + this.b.h / 2;
      const dist = Math.hypot(tx - x, ty - y);
      if (dist > range || dist < 8) continue;
      const a = Math.atan2(ty - y, tx - x);
      const diff = Math.abs(Math.atan2(Math.sin(a - angle), Math.cos(a - angle)));
      if (diff > cone) continue;
      const score = diff * 200 + dist;
      if (score < bestScore) {
        bestScore = score;
        best = a;
      }
    }
    return best;
  }

  blast(x: number, y: number, radius: number, hit: Hit, clearsProjectiles: boolean): number {
    let count = 0;
    for (const t of [...this.targets]) {
      if (!t.alive || !t.hurtbox(this.b) || !circleRect(x, y, radius, this.b)) continue;
      if (t.accepts && !t.accepts(hit.kind)) continue;
      if (this.apply(t, hit)) count++;
    }
    if (clearsProjectiles) {
      this.projectiles.forEachActive('enemy', (p) => {
        if ((p.x - x) ** 2 + (p.y - y) ** 2 <= (radius + p.radius) ** 2) this.projectiles.kill(p, true);
      });
    }
    return count;
  }

  mark(area: Rect, key: object): number {
    let set = this.marks.get(key);
    if (!set) {
      set = new Set();
      this.marks.set(key, set);
    }
    let added = 0;
    for (const t of this.targets) {
      if (set.has(t) || !t.alive || !t.countsAsEnemy || !t.hurtbox(this.b) || !overlaps(area, this.b)) continue;
      set.add(t);
      added++;
    }
    return added;
  }

  markedPoints(key: object): Array<{ x: number; y: number }> {
    const out: Array<{ x: number; y: number }> = [];
    for (const t of this.marks.get(key) ?? []) {
      if (t.alive && t.hurtbox(this.b)) out.push({ x: rectCenterX(this.b), y: rectCenterY(this.b) });
    }
    return out;
  }

  strikeMarked(key: object, hit: Hit, onEach?: (x: number, y: number) => void): number {
    const set = this.marks.get(key);
    this.marks.delete(key);
    if (!set) return 0;
    let count = 0;
    for (const t of set) {
      if (!t.alive || !t.hurtbox(this.b)) continue;
      const cx = rectCenterX(this.b);
      const cy = rectCenterY(this.b);
      if (this.apply(t, { ...hit, x: cx - Math.sign(cx - hit.x) * 8, y: cy })) {
        count++;
        onEach?.(cx, cy);
      }
    }
    return count;
  }

  groundWave(x: number, feetY: number, dir: 1 | -1, spec: WaveSpec, hitKind: HitKind): void {
    const r = COMBAT.waveRadius;
    this.projectiles.spawn('wave', 'player', x + dir * 6, feetY - r, dir * spec.speed, 0, spec.damage, spec.lifeMs, r, {
      hitKind,
      knockback: spec.knockback,
      stunMs: spec.stunMs,
      pierce: true,
      hugGround: true,
      tint: spec.color,
    });
  }

  lift(area: Rect): HeldObject | null {
    let best: Liftable | null = null;
    let bestDist = Infinity;
    const cx = rectCenterX(area);
    const cy = rectCenterY(area);
    for (const l of this.liftables) {
      if (!l.liftable || !l.liftBox(this.b) || !overlaps(area, this.b)) continue;
      const d = Math.hypot(rectCenterX(this.b) - cx, rectCenterY(this.b) - cy);
      if (d < bestDist) {
        bestDist = d;
        best = l;
      }
    }
    best?.lift();
    return best;
  }

  hurl(obj: HeldObject, x: number, y: number, vx: number, vy: number, hit: Hit, splash: number): void {
    const l = this.liftables.find((it) => it === obj);
    if (!l) return;
    this.thrown.push({ obj: l, x, y, vx, vy, hit, splash, age: 0, angle: 0, pins: [] });
  }

  /** A thrown object's landing blast: hits everything nearby except the pins it already bowled over. Returns enemies hit. */
  private blastExcept(x: number, y: number, radius: number, hit: Hit, skip: readonly Damageable[]): number {
    let count = 0;
    for (const t of [...this.targets]) {
      if (skip.includes(t) || !t.alive || !t.hurtbox(this.b) || !circleRect(x, y, radius, this.b)) continue;
      if (t.accepts && !t.accepts(hit.kind)) continue;
      if (this.apply(t, hit) && t.countsAsEnemy) count++;
    }
    this.projectiles.forEachActive('enemy', (p) => {
      if ((p.x - x) ** 2 + (p.y - y) ** 2 <= (radius + p.radius) ** 2) this.projectiles.kill(p, true);
    });
    return count;
  }

  /** Turns every enemy shot inside the radius around and fires it back outward. Returns how many. */
  reflectAround(x: number, y: number, radius: number, speedMultiplier: number, damage: number): number {
    let count = 0;
    this.projectiles.forEachActive('enemy', (p) => {
      if ((p.x - x) ** 2 + (p.y - y) ** 2 > (radius + p.radius) ** 2) return;
      this.projectiles.redirect(p, Math.atan2(p.y - y, p.x - x), speedMultiplier, damage);
      count++;
    });
    return count;
  }

  /** True while something thrown is still in the air. */
  get airborneThrows(): number {
    return this.thrown.length;
  }

  // ------------------------------------------------------------ Per-frame resolution

  update(dtMs: number): void {
    this.projectiles.forEachActive('player', (p) => this.resolvePlayerShot(p));
    this.updateThrown(dtMs);

    // Fireballs burn enemy lasers out of the air.
    this.projectiles.forEachActive('player', (shot) => {
      if (shot.kind !== 'fireball') return;
      this.projectiles.forEachActive('enemy', (laser) => {
        if (!shot.active || !laser.active) return;
        if ((shot.x - laser.x) ** 2 + (shot.y - laser.y) ** 2 <= (shot.radius + laser.radius + 2) ** 2) {
          this.projectiles.kill(laser, true);
          this.projectiles.kill(shot, true);
        }
      });
    });

    const player = this.player;
    if (!player || player.dead) return;
    player.hurtbox(this.a);

    this.projectiles.forEachActive('enemy', (p) => {
      if (!circleRect(p.x, p.y, p.radius, this.a)) return;
      const outcome = player.takeDamage(p.damage, p.x - p.vx * 0.05, 'shot');
      if (outcome.applied) {
        this.projectiles.kill(p, true);
        this.hooks.onPlayerHurt(outcome);
      }
    });

    for (const h of this.hazards) {
      if (!h.active || !h.hitbox(this.b) || !overlaps(this.a, this.b)) continue;
      const outcome = player.takeDamage(h.damage, this.b.x + this.b.w / 2, 'contact');
      if (outcome.applied) {
        h.onHitPlayer?.();
        this.hooks.onPlayerHurt(outcome);
      }
    }
  }

  /** Applies a hit and reports it. True when it landed (hit or kill). */
  private apply(t: Damageable, hit: Hit): boolean {
    const result = t.takeHit(hit);
    if (result !== 'none') this.hooks.onTargetHit(t, result, hit);
    return result === 'hit' || result === 'killed';
  }

  private resolvePlayerShot(p: Projectile): void {
    for (const t of this.targets) {
      if (!p.active) return;
      if (!t.alive || !t.hurtbox(this.b) || !circleRect(p.x, p.y, p.radius, this.b)) continue;
      if (p.pierce && p.hits.includes(t)) continue;
      if (t.accepts && !t.accepts(p.hitKind)) {
        this.projectiles.kill(p, true);
        return;
      }
      const hit: Hit = { damage: p.damage, kind: p.hitKind, x: p.x - Math.sign(p.vx) * 10, y: p.y, knockback: p.knockback, stunMs: p.stunMs || undefined };
      this.apply(t, hit);
      if (p.pierce) p.hits.push(t);
      else this.projectiles.kill(p, true);
    }
  }

  private updateThrown(dtMs: number): void {
    const dt = dtMs / 1000;
    for (let i = this.thrown.length - 1; i >= 0; i--) {
      const th = this.thrown[i];
      th.age += dtMs;
      th.vy += COMBAT.throwGravity * dt;
      th.x += th.vx * dt;
      th.y += th.vy * dt;
      th.angle += Math.sign(th.vx || 1) * COMBAT.throwSpinRadPerSec * dt;
      th.obj.fly(th.x, th.y, th.angle);
      const half = th.obj.height / 2;
      const r = COMBAT.thrownHitRadius;
      let impact = th.age > COMBAT.throwMaxMs || this.world.isSolid(th.x, th.y + half) || this.world.isSolid(th.x + Math.sign(th.vx) * r, th.y);
      if (!impact) {
        for (const t of [...this.targets]) {
          if (t === th.obj.self || !t.alive || th.pins.includes(t) || !t.hurtbox(this.b)) continue;
          if (t.accepts && !t.accepts(th.hit.kind)) continue;
          if (!circleRect(th.x, th.y, r, this.b)) continue;
          // Bowling: ordinary enemies are knocked down like pins and the throw rolls on. Walls, props and bosses stop it.
          if (!t.countsAsEnemy || t.stopsThrows) {
            impact = true;
            break;
          }
          th.pins.push(t);
          this.apply(t, { ...th.hit, x: th.x - th.vx * 0.05, y: th.y });
          th.vx *= COMBAT.bowlingSlowdown;
        }
      }
      if (!impact) continue;
      this.thrown.splice(i, 1);
      this.removeLiftable(th.obj);
      th.obj.shatter(th.x, th.y);
      const splashHits = this.blastExcept(th.x, th.y, th.splash, { ...th.hit, x: th.x - th.vx * 0.05, y: th.y }, th.pins);
      this.hooks.onThrowLanded?.(th.pins.filter((p) => p.countsAsEnemy).length + splashHits, th.x, th.y);
    }
  }
}
