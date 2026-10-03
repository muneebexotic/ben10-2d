import { HEATBLAST } from '../../config/aliens/heatblast';
import { FX } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { ChargeHum } from '../../systems/audio/Sfx';
import type { AbilityContext, FormAbilities, ShotSpec } from '../types';
import { flameNova } from './audio';
import { chance } from '../../systems/Pacing';

const FB = HEATBLAST.fireball;
const BURST = HEATBLAST.burst;
const ROCKET = HEATBLAST.rocketJump;
const NOVA = HEATBLAST.flameNova;
const DEG = Math.PI / 180;

const FIREBALL: ShotSpec = {
  kind: 'fireball',
  speed: FB.speed,
  damage: FB.damage,
  lifetimeMs: FB.lifetimeMs,
  radius: FB.radius,
  knockback: FB.knockback,
  hitKind: 'fire',
};

/** Fireballs on J, a charged Fire Burst on K, and the rocket jump (with a glide) on a second jump. */
export class HeatblastAbilities implements FormAbilities {
  private fireReadyAt = 0;
  private shootAnimLeft = 0;
  private chargeMs = -1;
  private chargeFullNotified = false;
  private burstReadyAt = 0;
  private rocketUsed = false;
  private rocketAnimLeft = 0;
  private shotIndex = 0;
  private readonly hum = new ChargeHum();

  update(ctx: AbilityContext, dt: number): void {
    const { controls, player } = ctx;
    this.shootAnimLeft = Math.max(0, this.shootAnimLeft - dt);
    this.rocketAnimLeft = Math.max(0, this.rocketAnimLeft - dt);

    // Living flame: head fire, embers and a warm light that make Heatblast the brightest thing in the forest.
    const headY = player.y - 30;
    ctx.fx.stream('fire', player.x + (Math.random() - 0.5) * 8, headY + Math.random() * 4);
    if (chance(0.25)) ctx.fx.trail('ember', player.x + (Math.random() - 0.5) * 12, player.y - 16);
    const flicker = 0.9 + Math.sin(ctx.now * 0.03) * 0.05 + Math.random() * 0.05;
    ctx.fx.frameLight(player.x, player.y - 16, HEATBLAST.lightRadius * flicker, HEATBLAST.lightColor, 1);

    this.updateCharge(ctx, dt);

    if (ctx.inputEnabled && controls.attackHeld && this.chargeMs < 0 && ctx.now >= this.fireReadyAt) {
      this.shoot(ctx);
    }

    if (this.rocketUsed && !player.grounded && controls.jumpHeld && player.vy > 0) {
      ctx.fx.stream('fire', player.x + (Math.random() - 0.5) * 6, player.y);
    }
  }

  private shoot(ctx: AbilityContext): void {
    const { controls, player } = ctx;
    let aim = 0;
    if (controls.up) aim = -38 * DEG;
    else if (controls.down && !player.grounded) aim = 38 * DEG;
    const mx = player.x + player.facing * FB.muzzleX;
    const my = player.y + FB.muzzleY - 16 + (this.shotIndex++ % 2 === 0 ? -1 : 1);
    let angle = player.facing > 0 ? aim : Math.PI - aim;
    angle = ctx.combat.aimAssist(mx, my, angle, FB.assistConeDeg * DEG, FB.assistRange);
    angle += (Math.random() - 0.5) * FB.spreadDeg * DEG * 2;

    ctx.combat.shoot(FIREBALL, mx, my, angle);
    this.fireReadyAt = ctx.now + FB.cooldownMs;
    this.shootAnimLeft = 140;
    if (player.grounded) player.setVelocityX(player.vx - player.facing * FB.recoil);
    ctx.fx.flash(mx, my, PALETTE.fire1, 10, 120);
    ctx.fx.burst('fire', mx, my, 3);
    ctx.fx.light(mx, my, 60, PALETTE.fire2, 120);
    ctx.sfx('fireball', 1, 0.92 + Math.random() * 0.16);
    ctx.notify('fireball');
  }

  private updateCharge(ctx: AbilityContext, dt: number): void {
    const { controls, player } = ctx;
    const holding = ctx.inputEnabled && controls.specialHeld;

    if (this.chargeMs < 0) {
      if (holding && controls.specialPressed && ctx.now >= this.burstReadyAt) {
        this.chargeMs = 0;
        this.chargeFullNotified = false;
        this.hum.start();
      }
      return;
    }

    if (holding) {
      this.chargeMs += dt;
      const t = Math.min(1, this.chargeMs / BURST.fullChargeMs);
      this.hum.set(t);
      player.glow(PALETTE.fire0, 0.25 + t * 0.45);
      const r = 10 + t * 18;
      for (let i = 0; i < 1 + Math.floor(t * 3); i++) {
        const a = Math.random() * Math.PI * 2;
        if (chance(1)) ctx.fx.trail('fire', player.x + Math.cos(a) * r, player.centerY + Math.sin(a) * r);
      }
      ctx.fx.frameLight(player.x, player.centerY, 60 + t * 90, PALETTE.fire1, 0.6 + t * 0.4);
      if (t >= 1 && !this.chargeFullNotified) {
        this.chargeFullNotified = true;
        ctx.fx.ring(player.x, player.centerY, PALETTE.fire0, 30, 250);
        ctx.fx.flash(player.x, player.centerY, PALETTE.fire0, 26, 200);
        ctx.sfx('beep', 0.9, 1.4);
      }
      return;
    }

    // Released.
    const charge = this.chargeMs;
    this.chargeMs = -1;
    this.hum.stop();
    player.glow(PALETTE.fire0, 0);
    if (charge < BURST.minChargeMs) return;
    this.release(ctx, Math.min(1, charge / BURST.fullChargeMs));
  }

  private release(ctx: AbilityContext, t: number): void {
    const { player } = ctx;
    const radius = BURST.minRadius + (BURST.maxRadius - BURST.minRadius) * t;
    const damage = Math.round(BURST.minDamage + (BURST.maxDamage - BURST.minDamage) * t);
    const cx = player.x;
    const cy = player.centerY;
    ctx.combat.blast(cx, cy, radius, { damage, kind: 'burst', x: cx, y: cy, knockback: BURST.knockback, heavy: t >= 1 }, true);
    this.burstReadyAt = ctx.now + BURST.cooldownMs;

    ctx.fx.ring(cx, cy, PALETTE.fire1, radius, 380);
    ctx.fx.ring(cx, cy, PALETTE.fire3, radius * 0.7, 460);
    ctx.fx.flash(cx, cy, PALETTE.fire0, radius * 0.9, 320);
    ctx.fx.burst('fire', cx, cy, Math.round(24 + t * 30));
    ctx.fx.burst('magma', cx, cy, Math.round(8 + t * 16));
    ctx.fx.burst('ember', cx, cy, 10);
    ctx.fx.light(cx, cy, radius * 2.4, PALETTE.fire1, 500);
    ctx.fx.shake(t >= 1 ? FX.shakeHeavy : FX.shakeMedium, 260);
    ctx.fx.hitStop(t >= 1 ? FX.hitStopHeavyMs : FX.hitStopLightMs);
    ctx.sfx('burst', 0.7 + t * 0.3, 1.15 - t * 0.2);
    if (t >= 1 && player.grounded) player.launch(-BURST.fullChargeHop, false);
    player.squash(1.35, 0.7);
    ctx.notify('burst');
  }

  tryAirJump(ctx: AbilityContext): boolean {
    if (this.rocketUsed || !ctx.inputEnabled) return false;
    const { player, controls } = ctx;
    this.rocketUsed = true;
    this.rocketAnimLeft = 320;
    const boost = controls.left ? -ROCKET.horizontalBoost : controls.right ? ROCKET.horizontalBoost : 0;
    player.setVelocityX(player.vx + boost);
    player.launch(-ROCKET.velocity, false);
    player.squash(0.7, 1.35);

    const fx = player.x;
    const fy = player.y;
    ctx.combat.blast(fx, fy + 6, ROCKET.blastRadius, { damage: ROCKET.blastDamage, kind: 'rocket', x: fx, y: fy + 12, knockback: 220 }, false);
    ctx.fx.burst('fire', fx, fy + 2, 22);
    ctx.fx.burst('smoke', fx, fy + 4, 6);
    ctx.fx.ring(fx, fy + 4, PALETTE.fire1, 34, 300);
    ctx.fx.flash(fx, fy + 4, PALETTE.fire0, 20, 200);
    ctx.fx.light(fx, fy, 120, PALETTE.fire1, 300);
    ctx.fx.shake(FX.shakeLight, 120);
    ctx.sfx('rocket');
    ctx.notify('rocket');
    return true;
  }

  onLand(ctx: AbilityContext, impact: number): void {
    this.rocketUsed = false;
    if (impact > HEATBLAST.hardLandingImpact) {
      ctx.fx.burst('ember', ctx.player.x, ctx.player.y, 6);
      ctx.fx.shake(FX.shakeLight, 90);
    }
  }

  onStep(ctx: AbilityContext): void {
    ctx.fx.burst('ember', ctx.player.x, ctx.player.y, 2);
  }

  /** Swap-in: Heatblast arrives in a ring of fire that also burns lasers out of the air. */
  onSwapIn(ctx: AbilityContext): void {
    const { player } = ctx;
    const x = player.x;
    const y = player.centerY;
    const hits = ctx.combat.blast(x, y, NOVA.radius, { damage: NOVA.damage, kind: 'burst', x, y, knockback: NOVA.knockback }, true);
    ctx.fx.ring(x, y, PALETTE.fire1, NOVA.radius, 360);
    ctx.fx.ring(x, y, PALETTE.fire3, NOVA.radius * 0.6, 420);
    ctx.fx.burst('fire', x, y, 36);
    ctx.fx.burst('ember', x, y, 12);
    ctx.fx.light(x, y, NOVA.radius * 2.6, PALETTE.fire1, 420);
    ctx.fx.shake(FX.shakeMedium, 200);
    ctx.sfx(flameNova);
    ctx.notify(hits > 0 ? 'swapStrike' : 'swap');
  }

  onExit(ctx: AbilityContext): void {
    this.hum.stop();
    ctx.player.glow(PALETTE.fire0, 0);
  }

  dispose(): void {
    this.hum.stop();
  }

  speedMultiplier(): number {
    return this.chargeMs >= 0 ? BURST.moveMultiplier : 1;
  }

  maxFallSpeed(ctx: AbilityContext): number | null {
    return this.rocketUsed && ctx.controls.jumpHeld ? ROCKET.glideMaxFall : null;
  }

  animOverride(): string | null {
    if (this.chargeMs >= 0) return 'charge';
    if (this.rocketAnimLeft > 0) return 'rocket';
    if (this.shootAnimLeft > 0) return 'shoot';
    return null;
  }
}
