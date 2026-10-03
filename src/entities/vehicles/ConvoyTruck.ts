import Phaser from 'phaser';
import { CONVOY as C } from '../../config/chapter2';
import { DEPTH } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import { CONVOY as ART } from '../../scenes/preload/vehicles';
import { pace } from '../../systems/Difficulty';
import { playSfx } from '../../systems/audio/Sfx';
import type { Projectile } from '../Projectiles';
import type { Damageable, Hit, HitResult, Liftable, Rect } from '../types';
import { crunch, engineRev, horn, wreck as wreckSound } from './audio';
import type { ChaseWorld } from './chaseWorld';
import { chance } from '../../systems/Pacing';

export type TruckState = 'approach' | 'tail' | 'rev' | 'ram' | 'clamped' | 'dropBack' | 'held' | 'thrown' | 'wreck' | 'gone';

export interface TruckHooks {
  /** The ram connected: the RV jolts (the director hurts and flings whoever stands at the back). */
  onRam(truck: ConvoyTruck): void;
  /** Hooked on too long: it yanks the RV and lets go. */
  onYank(truck: ConvoyTruck): void;
  onClamp(truck: ConvoyTruck): void;
  onLifted(truck: ConvoyTruck): void;
  /** Gone for good: thrown off the road or wrecked. */
  onDestroyed(truck: ConvoyTruck, how: 'thrown' | 'wrecked'): void;
}

/** Sprite layout: the wheels touch the road at row 55; the turret's barrel ends at (48, 20). */
const FEET = 55;
const HALF_W = ART.w / 2;
const HALF_H = ART.h / 2;
const MUZZLE = { dx: 48 - ART.w, dy: 20 - FEET };
/** The far lane sits a little further up the road. */
const LANE_Y = -9;

function between(range: readonly [number, number]): number {
  return range[0] + Math.random() * (range[1] - range[0]);
}

/**
 * One of Vilgax's convoy rigs. It tails the Rustbucket, the lead truck revs
 * (chevrons on the back of the roof), rams and hooks on with its clamp arm;
 * the others hang back and lob shells at a marked spot on the roof. Armour
 * shrugs off everything but smash damage, and a hooked truck can be ripped
 * off the RV by Four Arms and thrown, spinning, off the road.
 */
export class ConvoyTruck implements Damageable, Liftable {
  readonly countsAsEnemy = true;
  readonly stopsThrows = true;
  readonly height = 30;
  readonly impactDamage = C.thrownDamage;
  readonly sprite: Phaser.GameObjects.Sprite;
  /** Front of the plow (world x). */
  nose: number;
  state: TruckState = 'approach';
  hp: number = C.hp;
  lastDamage = 0;
  /** Where it keeps station while tailing (nose x); the director keeps it up to date. */
  slotX: number;
  /** The lead truck rams; the others hang back and shell the roof. */
  lead = false;
  /** Holds on until something makes it let go (the truck Four Arms is introduced on). */
  holdClamp = false;
  /** 0: right behind the RV (the lead). 1: the far lane, alongside it, drawn behind it. */
  lane: 0 | 1 = 0;
  private laneY = 0;
  private t = 0;
  private stateLeft = 0;
  private fireAt: number;
  private aimLeft = 0;
  private targetX = 0;
  private shell: Projectile | null = null;
  private readonly shellLast = { x: 0, y: 0 };
  private flashLeft = 0;
  private readonly wreckV = { x: 0, y: 0, spin: 0 };
  private wreckLeft = 0;
  private puff = 0;
  private yankWarned = false;
  private readonly seed = Math.random() * 1000;

  constructor(
    scene: Phaser.Scene,
    private readonly w: ChaseWorld,
    private readonly hooks: TruckHooks,
    startNose: number,
  ) {
    this.nose = startNose;
    this.slotX = startNose;
    this.sprite = scene.add.sprite(0, 0, TEX.convoy, 0).setDepth(DEPTH.terrain + 4).play('convoy-drive');
    this.fireAt = w.now() + pace.rest(between(C.fireEveryMs)) * 0.6;
    this.render(0);
  }

  get alive(): boolean {
    return this.state !== 'wreck' && this.state !== 'gone';
  }

  /** Still on the road behind the RV (not carried, flying or wrecked). */
  get driving(): boolean {
    return this.state === 'approach' || this.state === 'tail' || this.state === 'rev' || this.state === 'ram' || this.state === 'clamped' || this.state === 'dropBack';
  }

  get clamped(): boolean {
    return this.state === 'clamped';
  }

  private get roadY(): number {
    return this.w.rv.roadY;
  }

  /** Where the plow sits when it's hooked onto the RV. */
  private get hookedNose(): number {
    return this.w.rv.rearX + 4;
  }

  private enter(state: TruckState, ms = 0): void {
    this.state = state;
    this.stateLeft = ms;
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number): void {
    if (this.state === 'gone') return;
    const dt = dtMs / 1000;
    this.t += dtMs;
    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    this.stateLeft -= dtMs;
    this.trackShell();
    if (this.driving) {
      this.laneY += ((this.lane === 1 ? LANE_Y : 0) - this.laneY) * (1 - Math.exp(-4 * dt));
      this.sprite.setDepth(this.lane === 1 && this.state !== 'ram' && this.state !== 'clamped' ? DEPTH.terrain + 3 : DEPTH.terrain + 6);
    }
    switch (this.state) {
      case 'approach':
        this.nose = Math.min(this.slotX, this.nose + C.approachSpeed * dt);
        if (this.nose >= this.slotX - 1) this.enter('tail', pace.rest(between(C.tailMs)));
        break;
      case 'tail':
        this.nose += (this.slotX - this.nose) * (1 - Math.exp(-3 * dt));
        this.updateGun(dtMs, !this.lead);
        if (this.lead && this.stateLeft <= 0 && this.aimLeft <= 0) this.beginRev();
        break;
      case 'rev':
        this.updateRev(dt);
        break;
      case 'ram':
        this.nose += C.ramSpeed * dt;
        if (this.nose >= this.hookedNose) this.impact();
        break;
      case 'clamped':
        this.updateClamped();
        break;
      case 'dropBack':
        this.nose -= C.approachSpeed * 0.8 * dt;
        if (this.stateLeft <= 0) this.enter('tail', pace.rest(between(C.tailMs)));
        break;
      case 'wreck':
        this.updateWreck(dtMs, dt);
        return;
      default:
        return;
    }
    if (this.aimLeft > 0 || this.shell) this.drawTarget();
    this.render(dtMs);
  }

  private beginRev(): void {
    this.enter('rev', C.revMs);
    this.aimLeft = 0;
    playSfx(engineRev, 0.9);
    playSfx(horn, 0.8);
    const ramMs = Math.max(0, this.hookedNose - this.nose) / C.ramSpeed * 1000;
    this.w.threat(this, this.w.now() + C.revMs + ramMs);
  }

  private updateRev(dt: number): void {
    // Winds back a little, engine roaring, then lunges.
    this.nose -= 14 * dt;
    const k = 1 - Math.max(0, this.stateLeft) / C.revMs;
    this.drawRamZone(k);
    if (chance(0.6)) this.w.fx.trail('fire', this.nose - 44, this.roadY - 44);
    if (this.stateLeft <= 0) {
      this.enter('ram');
      playSfx('dive', 0.6, 0.6);
    }
  }

  private impact(): void {
    this.nose = this.hookedNose;
    const { fx, rv } = this.w;
    this.enter('clamped', this.holdClamp ? Infinity : C.clampMs);
    this.yankWarned = false;
    this.sprite.stop().setFrame(2);
    playSfx(crunch);
    playSfx('clamp', 0.9);
    fx.burst('spark', rv.rearX, rv.roofY + 10, 16);
    fx.burst('debris', rv.rearX, rv.roofY + 20, 6);
    fx.flash(rv.rearX, rv.roofY + 8, PALETTE.white, 22, 160);
    this.hooks.onRam(this);
    this.hooks.onClamp(this);
  }

  private updateClamped(): void {
    this.nose = this.hookedNose;
    const { fx, rv } = this.w;
    if (chance(0.25)) fx.burst('spark', rv.rearX + Math.random() * 6, rv.roofY + 4 + Math.random() * 10, 1);
    if (!Number.isFinite(this.stateLeft)) return;
    // The yank: same telegraph as the ram.
    if (this.stateLeft <= C.revMs) {
      if (!this.yankWarned) {
        this.yankWarned = true;
        playSfx(engineRev, 0.8, 0.8);
        this.w.threat(this, this.w.now() + this.stateLeft);
      }
      this.drawRamZone(1 - this.stateLeft / C.revMs);
    }
    if (this.stateLeft <= 0) {
      this.hooks.onYank(this);
      playSfx(crunch, 0.8, 0.8);
      fx.burst('spark', rv.rearX, rv.roofY + 6, 12);
      this.sprite.play('convoy-drive');
      this.enter('dropBack', C.dropBackMs);
    }
  }

  /** The back of the roof: chevrons pointing the way Ben will be flung. */
  private drawRamZone(strength: number): void {
    const rv = this.w.rv;
    this.w.telegraph.zone(rv.roofLeft, rv.roofY - 26, C.ramZone, 26, PALETTE.enemy, strength, this.t * 0.06, 1);
  }

  // ------------------------------------------------------------ Turret

  /** Finishes an aim already started; `mayStart`: free to start a new one (the lead truck isn't). */
  private updateGun(dtMs: number, mayStart: boolean): void {
    const now = this.w.now();
    if (this.aimLeft > 0) {
      this.aimLeft -= dtMs;
      if (this.aimLeft <= 0) this.fire();
      return;
    }
    if (!mayStart || this.shell || now < this.fireAt || this.w.player.dead) return;
    const rv = this.w.rv;
    this.targetX = Phaser.Math.Clamp(this.w.player.x, rv.roofLeft + 10, rv.roofRight - 10);
    this.aimLeft = C.aimMs;
    playSfx('laserCharge', 0.6, 0.6);
    this.w.threat(this, now + C.aimMs + C.shellFlightMs);
  }

  private fire(): void {
    const { fx, rv, projectiles } = this.w;
    const mx = this.nose + MUZZLE.dx;
    const my = this.roadY + this.laneY + MUZZLE.dy;
    const T = C.shellFlightMs / 1000;
    const g = C.shellGravity;
    const ty = rv.roofY - 3;
    const vx = (this.targetX - mx) / T;
    const vy = (ty - my - 0.5 * g * T * T) / T;
    this.shell = projectiles.spawn('shell', 'enemy', mx, my, vx, vy, C.shellDamage, C.shellFlightMs + 600, 5, { gravity: g });
    this.shellLast.x = mx;
    this.shellLast.y = my;
    this.fireAt = this.w.now() + pace.rest(between(C.fireEveryMs));
    playSfx('cannon', 0.7);
    fx.flash(mx, my, PALETTE.enemyGlow, 12, 120);
    fx.burst('smoke', mx, my, 4);
  }

  /** A shell that came down on the roof bursts; one punched back or clapped away doesn't. */
  private trackShell(): void {
    const s = this.shell;
    if (!s) return;
    if (s.active && s.team === 'enemy' && s.kind === 'shell') {
      this.shellLast.x = s.x;
      this.shellLast.y = s.y;
      return;
    }
    this.shell = null;
    this.w.cancelThreat(this);
    const rv = this.w.rv;
    if (!s.reflected && this.shellLast.y >= rv.roofY - 14 && this.shellLast.x > rv.roofLeft - 8 && this.shellLast.x < rv.roofRight + 8) {
      this.w.blast(this.shellLast.x, rv.roofY - 2, C.shellBlastRadius, C.shellDamage);
    }
  }

  private drawTarget(): void {
    const rv = this.w.rv;
    const k = this.aimLeft > 0 ? 1 - this.aimLeft / C.aimMs : 1;
    const y = rv.roofY - 4;
    this.w.telegraph.target(this.targetX, y, 13 - 4 * k, PALETTE.enemy, 0.45 + 0.55 * k);
    this.w.telegraph.rect(this.targetX - C.shellBlastRadius, rv.roofY - 1, C.shellBlastRadius * 2, 2, PALETTE.enemy, 0.3 + 0.5 * k);
  }

  // ------------------------------------------------------------ Damageable

  hurtbox(out: Rect): boolean {
    if (!this.driving) return false;
    if (this.state === 'clamped') {
      // The clamp arm reaches up over the roof's lip: that's what Ben can hit from up there.
      out.x = this.nose - 52;
      out.y = this.w.rv.roofY - 22;
      out.w = 56;
      out.h = this.roadY - 12 - out.y;
    } else {
      out.x = this.nose - 104;
      out.y = this.roadY + this.laneY - 46;
      out.w = 102;
      out.h = 36;
    }
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.driving) return 'none';
    const smash = hit.kind === 'smash';
    const dmg = hit.damage * (smash ? 1 : C.chipMultiplier);
    this.lastDamage = dmg;
    this.hp -= dmg;
    this.flashLeft = 70;
    this.w.fx.burst('spark', hit.x, hit.y, smash ? 10 : 4);
    playSfx(smash ? 'armorCrack' : 'armorTink', 0.8, 0.9 + Math.random() * 0.2);
    if (this.hp <= 0) {
      this.destroyAs('wrecked', this.sprite.x, this.sprite.y);
      return 'killed';
    }
    return 'hit';
  }

  // ------------------------------------------------------------ Liftable

  get liftable(): boolean {
    return this.state === 'clamped';
  }

  get self(): Damageable {
    return this;
  }

  liftBox(out: Rect): boolean {
    if (this.state !== 'clamped') return false;
    out.x = this.nose - 38;
    out.y = this.w.rv.roofY - 30;
    out.w = 44;
    out.h = 42;
    return true;
  }

  lift(): void {
    const { fx, rv } = this.w;
    this.state = 'held';
    this.w.cancelThreat(this);
    this.aimLeft = 0;
    this.sprite.stop().setFrame(2).setDepth(DEPTH.player + 1);
    fx.burst('spark', rv.rearX, rv.roofY + 6, 20);
    fx.burst('debris', rv.rearX, rv.roofY + 10, 8);
    fx.shake(0.012, 260);
    playSfx('grab', 1, 0.6);
    playSfx(crunch, 0.9, 1.3);
    this.hooks.onLifted(this);
  }

  carry(x: number, bottomY: number, facing: 1 | -1): void {
    // Upside down over Four Arms' head, wheels spinning in the air.
    this.sprite.setPosition(Math.round(x), Math.round(bottomY - HALF_H + 4)).setRotation(0).setFlipY(true).setFlipX(facing < 0);
  }

  fly(x: number, y: number, angle: number): void {
    this.state = 'thrown';
    this.sprite.setPosition(x, y).setRotation(angle);
    this.w.fx.stream('smoke', x, y);
    if (chance(0.5)) this.w.fx.trail('spark', x, y);
  }

  shatter(x: number, y: number): void {
    this.destroyAs('thrown', x, y);
  }

  // ------------------------------------------------------------ Wreck

  private destroyAs(how: 'thrown' | 'wrecked', x: number, y: number): void {
    const { fx } = this.w;
    this.state = 'wreck';
    this.w.cancelThreat(this);
    this.aimLeft = 0;
    this.sprite.stop().setFrame(3).setPosition(x, y).setDepth(DEPTH.terrain + 6).clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    fx.explosion(x, y, 'big');
    fx.hitStop(how === 'thrown' ? 90 : 60);
    playSfx(wreckSound);
    fx.popText(x, y - 34, how === 'thrown' ? 'OFF THE ROAD!' : 'WRECKED!', PALETTE.fire1, 1.4);
    if (how === 'thrown') {
      this.wreckV.x = -60;
      this.wreckV.y = -200;
      this.wreckV.spin = (this.sprite.flipX ? 1 : -1) * 6;
    } else {
      this.wreckV.x = -120;
      this.wreckV.y = -160;
      this.wreckV.spin = -2.5;
    }
    this.wreckLeft = C.wreckMs;
    this.hooks.onDestroyed(this, how);
  }

  private updateWreck(dtMs: number, dt: number): void {
    const s = this.sprite;
    const { fx } = this.w;
    this.wreckV.y += 900 * dt;
    // The asphalt carries it away behind the RV.
    s.x += (this.wreckV.x - this.w.roadSpeed * 0.7) * dt;
    s.y += this.wreckV.y * dt;
    const floor = this.roadY - 22;
    if (s.y > floor) {
      s.y = floor;
      this.wreckV.y = -Math.abs(this.wreckV.y) * 0.35;
      this.wreckV.spin *= 0.6;
      fx.burst('spark', s.x, this.roadY - 4, 8);
      fx.burst('dust', s.x, this.roadY - 4, 6);
    }
    s.rotation += this.wreckV.spin * dt;
    this.puff -= dtMs;
    if (this.puff <= 0) {
      this.puff = 50;
      fx.trail('smoke', s.x, s.y - 10);
      fx.trail('fire', s.x + (Math.random() - 0.5) * 30, s.y);
    }
    this.w.lighting.add(s.x, s.y, 70, PALETTE.fire2, 0.9);
    this.wreckLeft -= dtMs;
    const view = s.scene.cameras.main.worldView;
    if (this.wreckLeft > 0 && s.x > view.x - 80) return;
    if (s.x > view.x - 40) {
      fx.explosion(s.x, s.y, 'medium');
      playSfx('explode', 0.7, 0.8);
    }
    this.state = 'gone';
    s.setVisible(false);
  }

  // ------------------------------------------------------------ Look

  private render(dtMs: number): void {
    if (this.state === 'held' || this.state === 'thrown') return;
    const s = this.sprite;
    const { lighting, fx } = this.w;
    const bob = Math.round(Math.sin((this.t + this.seed) * 0.018) * 0.8);
    const jitter = this.state === 'rev' || (this.state === 'clamped' && this.yankWarned) ? Math.round((Math.random() - 0.5) * 2) : 0;
    const roadY = this.roadY + Math.round(this.laneY);
    s.setPosition(Math.round(this.nose - HALF_W + jitter), Math.round(roadY - FEET + HALF_H + bob)).setRotation(0).setFlipX(false).setFlipY(false);
    if (this.flashLeft > 0) s.setTintMode(Phaser.TintModes.FILL).setTint(PALETTE.white);
    else s.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    // Headlights, the drone core in the windshield, the turret charging.
    const night = this.w.night;
    if (night > 0.2) lighting.add(this.nose + 30, roadY - 16, 100, 0xfff0c0, 0.75 * night);
    lighting.add(this.nose - 32, roadY - 33, 24, PALETTE.enemy, 0.9);
    if (this.aimLeft > 0) lighting.add(this.nose + MUZZLE.dx, roadY + MUZZLE.dy, 30, PALETTE.enemy, 1);
    this.puff -= dtMs;
    if (this.puff <= 0) {
      this.puff = this.hp < C.hp / 2 ? 70 : 140;
      fx.trail('smoke', this.nose - 46, roadY - 46);
    }
  }

  destroy(): void {
    this.w.cancelThreat(this);
    this.sprite.destroy();
  }
}
