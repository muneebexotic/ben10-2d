import { UPGRADE } from '../../config/aliens/upgrade';
import { COMBAT } from '../../config/combat';
import { FX } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { PLAYER } from '../../config/player';
import type { Rect } from '../../entities/types';
import type { Controls } from '../../systems/InputMap';
import { chance } from '../../systems/Pacing';
import type { AbilityContext, FormAbilities, MachineHandle } from '../types';
import { UPGRADE_COLORS as C } from './art';
import { empSplash, laserTriple, laserZap, mergeIn, mergeMachine, mergeOut } from './audio';

const L = UPGRADE.laser;
const M = UPGRADE.merge;
const E = UPGRADE.emp;
const HALF_H = PLAYER.body.height / 2;

/**
 * Upgrade: J fires his eye laser (an instant beam; hold to keep firing), K
 * melts him into a puddle that slides along the floor. The puddle merges
 * with the first machine it reaches (a turret, a cabinet, a shutter, a lift,
 * a cart) and drives it; into a robot it's a takeover: the robot shakes with
 * circuitry and blows up. Inside anything he's untouchable, and K ejects.
 */
export class UpgradeAbilities implements FormAbilities {
  private now = 0;
  // Eye laser.
  private nextShotAt = 0;
  private lastShotAt = -Infinity;
  private shots = 0;
  private laserAnim: 'laser' | 'laserUp' | 'laserDown' = 'laser';
  private laserAnimLeft = 0;
  // Merge glide.
  private gliding = false;
  private glideT = 0;
  private glideDir: 1 | -1 = 1;
  private glideKey: object = {};
  private mergeReadyAt = 0;
  // Inside a machine, or riding a robot until it blows.
  private machine: MachineHandle | null = null;
  private mergedT = 0;
  private takeover: { x: number; y: number; t: number } | null = null;
  private readonly area: Rect = { x: 0, y: 0, w: 0, h: 0 };

  update(ctx: AbilityContext, dt: number): void {
    this.now = ctx.now;
    this.laserAnimLeft = Math.max(0, this.laserAnimLeft - dt);
    const { player, fx } = ctx;
    fx.frameLight(player.x, player.centerY, UPGRADE.light.radius, UPGRADE.light.color, UPGRADE.light.intensity);
    if (this.machine) {
      this.updateMachine(ctx, dt);
      return;
    }
    if (this.takeover) {
      this.updateTakeover(ctx, dt);
      return;
    }
    if (this.gliding) {
      this.updateGlide(ctx, dt);
      return;
    }
    this.tryMerge(ctx);
    if (!this.gliding) this.updateLaser(ctx);
  }

  // ------------------------------------------------------------ Eye laser

  private updateLaser(ctx: AbilityContext): void {
    const { controls } = ctx;
    if (!ctx.inputEnabled || !(controls.attackHeld || controls.attackPressed) || ctx.now < this.nextShotAt) return;
    this.fire(ctx);
  }

  private fire(ctx: AbilityContext): void {
    const { player, controls, fx } = ctx;
    this.shots++;
    const triple = this.shots % L.tripleEvery === 0;
    const up = controls.up;
    const down = controls.down && !player.grounded && !up;
    const angle = player.facing > 0 ? (up ? -L.diagonal : down ? L.diagonal : 0) : Math.PI + (up ? L.diagonal : down ? -L.diagonal : 0);
    // The eye sits high on the front of the head.
    const ex = player.x + player.facing * 5;
    const ey = player.y - 28 + (up ? -2 : down ? 2 : 0);
    const key = {};
    let hits = 0;
    const offsets = triple ? [-L.tripleSpread, 0, L.tripleSpread] : [0];
    for (const off of offsets) {
      const ox = ex - Math.sin(angle) * off;
      const oy = ey + Math.cos(angle) * off;
      hits += this.beam(ctx, ox, oy, angle, triple ? L.tripleDamage : L.damage, key, triple ? 2 : 1.5);
    }
    this.lastShotAt = ctx.now;
    this.nextShotAt = ctx.now + L.intervalMs;
    this.laserAnim = up ? 'laserUp' : down ? 'laserDown' : 'laser';
    this.laserAnimLeft = 120;
    fx.flash(ex, ey, C.line, triple ? 16 : 10, 120);
    ctx.sfx(triple ? laserTriple : laserZap, triple ? 0.9 : 0.7, 0.95 + Math.random() * 0.1);
    if (hits > 0) {
      fx.hitStop(L.hitStopMs);
      if (triple) fx.shake(FX.shakeLight, 90);
    }
    ctx.notify(triple ? 'laserTriple' : 'laser');
  }

  /** One beam: marches out until it meets a wall, hitting everything along the way once. Returns targets hit. */
  private beam(ctx: AbilityContext, x0: number, y0: number, angle: number, damage: number, key: object, width: number): number {
    const { world, combat, fx } = ctx;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let len = 0;
    while (len < L.range && !world.isSolid(x0 + cos * (len + 4), y0 + sin * (len + 4))) len += 4;
    let hits = 0;
    const a = this.area;
    for (let d = 0; d < len; d += L.step) {
      a.w = L.step;
      a.h = L.step;
      a.x = x0 + cos * (d + L.step / 2) - L.step / 2;
      a.y = y0 + sin * (d + L.step / 2) - L.step / 2;
      hits += combat.meleeOnce(a, { damage, kind: 'tech', x: x0, y: y0, knockback: L.knockback }, key);
    }
    combat.forget(key);
    const x1 = x0 + cos * len;
    const y1 = y0 + sin * len;
    fx.beam(x0, y0, x1, y1, C.line, width, L.beamMs);
    fx.burst(hits > 0 ? 'spark' : 'circuit', x1, y1, hits > 0 ? 5 : 2);
    return hits;
  }

  // ------------------------------------------------------------ Merge glide

  private tryMerge(ctx: AbilityContext): void {
    const { controls, player, fx } = ctx;
    if (!ctx.inputEnabled || !controls.specialPressed || ctx.now < this.mergeReadyAt) return;
    this.gliding = true;
    this.glideT = 0;
    this.glideKey = {};
    this.glideDir = controls.left && !controls.right ? -1 : controls.right && !controls.left ? 1 : player.facing;
    this.mergeReadyAt = ctx.now + M.cooldownMs;
    player.setFacing(this.glideDir);
    player.setVelocity(this.glideDir * M.speed, 0);
    player.squash(1.5, 0.5);
    fx.burst('circuit', player.x, player.y - 4, 10);
    ctx.sfx(mergeIn, 0.9, 1);
    ctx.notify('merge');
  }

  private updateGlide(ctx: AbilityContext, dt: number): void {
    const { player, world, combat, fx } = ctx;
    this.glideT += dt;
    player.setVelocity(this.glideDir * M.speed, 0);
    if (chance(0.7)) fx.trail('circuit', player.x - this.glideDir * 8, player.y - 2);
    const a = this.area;
    a.w = M.area.width;
    a.h = M.area.height;
    a.x = player.x - a.w / 2 + this.glideDir * 6;
    a.y = player.y - a.h;
    const machine = world.merge(a, this.glideDir);
    if (machine) {
      this.enterMachine(ctx, machine);
      return;
    }
    const robot = combat.hack(a, { damage: 0, kind: 'tech', x: player.x, y: player.centerY, knockback: 0 });
    if (robot) {
      this.startTakeover(ctx, robot);
      return;
    }
    combat.meleeOnce(a, { damage: M.glideDamage, kind: 'tech', x: player.x, y: player.centerY, knockback: M.glideKnockback }, this.glideKey);
    const wall = world.isSolid(player.x + this.glideDir * 8, player.y - 4);
    if (wall || this.glideT >= M.durationMs) this.endGlide(ctx);
  }

  private endGlide(ctx: AbilityContext): void {
    this.gliding = false;
    ctx.combat.forget(this.glideKey);
    ctx.player.setVelocityX(ctx.player.vx * 0.3);
    ctx.player.squash(0.7, 1.35);
    ctx.fx.burst('circuit', ctx.player.x, ctx.player.y - 6, 8);
    ctx.sfx(mergeOut, 0.7, 1.1);
  }

  // ------------------------------------------------------------ Inside a machine

  private enterMachine(ctx: AbilityContext, machine: MachineHandle): void {
    const { player, fx } = ctx;
    this.gliding = false;
    ctx.combat.forget(this.glideKey);
    this.machine = machine;
    this.mergedT = 0;
    player.setHidden(true);
    player.ride(machine.anchorX, machine.anchorY);
    fx.burst('circuit', machine.anchorX, machine.anchorY - 12, 18);
    fx.flash(machine.anchorX, machine.anchorY - 12, C.line, 26, 260);
    ctx.sfx(mergeMachine, 1);
    ctx.notify('mergeMachine');
    ctx.notify(`merge-${machine.kind}`);
  }

  private updateMachine(ctx: AbilityContext, dt: number): void {
    const m = this.machine!;
    this.mergedT += dt;
    ctx.player.ride(m.anchorX, m.anchorY);
    if (!m.holding) {
      this.leaveMachine(ctx);
      return;
    }
    if (ctx.inputEnabled && ctx.controls.specialPressed && this.mergedT >= M.ejectAfterMs) {
      m.release();
      this.leaveMachine(ctx);
      return;
    }
    m.control(ctx.inputEnabled ? ctx.controls : IDLE, dt);
  }

  /** Pops out on top of (or in front of) the machine. */
  private leaveMachine(ctx: AbilityContext): void {
    const m = this.machine!;
    const { player, fx } = ctx;
    this.machine = null;
    player.setHidden(false);
    player.ride(m.anchorX, m.anchorY);
    player.setVelocityX(player.facing * M.popVx);
    player.launch(-M.popVy, false);
    player.squash(0.7, 1.4);
    fx.burst('circuit', m.anchorX, m.anchorY - 8, 14);
    ctx.sfx(mergeOut, 0.9);
    ctx.notify('eject');
  }

  // ------------------------------------------------------------ Takeover

  private startTakeover(ctx: AbilityContext, at: { x: number; y: number }): void {
    this.gliding = false;
    ctx.combat.forget(this.glideKey);
    this.takeover = { x: at.x, y: at.y, t: 0 };
    ctx.player.setHidden(true);
    ctx.player.ride(at.x, at.y + HALF_H);
    ctx.sfx(mergeMachine, 1, 1.2);
    ctx.notify('takeover');
  }

  private updateTakeover(ctx: AbilityContext, dt: number): void {
    const t = this.takeover!;
    t.t += dt;
    ctx.player.ride(t.x, t.y + HALF_H);
    // He bursts out as the robot blows (both run on the same clock).
    if (t.t < COMBAT.hack.overloadMs) return;
    this.takeover = null;
    const { player, fx } = ctx;
    player.setHidden(false);
    player.launch(-M.popVy * 1.15, false);
    player.squash(0.6, 1.5);
    fx.burst('circuit', player.x, player.centerY, 20);
    ctx.sfx(mergeOut, 1, 0.9);
  }

  // ------------------------------------------------------------ Hooks

  onEnter(ctx: AbilityContext): void {
    this.now = ctx.now;
  }

  /** Swap-in: a splash of nanites shorts out every machine nearby. */
  onSwapIn(ctx: AbilityContext): void {
    const { player, fx, combat } = ctx;
    const hits = combat.blast(player.x, player.centerY, E.radius, { damage: E.damage, kind: 'tech', x: player.x, y: player.centerY, knockback: E.knockback, stunMs: E.stunMs }, false);
    fx.ring(player.x, player.centerY, C.line, E.radius, 360);
    fx.ring(player.x, player.centerY, PALETTE.white, E.radius * 0.6, 260);
    fx.burst('circuit', player.x, player.centerY, 28);
    fx.shake(FX.shakeMedium, 200);
    ctx.sfx(empSplash);
    ctx.notify(hits > 0 ? 'swapStrike' : 'swap');
  }

  onExit(ctx: AbilityContext): void {
    if (this.gliding) ctx.combat.forget(this.glideKey);
    this.gliding = false;
    this.machine?.release();
    this.machine = null;
    this.takeover = null;
    ctx.player.setHidden(false);
  }

  dispose(): void {
    this.machine?.release();
    this.machine = null;
  }

  onLand(ctx: AbilityContext, impact: number): void {
    if (impact > 0.6) ctx.fx.burst('circuit', ctx.player.x, ctx.player.y, 6);
  }

  onDodge(ctx: AbilityContext): void {
    // Shots pass through liquid metal.
    if (this.machine || this.gliding) ctx.fx.burst('circuit', ctx.player.x, ctx.player.centerY, 3);
  }

  isInvulnerable(): boolean {
    return this.gliding || this.machine !== null || this.takeover !== null;
  }

  locksMovement(): boolean {
    return this.gliding || this.machine !== null || this.takeover !== null;
  }

  gravityScale(): number | null {
    return this.gliding || this.machine !== null || this.takeover !== null ? 0 : null;
  }

  speedMultiplier(): number {
    return this.now - this.lastShotAt < 140 ? L.moveMultiplier : 1;
  }

  animOverride(): string | null {
    if (this.gliding) return 'merge';
    if (this.laserAnimLeft > 0) return this.laserAnim;
    return null;
  }
}

/** Controls a machine sees while input is off (a cutscene). Abilities stay free of Phaser, so this is spelled out. */
const IDLE: Controls = {
  left: false,
  right: false,
  up: false,
  down: false,
  jumpPressed: false,
  jumpHeld: false,
  attackPressed: false,
  attackHeld: false,
  specialPressed: false,
  specialHeld: false,
  specialReleased: false,
  dialPrev: false,
  dialNext: false,
  dialPick: null,
  transform: false,
  transformLeadMs: 0,
  pause: false,
  confirm: false,
  anyPressed: false,
};
