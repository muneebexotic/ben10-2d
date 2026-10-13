import Phaser from 'phaser';
import { DEPTH } from '../../config/constants';
import { KRAAB } from '../../config/hunters';
import { PALETTE } from '../../config/palette';
import { TELL } from '../../config/tells';
import { blinkOn } from '../../systems/Accessibility';
import { pace } from '../../systems/Difficulty';
import { chance, damp } from '../../systems/Pacing';
import { playSfx } from '../../systems/audio/Sfx';
import { burrow, clawCharge, clawFire, erupt, pinch } from '../../systems/audio/bountySfx';
import type { Projectile } from '../Projectiles';
import type { Damageable, Hazard, Hit, HitResult, Rect } from '../types';
import { HunterLook } from './HunterLook';
import { kraabShelled } from './huntRules';
import type { HunterWorld } from './HunterWorld';

type Mode = 'off' | 'hunt' | 'boss' | 'buried';
type State = 'hidden' | 'sink' | 'tunnel' | 'hold' | 'erupt' | 'dizzy' | 'idle' | 'walk' | 'pinchWind' | 'pinch' | 'charge' | 'fire' | 'rest' | 'leave';

const rand = (r: readonly [number, number]) => r[0] + Math.random() * (r[1] - r[0]);

/**
 * Kraab: crab armour, a claw cannon, a big mouth. He burrows: a crack line
 * races along the floor at Ben, stops under him and pulses (the tell), then
 * he erupts claw-first and reels for a moment. His claw cannon charges with
 * a long glow and an aim line; Diamondhead's shield sends the blast back for
 * a huge hit. Up close he snaps his claw. His front shell only gives to a
 * smash: hit his back, his open claw, or hit him hard.
 */
export class KraabFighter implements Damageable, Hazard {
  readonly look: HunterLook;
  readonly countsAsEnemy = true;
  readonly stopsThrows = true;
  mode: Mode = 'off';
  hp: number = KRAAB.boss.hp;
  maxHp: number = KRAAB.boss.hp;
  lastDamage = 0;
  private state: State = 'hidden';
  private t = 0;
  private vx = 0;
  private nextAt = 0;
  private fromX = 0;
  private aim = 0;
  private blast: Projectile | null = null;
  private blastLast = { x: 0, y: 0 };
  /** Damage taken this ambush (in the tunnels he bails out instead of falling). */
  private taken = 0;
  /** The floor he's on and how far he may roam. */
  bounds = { left: 0, right: 0, floor: 0 };
  /** Hunt: the ambush is over (he burrowed away). Boss: his health ran out. */
  onDone: (() => void) | null = null;
  onHealth: (() => void) | null = null;
  /** A reflected claw blast landed on him (REFLECTED!). */
  onReflected: (() => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    private readonly w: HunterWorld,
  ) {
    this.look = new HunterLook(scene, 'kraab', DEPTH.boss);
    this.look.setVisible(false);
  }

  get x(): number {
    return this.look.x;
  }

  get y(): number {
    return this.look.feetY;
  }

  get alive(): boolean {
    return (this.mode === 'hunt' || this.mode === 'boss') && this.above;
  }

  private get above(): boolean {
    return this.state !== 'hidden' && this.state !== 'tunnel' && this.state !== 'hold' && this.state !== 'sink';
  }

  get busy(): boolean {
    return this.mode === 'hunt' || this.mode === 'boss';
  }

  /** A tunnel ambush: a crack races from `fromX` at Ben, then he erupts (floor and bounds in px). */
  ambush(fromX: number, floor: number, left: number, right: number): void {
    this.mode = 'hunt';
    this.taken = 0;
    this.bounds = { left, right, floor };
    this.look.place(fromX, floor);
    this.look.setVisible(false);
    this.fromX = fromX;
    this.set('tunnel');
    playSfx(burrow, 0.8);
  }

  /** The boss fight: he's on the chamber floor. `entrance`: he bursts in through the wall at x. */
  startBoss(x: number, floor: number, left: number, right: number): void {
    this.mode = 'boss';
    this.hp = this.maxHp = KRAAB.boss.hp;
    this.bounds = { left, right, floor };
    this.look.place(x, floor);
    this.look.setVisible(true);
    this.look.play('idle');
    this.set('rest');
    this.nextAt = this.w.now + 900;
  }

  /** Just standing there, posed (a cameo in a story beat). */
  stand(x: number, floor: number, pose: string, facing: 1 | -1): void {
    this.mode = 'off';
    this.look.place(x, floor);
    this.look.face(facing);
    this.look.setVisible(true);
    this.look.play(pose);
  }

  /** The cave-in: buried up to his eyestalks, out of the fight. */
  bury(): void {
    this.mode = 'buried';
    this.w.cancelThreat(this);
    this.look.play('buried');
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
    if (!this.alive) return false;
    out.x = this.x - KRAAB.body.width / 2;
    out.y = this.y - KRAAB.body.height;
    out.w = KRAAB.body.width;
    out.h = KRAAB.body.height;
    return true;
  }

  get active(): boolean {
    return this.alive && this.state !== 'dizzy';
  }

  get damage(): number {
    if (this.state === 'erupt') return KRAAB.burrow.eruptDamage;
    if (this.state === 'pinch') return KRAAB.pinch.damage;
    return KRAAB.contactDamage;
  }

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    if (this.state === 'pinch') {
      out.x = this.look.facing > 0 ? this.x : this.x - KRAAB.pinch.reach;
      out.y = this.y - 30;
      out.w = KRAAB.pinch.reach;
      out.h = 26;
      return true;
    }
    if (this.state === 'erupt') {
      const r = KRAAB.burrow.eruptRadius;
      out.x = this.x - r;
      out.y = this.y - 44;
      out.w = r * 2;
      out.h = 44;
      return true;
    }
    out.x = this.x - 16;
    out.y = this.y - 34;
    out.w = 32;
    out.h = 32;
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    const open = this.state === 'charge' || this.state === 'dizzy';
    let dmg = hit.damage;
    if (hit.shot === 'claw' && hit.kind === 'reflect') {
      dmg = KRAAB.cannon.reflectDamage;
      this.w.fx.popText(this.x, this.y - 60, 'REFLECTED!', PALETTE.diamondhead, 2);
      this.w.fx.burst('crystal', this.x, this.y - 24, 20);
      this.onReflected?.();
      this.reel();
    } else if (kraabShelled(this.look.facing, this.x, open, hit)) {
      dmg *= KRAAB.shellMultiplier;
      this.w.fx.burst('spark', hit.x, hit.y, 4);
      playSfx('armorTink', 0.7, 0.8);
    }
    this.lastDamage = dmg;
    this.hp -= dmg;
    this.taken += dmg;
    this.look.flash();
    playSfx('droneHit', 0.7, 0.6);
    this.onHealth?.();
    if (this.mode === 'boss' && this.hp <= 0) {
      this.hp = 0;
      this.onDone?.();
      return 'killed';
    }
    if (this.mode === 'hunt' && this.taken >= 14 && this.state !== 'leave') this.leave();
    return 'hit';
  }

  private reel(): void {
    this.cancelAttack();
    this.set('dizzy');
    this.look.play('hurt');
  }

  private cancelAttack(): void {
    this.w.cancelThreat(this);
  }

  /** Back underground and away (the end of an ambush). */
  leave(): void {
    this.cancelAttack();
    this.set('leave');
    this.look.play('burrow');
    playSfx(burrow, 0.8, 0.8);
    this.w.fx.burst('dust', this.x, this.y, 14);
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number): void {
    if (this.mode === 'off' && !this.look.visible) return;
    this.t += dtMs;
    this.updateBlast();
    if (this.mode === 'hunt' || this.mode === 'boss') this.updateFight(dtMs);
    this.look.render(dtMs, this.state === 'charge' && blinkOn(this.t, 120) ? 0xffd0ec : null);
    if (this.look.visible && this.mode !== 'buried') this.w.lighting.add(this.x, this.y - 30, 30, PALETTE.kraab, this.state === 'charge' ? 1 : 0.4);
  }

  private updateFight(dtMs: number): void {
    const w = this.w;
    const p = w.player;
    const dt = dtMs / 1000;
    const floor = this.bounds.floor;
    switch (this.state) {
      case 'sink':
        // Down he goes; then the crack races out from where he went under.
        if (chance(0.6)) w.fx.burst('dust', this.x + (Math.random() - 0.5) * 30, floor, 1);
        if (this.t >= KRAAB.burrow.sinkMs) {
          this.look.setVisible(false);
          this.fromX = this.x;
          this.set('tunnel');
        }
        return;
      case 'tunnel': {
        // The crack races along the floor toward Ben.
        const dx = p.x - this.x;
        this.look.x += Math.sign(dx) * KRAAB.burrow.tunnelSpeed * dt;
        this.look.x = Phaser.Math.Clamp(this.look.x, this.bounds.left, this.bounds.right);
        w.telegraph.dashed(this.fromX, floor - 1, this.x, floor - 1, TELL.kraab, 0.7, this.t * 0.12, 2);
        if (chance(0.7)) w.fx.burst('dust', this.x, floor, 1);
        if (chance(0.15)) w.fx.burst('debris', this.x, floor, 1);
        if (Math.abs(dx) < 8 || this.t >= KRAAB.burrow.tunnelMaxMs) {
          this.set('hold');
          w.threat(this, w.now + KRAAB.burrow.holdMs);
          playSfx(burrow, 1, 1.3);
        }
        return;
      }
      case 'hold': {
        const k = this.t / KRAAB.burrow.holdMs;
        const r = KRAAB.burrow.eruptRadius;
        w.telegraph.zone(this.x - r, floor - 44, r * 2, 44, TELL.kraab, 0.45 + k * 0.5 + (blinkOn(this.t, 80) ? 0.08 : 0), this.t * 0.08, 0);
        if (chance(0.6)) w.fx.burst('debris', this.x + (Math.random() - 0.5) * r * 2, floor, 1);
        w.fx.shake(0.0015, 60);
        if (this.t >= KRAAB.burrow.holdMs) {
          this.set('erupt');
          this.look.setVisible(true);
          this.look.play('erupt');
          this.look.face(p.x - this.x || 1);
          w.fx.burst('debris', this.x, floor, 22);
          w.fx.burst('dust', this.x, floor, 18);
          w.fx.shake(0.012, 260);
          playSfx(erupt, 1);
          if (this.mode === 'hunt') w.say?.('kraab', ['SURPRISE, BOY!', 'HA! DID YOU MISS ME?', 'NOWHERE TO RUN DOWN HERE!'][Math.floor(Math.random() * 3)], 1600);
        }
        return;
      }
      case 'erupt':
        if (this.t >= KRAAB.burrow.eruptMs) {
          this.set('dizzy');
          this.look.play('hurt');
        }
        return;
      case 'dizzy':
        if (chance(0.08)) w.fx.burst('spark', this.x + (Math.random() - 0.5) * 20, this.y - 46, 1);
        if (this.t >= pace.punish(KRAAB.burrow.dizzyMs)) {
          this.look.play('idle');
          this.rest(500);
        }
        return;
      case 'idle':
      case 'walk': {
        const dx = p.x - this.x;
        this.look.face(dx);
        if (this.mode === 'hunt' && this.t >= KRAAB.hunt.stayMs) {
          this.leave();
          return;
        }
        if (w.now >= this.nextAt && !p.dead && !p.cloaked) {
          this.pickAttack(Math.abs(dx));
          return;
        }
        this.vx = Math.abs(dx) > 50 ? Math.sign(dx) * KRAAB.walkSpeed : 0;
        this.look.play(this.vx !== 0 ? 'walk' : 'idle');
        this.step(dt);
        return;
      }
      case 'pinchWind': {
        const k = this.t / KRAAB.pinch.windupMs;
        const dir = this.look.facing;
        w.telegraph.zone(dir > 0 ? this.x : this.x - KRAAB.pinch.reach, floor - 30, KRAAB.pinch.reach, 30, TELL.kraab, 0.4 + k * 0.5, this.t * 0.05, dir);
        if (this.t >= KRAAB.pinch.windupMs) {
          this.set('pinch');
          this.look.play('guard');
          playSfx(pinch, 1);
        }
        return;
      }
      case 'pinch':
        if (this.t >= 220) this.rest();
        return;
      case 'charge': {
        // The claw glows brighter and brighter; the aim line locks just before the shot.
        const k = this.t / KRAAB.cannon.chargeMs;
        const cx = this.x + this.look.facing * 26;
        const cy = this.y - 30;
        if (this.t < KRAAB.cannon.chargeMs - 250) this.aim = Math.atan2(p.centerY - cy, p.x - cx);
        this.look.face(Math.cos(this.aim) || this.look.facing);
        w.telegraph.dashed(cx, cy, cx + Math.cos(this.aim) * 340, cy + Math.sin(this.aim) * 340, TELL.kraab, 0.3 + k * 0.6, this.t * 0.06, k > 0.75 ? 3 : 1);
        w.lighting.add(cx, cy, 14 + k * 50, PALETTE.kraab, 1);
        if (chance(0.5)) w.fx.trail('red', cx + (Math.random() - 0.5) * 10, cy + (Math.random() - 0.5) * 10);
        if (this.t >= KRAAB.cannon.chargeMs) this.fire(cx, cy);
        return;
      }
      case 'fire':
        if (this.t >= 380) {
          this.look.play('idle');
          this.rest();
        }
        return;
      case 'rest':
        this.vx = damp(this.vx, 0.8);
        if (this.t >= 300) this.set('idle');
        return;
      case 'leave':
        if (chance(0.6)) w.fx.burst('dust', this.x, floor, 1);
        if (this.t >= 500) {
          this.look.setVisible(false);
          this.set('hidden');
          const done = this.onDone;
          if (this.mode === 'hunt') {
            this.mode = 'off';
            this.onDone = null;
            done?.();
          }
        }
        return;
      default:
        return;
    }
  }

  private pickAttack(dist: number): void {
    const w = this.w;
    if (dist < KRAAB.pinch.reach + 10) {
      this.set('pinchWind');
      this.look.play('charge');
      w.threat(this, w.now + KRAAB.pinch.windupMs);
      return;
    }
    // Far away: the cannon, or (in the boss fight) dive underground and come up under Ben.
    if (this.mode === 'boss' && chance(0.45)) {
      this.set('sink');
      this.look.play('burrow');
      playSfx(burrow, 0.8);
      w.fx.burst('dust', this.x, this.bounds.floor, 12);
      return;
    }
    this.set('charge');
    this.look.play('charge');
    w.threat(this, w.now + KRAAB.cannon.chargeMs);
    playSfx(clawCharge, 0.8);
  }

  private fire(cx: number, cy: number): Projectile {
    const C = KRAAB.cannon;
    this.set('fire');
    this.look.play('fire');
    this.blast = this.w.projectiles.spawn('claw', 'enemy', cx, cy, Math.cos(this.aim) * C.speed, Math.sin(this.aim) * C.speed, C.damage, 3000, C.radius);
    this.blastLast = { x: cx, y: cy };
    this.w.fx.flash(cx, cy, PALETTE.kraab, 24, 160);
    this.w.fx.shake(0.008, 180);
    this.look.x -= this.look.facing * 6;
    playSfx(clawFire, 1);
    return this.blast;
  }

  /** The claw blast goes off where it lands, unless Diamondhead sent it back. */
  private updateBlast(): void {
    const b = this.blast;
    if (!b) return;
    if (b.active && b.team === 'player') {
      this.blast = null;
      return;
    }
    if (b.active) {
      this.blastLast.x = b.x;
      this.blastLast.y = b.y;
      return;
    }
    this.blast = null;
    const { x, y } = this.blastLast;
    this.w.fx.explosion(x, y, 'medium');
    this.w.fx.ring(x, y, PALETTE.kraab, KRAAB.cannon.blastRadius, 300);
    this.w.blastPlayer(x, y, KRAAB.cannon.blastRadius, KRAAB.cannon.damage - 1);
    playSfx('explode', 0.8, 0.9);
  }

  private rest(extra = 0): void {
    this.set('rest');
    this.nextAt = this.w.now + pace.rest(rand(KRAAB.restMs)) + extra;
  }

  private step(dt: number): void {
    const nx = this.look.x + this.vx * dt;
    if (!this.w.isSolid(nx + Math.sign(this.vx) * 22, this.y - 12)) this.look.x = nx;
    this.look.x = Phaser.Math.Clamp(this.look.x, this.bounds.left + 20, this.bounds.right - 20);
  }

  /** The cannon, on cue (a story beat): charge at `aimX, aimY`, fire when told. */
  chargeAt(aimX: number, aimY: number): void {
    this.look.play('charge');
    this.aimAt(aimX, aimY);
    playSfx(clawCharge, 0.9);
  }

  /** Keeps a story charge pointed at (x, y). */
  aimAt(aimX: number, aimY: number): void {
    this.aim = Math.atan2(aimY - (this.y - 30), aimX - (this.x + this.look.facing * 26));
  }

  /** Fires the charged cannon (story beat): the blast, to watch for a reflection. */
  fireNow(): Projectile {
    return this.fire(this.x + this.look.facing * 26, this.y - 30);
  }

  /** The charge glow and aim line during a story charge (call each frame). */
  drawCharge(k: number): void {
    const cx = this.x + this.look.facing * 26;
    const cy = this.y - 30;
    this.w.telegraph.dashed(cx, cy, cx + Math.cos(this.aim) * 340, cy + Math.sin(this.aim) * 340, TELL.kraab, 0.3 + k * 0.6, this.t * 0.06, k > 0.75 ? 3 : 1);
    this.w.lighting.add(cx, cy, 14 + k * 50, PALETTE.kraab, 1);
    if (chance(0.5)) this.w.fx.trail('red', cx + (Math.random() - 0.5) * 10, cy + (Math.random() - 0.5) * 10);
  }

  destroy(): void {
    this.look.destroy();
  }
}
