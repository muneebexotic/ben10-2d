import { STINKFLY } from '../../config/aliens/stinkfly';
import { FX } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import type { AbilityContext, FormAbilities, ShotSpec } from '../types';
import { STINKFLY_COLORS as C } from './art';
import { buzz, slimeSpit, stinkVent, takeoff } from './audio';

const FL = STINKFLY.flight;
const SL = STINKFLY.slime;
const ST = STINKFLY.stink;
const SP = STINKFLY.spray;
const DEG = Math.PI / 180;

const GLOB: ShotSpec = {
  kind: 'slime',
  speed: SL.speed,
  damage: SL.damage,
  lifetimeMs: SL.lifetimeMs,
  radius: SL.radius,
  knockback: SL.knockback,
  hitKind: 'slime',
  gravity: SL.gravity,
  slowMs: SL.slowMs,
};

const SPRAY: ShotSpec = { ...GLOB, speed: SP.speed, damage: SP.damage, slowMs: SP.slowMs, lifetimeMs: 700 };

/**
 * Stinkfly: jump in mid-air to fly (hold to climb, let go to hover, down to
 * dive) until his wings tire; J lobs slime that slows and gums enemies, and
 * K vents a stink cloud that chokes them. Fire sets the cloud off.
 */
export class StinkflyAbilities implements FormAbilities {
  private flying = false;
  private stamina = 1;
  private gliding = false;
  private buzzT = 0;
  private fireReadyAt = 0;
  private spitAnimLeft = 0;
  private stinkReadyAt = 0;
  private ventAnimLeft = 0;
  private shotIndex = 0;

  update(ctx: AbilityContext, dt: number): void {
    const { player, controls } = ctx;
    this.spitAnimLeft = Math.max(0, this.spitAnimLeft - dt);
    this.ventAnimLeft = Math.max(0, this.ventAnimLeft - dt);
    ctx.fx.frameLight(player.x, player.centerY, 40, STINKFLY.light.color, 0.35);

    if (player.grounded) {
      this.flying = false;
      this.stamina = Math.min(1, this.stamina + dt / 1000 / FL.refillSeconds);
    }
    if (this.flying) this.fly(ctx, dt);
    this.gliding = !this.flying && !player.grounded && ctx.inputEnabled && controls.jumpHeld && player.vy > 0;
    if (this.gliding && Math.random() < 0.3) ctx.fx.trail('slime', player.x - player.facing * 8, player.centerY + 4);

    if (ctx.inputEnabled && controls.attackHeld && ctx.now >= this.fireReadyAt) this.spit(ctx);
    if (ctx.inputEnabled && controls.specialPressed && ctx.now >= this.stinkReadyAt) this.vent(ctx);
  }

  // ------------------------------------------------------------ Flight

  tryAirJump(ctx: AbilityContext): boolean {
    if (this.stamina <= 0.02) {
      ctx.fx.burst('slime', ctx.player.x, ctx.player.centerY, 3);
      ctx.sfx(buzz, 0.5, 0.6);
      return false;
    }
    this.flying = true;
    ctx.player.setVelocityY(Math.min(ctx.player.vy, -FL.takeoffVy));
    ctx.player.squash(0.8, 1.2);
    ctx.fx.burst('dust', ctx.player.x, ctx.player.y, 5);
    ctx.fx.ring(ctx.player.x, ctx.player.centerY, C.wing, 18, 200);
    ctx.sfx(takeoff, 0.9);
    ctx.notify('fly');
    return true;
  }

  private fly(ctx: AbilityContext, dt: number): void {
    const { player, controls } = ctx;
    const s = dt / 1000;
    const flapping = ctx.inputEnabled && controls.jumpHeld && !controls.down;
    const diving = ctx.inputEnabled && controls.down;
    let vy = player.vy;
    if (diving) vy = Math.min(FL.diveSpeed, vy + FL.riseAccel * 1.5 * s);
    else if (flapping) vy = Math.max(-FL.riseSpeed, vy - FL.riseAccel * s);
    else vy += (FL.hoverSink - vy) * Math.min(1, 8 * s);
    player.setVelocityY(vy);
    if (!diving) this.stamina -= (s / FL.staminaSeconds) * (flapping ? 1 : FL.hoverCost);
    if (this.stamina <= 0) {
      this.stamina = 0;
      this.flying = false;
      ctx.fx.popText(player.x, player.y - 34, 'TIRED!', PALETTE.uiDim);
      ctx.sfx(buzz, 0.6, 0.55);
      return;
    }
    this.buzzT -= dt;
    if (this.buzzT <= 0) {
      const low = this.stamina < FL.lowAt;
      this.buzzT = low ? 120 : 80;
      ctx.sfx(buzz, low ? 0.35 : 0.45, (low ? 0.8 : 1) + Math.random() * 0.08);
    }
    if (Math.random() < 0.35) player.afterimage(C.wing, 0.18, 90);
  }

  gravityScale(): number | null {
    return this.flying ? 0 : null;
  }

  maxFallSpeed(): number | null {
    if (this.flying) return FL.diveSpeed;
    return this.gliding ? FL.glideMaxFall : null;
  }

  meter(): { value: number; color: number } | null {
    return { value: this.stamina, color: C.body };
  }

  // ------------------------------------------------------------ Slime and stink

  private spit(ctx: AbilityContext): void {
    const { player, controls } = ctx;
    let aim = -8 * DEG;
    if (controls.up) aim = -SL.upDeg * DEG;
    else if (controls.down && !player.grounded) aim = SL.downDeg * DEG;
    const mx = player.x + player.facing * SL.muzzleX;
    const my = player.y + SL.muzzleY + (this.shotIndex++ % 2 === 0 ? -1 : 1);
    let angle = player.facing > 0 ? aim : Math.PI - aim;
    angle = ctx.combat.aimAssist(mx, my, angle, SL.assistConeDeg * DEG, SL.assistRange);
    ctx.combat.shoot(GLOB, mx, my, angle);
    this.fireReadyAt = ctx.now + SL.cooldownMs;
    this.spitAnimLeft = 150;
    ctx.fx.burst('slime', mx, my, 4);
    ctx.sfx(slimeSpit, 0.9, 0.9 + Math.random() * 0.2);
    ctx.notify('slime');
  }

  private vent(ctx: AbilityContext): void {
    const { player } = ctx;
    const x = player.x + player.facing * ST.offsetX;
    const y = player.y + ST.offsetY - 12;
    ctx.combat.gas(x, y, ST.radius, ST.lifeMs, { damage: ST.tickDamage, kind: 'slime', x, y, knockback: 0, slowMs: ST.tickSlowMs });
    this.stinkReadyAt = ctx.now + ST.cooldownMs;
    this.ventAnimLeft = 260;
    ctx.fx.burst('stink', x, y, 14);
    ctx.fx.ring(x, y, C.stink, ST.radius, 420);
    if (!player.grounded) player.setVelocityY(Math.min(player.vy, -ST.recoilVy));
    ctx.sfx(stinkVent, 1);
    ctx.notify('stink');
  }

  // ------------------------------------------------------------ Hooks

  onLand(ctx: AbilityContext): void {
    if (this.flying) ctx.fx.burst('dust', ctx.player.x, ctx.player.y, 4);
    this.flying = false;
  }

  onSwapIn(ctx: AbilityContext): void {
    const { player, fx } = ctx;
    for (let i = 0; i < SP.count; i++) {
      const a = (i / SP.count) * Math.PI * 2 + 0.2;
      ctx.combat.shoot(SPRAY, player.x, player.centerY, a);
    }
    fx.burst('slime', player.x, player.centerY, 18);
    fx.ring(player.x, player.centerY, C.body, 48, 300);
    fx.shake(FX.shakeLight, 160);
    ctx.sfx(slimeSpit, 1, 0.7);
    // He arrives with full wings, so a swap mid-jump can fly straight off.
    this.stamina = Math.max(this.stamina, 0.6);
    ctx.notify('swap');
  }

  onExit(): void {
    this.flying = false;
  }

  animOverride(): string | null {
    if (this.ventAnimLeft > 0) return 'vent';
    if (this.spitAnimLeft > 0) return 'spit';
    if (this.flying) return 'fly';
    if (this.gliding) return 'glide';
    return null;
  }
}
