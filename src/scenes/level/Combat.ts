import { HEATBLAST } from '../../config/aliens';
import { HUMAN_COMBAT } from '../../config/player';
import type { CombatApi } from '../../aliens/types';
import type { DamageOutcome, Player } from '../../entities/Player';
import type { Projectile, Projectiles } from '../../entities/Projectiles';
import { circleRect, overlaps, type Damageable, type Hazard, type Hit, type HitResult, type Rect } from '../../entities/types';

export interface CombatHooks {
  onTargetHit(target: Damageable, result: HitResult, hit: Hit): void;
  onPlayerHurt(outcome: DamageOutcome, sourceX: number): void;
  onParry(count: number): void;
}

const FB = HEATBLAST.fireball;

/** Resolves every hit in the level: melee, projectiles, blasts, contact hazards. */
export class Combat implements CombatApi {
  private readonly targets: Damageable[] = [];
  private readonly hazards: Hazard[] = [];
  private player: Player | null = null;
  private readonly a: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private readonly b: Rect = { x: 0, y: 0, w: 0, h: 0 };

  constructor(
    private readonly projectiles: Projectiles,
    private readonly hooks: CombatHooks,
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

  removeTarget(t: Damageable): void {
    const i = this.targets.indexOf(t);
    if (i >= 0) this.targets.splice(i, 1);
  }

  removeHazard(h: Hazard): void {
    const i = this.hazards.indexOf(h);
    if (i >= 0) this.hazards.splice(i, 1);
  }

  // ------------------------------------------------------------ CombatApi

  melee(area: Rect, hit: Hit): number {
    let count = 0;
    for (const t of [...this.targets]) {
      if (!t.alive || !t.hurtbox(this.b) || !overlaps(area, this.b)) continue;
      const result = t.takeHit(hit);
      if (result !== 'none') this.hooks.onTargetHit(t, result, hit);
      if (result === 'hit' || result === 'killed') count++;
    }
    return count;
  }

  parry(area: Rect, facing: 1 | -1): number {
    let count = 0;
    this.projectiles.forEachActive('enemy', (p) => {
      if (!circleRect(p.x, p.y, p.radius + 4, area)) return;
      this.projectiles.reflect(p, facing, HUMAN_COMBAT.punch.parrySpeedMultiplier, HUMAN_COMBAT.punch.parryDamage);
      count++;
    });
    if (count > 0) this.hooks.onParry(count);
    return count;
  }

  fireball(x: number, y: number, angle: number): void {
    this.projectiles.spawn('fireball', 'player', x, y, Math.cos(angle) * FB.speed, Math.sin(angle) * FB.speed, FB.damage, FB.lifetimeMs, FB.radius);
  }

  aimAssist(x: number, y: number, angle: number, cone: number, range: number): number {
    let best = angle;
    let bestScore = Infinity;
    for (const t of this.targets) {
      if (!t.alive || !t.countsAsEnemy || !t.hurtbox(this.b)) continue;
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
      const result = t.takeHit(hit);
      if (result !== 'none') this.hooks.onTargetHit(t, result, hit);
      if (result === 'hit' || result === 'killed') count++;
    }
    if (clearsProjectiles) {
      this.projectiles.forEachActive('enemy', (p) => {
        if ((p.x - x) ** 2 + (p.y - y) ** 2 <= (radius + p.radius) ** 2) this.projectiles.kill(p, true);
      });
    }
    return count;
  }

  // ------------------------------------------------------------ Per-frame resolution

  update(): void {
    this.projectiles.forEachActive('player', (p) => this.resolvePlayerShot(p));

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
      const outcome = player.takeDamage(p.damage, p.x - p.vx * 0.05);
      if (outcome.applied) {
        this.projectiles.kill(p, true);
        this.hooks.onPlayerHurt(outcome, p.x);
      }
    });

    for (const h of this.hazards) {
      if (!h.active || !h.hitbox(this.b) || !overlaps(this.a, this.b)) continue;
      const outcome = player.takeDamage(h.damage, this.b.x + this.b.w / 2);
      if (outcome.applied) {
        h.onHitPlayer?.();
        this.hooks.onPlayerHurt(outcome, this.b.x + this.b.w / 2);
      }
    }
  }

  private resolvePlayerShot(p: Projectile): void {
    for (const t of this.targets) {
      if (!p.active) return;
      if (!t.alive || !t.hurtbox(this.b) || !circleRect(p.x, p.y, p.radius, this.b)) continue;
      const kind = p.reflected ? 'reflect' : 'fire';
      if (t.accepts && !t.accepts(kind)) {
        this.projectiles.kill(p, true);
        return;
      }
      const hit: Hit = { damage: p.damage, kind, x: p.x - Math.sign(p.vx) * 10, y: p.y, knockback: FB.knockback };
      const result = t.takeHit(hit);
      if (result !== 'none') this.hooks.onTargetHit(t, result, hit);
      this.projectiles.kill(p, true);
    }
  }
}
