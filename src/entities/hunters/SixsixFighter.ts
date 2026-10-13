import Phaser from 'phaser';
import { DEPTH } from '../../config/constants';
import { SIXSIX } from '../../config/hunters';
import { PALETTE } from '../../config/palette';
import { TELL } from '../../config/tells';
import { blinkOn } from '../../systems/Accessibility';
import { pace } from '../../systems/Difficulty';
import { chance, damp } from '../../systems/Pacing';
import { playSfx } from '../../systems/audio/Sfx';
import { jetpack, sixsixClicks, sixsixLaugh } from '../../systems/audio/bountySfx';
import type { Damageable, Hazard, Hit, HitResult, Rect } from '../types';
import { HunterLook } from './HunterLook';
import type { HunterWorld } from './HunterWorld';

type Mode = 'off' | 'duel' | 'boss' | 'leaving' | 'fallen';
type State = 'drop' | 'idle' | 'walk' | 'windup' | 'slash' | 'hop' | 'aim' | 'fire' | 'rest' | 'hover' | 'sputter' | 'gone';

const rand = (r: readonly [number, number]) => r[0] + Math.random() * (r[1] - r[0]);

/**
 * Sixsix: armour, a jetpack, wrist blades and shoulder cannons; he only
 * speaks in clicks. On Main Street he drops in for short duels (a blade
 * combo after a zone tell, a three-bolt cannon after an aim line, jetpack
 * hops), then blasts off. In THE HUNTERS he hovers up the lift shaft above
 * Ben, painting his ledge for salvos; reflected missiles wreck his jetpack.
 */
export class SixsixFighter implements Damageable, Hazard {
  readonly look: HunterLook;
  readonly countsAsEnemy = true;
  readonly stopsThrows = true;
  mode: Mode = 'off';
  hp: number = SIXSIX.duelHp;
  maxHp: number = SIXSIX.duelHp;
  lastDamage = 0;
  private state: State = 'gone';
  private t = 0;
  private vx = 0;
  private vy = 0;
  private combo = 0;
  private nextAt = 0;
  private shots = 0;
  private attacks = 0;
  private aim = 0;
  private duelLeft = 0;
  private damageSinceSputter = 0;
  /** The shaft or arena he keeps to (boss), and the floor he duels on. */
  bounds = { left: 0, right: 0, top: 0, bottom: 0 };
  /** Called once when a duel ends (he flew off) or when he's beaten in the boss fight. */
  onDone: (() => void) | null = null;
  /** Boss: his health changed (the bar). */
  onHealth: (() => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    private readonly w: HunterWorld,
  ) {
    this.look = new HunterLook(scene, 'sixsix', DEPTH.boss);
    this.look.setVisible(false);
  }

  get x(): number {
    return this.look.x;
  }

  get y(): number {
    return this.look.feetY;
  }

  get alive(): boolean {
    return this.mode === 'duel' || this.mode === 'boss';
  }

  get busy(): boolean {
    return this.mode !== 'off';
  }

  /** Drops out of the sky for a duel at x, landing on floorY. */
  startDuel(x: number, floorY: number): void {
    this.mode = 'duel';
    this.hp = this.maxHp = SIXSIX.duelHp;
    this.duelLeft = SIXSIX.duelMs;
    this.look.place(x, floorY - 260);
    this.look.setVisible(true);
    this.bounds = { left: x - 200, right: x + 200, top: floorY - 300, bottom: floorY };
    this.set('drop');
    this.look.play('fly');
    playSfx(jetpack, 0.8);
    this.w.say?.('sixsix', '(SIXSIX SAYS SOMETHING RUDE)', 1800);
    playSfx(sixsixClicks, 0.9);
  }

  /** Boss phase 2: he hovers in the shaft (`bounds`, px) above Ben. */
  startBoss(x: number, y: number, bounds: { left: number; right: number; top: number; bottom: number }): void {
    this.mode = 'boss';
    this.hp = this.maxHp = SIXSIX.boss.hp;
    this.bounds = bounds;
    this.look.place(x, y);
    this.look.setVisible(true);
    this.look.play('fly');
    this.damageSinceSputter = 0;
    this.set('hover');
    this.nextAt = this.w.now + 1400;
  }

  /** Off he goes, straight up and out (a duel's end). */
  leave(): void {
    if (this.mode === 'leaving' || this.mode === 'off') return;
    this.mode = 'leaving';
    this.w.cancelThreat(this);
    this.look.play('fly');
    this.vx = this.look.facing * -60;
    this.vy = -420;
    playSfx(jetpack, 0.9, 1.1);
    playSfx(sixsixLaugh, 0.8);
    this.w.fx.burst('smoke', this.x, this.y, 12);
    this.set('gone');
  }

  hide(): void {
    this.mode = 'off';
    this.look.setVisible(false);
  }

  private set(s: State): void {
    this.state = s;
    this.t = 0;
  }

  // ------------------------------------------------------------ Combat interfaces

  hurtbox(out: Rect): boolean {
    if (!this.alive || this.state === 'drop') return false;
    out.x = this.x - SIXSIX.body.width / 2;
    out.y = this.y - SIXSIX.body.height;
    out.w = SIXSIX.body.width;
    out.h = SIXSIX.body.height;
    return true;
  }

  get active(): boolean {
    return this.alive && this.state !== 'drop' && this.state !== 'sputter';
  }

  get damage(): number {
    return this.state === 'slash' ? SIXSIX.slash.damage : SIXSIX.contactDamage;
  }

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    if (this.state === 'slash') {
      // The blade's reach ahead of him.
      out.x = this.look.facing > 0 ? this.x - 6 : this.x - SIXSIX.slash.reach;
      out.y = this.y - 34;
      out.w = SIXSIX.slash.reach + 6;
      out.h = 30;
      return true;
    }
    out.x = this.x - 8;
    out.y = this.y - 36;
    out.w = 16;
    out.h = 34;
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive || this.state === 'drop') return 'none';
    let dmg = hit.damage;
    // A missile turned around by Diamondhead's shield wrecks the jetpack.
    if (this.mode === 'boss' && hit.kind === 'reflect') dmg *= SIXSIX.boss.reflectedMultiplier;
    this.lastDamage = dmg;
    this.hp -= dmg;
    this.look.flash();
    this.w.fx.burst('spark', hit.x, hit.y, 5);
    playSfx('droneHit', 0.7, 0.8);
    this.onHealth?.();
    if (this.mode === 'duel' && this.hp <= 0) {
      // Beaten in a duel: he doesn't fall, he bails.
      this.w.fx.popText(this.x, this.y - 50, 'BAILED!', PALETTE.sixsix);
      this.finishDuel();
      return 'hit';
    }
    if (this.mode === 'boss') {
      this.damageSinceSputter += dmg;
      if (this.hp <= 0) {
        this.hp = 0;
        this.mode = 'fallen';
        this.w.cancelThreat(this);
        this.onDone?.();
        return 'killed';
      }
      if (this.damageSinceSputter >= SIXSIX.boss.sputterEvery && this.state !== 'sputter') this.sputter();
    }
    return 'hit';
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number): void {
    if (this.mode === 'off') return;
    this.t += dtMs;
    const dt = dtMs / 1000;
    if (this.mode === 'leaving') {
      this.vy -= 300 * dt;
      this.look.x += this.vx * dt;
      this.look.feetY += this.vy * dt;
      this.trail();
      if (this.y < this.w.player.y - 600) this.hide();
    } else if (this.mode === 'duel') {
      this.updateDuel(dtMs, dt);
    } else if (this.mode === 'boss') {
      this.updateBoss(dt);
    }
    this.look.render(dtMs);
    if (this.look.visible) this.w.lighting.add(this.x + this.look.facing * 6, this.y - 30, 26, PALETTE.sixsix, 0.6);
  }

  private trail(): void {
    if (chance(0.9)) this.w.fx.trail('fire', this.x - this.look.facing * 8, this.y - 10);
    if (chance(0.4)) this.w.fx.trail('smoke', this.x - this.look.facing * 8, this.y - 6);
  }

  private finishDuel(): void {
    const done = this.onDone;
    this.onDone = null;
    this.leave();
    done?.();
  }

  private updateDuel(dtMs: number, dt: number): void {
    const w = this.w;
    const p = w.player;
    const floor = this.bounds.bottom;
    this.duelLeft -= dtMs;
    if (this.state !== 'drop' && this.duelLeft <= 0 && (this.state === 'idle' || this.state === 'walk' || this.state === 'rest')) {
      this.finishDuel();
      return;
    }
    switch (this.state) {
      case 'drop': {
        this.look.feetY += 420 * dt;
        this.trail();
        if (this.look.feetY >= floor) {
          this.look.feetY = floor;
          this.look.play('land');
          w.fx.burst('dust', this.x, floor, 16);
          w.fx.ring(this.x, floor - 4, PALETTE.sixsix, 40, 300);
          w.fx.shake(0.008, 200);
          playSfx('land', 1, 0.7);
          this.set('rest');
          this.nextAt = w.now + 700;
        }
        return;
      }
      case 'idle':
      case 'walk': {
        this.look.face(p.x - this.x);
        const dx = p.x - this.x;
        if (w.now >= this.nextAt && !p.dead && !p.cloaked) {
          if (Math.abs(dx) < 90) this.startCombo();
          else this.startCannon();
          return;
        }
        // Circle at a striking distance.
        const want = Math.abs(dx) > 70 ? Math.sign(dx) * SIXSIX.walkSpeed : 0;
        this.vx = want;
        this.stepGround(dt);
        return;
      }
      case 'windup': {
        const ms = this.combo === 0 ? SIXSIX.slash.windupMs : SIXSIX.slash.chainWindupMs;
        const k = this.t / ms;
        const dir = this.look.facing;
        const reach = SIXSIX.slash.reach + SIXSIX.slash.dashSpeed * (SIXSIX.slash.dashMs / 1000);
        w.telegraph.zone(dir > 0 ? this.x : this.x - reach, floor - 34, reach, 34, TELL.sixsix, 0.35 + k * 0.55 + (blinkOn(this.t, 70) ? 0.08 : 0), this.t * 0.05, dir);
        if (this.t >= ms) {
          this.set('slash');
          this.look.play('slash');
          this.vx = dir * SIXSIX.slash.dashSpeed;
          playSfx('swing', 1, 1.3);
          w.fx.speedLine(this.x, floor - 20, dir, PALETTE.sixsix);
        }
        return;
      }
      case 'slash': {
        this.stepGround(dt);
        if (this.t >= SIXSIX.slash.dashMs) {
          this.vx = 0;
          this.combo++;
          const total = this.combo >= SIXSIX.slash.combo[0] && (this.combo >= SIXSIX.slash.combo[1] || chance(0.5));
          if (total) {
            this.set('hop');
            this.look.play('fly');
            this.vx = -this.look.facing * SIXSIX.hop.vx;
            this.vy = SIXSIX.hop.vy;
            playSfx(jetpack, 0.5, 1.2);
          } else {
            this.look.face(p.x - this.x);
            this.set('windup');
            this.look.play('windup');
            w.threat(this, w.now + SIXSIX.slash.chainWindupMs);
          }
        }
        return;
      }
      case 'hop': {
        this.vy += 900 * dt;
        this.look.x += this.vx * dt;
        this.look.feetY = Math.min(floor, this.look.feetY + this.vy * dt);
        this.clampX();
        this.trail();
        if (this.t >= SIXSIX.hop.ms && this.look.feetY >= floor) {
          this.look.play('land');
          this.rest();
        }
        return;
      }
      case 'aim': {
        const k = this.t / SIXSIX.cannon.windupMs;
        if (this.t < SIXSIX.cannon.windupMs - 200) this.aim = Math.atan2(p.centerY - (this.y - 30), p.x - this.x);
        this.look.face(Math.cos(this.aim));
        w.telegraph.dashed(this.x, this.y - 30, this.x + Math.cos(this.aim) * 300, this.y - 30 + Math.sin(this.aim) * 300, TELL.sixsix, 0.3 + k * 0.6, this.t * 0.06, k > 0.7 ? 2 : 1);
        w.lighting.add(this.x + this.look.facing * 10, this.y - 30, 14 + k * 20, PALETTE.sixsix, 1);
        if (this.t >= SIXSIX.cannon.windupMs) {
          this.set('fire');
          this.shots = 0;
        }
        return;
      }
      case 'fire': {
        const C = SIXSIX.cannon;
        if (this.shots < C.bolts && this.t >= this.shots * C.gapMs) {
          this.shots++;
          const ox = this.x + this.look.facing * 12;
          const oy = this.y - 30;
          w.projectiles.spawn('laser', 'enemy', ox, oy, Math.cos(this.aim) * C.speed, Math.sin(this.aim) * C.speed, C.damage, 2400, 4, { tint: PALETTE.sixsix });
          w.fx.flash(ox, oy, PALETTE.sixsix, 10, 90);
          playSfx('laser', 0.7, 1.2);
        }
        if (this.shots >= C.bolts && this.t >= C.bolts * C.gapMs + 250) this.rest();
        return;
      }
      case 'rest':
        this.vx = damp(this.vx, 0.8);
        this.stepGround(dt);
        if (this.t >= 400) {
          this.look.play('idle');
          this.set('idle');
        }
        return;
      default:
        return;
    }
  }

  private startCombo(): void {
    this.combo = 0;
    this.look.face(this.w.player.x - this.x);
    this.look.play('windup');
    this.set('windup');
    this.w.threat(this, this.w.now + SIXSIX.slash.windupMs);
    playSfx('swing', 0.5, 0.8);
  }

  private startCannon(): void {
    this.look.play('cannon');
    this.set('aim');
    this.w.threat(this, this.w.now + SIXSIX.cannon.windupMs);
    playSfx('laserCharge', 0.6, 1.2);
  }

  private rest(): void {
    this.set('rest');
    this.nextAt = this.w.now + pace.rest(rand(SIXSIX.restMs));
  }

  private stepGround(dt: number): void {
    const nx = this.look.x + this.vx * dt;
    if (!this.w.isSolid(nx + Math.sign(this.vx) * 10, this.y - 10)) this.look.x = nx;
    this.clampX();
  }

  private clampX(): void {
    this.look.x = Phaser.Math.Clamp(this.look.x, this.bounds.left + 10, this.bounds.right - 10);
  }

  // ------------------------------------------------------------ Boss: up the shaft

  private updateBoss(dt: number): void {
    const w = this.w;
    const p = w.player;
    const B = SIXSIX.boss;
    if (this.state === 'sputter') {
      // The jetpack coughs: he sinks toward Ben, open.
      this.vy = Math.min(140, this.vy + 260 * dt);
      this.look.feetY = Math.min(this.bounds.bottom - 20, this.look.feetY + this.vy * dt);
      if (chance(0.5)) w.fx.trail('smoke', this.x, this.y - 8);
      if (chance(0.1)) w.fx.burst('spark', this.x - this.look.facing * 8, this.y - 14, 2);
      this.look.play('hurt');
      if (this.t >= B.sputterMs) {
        this.look.play('fly');
        this.set('hover');
        this.nextAt = w.now + 800;
        playSfx(jetpack, 0.8, 1.2);
      }
      return;
    }
    // Hover above Ben, inside the shaft, bobbing; drift side to side.
    const tx = Phaser.Math.Clamp(p.x + Math.sin(w.now * 0.0012) * 40, this.bounds.left + 12, this.bounds.right - 12);
    const ty = Phaser.Math.Clamp(p.y - B.hoverAbove + Math.sin(w.now * 0.003) * 8, this.bounds.top + 50, this.bounds.bottom - 60);
    this.vx = Phaser.Math.Clamp((tx - this.x) * 2, -B.moveSpeed, B.moveSpeed);
    this.vy = Phaser.Math.Clamp((ty - this.y) * 2, -B.moveSpeed, B.moveSpeed);
    this.look.x += this.vx * dt;
    this.look.feetY += this.vy * dt;
    this.look.face(p.x - this.x);
    this.trail();
    if (this.state === 'aim' || this.state === 'fire') {
      // The cannon burst, same as the duel's.
      this.updateCannonInAir();
      return;
    }
    if (w.now >= this.nextAt && !p.dead && !p.cloaked) {
      this.attacks++;
      if (this.attacks % 3 === 0) {
        this.set('aim');
        this.look.play('cannon');
        w.threat(this, w.now + SIXSIX.cannon.windupMs);
        playSfx('laserCharge', 0.6, 1.2);
      } else {
        w.salvo(p.x, w.groundBelow(p.x, p.y - 4), B.salvo.missiles, B.salvo.spreadPx, B.salvo.warnMs);
        playSfx(sixsixClicks, 0.6);
      }
      this.nextAt = w.now + pace.rest(rand(B.salvoEveryMs));
    }
  }

  private updateCannonInAir(): void {
    const w = this.w;
    const p = w.player;
    if (this.state === 'aim') {
      const k = this.t / SIXSIX.cannon.windupMs;
      if (this.t < SIXSIX.cannon.windupMs - 200) this.aim = Math.atan2(p.centerY - (this.y - 30), p.x - this.x);
      w.telegraph.dashed(this.x, this.y - 30, this.x + Math.cos(this.aim) * 360, this.y - 30 + Math.sin(this.aim) * 360, TELL.sixsix, 0.3 + k * 0.6, this.t * 0.06, k > 0.7 ? 2 : 1);
      if (this.t >= SIXSIX.cannon.windupMs) {
        this.set('fire');
        this.shots = 0;
      }
      return;
    }
    const C = SIXSIX.cannon;
    if (this.shots < C.bolts && this.t >= this.shots * C.gapMs) {
      this.shots++;
      const ox = this.x;
      const oy = this.y - 30;
      w.projectiles.spawn('laser', 'enemy', ox, oy, Math.cos(this.aim) * C.speed, Math.sin(this.aim) * C.speed, C.damage, 2600, 4, { tint: PALETTE.sixsix });
      playSfx('laser', 0.7, 1.2);
    }
    if (this.shots >= C.bolts && this.t >= C.bolts * C.gapMs + 250) {
      this.look.play('fly');
      this.set('hover');
      this.shots = 0;
    }
  }

  private sputter(): void {
    this.damageSinceSputter = 0;
    this.set('sputter');
    this.vy = 0;
    this.w.cancelThreat(this);
    this.w.fx.popText(this.x, this.y - 50, 'SPUTTER!', PALETTE.sixsix);
    playSfx('droneDown', 0.8, 1.2);
  }

  destroy(): void {
    this.look.destroy();
  }
}
