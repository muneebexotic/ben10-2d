import { GREYMATTER } from '../../config/aliens/greymatter';
import { PALETTE } from '../../config/palette';
import type { Rect } from '../../entities/types';
import type { AbilityContext, FormAbilities } from '../types';
import { GREYMATTER_COLORS as C } from './art';
import { biteSnap, scanMiss, scanSweep, weakFound } from './audio';

const B = GREYMATTER.bite;
const AN = GREYMATTER.analyze;
const SW = GREYMATTER.swapScan;

/**
 * Grey Matter: J nips (hold for a chain; every third is a hop-and-chomp). K
 * is ANALYZE: a scan cone ahead finds the nearest enemy (or boss) and marks
 * its weak point, where every hit from any alien does triple damage for a
 * few seconds. He's tiny (vents and gaps a tile high are doorways to him)
 * and jumps very high for his size. Swapping in reads everything nearby.
 */
export class GreyMatterAbilities implements FormAbilities {
  private bites = 0;
  private nextBiteAt = 0;
  private biteAnimLeft = 0;
  private finisher = false;
  private scanLeft = 0;
  private rootLeft = 0;
  private analyzeReadyAt = 0;
  private cheerLeft = 0;
  private readonly area: Rect = { x: 0, y: 0, w: 0, h: 0 };

  update(ctx: AbilityContext, dt: number): void {
    const { player, fx } = ctx;
    this.biteAnimLeft = Math.max(0, this.biteAnimLeft - dt);
    this.rootLeft = Math.max(0, this.rootLeft - dt);
    this.cheerLeft = Math.max(0, this.cheerLeft - dt);
    fx.frameLight(player.x, player.centerY, GREYMATTER.light.radius, GREYMATTER.light.color, GREYMATTER.light.intensity);
    if (this.scanLeft > 0) {
      this.scanLeft -= dt;
      this.drawScan(ctx);
      if (this.scanLeft <= 0) this.finishScan(ctx);
      return;
    }
    if (!ctx.inputEnabled) return;
    if (ctx.controls.specialPressed && ctx.now >= this.analyzeReadyAt) {
      this.startScan(ctx);
      return;
    }
    if (ctx.controls.attackHeld && ctx.now >= this.nextBiteAt) this.bite(ctx);
  }

  // ------------------------------------------------------------ Bite

  private bite(ctx: AbilityContext): void {
    const { player, combat, fx } = ctx;
    this.bites++;
    this.finisher = this.bites % B.chain === 0;
    this.nextBiteAt = ctx.now + B.intervalMs * (this.finisher ? 1.6 : 1);
    this.biteAnimLeft = this.finisher ? 220 : 120;
    const f = player.facing;
    const a = this.area;
    a.x = f > 0 ? player.x : player.x - B.reach;
    a.y = player.y - B.height;
    a.w = B.reach;
    a.h = B.height;
    if (this.finisher) {
      player.setVelocity(f * 110, B.finisherHop);
      player.squash(1.2, 0.8);
    }
    const hits = combat.melee(a, {
      damage: this.finisher ? B.finisherDamage : B.damage,
      kind: 'melee',
      x: player.x,
      y: player.centerY,
      knockback: this.finisher ? B.finisherKnockback : B.knockback,
    });
    if (hits > 0) {
      fx.hitStop(B.hitStopMs);
      fx.burst('white', player.x + f * (B.reach - 2), player.centerY, this.finisher ? 6 : 3);
    }
    ctx.sfx(biteSnap, this.finisher ? 1 : 0.7, this.finisher ? 0.8 : 1 + Math.random() * 0.2);
    ctx.notify(this.finisher ? 'chomp' : 'bite');
  }

  // ------------------------------------------------------------ ANALYZE

  private startScan(ctx: AbilityContext): void {
    this.scanLeft = AN.scanMs;
    this.rootLeft = AN.rootMs;
    this.analyzeReadyAt = ctx.now + AN.cooldownMs;
    ctx.player.setVelocityX(0);
    ctx.sfx(scanSweep, 0.8);
  }

  /** The scan cone sweeping out ahead of him, a few lines a frame. */
  private drawScan(ctx: AbilityContext): void {
    const { player, fx } = ctx;
    const t = 1 - this.scanLeft / AN.scanMs;
    const reach = AN.range * Math.min(1, t * 1.6);
    const ex = player.x + player.facing * 4;
    const ey = player.y - 14;
    const spread = (AN.height / 2) * Math.min(1, t * 1.6);
    const k = Math.floor(t * 7) % 3;
    fx.beam(ex, ey, ex + player.facing * reach, ey - spread + k * spread, C.scan, 1, 70);
  }

  private finishScan(ctx: AbilityContext): void {
    const { player, combat, fx } = ctx;
    const f = player.facing;
    const a = this.area;
    a.x = f > 0 ? player.x : player.x - AN.range;
    a.y = player.y - 14 - AN.height / 2;
    a.w = AN.range;
    a.h = AN.height;
    const found = combat.analyze(a, AN.weakMs, player.x, player.centerY);
    if (found) {
      fx.beam(player.x + f * 4, player.y - 14, found.x, found.y, PALETTE.greymatterGlow, 2, 260);
      fx.ring(found.x, found.y, PALETTE.greymatter, 22, 360);
      fx.popText(found.x, found.y - 22, 'WEAK POINT!', PALETTE.greymatter);
      ctx.sfx(weakFound, 0.9);
      this.cheerLeft = 380;
      ctx.notify('analyze');
    } else {
      fx.popText(player.x + f * 40, player.y - 26, 'NOTHING TO ANALYZE', PALETTE.uiDim);
      ctx.sfx(scanMiss, 0.6);
      ctx.notify('analyzeMiss');
    }
  }

  // ------------------------------------------------------------ Hooks

  /** Swap-in: one look at the room. Everything nearby gets a short-lived weak point. */
  onSwapIn(ctx: AbilityContext): void {
    const { player, combat, fx } = ctx;
    const n = combat.analyzeAround(player.x, player.centerY, SW.radius, SW.weakMs);
    fx.ring(player.x, player.centerY, PALETTE.greymatter, SW.radius, 420);
    fx.ring(player.x, player.centerY, PALETTE.white, SW.radius * 0.6, 300);
    fx.burst('scan', player.x, player.centerY, 18);
    ctx.sfx(scanSweep, 1, 1.2);
    if (n > 0) ctx.sfx(weakFound, 0.7);
    ctx.notify(n > 0 ? 'swapStrike' : 'swap');
  }

  speedMultiplier(): number {
    if (this.rootLeft > 0) return 0;
    return this.biteAnimLeft > 0 ? B.moveMultiplier : 1;
  }

  animOverride(): string | null {
    if (this.scanLeft > 0) return 'scan';
    if (this.cheerLeft > 0) return 'cheer';
    if (this.biteAnimLeft > 0) return this.finisher ? 'biteB' : 'biteA';
    return null;
  }
}
