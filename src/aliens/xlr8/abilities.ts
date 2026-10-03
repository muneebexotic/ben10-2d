import { XLR8, XLR8_MOTOR } from '../../config/aliens/xlr8';
import { FX } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import type { Rect } from '../../entities/types';
import type { AbilityContext, FormAbilities } from '../types';
import { XLR8_COLORS as C } from './art';
import { WindLoop, dashSlash, dashWhoosh, kickHit, strikeHit, strikeWhiff, tooSlow, waterStep } from './audio';
import { chance } from '../../systems/Pacing';

const S = XLR8.strike;
const D = XLR8.dash;
const W = XLR8.waterRun;
const SF = XLR8.speedFx;
const L = XLR8.light;
const DEG = Math.PI / 180;

type StrikeAnim = 'strikeA' | 'strikeB' | 'kick';

interface PendingCut {
  key: object;
  at: number;
  dir: 1 | -1;
  swap: boolean;
  /** Enemies the dash passed through. */
  count: number;
  /** The comic-panel freeze already played for this cut. */
  frozen: boolean;
}

/**
 * XLR8: hold J for a flurry (every sixth hit is a launching kick), K to dash
 * straight through enemies (they all get cut a beat later), and run fast
 * enough to stay on top of water.
 */
export class Xlr8Abilities implements FormAbilities {
  private now = 0;
  private nextStrikeAt = 0;
  private lastStrikeAt = -Infinity;
  private strikeCount = 0;
  private bufferedUntil = 0;
  private strikeAnim: StrikeAnim = 'strikeA';
  private strikeAnimLeft = 0;
  private hoverLeft = 0;
  private airStrikes = 0;

  private dashLeft = 0;
  private dashDir: 1 | -1 = 1;
  private dashVx = 0;
  private dashVy = 0;
  private dashReadyAt = 0;
  private airDashUsed = false;
  private invulnUntil = 0;
  private dashKey: object | null = null;
  private dashMarks = 0;
  private swapDash = false;
  private dodged = false;
  private readonly pending: PendingCut[] = [];

  private waterGrace = 0;
  private afterimageT = 0;
  private lineT = 0;
  private readonly wind = new WindLoop();
  private readonly area: Rect = { x: 0, y: 0, w: 0, h: 0 };

  update(ctx: AbilityContext, dt: number): void {
    const { player } = ctx;
    this.now = ctx.now;
    const speedRatio = Math.abs(player.vx) / XLR8_MOTOR.runSpeed;
    this.strikeAnimLeft = Math.max(0, this.strikeAnimLeft - dt);
    this.hoverLeft = Math.max(0, this.hoverLeft - dt);
    this.waterGrace = speedRatio >= W.minSpeedRatio || this.dashLeft > 0 ? W.graceMs : Math.max(0, this.waterGrace - dt);

    this.updateDash(ctx, dt);
    this.updateStrikes(ctx);
    this.resolveCuts(ctx, false);
    this.speedEffects(ctx, dt, speedRatio);
    ctx.fx.frameLight(player.x, player.centerY, L.radius, L.color, L.intensity);
    this.wind.set(this.dashLeft > 0 ? 1.3 : speedRatio);
  }

  // ------------------------------------------------------------ Dash

  private updateDash(ctx: AbilityContext, dt: number): void {
    const { player, controls } = ctx;
    if (this.dashLeft > 0) {
      this.dashLeft -= dt;
      player.setVelocity(this.dashVx, this.dashVy);
      this.sweep(ctx);
      if (chance(1)) player.afterimage(C.blue, 0.55, 200);
      if (chance(1)) ctx.fx.speedLine(player.x - this.dashDir * 4, player.y - 4 - Math.random() * 20, this.dashDir, C.light);
      if (this.dashLeft <= 0) this.endDash(ctx);
      return;
    }
    if (!ctx.inputEnabled || !controls.specialPressed || ctx.now < this.dashReadyAt) return;
    if (!player.grounded && this.airDashUsed) return;
    this.startDash(ctx, false);
  }

  private startDash(ctx: AbilityContext, swap: boolean): void {
    const { player, controls } = ctx;
    const dir: 1 | -1 = controls.left ? -1 : controls.right ? 1 : player.facing;
    const angle = controls.up ? D.upAngleDeg * DEG : 0;
    player.setFacing(dir);
    this.dashDir = dir;
    this.dashVx = Math.cos(angle) * D.speed * dir;
    this.dashVy = -Math.sin(angle) * D.speed;
    this.dashLeft = D.durationMs;
    this.invulnUntil = ctx.now + D.invulnMs;
    if (!player.grounded) this.airDashUsed = true;
    this.dashKey = {};
    this.dashMarks = 0;
    this.swapDash = swap;
    this.dodged = false;
    this.strikeCount = 0;
    this.sweep(ctx);

    player.squash(1.55, 0.6);
    if (player.grounded) ctx.fx.burst(player.onWater ? 'splash' : 'dust', player.x - dir * 6, player.y, 8);
    ctx.fx.flash(player.x - dir * 4, player.centerY, C.light, 16, 160);
    ctx.fx.ring(player.x, player.centerY, C.blue, 18, 180);
    ctx.sfx(dashWhoosh, 1, 0.95 + Math.random() * 0.1);
    ctx.notify('dash');
  }

  /** Everything the dash overlaps is tagged now and cut when the dash is over. */
  private sweep(ctx: AbilityContext): void {
    if (!this.dashKey) return;
    const { player } = ctx;
    const a = this.area;
    a.w = D.sweep.width;
    a.h = D.sweep.height;
    a.x = player.x - a.w / 2;
    a.y = player.centerY - a.h / 2;
    this.dashMarks += ctx.combat.mark(a, this.dashKey);
  }

  private endDash(ctx: AbilityContext): void {
    const { player } = ctx;
    this.dashLeft = 0;
    player.setVelocity(this.dashDir * XLR8_MOTOR.runSpeed * D.exitSpeed, this.dashVy < 0 ? this.dashVy * 0.35 : 0);
    player.squash(0.8, 1.2);
    this.dashReadyAt = ctx.now + D.cooldownMs;
    if (this.dashKey) this.pending.push({ key: this.dashKey, at: ctx.now + D.detonateDelayMs, dir: this.dashDir, swap: this.swapDash, count: this.dashMarks, frozen: false });
    this.dashKey = null;
  }

  /** The delayed cut: every tagged enemy pops at once. `all` flushes everything (reverting mid-cut). */
  private resolveCuts(ctx: AbilityContext, all: boolean): void {
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const cut = this.pending[i];
      if (!all && ctx.now < cut.at) continue;
      const { player, fx } = ctx;
      if (!all && !cut.frozen && cut.count >= XLR8.multiCut.minTargets) {
        // Four or more in one dash: the world freezes into a comic panel first; the cut lands right after.
        cut.frozen = true;
        cut.at = ctx.now + 1;
        const points = ctx.combat.markedPoints(cut.key);
        if (points.length >= XLR8.multiCut.minTargets) {
          fx.comicFreeze(points.length, player.x, player.centerY, cut.dir, C.light, points, XLR8.multiCut.freezeMs);
          ctx.notify('multiCut');
          continue;
        }
      }
      this.pending.splice(i, 1);
      const hits = ctx.combat.strikeMarked(
        cut.key,
        { damage: D.damage, kind: 'melee', x: player.x, y: player.centerY, knockback: D.knockback, heavy: true },
        (x, y) => {
          fx.flash(x, y, PALETTE.white, 20, 180);
          fx.ring(x, y, C.light, 18, 220);
          fx.burst('white', x, y, 10);
          fx.burst('spark', x, y, 6);
          fx.speedLine(x + cut.dir * 14, y - 3, cut.dir, PALETTE.white);
          fx.speedLine(x + cut.dir * 14, y + 3, cut.dir, C.light);
        },
      );
      if (hits <= 0) continue;
      fx.hitStop(D.hitStopMs);
      fx.shake(hits > 1 ? FX.shakeMedium : FX.shakeLight, 150);
      ctx.sfx(dashSlash, 1, hits > 1 ? 1.12 : 1);
      if (hits > 1) fx.popText(player.x, player.y - 40, `X${hits} CUT!`, C.light);
      ctx.notify(cut.swap ? 'swapStrike' : 'dashStrike');
    }
  }

  // ------------------------------------------------------------ Strikes

  private updateStrikes(ctx: AbilityContext): void {
    const { controls } = ctx;
    if (ctx.inputEnabled && controls.attackPressed) this.bufferedUntil = ctx.now + S.bufferMs;
    if (ctx.now - this.lastStrikeAt > S.resetMs) this.strikeCount = 0;
    const wants = ctx.inputEnabled && (controls.attackHeld || ctx.now < this.bufferedUntil);
    if (!wants || this.dashLeft > 0 || ctx.now < this.nextStrikeAt) return;
    this.bufferedUntil = 0;
    this.strike(ctx);
  }

  private strike(ctx: AbilityContext): void {
    const { player, fx } = ctx;
    this.strikeCount++;
    const finisher = this.strikeCount % S.chain === 0;
    const reach = finisher ? S.finisherReach : S.reach;
    const a = this.area;
    a.w = reach;
    a.h = S.height + (finisher ? 6 : 0);
    a.x = player.facing > 0 ? player.x + 2 : player.x - 2 - reach;
    a.y = player.centerY - a.h / 2 - 2;
    const hits = ctx.combat.melee(a, {
      damage: finisher ? S.finisherDamage : S.damage,
      kind: 'melee',
      x: player.x,
      y: player.centerY,
      knockback: finisher ? S.finisherKnockback : S.knockback,
      heavy: finisher,
    });
    this.lastStrikeAt = ctx.now;
    this.nextStrikeAt = ctx.now + (finisher ? S.finisherRecoverMs : S.intervalMs);
    this.strikeAnim = finisher ? 'kick' : this.strikeCount % 2 === 1 ? 'strikeA' : 'strikeB';
    this.strikeAnimLeft = finisher ? 200 : 90;

    if (player.grounded) {
      if (Math.abs(player.vx) < S.lunge) player.setVelocityX(player.facing * S.lunge);
    } else if (this.airStrikes < S.airStrikes) {
      this.airStrikes++;
      this.hoverLeft = S.airHoverMs;
      if (player.vy > S.airHoverFall) player.setVelocityY(S.airHoverFall);
    }

    const fx0 = a.x + (player.facing > 0 ? a.w : 0);
    const fy = a.y + a.h / 2 + (Math.random() - 0.5) * 8;
    if (hits > 0) {
      fx.burst('spark', fx0, fy, finisher ? 10 : 4);
      fx.burst('white', fx0, fy, finisher ? 8 : 2);
      fx.hitStop(finisher ? S.finisherHitStopMs : S.hitStopMs);
      if (finisher) {
        fx.ring(fx0, fy, C.light, 22, 220);
        fx.shake(FX.shakeMedium, 140);
      }
      ctx.sfx(finisher ? kickHit : strikeHit, 1, 0.9 + Math.random() * 0.25);
    } else {
      fx.speedLine(fx0 - player.facing * 4, fy, player.facing, C.light);
      ctx.sfx(strikeWhiff, 0.8, 0.85 + Math.random() * 0.3);
    }
    ctx.notify(finisher ? 'kick' : 'strike');
  }

  // ------------------------------------------------------------ Feel

  private speedEffects(ctx: AbilityContext, dt: number, speedRatio: number): void {
    const { player, fx } = ctx;
    if (this.dashLeft > 0 || speedRatio < SF.minSpeedRatio || dt <= 0) return;
    const dir: 1 | -1 = player.vx < 0 ? -1 : 1;
    this.afterimageT -= dt;
    if (this.afterimageT <= 0) {
      this.afterimageT = SF.afterimageEveryMs;
      player.afterimage(C.blue, SF.afterimageAlpha, SF.afterimageLifeMs);
    }
    this.lineT -= dt;
    if (this.lineT <= 0) {
      this.lineT = SF.lineEveryMs;
      fx.speedLine(player.x - dir * 8, player.y - 4 - Math.random() * 22, dir, C.light);
    }
    if (!player.grounded) return;
    if (player.onWater) {
      fx.stream('splash', player.x - dir * 6, player.y - 1, 2);
      if (chance(0.3)) fx.ring(player.x - dir * 10, player.y, C.light, 10, 260);
    } else if (chance(0.3)) {
      fx.trail('dust', player.x - dir * 6, player.y - 1);
    }
  }

  onLand(ctx: AbilityContext, impact: number): void {
    this.airDashUsed = false;
    this.airStrikes = 0;
    this.hoverLeft = 0;
    if (impact > 0.6) ctx.fx.burst(ctx.player.onWater ? 'splash' : 'dust', ctx.player.x, ctx.player.y, 6);
  }

  onStep(ctx: AbilityContext): void {
    if (ctx.player.onWater) {
      ctx.sfx(waterStep, 0.8, 0.9 + Math.random() * 0.3);
      ctx.fx.burst('splash', ctx.player.x, ctx.player.y, 3);
    }
  }

  /** Dodging a shot mid-dash: "TOO SLOW!", a slow-motion beat and the dash back instantly. */
  onDodge(ctx: AbilityContext, source: 'shot' | 'contact'): void {
    if (source !== 'shot' || this.dodged || (this.dashLeft <= 0 && ctx.now >= this.invulnUntil)) return;
    this.dodged = true;
    const { player, fx } = ctx;
    fx.slowMo(XLR8.tooSlow.slowMoScale, XLR8.tooSlow.slowMoMs, 260);
    fx.popText(player.x, player.y - 38, 'TOO SLOW!', C.light);
    fx.ring(player.x, player.centerY, PALETTE.white, 30, 300);
    ctx.sfx(tooSlow);
    this.dashReadyAt = 0;
    this.airDashUsed = false;
    ctx.notify('tooSlow');
  }

  /** Swap-in: XLR8 arrives already dashing, cutting through whatever is in front of him. */
  onSwapIn(ctx: AbilityContext): void {
    this.startDash(ctx, true);
  }

  dispose(): void {
    this.wind.stop();
  }

  onExit(ctx: AbilityContext): void {
    this.wind.stop();
    if (this.dashKey) this.pending.push({ key: this.dashKey, at: 0, dir: this.dashDir, swap: this.swapDash, count: this.dashMarks, frozen: true });
    this.dashKey = null;
    this.resolveCuts(ctx, true);
  }

  isInvulnerable(): boolean {
    return this.dashLeft > 0 || this.now < this.invulnUntil;
  }

  locksMovement(): boolean {
    return this.dashLeft > 0;
  }

  speedMultiplier(): number {
    return this.now - this.lastStrikeAt < 150 ? S.moveMultiplier : 1;
  }

  maxFallSpeed(): number | null {
    return this.hoverLeft > 0 ? S.airHoverFall : null;
  }

  canRunOnWater(): boolean {
    return this.waterGrace > 0;
  }

  animOverride(): string | null {
    if (this.dashLeft > 0) return 'dash';
    if (this.strikeAnimLeft > 0) return this.strikeAnim;
    return null;
  }
}
