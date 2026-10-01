import { FOURARMS } from '../../config/aliens/fourarms';
import { FX } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import type { Rect } from '../../entities/types';
import type { AbilityContext, FormAbilities, HeldObject } from '../types';
import { FOURARMS_COLORS as C } from './art';
import { clapBoom, heavyHit, heavySwing, plunge, quake, thud } from './audio';

const PU = FOURARMS.punch;
const HM = FOURARMS.haymaker;
const CL = FOURARMS.clap;
const SL = FOURARMS.slam;
const ME = FOURARMS.meteor;
const LA = FOURARMS.landing;
const GR = FOURARMS.grab;
const TH = FOURARMS.throw;

type Action = 'none' | 'punch' | 'haymaker' | 'clap' | 'slam' | 'meteor' | 'lift' | 'throw';

const LOCKING: readonly Action[] = ['haymaker', 'clap', 'slam', 'meteor', 'lift'];

/**
 * Four Arms: J throws a two-punch chain ending in a four-fisted haymaker,
 * Up+J claps a shockwave overhead, K slams the ground (or plunges from the
 * air), and J next to anything stunned picks it up to throw. Every hit is
 * 'smash' damage: cracked walls and armour give way.
 */
export class FourArmsAbilities implements FormAbilities {
  private action: Action = 'none';
  private actionT = 0;
  private resolved = false;
  private chain = 0;
  private punchAnim: 'punchA' | 'punchB' = 'punchA';
  private lastPunchEnd = -Infinity;
  private bufferedAttack = 0;
  private bufferedSpecial = 0;
  private clapReadyAt = 0;
  private slamReadyAt = 0;
  private held: HeldObject | null = null;
  private meteorStartY = 0;
  private meteorSwap = false;
  private moving = false;
  private readonly area: Rect = { x: 0, y: 0, w: 0, h: 0 };

  update(ctx: AbilityContext, dt: number): void {
    const { player, controls } = ctx;
    this.moving = Math.abs(player.vx) > 12;
    ctx.fx.frameLight(player.x, player.centerY - 4, FOURARMS.light.radius, FOURARMS.light.color, FOURARMS.light.intensity);
    if (ctx.inputEnabled && controls.attackPressed) this.bufferedAttack = ctx.now + PU.bufferMs;
    if (ctx.inputEnabled && controls.specialPressed) this.bufferedSpecial = ctx.now + PU.bufferMs;

    if (this.held && this.action !== 'lift') this.held.carry(player.x + player.facing * 2, player.y - GR.overhead, player.facing);
    if (this.action !== 'none') {
      this.actionT += dt;
      this.stepAction(ctx);
    }
    if (this.action === 'none') this.startAction(ctx);
  }

  // ------------------------------------------------------------ Starting moves

  private startAction(ctx: AbilityContext): void {
    if (!ctx.inputEnabled) return;
    const { player, controls } = ctx;
    const attack = ctx.now < this.bufferedAttack;
    const special = ctx.now < this.bufferedSpecial;
    if (!attack && !special) return;
    this.bufferedAttack = 0;
    this.bufferedSpecial = 0;

    if (this.held) {
      this.throwHeld(ctx);
      return;
    }
    if (special) {
      if (!player.grounded) this.beginMeteor(ctx, false);
      else if (ctx.now >= this.slamReadyAt) this.begin(ctx, 'slam');
      return;
    }
    if (controls.up && ctx.now >= this.clapReadyAt) {
      this.begin(ctx, 'clap');
      return;
    }
    if (this.tryLift(ctx)) return;
    if (ctx.now - this.lastPunchEnd > PU.chainWindowMs) this.chain = 0;
    this.begin(ctx, this.chain === 2 ? 'haymaker' : 'punch');
  }

  private begin(ctx: AbilityContext, action: Action): void {
    const { player } = ctx;
    this.action = action;
    this.actionT = 0;
    this.resolved = false;
    if (LOCKING.includes(action) && player.grounded) player.setVelocityX(0);
    if (action === 'punch') {
      this.punchAnim = this.chain === 0 ? 'punchA' : 'punchB';
      ctx.sfx(heavySwing, 0.8, 0.9 + Math.random() * 0.15);
    } else if (action === 'haymaker') {
      player.squash(0.85, 1.15);
      ctx.sfx(heavySwing, 1, 0.7);
    } else if (action === 'slam') {
      player.squash(0.85, 1.2);
    } else if (action === 'clap') {
      player.squash(0.9, 1.15);
    }
  }

  private stepAction(ctx: AbilityContext): void {
    const t = this.actionT;
    switch (this.action) {
      case 'punch':
      case 'haymaker': {
        const s = this.action === 'haymaker' ? HM : PU;
        if (!this.resolved && t >= s.startupMs) {
          this.resolved = true;
          this.resolvePunch(ctx, this.action === 'haymaker');
        }
        if (t >= s.startupMs + s.activeMs + s.recoverMs) {
          this.lastPunchEnd = ctx.now;
          this.chain = (this.chain + 1) % 3;
          this.action = 'none';
        }
        break;
      }
      case 'clap':
        if (!this.resolved && t >= CL.startupMs) {
          this.resolved = true;
          this.resolveClap(ctx);
        }
        if (t >= CL.startupMs + CL.recoverMs) {
          this.clapReadyAt = ctx.now + CL.cooldownMs;
          this.action = 'none';
        }
        break;
      case 'slam':
        if (!this.resolved && t >= SL.startupMs) {
          this.resolved = true;
          this.impact(ctx, SL.damage, SL.radius, 0.7, SL.wave.lifeMs, false);
        }
        if (t >= SL.startupMs + SL.recoverMs) {
          this.slamReadyAt = ctx.now + SL.cooldownMs;
          this.action = 'none';
        }
        break;
      case 'meteor':
        ctx.player.setVelocity(0, ME.speed);
        ctx.fx.trail('dust', ctx.player.x + (Math.random() - 0.5) * 12, ctx.player.y - 30);
        if (t > 2500) this.action = 'none';
        break;
      case 'lift': {
        const k = Math.min(1, t / GR.liftMs);
        this.held?.carry(ctx.player.x + ctx.player.facing * (10 - 8 * k), ctx.player.y - 4 - (GR.overhead - 4) * k, ctx.player.facing);
        if (t >= GR.liftMs) this.action = 'none';
        break;
      }
      case 'throw':
        if (t >= 200) this.action = 'none';
        break;
      default:
        break;
    }
  }

  // ------------------------------------------------------------ Hits

  private resolvePunch(ctx: AbilityContext, haymaker: boolean): void {
    const { player, fx } = ctx;
    const s = haymaker ? HM : PU;
    const a = this.area;
    a.w = s.reach;
    a.h = s.height;
    a.x = player.facing > 0 ? player.x + 2 : player.x - 2 - s.reach;
    a.y = player.centerY - s.height / 2 - 4;
    const hits = ctx.combat.melee(a, {
      damage: s.damage,
      kind: 'smash',
      x: player.x,
      y: player.centerY,
      knockback: s.knockback,
      heavy: haymaker,
      stunMs: haymaker ? HM.stunMs : undefined,
    });
    if (player.grounded) player.setVelocityX(player.facing * PU.lunge * (haymaker ? 1.5 : 1));
    const fx0 = player.x + player.facing * (s.reach - 2);
    const fy = a.y + a.h / 2;
    if (hits > 0) {
      fx.hitStop(s.hitStopMs);
      fx.shake(haymaker ? FX.shakeHeavy : FX.shakeMedium, haymaker ? 260 : 160);
      fx.burst('spark', fx0, fy, haymaker ? 14 : 8);
      fx.burst('debris', fx0, fy, haymaker ? 10 : 5);
      fx.ring(fx0, fy, haymaker ? PALETTE.white : C.light, haymaker ? 34 : 20, 240);
      if (haymaker) fx.flash(fx0, fy, C.light, 30, 240);
      ctx.sfx(heavyHit, 1, haymaker ? 0.75 : 0.95 + Math.random() * 0.1);
    } else {
      fx.burst('dust', fx0, fy, 3);
    }
    player.squash(1.15, 0.9);
    ctx.notify(haymaker ? 'haymaker' : 'punch');
  }

  private resolveClap(ctx: AbilityContext): void {
    const { player, fx } = ctx;
    const cx = player.x + player.facing * 3;
    const cy = player.y + CL.offsetY;
    const hits = ctx.combat.blast(cx, cy, CL.radius, { damage: CL.damage, kind: 'smash', x: cx, y: cy, knockback: CL.knockback, stunMs: CL.stunMs }, true);
    fx.ring(cx, cy, PALETTE.white, CL.radius, 300);
    fx.ring(cx, cy, C.light, CL.radius * 0.7, 360);
    fx.rays(cx, cy, PALETTE.white, CL.radius * 1.1, 360);
    fx.flash(cx, cy, PALETTE.white, 26, 200);
    fx.burst('white', cx, cy, 18);
    fx.shake(FX.shakeMedium, 200);
    fx.hitStop(hits > 0 ? CL.hitStopMs : 40);
    ctx.sfx(clapBoom);
    ctx.notify('clap');
  }

  /** The ground-shaker shared by the slam, the meteor drop and the swap-in. */
  private impact(ctx: AbilityContext, damage: number, radius: number, power: number, waveLifeMs: number, swap: boolean): void {
    const { player, fx } = ctx;
    const x = player.x;
    const y = player.y;
    const hits = ctx.combat.blast(x, y - 10, radius, { damage, kind: 'smash', x, y: y + 12, knockback: SL.knockback, stunMs: SL.stunMs, heavy: true }, false);
    const wave = { ...SL.wave, lifeMs: waveLifeMs, color: C.light };
    ctx.combat.groundWave(x, y, -1, wave, 'smash');
    ctx.combat.groundWave(x, y, 1, wave, 'smash');
    fx.crack(x, y, power);
    fx.burst('debris', x, y - 2, Math.round(12 + power * 16));
    fx.burst('dust', x - 14, y - 2, 10);
    fx.burst('dust', x + 14, y - 2, 10);
    fx.ring(x, y - 4, C.light, radius, 360);
    fx.flash(x, y - 6, C.light, radius * 0.6, 240);
    fx.light(x, y - 6, radius * 2.2, C.light, 360);
    fx.shake(FX.shakeHeavy * (0.7 + power * 0.5), 300 + power * 120);
    fx.hitStop(SL.hitStopMs * (0.7 + power * 0.4));
    player.squash(1.45, 0.65);
    ctx.sfx(quake, 0.8 + power * 0.2, 1.1 - power * 0.2);
    ctx.notify(swap && hits > 0 ? 'swapStrike' : 'slam');
  }

  private beginMeteor(ctx: AbilityContext, swap: boolean): void {
    this.action = 'meteor';
    this.actionT = 0;
    this.meteorSwap = swap;
    this.meteorStartY = ctx.player.y;
    ctx.player.setVelocity(0, ME.speed);
    ctx.player.squash(0.75, 1.3);
    ctx.sfx(plunge);
    ctx.notify('meteor');
  }

  // ------------------------------------------------------------ Lift and throw

  private tryLift(ctx: AbilityContext): boolean {
    const { player } = ctx;
    const a = this.area;
    a.w = GR.reach;
    a.h = GR.height;
    a.x = player.facing > 0 ? player.x - 4 : player.x + 4 - GR.reach;
    a.y = player.y - GR.height;
    const held = ctx.combat.lift(a);
    if (!held) return false;
    this.held = held;
    this.begin(ctx, 'lift');
    ctx.fx.burst('dust', player.x + player.facing * 10, player.y, 6);
    ctx.notify('grab');
    return true;
  }

  private throwHeld(ctx: AbilityContext): void {
    const held = this.held;
    if (!held) return;
    const { player, controls } = ctx;
    const up = controls.up;
    const vx = player.facing * (up ? TH.upVx : TH.vx) + player.vx * 0.3;
    const vy = up ? TH.upVy : TH.vy;
    const x = player.x + player.facing * 6;
    const y = player.y - GR.overhead;
    ctx.combat.hurl(held, x, y, vx, vy, { damage: TH.damage, kind: 'smash', x, y, knockback: TH.knockback, stunMs: TH.stunMs, heavy: true }, TH.splash);
    this.held = null;
    this.begin(ctx, 'throw');
    player.squash(1.25, 0.85);
    ctx.fx.speedLine(x, y, player.facing, PALETTE.white);
    ctx.sfx('throw');
    ctx.notify('throw');
  }

  // ------------------------------------------------------------ Hooks

  onLand(ctx: AbilityContext, impact: number): void {
    const { player, fx } = ctx;
    if (this.action === 'meteor') {
      const power = Math.min(1, Math.max(0, (player.y - this.meteorStartY) / ME.fullPowerDrop));
      const damage = Math.round(ME.minDamage + (ME.maxDamage - ME.minDamage) * power);
      const radius = ME.minRadius + (ME.maxRadius - ME.minRadius) * power;
      this.action = 'none';
      this.slamReadyAt = ctx.now + SL.cooldownMs;
      this.impact(ctx, damage, radius, 0.5 + power * 0.5, ME.waveLifeMs, this.meteorSwap);
      return;
    }
    if (impact > LA.impact) {
      // Superhero landing: the ground cracks and anything close gets jolted.
      ctx.combat.blast(player.x, player.y - 6, LA.radius, { damage: LA.damage, kind: 'smash', x: player.x, y: player.y + 10, knockback: 200 }, false);
      fx.crack(player.x, player.y, 0.35);
      fx.burst('dust', player.x, player.y, 12);
      fx.shake(FX.shakeMedium, 200);
      ctx.sfx(thud, 1, 0.7);
    } else if (impact > 0.35) {
      fx.shake(FX.shakeLight, 110);
      ctx.sfx(thud, 0.7, 0.9);
    }
  }

  onStep(ctx: AbilityContext): void {
    ctx.fx.shake(FOURARMS.stepShake, 80);
    ctx.fx.burst('dust', ctx.player.x, ctx.player.y, 3);
    ctx.sfx(thud, 0.55, 1 + Math.random() * 0.1);
  }

  /** Swap-in: Four Arms lands like a meteor; on the ground he arrives already slamming. */
  onSwapIn(ctx: AbilityContext): void {
    if (ctx.player.grounded) this.impact(ctx, SL.damage, SL.radius, 0.8, SL.wave.lifeMs, true);
    else this.beginMeteor(ctx, true);
  }

  /** Reverting mid-carry drops whatever he was holding. */
  onExit(ctx: AbilityContext): void {
    const held = this.held;
    this.held = null;
    if (!held) return;
    const { player } = ctx;
    const y = player.y - GR.overhead;
    ctx.combat.hurl(held, player.x, y, player.facing * 60, -60, { damage: 2, kind: 'smash', x: player.x, y, knockback: 120 }, TH.splash * 0.6);
  }

  locksMovement(): boolean {
    return LOCKING.includes(this.action);
  }

  speedMultiplier(): number {
    if (this.action === 'punch') return PU.moveMultiplier;
    return this.held ? GR.carryMultiplier : 1;
  }

  maxFallSpeed(): number | null {
    return this.action === 'meteor' ? ME.speed : null;
  }

  animOverride(): string | null {
    switch (this.action) {
      case 'punch':
        return this.punchAnim;
      case 'haymaker':
        return this.actionT < HM.startupMs ? 'haymakerUp' : 'haymaker';
      case 'clap':
        return 'clap';
      case 'slam':
        return this.actionT < SL.startupMs ? 'slamUp' : 'slam';
      case 'meteor':
        return 'meteor';
      case 'lift':
        return 'carry';
      case 'throw':
        return 'throw';
      default:
        if (this.held) return this.moving ? 'carryRun' : 'carry';
        return null;
    }
  }
}
