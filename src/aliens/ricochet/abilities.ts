import { RICOCHET } from '../../config/aliens/ricochet';
import { FX } from '../../config/constants';
import { PLAYER } from '../../config/player';
import type { Hit, Rect } from '../../entities/types';
import type { AbilityContext, FormAbilities } from '../types';
import { RICOCHET_COLORS as C } from './art';
import { bonk, boing, bowlingRush, curlClack, rollRumble, shellCrash, shellThunk, spinWhirr } from './audio';
import { clampSpeed, dropDamage, landingBounce, ricochetOff, rollDamage, rollSmashes, spinRate, stepRollSpeed } from './rollMotor';

const B = RICOCHET.bash;
const R = RICOCHET.roll;
const BO = RICOCHET.boost;
const D = RICOCHET.drop;
const S = RICOCHET.swapIn;
const L = RICOCHET.light;
/** The ball's radius (game px): it sits on the feet. */
const BALL_R = 11;

/**
 * Ricochet: on his feet, J is a chain of shell bashes (every third a SHELL
 * SLAM). K curls him into a ball: rolling builds speed slowly and keeps it,
 * a fast roll hurts and smashes what it hits, walls send him back the other
 * way (BONK), Jump bounces, landings bounce, and Jump pressed right as he
 * lands is a PERFECT BOUNCE that climbs higher each time. J rolling is a
 * SPIN BOOST; Down in the air a SHELL DROP. Swapping in, he arrives rolling.
 */
export class RicochetAbilities implements FormAbilities {
  private curled = false;
  /** The ball's speed along x (px/s, signed): it lives here, the body just follows it. */
  private v = 0;
  /** What was asked of the body last frame (to tell a wall, or an outside push, from the roll). */
  private setVx: number | null = null;
  private toggleReadyAt = 0;
  private bashes = 0;
  private nextBashAt = 0;
  private bashAnimLeft = 0;
  private slam = false;
  private boostReadyAt = 0;
  private dropping = false;
  private downWas = false;
  private jumpAt = -Infinity;
  private landedAt = -Infinity;
  private landFall = 0;
  private heldMs = 0;
  private chain = 0;
  /** Airborne since he last left the ground (no bounce off a walk-off). */
  private leftGroundAt = 0;
  private wasGrounded = true;
  private rumbleMs = 0;
  private rehitMs = 0;
  private readonly rollKey = {};
  private readonly dropKey = {};
  private readonly area: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private readonly hit: Hit = { damage: 0, kind: 'melee', x: 0, y: 0, knockback: 0 };

  rolling(): boolean {
    return this.curled;
  }

  update(ctx: AbilityContext, dt: number): void {
    const { player, fx } = ctx;
    this.bashAnimLeft = Math.max(0, this.bashAnimLeft - dt);
    fx.frameLight(player.x, player.y - BALL_R, L.radius, L.color, L.intensity * (this.curled ? 0.6 + Math.min(1, Math.abs(this.v) / R.maxSpeed) * 0.6 : 1));
    if (this.curled) {
      this.stepRoll(ctx, dt);
      return;
    }
    if (!ctx.inputEnabled) return;
    if (ctx.controls.specialPressed && ctx.now >= this.toggleReadyAt) {
      this.curl(ctx, player.vx + player.facing * R.curlKick);
      return;
    }
    if (ctx.controls.attackHeld && ctx.now >= this.nextBashAt) this.bash(ctx);
  }

  // ------------------------------------------------------------ On his feet: shell bashes

  private bash(ctx: AbilityContext): void {
    const { player, combat, fx } = ctx;
    this.bashes++;
    this.slam = this.bashes % B.chain === 0;
    this.nextBashAt = ctx.now + B.intervalMs * (this.slam ? 1.6 : 1);
    this.bashAnimLeft = this.slam ? 300 : 200;
    const f = player.facing;
    if (player.grounded) player.setVelocityX(f * (this.slam ? B.slamLunge : B.lunge));
    player.squash(this.slam ? 1.3 : 1.12, this.slam ? 0.78 : 0.92);
    const a = this.area;
    a.x = f > 0 ? player.x : player.x - B.reach;
    a.y = player.y - B.height - 2;
    a.w = B.reach;
    a.h = B.height;
    const h = this.hit;
    h.damage = this.slam ? B.slamDamage : B.damage;
    h.kind = this.slam ? 'smash' : 'melee';
    h.x = player.x;
    h.y = player.centerY;
    h.knockback = this.slam ? B.slamKnockback : B.knockback;
    h.heavy = this.slam;
    h.stunMs = this.slam ? B.slamStunMs : undefined;
    h.roll = undefined;
    const hits = combat.melee(a, h);
    if (hits > 0) {
      fx.hitStop(this.slam ? B.slamHitStopMs : B.hitStopMs);
      fx.burst(this.slam ? 'debris' : 'spark', player.x + f * (B.reach - 4), player.centerY - 2, this.slam ? 10 : 5);
      if (this.slam) {
        fx.shake(FX.shakeLight, 140);
        fx.popText(player.x + f * 18, player.y - 34, 'SLAM!', C.seam);
      }
    } else if (this.slam && player.grounded) fx.burst('dust', player.x + f * 10, player.y, 5);
    ctx.sfx(shellThunk, this.slam ? 1 : 0.7, this.slam ? 0.7 : 1 + Math.random() * 0.12);
    ctx.notify(this.slam ? 'shellSlam' : 'bash');
  }

  // ------------------------------------------------------------ Curled up: the roll

  private curl(ctx: AbilityContext, v: number): void {
    this.curled = true;
    this.v = clampSpeed(v);
    this.setVx = null;
    this.dropping = false;
    this.chain = 0;
    this.toggleReadyAt = ctx.now + R.toggleMs;
    this.wasGrounded = ctx.player.grounded;
    ctx.combat.forget(this.rollKey);
    ctx.player.squash(1.2, 0.82);
    ctx.fx.burst('dust', ctx.player.x, ctx.player.y, 4);
    ctx.sfx(curlClack, 0.9);
    ctx.notify('curl');
  }

  private uncurl(ctx: AbilityContext): void {
    this.curled = false;
    this.dropping = false;
    this.toggleReadyAt = ctx.now + R.toggleMs;
    ctx.player.setVelocityX(this.v * R.uncurlKeep);
    ctx.player.setAnimRate(1);
    ctx.player.squash(0.86, 1.16);
    ctx.sfx(curlClack, 0.7, 1.25);
    this.v = 0;
    this.setVx = null;
  }

  private stepRoll(ctx: AbilityContext, dt: number): void {
    const { player, controls: c, fx } = ctx;
    const grounded = player.grounded;
    if (grounded) this.wasGrounded = true;
    else if (this.wasGrounded) {
      this.wasGrounded = false;
      this.leftGroundAt = ctx.now;
    }
    // What happened to the body since last frame: a wall stopped it (ricochet), or something pushed it (a bumper, a hit).
    if (this.setVx !== null) {
      const vxNow = player.vx;
      const into = Math.sign(this.setVx);
      const wall = into > 0 ? player.blockedRight : into < 0 ? player.blockedLeft : false;
      if (wall && Math.abs(vxNow) < Math.abs(this.setVx) * 0.5) this.hitWall(ctx, this.setVx);
      else if (Math.abs(vxNow - this.setVx) > 3) this.v = clampSpeed(vxNow);
    }

    const input = ctx.inputEnabled;
    // A cutscene took the controls: he uncurls so the story can walk him.
    this.heldMs = input ? 0 : this.heldMs + dt;
    if (this.heldMs > R.uncurlAfterHeldMs) {
      this.uncurl(ctx);
      return;
    }
    const move: -1 | 0 | 1 = !input || c.left === c.right ? 0 : c.left ? -1 : 1;
    const downPressed = input && c.down && !this.downWas;
    this.downWas = input && c.down;
    if (input && c.jumpPressed) this.jumpAt = ctx.now;
    if (input) {
      if (c.specialPressed && ctx.now >= this.toggleReadyAt) {
        this.uncurl(ctx);
        return;
      }
      if (c.attackPressed && ctx.now >= this.boostReadyAt) this.boost(ctx);
      // A bounce: off the ground, or (just after a landing) the perfect one.
      if (c.jumpPressed) {
        const coyote = !grounded && ctx.now - this.leftGroundAt < R.coyoteMs && player.vy >= 0;
        const justLanded = ctx.now - this.landedAt < R.perfectWindowMs && this.landFall >= R.perfectMinFall;
        // Just after a real landing (bounced off it already, or still on the floor): the perfect bounce.
        if (justLanded && (player.vy < 0 || grounded)) this.perfectBounce(ctx);
        else if (grounded || coyote) this.jump(ctx);
      }
      if (downPressed && !grounded && !this.dropping) this.startDrop(ctx);
    }

    this.v = stepRollSpeed(this.v, this.dropping ? 0 : move, grounded, dt);
    this.contact(ctx, dt);
    player.setVelocityX(this.v);
    this.setVx = this.v;
    if (Math.abs(this.v) > 6) player.setFacing(this.v > 0 ? 1 : -1);
    player.setAnimRate(grounded || Math.abs(this.v) > 6 ? spinRate(this.v) : 0.6);

    // The rumble of the shell on the floor, closer together the faster he goes.
    const speed = Math.abs(this.v);
    if (grounded && speed > 30) {
      this.rumbleMs -= dt;
      if (this.rumbleMs <= 0) {
        this.rumbleMs = 300 - Math.min(1, speed / R.maxSpeed) * 190;
        ctx.sfx(rollRumble, 0.4 + Math.min(1, speed / R.maxSpeed) * 0.5, 0.8 + speed / 800);
        if (speed > R.smashSpeed) fx.burst('dust', player.x - Math.sign(this.v) * 6, player.y, 1);
      }
    }
    if (speed > R.smashSpeed) fx.stream('dust', player.x - Math.sign(this.v) * 8, player.y - 2, 0.25);
  }

  private hitWall(ctx: AbilityContext, v: number): void {
    const { player, fx } = ctx;
    const out = ricochetOff(v);
    this.v = out;
    if (out === 0) return;
    const speed = Math.abs(v);
    const side = Math.sign(v);
    player.squash(0.7, 1.25);
    fx.burst('spark', player.x + side * BALL_R, player.y - BALL_R, speed > R.bonkSpeed ? 8 : 4);
    if (speed > R.bonkSpeed) {
      fx.shake(FX.shakeLight, 110);
      fx.hitStop(35);
      fx.popText(player.x + side * 6, player.y - 36, 'BONK!', C.seam);
    }
    ctx.sfx(bonk, Math.min(1, 0.4 + speed / R.capSpeed), 0.85 + speed / 1600);
    ctx.notify('ricochet');
  }

  private jump(ctx: AbilityContext): void {
    this.chain = 0;
    this.bounceUp(ctx, -R.bounceJump, 1);
  }

  private perfectBounce(ctx: AbilityContext): void {
    // One perfect per landing.
    this.landedAt = -Infinity;
    const b = landingBounce(0, true, this.chain);
    this.chain = b.chain;
    this.bounceUp(ctx, b.vy, 1 + b.chain * 0.12);
    const { player, fx } = ctx;
    fx.popText(player.x, player.y - 40, b.chain >= R.perfectChainMax ? 'PERFECT x3!' : b.chain > 1 ? `PERFECT x${b.chain}!` : 'PERFECT!', C.seam);
    fx.ring(player.x, player.y, C.seam, 22 + b.chain * 6, 260);
    ctx.notify(b.chain >= R.perfectChainMax ? 'perfectBounce3' : 'perfectBounce');
  }

  private bounceUp(ctx: AbilityContext, vy: number, pitch: number): void {
    const { player, fx } = ctx;
    player.launch(vy, false);
    this.jumpAt = -Infinity;
    this.dropping = false;
    player.squash(0.78, 1.25);
    fx.burst('dust', player.x, player.y, 5);
    ctx.sfx(boing, 0.8, pitch);
  }

  private boost(ctx: AbilityContext): void {
    const { player, fx } = ctx;
    const dir = Math.abs(this.v) > BO.minSpeed ? Math.sign(this.v) : player.facing;
    this.v = clampSpeed(dir * (Math.max(Math.abs(this.v), BO.minSpeed) + BO.add));
    this.boostReadyAt = ctx.now + BO.cooldownMs;
    ctx.combat.forget(this.rollKey);
    player.squash(1.25, 0.8);
    fx.burst('spark', player.x - dir * 8, player.y - 4, 8);
    player.afterimage(C.seam, 0.5, 220);
    ctx.sfx(spinWhirr, 0.9);
    ctx.notify('spinBoost');
  }

  private startDrop(ctx: AbilityContext): void {
    this.dropping = true;
    ctx.player.setVelocityY(D.speed);
    ctx.combat.forget(this.dropKey);
    ctx.player.squash(0.85, 1.2);
    ctx.sfx(spinWhirr, 0.6, 0.6);
    ctx.notify('shellDrop');
  }

  /** What the ball rolls (or drops) into: hurt it, and bowl through or bounce off. */
  private contact(ctx: AbilityContext, dt: number): void {
    const { player, combat, fx } = ctx;
    this.rehitMs -= dt;
    if (this.rehitMs <= 0) {
      this.rehitMs = R.rehitMs;
      combat.forget(this.rollKey);
    }
    const a = this.area;
    const h = this.hit;
    if (this.dropping) {
      // Coming down on something: it takes the drop.
      a.x = player.x - BALL_R;
      a.y = player.y - 6;
      a.w = BALL_R * 2;
      a.h = 10;
      h.damage = dropDamage(Math.max(0, player.vy), D.speed);
      h.kind = 'smash';
      h.x = player.x;
      h.y = player.y - 30;
      h.knockback = D.knockback;
      h.heavy = true;
      h.stunMs = D.stunMs;
      h.roll = true;
      if (combat.meleeOnce(a, h, this.dropKey) > 0) {
        fx.hitStop(D.hitStopMs);
        player.setInvulnerable(R.guardMs);
      }
      return;
    }
    const speed = Math.abs(this.v);
    const dmg = rollDamage(speed);
    if (dmg <= 0) return;
    const dir = Math.sign(this.v);
    a.x = player.x - BALL_R + dir * 3;
    a.y = player.y - BALL_R * 2;
    a.w = BALL_R * 2;
    a.h = BALL_R * 2;
    const smash = rollSmashes(speed);
    h.damage = dmg;
    h.kind = smash ? 'smash' : 'melee';
    h.x = player.x - dir * 10;
    h.y = player.y - BALL_R;
    h.knockback = R.knockback * Math.min(1.2, speed / R.maxSpeed);
    h.heavy = smash;
    h.stunMs = smash ? 400 : undefined;
    h.roll = true;
    const hits = combat.meleeOnce(a, h, this.rollKey);
    if (hits <= 0) return;
    player.setInvulnerable(R.guardMs);
    fx.hitStop(R.hitStopMs);
    fx.burst('spark', player.x + dir * BALL_R, player.y - BALL_R, 6);
    ctx.sfx(shellThunk, 0.9, 0.8);
    // Fast enough, he bowls on through; slower, he bounces off.
    this.v = smash ? this.v * 0.85 : -this.v * R.bounceOffKeep;
    ctx.notify('rollHit');
  }

  onLand(ctx: AbilityContext, impact: number): void {
    if (!this.curled) return;
    const { player, fx, combat } = ctx;
    const fall = impact * PLAYER.maxFallSpeed;
    if (this.dropping) {
      this.dropping = false;
      // SHELL DROP: everything round him takes it, and it springs him back up.
      const h = this.hit;
      h.damage = dropDamage(fall, D.speed);
      h.kind = 'smash';
      h.x = player.x;
      h.y = player.y - 24;
      h.knockback = D.knockback;
      h.heavy = true;
      h.stunMs = D.stunMs;
      h.roll = true;
      combat.blast(player.x, player.y - 6, D.radius, h, false);
      fx.shake(FX.shakeMedium, 180);
      fx.hitStop(D.hitStopMs);
      fx.crack(player.x, player.y, 0.6);
      fx.burst('debris', player.x, player.y, 10);
      fx.burst('dust', player.x, player.y, 8);
      ctx.sfx(shellCrash, 1);
      this.landedAt = ctx.now;
      this.landFall = fall;
      const perfect = ctx.now - this.jumpAt < R.perfectWindowMs;
      if (perfect) this.perfectBounce(ctx);
      else this.bounceUp(ctx, -D.bounce, 0.8);
      ctx.notify('shellDropLand');
      return;
    }
    this.landedAt = ctx.now;
    this.landFall = fall;
    // Jump pressed just before he touched down from a real drop: the perfect bounce.
    if (ctx.now - this.jumpAt < R.perfectWindowMs && fall >= R.perfectMinFall) {
      this.landedAt = -Infinity;
      this.perfectBounce(ctx);
      return;
    }
    const b = landingBounce(fall, false, this.chain);
    this.chain = 0;
    if (b.vy < 0) {
      this.bounceUp(ctx, b.vy, 0.9);
    } else {
      player.squash(1.18, 0.84);
      fx.burst('dust', player.x, player.y, 3);
    }
  }

  onSwapIn(ctx: AbilityContext): void {
    const { player, combat, fx } = ctx;
    this.curl(ctx, player.facing * S.speed);
    const h = this.hit;
    h.damage = S.damage;
    h.kind = 'smash';
    h.x = player.x - player.facing * 12;
    h.y = player.centerY;
    h.knockback = S.knockback;
    h.heavy = true;
    h.stunMs = S.stunMs;
    h.roll = true;
    combat.blast(player.x + player.facing * 14, player.y - BALL_R, S.radius, h, true);
    fx.burst('spark', player.x, player.y - BALL_R, 12);
    fx.popText(player.x, player.y - 40, 'STRIKE!', C.seam);
    fx.shake(FX.shakeLight, 120);
    ctx.sfx(bowlingRush, 1);
  }

  onExit(ctx: AbilityContext): void {
    this.curled = false;
    this.dropping = false;
    ctx.player.setAnimRate(1);
  }

  locksMovement(): boolean {
    return this.curled;
  }

  speedMultiplier(): number {
    return this.bashAnimLeft > 0 ? 0.55 : 1;
  }

  gravityScale(): number | null {
    // A ball's bounces are the same every time (no floaty jump curve).
    return this.curled ? R.gravity : null;
  }

  maxFallSpeed(): number | null {
    return this.dropping ? D.speed : null;
  }

  animOverride(): string | null {
    if (this.curled) return 'roll';
    if (this.bashAnimLeft > 0) return this.slam ? 'slam' : this.bashes % 2 ? 'bashA' : 'bashB';
    return null;
  }
}
