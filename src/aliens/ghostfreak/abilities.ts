import { GHOSTFREAK } from '../../config/aliens/ghostfreak';
import { FX } from '../../config/constants';
import type { Rect } from '../../entities/types';
import { chance } from '../../systems/Pacing';
import type { AbilityContext, FormAbilities } from '../types';
import { GHOSTFREAK_COLORS as C } from './art';
import { lashWhip, phaseIn, phaseOut, scream, vanish } from './audio';

const L = GHOSTFREAK.lash;
const PH = GHOSTFREAK.phase;
const SC = GHOSTFREAK.scream;

/**
 * Ghostfreak: J lashes with the tentacles in his chest (every third reaches
 * further and drags what it catches). Holding K phases him: intangible, he
 * drifts through phase walls, enemies and shots, and can't attack; held
 * still, he fades out completely and enemies lose track of him. He sinks
 * slowly instead of falling. Swapping in, he screams and everything nearby
 * panics.
 */
export class GhostfreakAbilities implements FormAbilities {
  private lashReadyAt = 0;
  private lashes = 0;
  private lashAnimLeft = 0;
  private lashLong = false;
  private phasing = false;
  private phaseMs = 0;
  private phaseReadyAt = 0;
  private stillMs = 0;
  private invisible = false;
  private screamAnimLeft = 0;
  private readonly area: Rect = { x: 0, y: 0, w: 0, h: 0 };

  update(ctx: AbilityContext, dt: number): void {
    const { player, fx } = ctx;
    this.lashAnimLeft = Math.max(0, this.lashAnimLeft - dt);
    this.screamAnimLeft = Math.max(0, this.screamAnimLeft - dt);
    // A cold glow from the eye, and wisps trailing off him.
    if (!this.invisible) {
      fx.frameLight(player.x, player.y - 24, GHOSTFREAK.light.radius, GHOSTFREAK.light.color, GHOSTFREAK.light.intensity);
      if (chance(0.18)) fx.trail('ghost', player.x - player.facing * 6 + (Math.random() - 0.5) * 8, player.y - 6 - Math.random() * 16);
    }
    this.updatePhase(ctx, dt);
    if (!this.phasing && ctx.inputEnabled && ctx.controls.attackHeld && ctx.now >= this.lashReadyAt) this.lash(ctx);
  }

  // ------------------------------------------------------------ Lash

  private lash(ctx: AbilityContext): void {
    const { player, combat, fx } = ctx;
    this.lashes++;
    const long = this.lashes % L.longEvery === 0;
    const range = long ? L.longRange : L.range;
    const a = this.area;
    a.w = range;
    a.h = L.height;
    a.x = player.facing > 0 ? player.x + 4 : player.x - 4 - range;
    a.y = player.y - 30;
    const hits = combat.melee(a, { damage: long ? L.longDamage : L.damage, kind: 'melee', x: player.x, y: player.centerY, knockback: long ? L.pull : L.knockback });
    this.lashReadyAt = ctx.now + L.cooldownMs;
    this.lashAnimLeft = 190;
    this.lashLong = long;
    const tipX = player.x + player.facing * (range + 4);
    fx.beam(player.x + player.facing * 6, player.y - 22, tipX, player.y - 20 + (long ? 2 : -3), C.tentacle, long ? 3 : 2, 120);
    fx.burst('ghost', tipX, player.y - 20, long ? 6 : 3);
    if (hits > 0) {
      fx.hitStop(L.hitStopMs);
      fx.burst('spark', tipX, player.y - 20, 4);
    }
    ctx.sfx(lashWhip, long ? 1 : 0.75, long ? 0.8 : 1 + Math.random() * 0.15);
    ctx.notify(long ? 'lashLong' : 'lash');
  }

  // ------------------------------------------------------------ Phase

  private updatePhase(ctx: AbilityContext, dt: number): void {
    const { player, controls, fx } = ctx;
    const holding = ctx.inputEnabled && controls.specialHeld;
    if (!this.phasing) {
      if (holding && controls.specialPressed && ctx.now >= this.phaseReadyAt) {
        this.phasing = true;
        this.phaseMs = 0;
        this.stillMs = 0;
        fx.burst('ghost', player.x, player.centerY, 14);
        ctx.sfx(phaseIn, 0.8);
        ctx.notify('phase');
      }
      return;
    }
    this.phaseMs += dt;
    const still = Math.abs(player.vx) < PH.stillSpeed && player.grounded;
    this.stillMs = still ? this.stillMs + dt : 0;
    const wasInvisible = this.invisible;
    this.invisible = this.stillMs >= PH.vanishAfterMs;
    if (this.invisible && !wasInvisible) {
      ctx.sfx(vanish, 0.6);
      ctx.notify('vanish');
    }
    if (!this.invisible && chance(0.35)) ctx.player.afterimage(C.glow, 0.25, 260);
    if (!holding || this.phaseMs >= PH.maxMs) this.solidify(ctx, this.phaseMs >= PH.maxMs);
  }

  private solidify(ctx: AbilityContext, forced: boolean): void {
    this.phasing = false;
    this.invisible = false;
    this.phaseReadyAt = ctx.now + PH.cooldownMs * (forced ? 1.5 : 1);
    ctx.fx.burst('ghost', ctx.player.x, ctx.player.centerY, 10);
    ctx.sfx(phaseOut, 0.7);
    ctx.notify('solid');
  }

  // ------------------------------------------------------------ Hooks

  /** Swap-in: a scream that sends everything nearby running. */
  onSwapIn(ctx: AbilityContext): void {
    const { player, combat, fx } = ctx;
    const hits = combat.blast(player.x, player.centerY, SC.radius, { damage: SC.damage, kind: 'melee', x: player.x, y: player.centerY, knockback: SC.knockback, fear: SC.fearMs }, false);
    fx.ring(player.x, player.centerY, C.glow, SC.radius, 420);
    fx.ring(player.x, player.centerY, C.eye, SC.radius * 0.7, 520);
    fx.burst('ghost', player.x, player.centerY, 26);
    fx.shake(FX.shakeMedium, 260);
    this.screamAnimLeft = 420;
    ctx.sfx(scream);
    ctx.notify(hits > 0 ? 'swapStrike' : 'swap');
    for (let i = 0; i < hits; i++) ctx.notify('frighten');
  }

  onExit(ctx: AbilityContext): void {
    if (this.phasing) ctx.fx.burst('ghost', ctx.player.x, ctx.player.centerY, 8);
    this.phasing = false;
    this.invisible = false;
  }

  onDodge(ctx: AbilityContext): void {
    if (this.phasing) ctx.fx.burst('ghost', ctx.player.x, ctx.player.centerY, 3);
  }

  phased(): boolean {
    return this.phasing;
  }

  cloaked(): boolean {
    return this.invisible;
  }

  fade(): number {
    return this.invisible ? PH.vanishAlpha : this.phasing ? PH.alpha : 0.92;
  }

  isInvulnerable(): boolean {
    return this.phasing;
  }

  speedMultiplier(): number {
    return this.phasing ? PH.moveMultiplier : 1;
  }

  maxFallSpeed(): number {
    return GHOSTFREAK.maxFallSpeed;
  }

  meter(): { value: number; color: number } | null {
    if (!this.phasing) return null;
    return { value: Math.max(0, 1 - this.phaseMs / PH.maxMs), color: C.glow };
  }

  animOverride(): string | null {
    if (this.screamAnimLeft > 0) return 'scream';
    if (this.phasing) return 'phase';
    if (this.lashAnimLeft > 0) return this.lashLong ? 'lashLong' : 'lash';
    return null;
  }
}
