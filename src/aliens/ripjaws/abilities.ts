import { RIPJAWS } from '../../config/aliens/ripjaws';
import { FX } from '../../config/constants';
import type { Hit, Rect } from '../../entities/types';
import type { AbilityContext, FormAbilities } from '../types';
import { RIPJAWS_COLORS as C } from './art';
import { chompSnap, gaspHuff, ripDashRush, tailWhoosh, waterBurst } from './audio';

const B = RIPJAWS.bite;
const W = RIPJAWS.whip;
const D = RIPJAWS.ripDash;
const S = RIPJAWS.swapIn;
const G = RIPJAWS.gasp;
const L = RIPJAWS.light;

/**
 * Ripjaws: J bites (hold for a chain; every third is a lunging CHOMP that
 * carries him forward in water). K on land is the tail whip: a full spin
 * that slaps everything round him and knocks shots back. K in water is RIP
 * DASH: a torpedo along the stick that bites through a whole line. In water
 * he's the fastest swimmer in the game; on land he hops on his tail and the
 * watch runs down fast (the form's `landDrain`). Swapping in, a burst of
 * water knocks everything back.
 */
export class RipjawsAbilities implements FormAbilities {
  private bites = 0;
  private nextBiteAt = 0;
  private biteAnimLeft = 0;
  private chomp = false;
  private whipLeft = 0;
  private whipReadyAt = 0;
  private dashLeft = 0;
  private dashReadyAt = 0;
  private dashVx = 0;
  private dashVy = 0;
  private dryMs = 0;
  private trailMs = 0;
  private stillMs = 0;
  private gaspLeft = 0;
  private nextGaspAt = 0;
  private readonly dashKey = {};
  private readonly whipKey = {};
  private readonly area: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private readonly hit: Hit = { damage: 0, kind: 'melee', x: 0, y: 0, knockback: 0 };

  /** Swimming this frame (bites in water stay level). */
  private swimming = false;

  update(ctx: AbilityContext, dt: number): void {
    const { player, fx } = ctx;
    this.swimming = player.swimming;
    this.biteAnimLeft = Math.max(0, this.biteAnimLeft - dt);
    this.gaspLeft = Math.max(0, this.gaspLeft - dt);
    fx.frameLight(player.x + player.facing * 6, player.y - 30, L.radius, L.color, player.submerged ? L.waterIntensity : L.intensity);

    if (this.dashLeft > 0) {
      this.stepDash(ctx, dt);
      return;
    }
    if (this.whipLeft > 0) this.stepWhip(ctx, dt);
    this.trackDry(ctx, dt);
    if (!ctx.inputEnabled) return;
    if (ctx.controls.specialPressed) {
      if (player.swimming && ctx.now >= this.dashReadyAt) this.startDash(ctx);
      else if (!player.swimming && this.whipLeft <= 0 && ctx.now >= this.whipReadyAt) this.startWhip(ctx);
      return;
    }
    if (ctx.controls.attackHeld && this.whipLeft <= 0 && ctx.now >= this.nextBiteAt) this.bite(ctx);
  }

  // ------------------------------------------------------------ Bite

  private bite(ctx: AbilityContext): void {
    const { player, combat, fx } = ctx;
    this.bites++;
    this.chomp = this.bites % B.chain === 0;
    this.nextBiteAt = ctx.now + B.intervalMs * (this.chomp ? 1.5 : 1);
    this.biteAnimLeft = this.chomp ? 280 : 190;
    const f = player.facing;
    if (this.chomp) {
      // The lunge: a real surge in water, a hop on land.
      if (player.swimming) player.setVelocity(f * B.lungeWater, player.vy * 0.3);
      else player.setVelocity(f * B.lungeLand, player.grounded ? -120 : player.vy);
      player.squash(1.25, 0.8);
    }
    const a = this.area;
    a.x = f > 0 ? player.x : player.x - B.reach;
    a.y = player.y - B.height - 4;
    a.w = B.reach;
    a.h = B.height;
    const h = this.hit;
    h.damage = this.chomp ? B.chompDamage : B.damage;
    h.kind = 'melee';
    h.x = player.x;
    h.y = player.centerY;
    h.knockback = this.chomp ? B.chompKnockback : B.knockback;
    h.heavy = this.chomp;
    h.stunMs = undefined;
    const hits = combat.melee(a, h);
    if (hits > 0) {
      fx.hitStop(this.chomp ? B.chompHitStopMs : B.hitStopMs);
      fx.burst('white', player.x + f * (B.reach - 4), player.centerY - 4, this.chomp ? 8 : 4);
      if (this.chomp) {
        fx.shake(FX.shakeLight, 120);
        fx.popText(player.x + f * 20, player.y - 34, 'CHOMP!', C.white);
      }
    }
    if (player.submerged) fx.burst('bubble', player.x + f * 12, player.centerY - 4, this.chomp ? 6 : 2);
    ctx.sfx(chompSnap, this.chomp ? 1 : 0.7, this.chomp ? 0.75 : 1 + Math.random() * 0.15);
    ctx.notify(this.chomp ? 'chomp' : 'bite');
  }

  // ------------------------------------------------------------ Tail whip (land)

  private startWhip(ctx: AbilityContext): void {
    this.whipLeft = W.durationMs;
    this.whipReadyAt = ctx.now + W.cooldownMs;
    ctx.combat.forget(this.whipKey);
    ctx.player.squash(1.15, 0.9);
    ctx.sfx(tailWhoosh, 1);
    ctx.notify('whip');
  }

  private stepWhip(ctx: AbilityContext, dt: number): void {
    const { player, combat, fx } = ctx;
    const t = W.durationMs - this.whipLeft;
    this.whipLeft = Math.max(0, this.whipLeft - dt);
    if (t < W.activeFromMs || t > W.activeToMs) return;
    const a = this.area;
    a.x = player.x - W.radius;
    a.y = player.y - W.radius * 1.4;
    a.w = W.radius * 2;
    a.h = W.radius * 1.5;
    const h = this.hit;
    h.damage = W.damage;
    h.kind = 'melee';
    h.x = player.x;
    h.y = player.centerY;
    h.knockback = W.knockback;
    h.heavy = false;
    h.stunMs = undefined;
    const n = combat.meleeOnce(a, h, this.whipKey);
    const parried = combat.parry(a, player.facing, W.parrySpeed, W.parryDamage);
    if (n > 0) {
      fx.hitStop(W.hitStopMs);
      fx.burst('splash', player.x, player.centerY, 8);
    }
    if (parried > 0) fx.popText(player.x, player.y - 36, 'SLAPPED BACK!', C.white);
  }

  // ------------------------------------------------------------ RIP DASH (water)

  private startDash(ctx: AbilityContext): void {
    const { player, controls, fx, combat } = ctx;
    let dx = controls.left === controls.right ? 0 : controls.left ? -1 : 1;
    const dy = controls.up === controls.down ? 0 : controls.up ? -1 : 1;
    if (dx === 0 && dy === 0) dx = player.facing;
    const len = Math.hypot(dx, dy);
    this.dashVx = (dx / len) * D.speed;
    this.dashVy = (dy / len) * D.speed;
    if (dx !== 0) player.setFacing(dx > 0 ? 1 : -1);
    this.dashLeft = D.durationMs;
    this.dashReadyAt = ctx.now + D.cooldownMs;
    combat.forget(this.dashKey);
    player.setInvulnerable(D.durationMs * 0.6);
    player.squash(1.35, 0.7);
    fx.ring(player.x, player.centerY, C.lure, 26, 260);
    fx.burst('bubble', player.x, player.centerY, 12);
    ctx.sfx(ripDashRush, 1);
    ctx.notify('ripDash');
  }

  private stepDash(ctx: AbilityContext, dt: number): void {
    const { player, combat, fx } = ctx;
    this.dashLeft = Math.max(0, this.dashLeft - dt);
    player.setVelocity(this.dashVx, this.dashVy);
    fx.stream('bubble', player.x - player.facing * 10, player.centerY, 2);
    this.trailMs -= dt;
    if (this.trailMs <= 0) {
      this.trailMs = 45;
      player.afterimage(C.lure, 0.35, 160);
    }
    const a = this.area;
    a.x = player.x - D.width / 2 + Math.sign(this.dashVx) * 8;
    a.y = player.centerY - D.height / 2;
    a.w = D.width;
    a.h = D.height;
    const h = this.hit;
    h.damage = D.damage;
    h.kind = 'melee';
    h.x = player.x - Math.sign(this.dashVx || player.facing) * 10;
    h.y = player.centerY;
    h.knockback = D.knockback;
    h.heavy = true;
    h.stunMs = undefined;
    const n = combat.meleeOnce(a, h, this.dashKey);
    if (n > 0) {
      fx.hitStop(D.hitStopMs);
      fx.burst('white', player.x + player.facing * 10, player.centerY, 8);
      fx.shake(FX.shakeLight, 120);
      ctx.sfx(chompSnap, 1, 0.7);
    }
    if (this.dashLeft <= 0 || !player.swimming) {
      this.dashLeft = 0;
      player.setVelocity(this.dashVx * D.exitKeep, this.dashVy * D.exitKeep);
    }
  }

  // ------------------------------------------------------------ Out of water

  /** Standing still on dry land for a while, he gasps ("NEED... WATER..."). */
  private trackDry(ctx: AbilityContext, dt: number): void {
    const { player } = ctx;
    const dry = !player.submerged;
    this.dryMs = dry ? this.dryMs + dt : 0;
    const still = player.grounded && Math.abs(player.vx) < 10;
    this.stillMs = dry && still ? this.stillMs + dt : 0;
    if (this.stillMs > G.afterMs && ctx.now >= this.nextGaspAt && this.biteAnimLeft <= 0 && this.whipLeft <= 0) {
      this.gaspLeft = G.forMs;
      this.nextGaspAt = ctx.now + G.everyMs;
      ctx.sfx(gaspHuff, 0.8);
      ctx.notify('gasp');
    }
  }

  // ------------------------------------------------------------ Hooks

  /** Swap-in: a burst of water out of nowhere knocks everything round him back. */
  onSwapIn(ctx: AbilityContext): void {
    const { player, combat, fx } = ctx;
    const h = this.hit;
    h.damage = S.damage;
    h.kind = 'burst';
    h.x = player.x;
    h.y = player.centerY;
    h.knockback = S.knockback;
    h.heavy = false;
    h.stunMs = S.stunMs;
    const n = combat.blast(player.x, player.centerY, S.radius, h, true);
    fx.ring(player.x, player.centerY, C.lure, S.radius, 380);
    fx.ring(player.x, player.centerY, 0xffffff, S.radius * 0.6, 280);
    fx.burst('splash', player.x, player.centerY, 26);
    fx.burst('bubble', player.x, player.centerY, 14);
    fx.shake(FX.shakeLight, 160);
    ctx.sfx(waterBurst, 1);
    ctx.notify(n > 0 ? 'swapStrike' : 'swap');
  }

  onExit(): void {
    this.dashLeft = 0;
    this.whipLeft = 0;
  }

  locksMovement(): boolean {
    return this.dashLeft > 0;
  }

  isInvulnerable(): boolean {
    return this.dashLeft > D.durationMs * 0.4;
  }

  speedMultiplier(): number {
    if (this.whipLeft > 0) return 0.35;
    return this.biteAnimLeft > 0 && !this.chomp ? B.moveMultiplier : 1;
  }

  animOverride(): string | null {
    if (this.dashLeft > 0) return 'dash';
    if (this.whipLeft > 0) return 'whip';
    if (this.biteAnimLeft > 0) return this.swimming ? 'swimBite' : this.chomp ? 'biteB' : 'biteA';
    if (this.gaspLeft > 0) return 'gasp';
    return null;
  }
}
