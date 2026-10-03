import { WILDMUTT } from '../../config/aliens/wildmutt';
import { FX } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { PLAYER } from '../../config/player';
import type { Rect } from '../../entities/types';
import type { AbilityContext, FormAbilities } from '../types';
import { WILDMUTT_COLORS as C } from './art';
import { clawHit, clawSwipe, pounceLand, pounceLeap, roarSound, sniff, wallScratch } from './audio';
import { chance } from '../../systems/Pacing';

const CL = WILDMUTT.claw;
const PO = WILDMUTT.pounce;
const CB = WILDMUTT.climb;
const SE = WILDMUTT.senses;
const RO = WILDMUTT.roar;
const HALF_W = PLAYER.body.width / 2;
const BODY_H = PLAYER.body.height;

type ClawAnim = 'clawA' | 'clawB' | 'clawC';

/**
 * Wildmutt: J rakes with his claws (every third swipe is a double rake), K
 * pounces (landing on an enemy from above is a POUNCE), and pushing into a
 * wall grabs it: climb toward it, slide down, leap off. He has no eyes; his
 * senses ripple out around him and reveal what's hidden.
 */
export class WildmuttAbilities implements FormAbilities {
  private now = 0;
  // Claws.
  private clawCount = 0;
  private nextClawAt = 0;
  private lastClawAt = -Infinity;
  private bufferedUntil = 0;
  private clawAnim: ClawAnim = 'clawA';
  private clawAnimLeft = 0;
  // Pounce.
  private pouncing = false;
  private pounceT = 0;
  private pounceKey: object = {};
  private pounceReadyAt = 0;
  private bounced = false;
  // Climbing: the wall's side (0: not on a wall).
  private wall: 0 | 1 | -1 = 0;
  private lastWall: 0 | 1 | -1 = 0;
  private regrabAt = 0;
  private climbMoving = false;
  private scratchT = 0;
  // Senses.
  private pulseT = 0;
  private burstUntil = 0;
  private readonly area: Rect = { x: 0, y: 0, w: 0, h: 0 };

  update(ctx: AbilityContext, dt: number): void {
    this.now = ctx.now;
    this.clawAnimLeft = Math.max(0, this.clawAnimLeft - dt);
    const { player, fx } = ctx;
    fx.frameLight(player.x, player.centerY, 46, WILDMUTT.light.color, 0.5);
    this.updateSenses(ctx, dt);
    if (this.wall !== 0) this.updateClimb(ctx, dt);
    else this.tryGrab(ctx);
    if (this.pouncing) this.updatePounce(ctx, dt);
    else if (this.wall === 0) this.tryPounce(ctx);
    if (this.wall === 0) this.updateClaws(ctx);
  }

  // ------------------------------------------------------------ Senses

  private updateSenses(ctx: AbilityContext, dt: number): void {
    this.pulseT -= dt;
    if (this.pulseT > 0) return;
    this.pulseT = SE.pulseEveryMs;
    const { player, fx } = ctx;
    fx.ring(player.x, player.centerY, C.sense, this.senseRadius(), SE.pulseMs);
    if (Math.random() < 0.35) ctx.sfx(sniff, 0.5, 0.9 + Math.random() * 0.2);
  }

  senseRadius(): number {
    return this.now < this.burstUntil ? SE.burstRadius : SE.radius;
  }

  /** One big pulse (the swap-in roar). */
  private burst(ctx: AbilityContext): void {
    this.burstUntil = ctx.now + SE.burstMs;
    this.pulseT = SE.burstMs;
    ctx.fx.ring(ctx.player.x, ctx.player.centerY, C.sense, SE.burstRadius, SE.burstMs);
    ctx.fx.ring(ctx.player.x, ctx.player.centerY, PALETTE.white, SE.burstRadius * 0.7, SE.burstMs * 0.8);
  }

  // ------------------------------------------------------------ Walls

  private wallAt(ctx: AbilityContext, dir: 1 | -1, y: number): boolean {
    return ctx.world.isSolid(ctx.player.x + dir * (HALF_W + 3), y);
  }

  /** Pushing into a wall grabs it (on the ground he runs straight up it). */
  private tryGrab(ctx: AbilityContext): void {
    if (!ctx.inputEnabled || this.pouncing) return;
    const { controls, player } = ctx;
    const dir: 0 | 1 | -1 = controls.right && !controls.left ? 1 : controls.left && !controls.right ? -1 : 0;
    if (dir === 0) return;
    if (dir === this.lastWall && ctx.now < this.regrabAt) return;
    if (!this.wallAt(ctx, dir, player.centerY) || !this.wallAt(ctx, dir, player.y - 4)) return;
    // A wall Ben could just hop onto isn't worth clinging to from the ground.
    if (player.grounded && !this.wallAt(ctx, dir, player.y - BODY_H - 10)) return;
    this.wall = dir;
    this.lastWall = dir;
    player.setFacing(dir);
    player.setVelocity(0, Math.min(0, player.vy * 0.3));
    player.squash(0.85, 1.15);
    ctx.fx.burst('dust', player.x + dir * HALF_W, player.centerY, 4);
    ctx.sfx(wallScratch, 0.8);
    ctx.notify('climb');
  }

  private updateClimb(ctx: AbilityContext, dt: number): void {
    const { player, controls, fx } = ctx;
    const dir = this.wall as 1 | -1;
    if (!ctx.inputEnabled) {
      player.setVelocity(dir * 30, CB.gripSlide);
      return;
    }
    const lower = this.wallAt(ctx, dir, player.y - 4) || this.wallAt(ctx, dir, player.centerY);
    if (!lower) {
      this.letGo();
      return;
    }
    // Head clear of the wall's top: pull up and over.
    if (!this.wallAt(ctx, dir, player.y - BODY_H + 3)) {
      this.letGo();
      player.setVelocity(dir * CB.vaultVx, 0);
      player.launch(-CB.vaultVy, false);
      player.squash(0.8, 1.2);
      fx.burst('dust', player.x + dir * HALF_W, player.y - BODY_H, 6);
      ctx.notify('vault');
      return;
    }
    const toward = dir > 0 ? controls.right : controls.left;
    const away = dir > 0 ? controls.left : controls.right;
    if (controls.jumpPressed) {
      this.leap(ctx, (-dir) as 1 | -1);
      return;
    }
    if (controls.specialPressed && ctx.now >= this.pounceReadyAt) {
      this.letGo();
      player.setFacing((-dir) as 1 | -1);
      this.startPounce(ctx, (-dir) as 1 | -1, controls.up);
      return;
    }
    if (away) {
      this.letGo();
      player.setVelocity(-dir * 60, 0);
      return;
    }
    if (player.grounded && !toward) {
      this.letGo();
      return;
    }
    const vy = toward || controls.up ? -CB.upSpeed : controls.down ? CB.slideSpeed : CB.gripSlide;
    this.climbMoving = vy !== CB.gripSlide;
    player.setFacing(dir);
    player.setVelocity(dir * 30, vy);
    this.scratchT -= dt;
    if (this.climbMoving && this.scratchT <= 0) {
      this.scratchT = 170;
      ctx.sfx(wallScratch, 0.4, 0.9 + Math.random() * 0.3);
      fx.burst('dust', player.x + dir * (HALF_W + 1), player.y - 6, 1);
    }
  }

  private leap(ctx: AbilityContext, dir: 1 | -1): void {
    const { player } = ctx;
    this.letGo();
    player.setFacing(dir);
    player.setVelocity(dir * CB.leapVx, 0);
    player.launch(-CB.leapVy, true);
    player.squash(0.75, 1.3);
    ctx.fx.burst('dust', player.x - dir * HALF_W, player.centerY, 6);
    ctx.sfx('jump', 1, 0.85);
    ctx.notify('wallJump');
  }

  private letGo(): void {
    if (this.wall !== 0) this.regrabAt = this.now + CB.regrabMs;
    this.wall = 0;
    this.climbMoving = false;
  }

  // ------------------------------------------------------------ Pounce

  private tryPounce(ctx: AbilityContext): void {
    const { controls, player } = ctx;
    if (!ctx.inputEnabled || !controls.specialPressed || ctx.now < this.pounceReadyAt) return;
    const dir: 1 | -1 = controls.left ? -1 : controls.right ? 1 : player.facing;
    this.startPounce(ctx, dir, controls.up);
  }

  private startPounce(ctx: AbilityContext, dir: 1 | -1, high: boolean): void {
    const { player, fx } = ctx;
    this.pouncing = true;
    this.pounceT = 0;
    this.bounced = false;
    this.pounceKey = {};
    this.pounceReadyAt = ctx.now + PO.cooldownMs;
    player.setFacing(dir);
    player.setVelocity(dir * (high ? PO.upVx : PO.vx), 0);
    player.launch(-(high ? PO.upVy : PO.vy), false);
    player.squash(1.4, 0.7);
    fx.burst('dust', player.x - dir * 6, player.y, 8);
    ctx.sfx(pounceLeap, 1, 0.95 + Math.random() * 0.1);
    ctx.notify('pounce');
  }

  private updatePounce(ctx: AbilityContext, dt: number): void {
    const { player, fx } = ctx;
    this.pounceT += dt;
    if (this.pounceT > PO.maxMs) {
      this.endPounce(ctx);
      return;
    }
    // Pouncing into a wall grabs it.
    if (this.pounceT > 80 && this.wallAt(ctx, player.facing, player.centerY) && this.wallAt(ctx, player.facing, player.y - 4) && ctx.inputEnabled) {
      this.endPounce(ctx);
      this.wall = player.facing;
      this.lastWall = player.facing;
      player.setVelocity(0, 0);
      ctx.sfx(wallScratch, 0.9);
      return;
    }
    if (chance(0.6)) player.afterimage(C.fur, 0.35, 160);
    const falling = player.vy > 40;
    const a = this.area;
    a.w = PO.area.width;
    a.h = PO.area.height + (falling ? 8 : 0);
    a.x = player.x - a.w / 2 + player.facing * 6;
    a.y = player.centerY - PO.area.height / 2 + (falling ? 4 : -2);
    const hits = ctx.combat.meleeOnce(
      a,
      falling
        ? { damage: PO.landDamage, kind: 'melee', x: player.x, y: player.y - 30, knockback: PO.knockback, heavy: true, stunMs: PO.landStunMs }
        : { damage: PO.damage, kind: 'melee', x: player.x, y: player.centerY, knockback: PO.knockback },
      this.pounceKey,
    );
    if (hits <= 0) return;
    fx.hitStop(falling ? PO.hitStopMs : PO.hitStopMs * 0.6);
    fx.burst('spark', player.x + player.facing * 8, player.y, falling ? 12 : 6);
    fx.burst('white', player.x, player.y, falling ? 8 : 3);
    if (falling) {
      fx.popText(player.x, player.y - 34, hits > 1 ? `POUNCE X${hits}!` : 'POUNCE!', C.light);
      fx.ring(player.x, player.y, C.light, 30, 260);
      fx.shake(FX.shakeMedium, 160);
      ctx.sfx(pounceLand, 1, 1.05);
      ctx.notify('pounceHit');
      // Bounce off its back, ready to pounce again.
      if (!this.bounced) {
        this.bounced = true;
        player.launch(-PO.bounceVy, false);
        this.pounceReadyAt = ctx.now + 120;
      }
    } else {
      ctx.sfx(clawHit, 0.8, 1.1);
    }
  }

  private endPounce(ctx: AbilityContext): void {
    this.pouncing = false;
    ctx.combat.forget(this.pounceKey);
  }

  // ------------------------------------------------------------ Claws

  private updateClaws(ctx: AbilityContext): void {
    const { controls } = ctx;
    if (ctx.inputEnabled && controls.attackPressed) this.bufferedUntil = ctx.now + CL.bufferMs;
    if (ctx.now - this.lastClawAt > CL.resetMs) this.clawCount = 0;
    const wants = ctx.inputEnabled && (controls.attackHeld || ctx.now < this.bufferedUntil);
    if (!wants || this.pouncing || ctx.now < this.nextClawAt) return;
    this.bufferedUntil = 0;
    this.claw(ctx);
  }

  private claw(ctx: AbilityContext): void {
    const { player, fx } = ctx;
    this.clawCount++;
    const finisher = this.clawCount % CL.chain === 0;
    const a = this.area;
    a.w = CL.reach + (finisher ? 6 : 0);
    a.h = CL.height + (finisher ? 6 : 0);
    a.x = player.facing > 0 ? player.x + 2 : player.x - 2 - a.w;
    a.y = player.centerY - a.h / 2;
    const hits = ctx.combat.melee(a, {
      damage: finisher ? CL.finisherDamage : CL.damage,
      kind: 'melee',
      x: player.x,
      y: player.centerY,
      knockback: finisher ? CL.finisherKnockback : CL.knockback,
      heavy: finisher,
    });
    this.lastClawAt = ctx.now;
    this.nextClawAt = ctx.now + (finisher ? CL.finisherRecoverMs : CL.intervalMs);
    this.clawAnim = finisher ? 'clawC' : this.clawCount % 2 === 1 ? 'clawA' : 'clawB';
    this.clawAnimLeft = finisher ? 220 : 120;
    if (player.grounded && Math.abs(player.vx) < CL.lunge) player.setVelocityX(player.facing * CL.lunge);
    const fx0 = a.x + (player.facing > 0 ? a.w : 0);
    const fy = a.y + a.h / 2;
    // Three claw marks raking through the air.
    for (let i = -1; i <= 1; i++) fx.speedLine(fx0 - player.facing * 10, fy + i * 4, player.facing, i === 0 ? PALETTE.white : C.light);
    if (hits > 0) {
      fx.burst('spark', fx0, fy, finisher ? 10 : 5);
      fx.hitStop(finisher ? CL.finisherHitStopMs : CL.hitStopMs);
      if (finisher) fx.shake(FX.shakeMedium, 130);
      ctx.sfx(clawHit, 1, finisher ? 0.8 : 0.95 + Math.random() * 0.2);
    } else {
      ctx.sfx(clawSwipe, 0.8, 0.9 + Math.random() * 0.3);
    }
    ctx.notify(finisher ? 'rake' : 'claw');
  }

  // ------------------------------------------------------------ Hooks

  onEnter(ctx: AbilityContext): void {
    this.pulseT = 250;
    this.now = ctx.now;
  }

  onLand(ctx: AbilityContext, impact: number): void {
    if (this.pouncing) {
      this.endPounce(ctx);
      ctx.fx.burst('dust', ctx.player.x, ctx.player.y, 8);
      ctx.player.squash(1.3, 0.75);
    }
    if (impact > 0.7) ctx.fx.burst('dust', ctx.player.x, ctx.player.y, 6);
  }

  onStep(ctx: AbilityContext): void {
    if (Math.random() < 0.4) ctx.fx.burst('dust', ctx.player.x, ctx.player.y, 1);
  }

  /** Swap-in: lands with a roar that stuns everything close, and his senses flare out. */
  onSwapIn(ctx: AbilityContext): void {
    const { player, fx } = ctx;
    const hits = ctx.combat.blast(player.x, player.centerY, RO.radius, { damage: RO.damage, kind: 'melee', x: player.x, y: player.centerY, knockback: RO.knockback, stunMs: RO.stunMs }, false);
    fx.ring(player.x, player.centerY, C.light, RO.radius, 320);
    fx.shake(FX.shakeMedium, 220);
    ctx.sfx(roarSound);
    this.burst(ctx);
    ctx.notify(hits > 0 ? 'swapStrike' : 'swap');
  }

  onExit(ctx: AbilityContext): void {
    this.wall = 0;
    if (this.pouncing) this.endPounce(ctx);
  }

  locksMovement(): boolean {
    return this.wall !== 0 || this.pouncing;
  }

  gravityScale(): number | null {
    return this.wall !== 0 ? 0 : null;
  }

  speedMultiplier(): number {
    return this.now - this.lastClawAt < 140 ? CL.moveMultiplier : 1;
  }

  animOverride(): string | null {
    if (this.wall !== 0) return this.climbMoving ? 'climb' : 'cling';
    if (this.pouncing) return 'pounce';
    if (this.clawAnimLeft > 0) return this.clawAnim;
    return null;
  }
}
