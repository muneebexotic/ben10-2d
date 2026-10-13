import { DIAMONDHEAD } from '../../config/aliens/diamondhead';
import { FX } from '../../config/constants';
import type { Rect } from '../../entities/types';
import type { AbilityContext, FormAbilities, ShotSpec } from '../types';
import { DIAMONDHEAD_COLORS as C } from './art';
import { crystalChime, platformGrow, shardShot, shieldClang, shieldUp, spikeBurst } from './audio';

const S = DIAMONDHEAD.shard;
const SH = DIAMONDHEAD.shield;
const PL = DIAMONDHEAD.platform;
const SP = DIAMONDHEAD.spikes;
const DEG = Math.PI / 180;

const SHARD: ShotSpec = {
  kind: 'shard',
  speed: S.speed,
  damage: S.damage,
  lifetimeMs: S.lifetimeMs,
  radius: S.radius,
  knockback: S.knockback,
  hitKind: 'melee',
};

type ShieldTilt = -1 | 0 | 1;

/**
 * Diamondhead: J fires crystal shards (every third volley a fan of three).
 * Holding K raises a crystal shield that turns shots around (Up or Down tilts
 * it, and laser beams bounce off it too). Up+K grows a crystal platform: a
 * bridge ahead on the ground, a foothold under his feet in the air. Two at a
 * time; each one flickers, then shatters.
 */
export class DiamondheadAbilities implements FormAbilities {
  private fireReadyAt = 0;
  private volleys = 0;
  private shootAnimLeft = 0;
  private shootUp = false;
  // Shield.
  private shielding = false;
  private shieldHeldMs = 0;
  private shieldReadyAt = 0;
  private tilt: ShieldTilt = 0;
  private x = 0;
  private y = 0;
  private facing: 1 | -1 = 1;
  // Platforms.
  private readonly platforms: number[] = [];
  private platformReadyAt = 0;
  private growAnimLeft = 0;
  private spikeAnimLeft = 0;
  private readonly area: Rect = { x: 0, y: 0, w: 0, h: 0 };

  update(ctx: AbilityContext, dt: number): void {
    const { player, controls, fx } = ctx;
    this.x = player.x;
    this.y = player.y;
    this.facing = player.facing;
    this.shootAnimLeft = Math.max(0, this.shootAnimLeft - dt);
    this.growAnimLeft = Math.max(0, this.growAnimLeft - dt);
    this.spikeAnimLeft = Math.max(0, this.spikeAnimLeft - dt);
    fx.frameLight(player.x, player.y - 20, DIAMONDHEAD.light.radius, DIAMONDHEAD.light.color, DIAMONDHEAD.light.intensity);

    // Up+K grows a platform; K on its own raises the shield.
    if (ctx.inputEnabled && controls.specialPressed && controls.up && !this.shielding) {
      this.grow(ctx);
      return;
    }
    this.updateShield(ctx, dt);
    if (this.shielding) return;
    if (ctx.inputEnabled && controls.attackHeld && ctx.now >= this.fireReadyAt) this.shoot(ctx);
  }

  // ------------------------------------------------------------ Shards

  private shoot(ctx: AbilityContext): void {
    const { player, controls, combat, fx } = ctx;
    this.volleys++;
    const fan = this.volleys % S.fanEvery === 0;
    this.shootUp = controls.up;
    const aim = controls.up ? -S.upDeg * DEG : 0;
    const mx = player.x + player.facing * S.muzzleX;
    const my = player.y + S.muzzleY + (controls.up ? -4 : 0);
    let angle = player.facing > 0 ? aim : Math.PI - aim;
    angle = combat.aimAssist(mx, my, angle, S.assistConeDeg * DEG, S.assistRange);
    const spreads = fan ? [-S.fanDeg, 0, S.fanDeg] : [0];
    for (const d of spreads) combat.shoot(SHARD, mx, my, angle + d * DEG);
    this.fireReadyAt = ctx.now + S.cooldownMs;
    this.shootAnimLeft = 150;
    fx.flash(mx, my, C.glow, fan ? 14 : 9, 110);
    fx.burst('crystal', mx, my, fan ? 6 : 3);
    ctx.sfx(shardShot, fan ? 1 : 0.8, fan ? 0.85 : 0.95 + Math.random() * 0.12);
    ctx.notify(fan ? 'shardFan' : 'shard');
  }

  // ------------------------------------------------------------ Shield

  private updateShield(ctx: AbilityContext, dt: number): void {
    const { controls, player, combat, fx } = ctx;
    const holding = ctx.inputEnabled && controls.specialHeld;
    if (!this.shielding) {
      if (holding && controls.specialPressed && ctx.now >= this.shieldReadyAt) {
        this.shielding = true;
        this.shieldHeldMs = 0;
        fx.burst('crystal', player.x + player.facing * 12, player.y - 20, 8);
        ctx.sfx(shieldUp, 0.8);
        ctx.notify('shield');
      }
      return;
    }
    this.shieldHeldMs += dt;
    if (!holding || this.shieldHeldMs >= SH.maxHoldMs) {
      this.lower(ctx, this.shieldHeldMs >= SH.maxHoldMs);
      return;
    }
    this.tilt = controls.up ? -1 : controls.down ? 1 : 0;
    const a = this.area;
    a.w = SH.area.width;
    a.h = SH.area.height;
    a.x = player.x + (player.facing > 0 ? SH.area.ahead : -SH.area.ahead - a.w);
    a.y = player.y - a.h - (this.tilt < 0 ? 8 : 0) + (this.tilt > 0 ? 4 : 0);
    const angle = this.mirrorAngle();
    const turned = combat.deflect(a, angle, SH.reflectSpeed, SH.reflectDamage);
    if (turned > 0) {
      fx.flash(player.x + player.facing * 14, player.y - 22, C.glow, 22, 160);
      fx.burst('crystal', player.x + player.facing * 14, player.y - 22, 6 * turned);
      fx.hitStop(30);
      ctx.sfx(shieldClang, 1, 1 + Math.random() * 0.1);
      for (let i = 0; i < turned; i++) ctx.notify('reflected');
    }
  }

  private lower(ctx: AbilityContext, cracked: boolean): void {
    this.shielding = false;
    this.shieldReadyAt = ctx.now + (cracked ? SH.cooldownMs * 2 : SH.cooldownMs);
    if (cracked) {
      ctx.fx.burst('crystal', ctx.player.x + ctx.player.facing * 12, ctx.player.y - 20, 14);
      ctx.sfx(crystalChime, 0.9, 0.7);
    }
  }

  /** Where the shield sends things: straight back the way he faces, or tilted up or down. */
  private mirrorAngle(): number {
    const tilt = this.tilt * SH.tiltDeg * DEG;
    return this.facing > 0 ? tilt : Math.PI - tilt;
  }

  // ------------------------------------------------------------ Platforms

  private grow(ctx: AbilityContext): void {
    const { player, world, fx } = ctx;
    if (ctx.now < this.platformReadyAt) return;
    // On the ground: a bridge segment ahead at foot level. In the air: a foothold under his feet.
    const x = player.grounded ? player.x + player.facing * PL.aheadPx : player.x;
    const topY = player.grounded ? player.y : player.y + 2;
    const id = world.growPlatform(x, topY, PL.widthPx, PL.lifeMs, PL.warnMs);
    if (id === null) {
      ctx.sfx('denied', 0.5);
      return;
    }
    this.platformReadyAt = ctx.now + PL.cooldownMs;
    this.platforms.push(id);
    while (this.platforms.length > PL.max) world.breakPlatform(this.platforms.shift()!);
    if (!player.grounded) {
      // Stand on it straight away.
      player.setVelocityY(Math.min(0, player.vy));
      player.squash(1.2, 0.85);
    }
    this.growAnimLeft = 220;
    fx.burst('crystal', x, topY, 12);
    fx.flash(x, topY - 2, C.glow, 20, 160);
    ctx.sfx(platformGrow, 0.9, 1 + Math.random() * 0.1);
    ctx.notify('platform');
  }

  // ------------------------------------------------------------ Hooks

  /** Swap-in: crystal spikes erupt from the ground around him. */
  onSwapIn(ctx: AbilityContext): void {
    const { player, combat, fx } = ctx;
    const hits = combat.blast(player.x, player.y - 10, SP.radius, { damage: SP.damage, kind: 'smash', x: player.x, y: player.y, knockback: SP.knockback, stunMs: SP.stunMs, heavy: true }, true);
    fx.spikes(player.x, player.y, SP.radius, C.light);
    fx.burst('crystal', player.x, player.y - 8, 24);
    fx.ring(player.x, player.y - 10, C.glow, SP.radius, 320);
    fx.shake(FX.shakeMedium, 220);
    this.spikeAnimLeft = 300;
    ctx.sfx(spikeBurst);
    ctx.notify(hits > 0 ? 'swapStrike' : 'swap');
  }

  onExit(ctx: AbilityContext): void {
    for (const id of this.platforms) ctx.world.breakPlatform(id);
    this.platforms.length = 0;
    this.shielding = false;
  }

  /** Crystal sentries' shards: he drinks them in instead of getting hurt. */
  absorbShot(ctx: AbilityContext, kind: string): boolean {
    if (kind !== 'shard') return false;
    ctx.fx.burst('crystal', ctx.player.x, ctx.player.centerY, 6);
    ctx.fx.popText(ctx.player.x, ctx.player.y - 44, 'ABSORBED!', C.glow);
    ctx.sfx(crystalChime, 0.7, 1.3);
    ctx.notify('absorb');
    return true;
  }

  onLand(ctx: AbilityContext, impact: number): void {
    if (impact > 0.55) {
      ctx.fx.burst('crystal', ctx.player.x, ctx.player.y, 6);
      ctx.sfx(crystalChime, 0.5, 0.6);
    }
  }

  onDodge(ctx: AbilityContext): void {
    if (this.shielding) ctx.fx.burst('crystal', ctx.player.x + ctx.player.facing * 12, ctx.player.centerY, 3);
  }

  mirror(): { x: number; y: number; angle: number; halfLength: number } | null {
    if (!this.shielding) return null;
    return { x: this.x + this.facing * (SH.area.ahead + SH.area.width / 2), y: this.y - SH.area.height / 2 - (this.tilt < 0 ? 6 : 0), angle: this.mirrorAngle(), halfLength: SH.area.height / 2 };
  }

  speedMultiplier(): number {
    return this.shielding ? SH.moveMultiplier : 1;
  }

  animOverride(): string | null {
    if (this.shielding) return this.tilt < 0 ? 'shieldUp' : this.tilt > 0 ? 'shieldDown' : 'shield';
    if (this.spikeAnimLeft > 0) return 'spikes';
    if (this.growAnimLeft > 0) return 'grow';
    if (this.shootAnimLeft > 0) return this.shootUp ? 'shootUp' : 'shoot';
    return null;
  }
}

