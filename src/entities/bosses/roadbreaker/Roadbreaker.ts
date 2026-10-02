import Phaser from 'phaser';
import { DEPTH, FX } from '../../../config/constants';
import { PALETTE } from '../../../config/palette';
import { ROADBREAKER as RB } from '../../../config/roadbreaker';
import { TEX } from '../../../scenes/preload/assetKeys';
import { RB_TORSO } from '../../../scenes/preload/roadbreaker';
import { pace } from '../../../systems/Difficulty';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Damageable, Hazard, Hit, HitResult, Liftable, Rect } from '../../types';
import { crunch, horn } from '../../vehicles/audio';
import type { ArenaBoss } from '../ArenaBoss';
import type { BossWorld } from '../HunterDrone';
import { RbPlate, RbSaw, RbTire, type PartOwner } from './parts';
import { RB_ATTACKS, newRbAttack, type RbAttackKind, type RbAttackState } from './rbAttacks';
import { coreMultiplier, isFire } from './rules';

type Mode = 'truck' | 'robot';
type RbState = 'intro' | 'idle' | 'attack' | 'stalled' | 'held' | 'thrown' | 'transform' | 'seized' | 'dying' | 'dead';

const TRUCK_BAG: RbAttackKind[] = ['ram', 'lob', 'ram', 'dispatch', 'ram'];
const ROBOT_BAG: RbAttackKind[] = ['slam', 'saw', 'beam', 'slam', 'dispatch', 'saw', 'slam'];

/** Where the truck's wheels sit, from its centre (facing right). */
const WHEEL_DX = [-32, 34] as const;
const WHEEL_Y = 13;
/** Robot layout: legs are 38 tall and the torso overlaps them by 8. */
const LEGS_H = 30;
const SHOULDER_DX = 34;
const ARM_LEN = 46;

/** The blast where the robot's fists come down. */
class FistImpact implements Hazard {
  readonly damage = RB.robot.slam.damage;
  active = false;
  x = 0;
  floorY = 0;
  life = 0;
  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    const w = RB.robot.slam.width;
    out.x = this.x - w / 2;
    out.y = this.floorY - 40;
    out.w = w;
    out.h = 40;
    return true;
  }
  onHitPlayer(): void {
    this.active = false;
  }
}

/**
 * ROADBREAKER: Vilgax's war rig. Truck mode rams across the arena, lobs
 * barrels and launches drones; shred both tires and it stalls (Four Arms can
 * lift and throw the whole truck). At `robotAt` it stands up as a robot:
 * hammer slams with shockwaves, wheels bowled along the floor, a beam at knee
 * height. Its chest plates only break to smash damage; after a slam its vents
 * open and fire overheats it into a kneel.
 */
export class Roadbreaker implements ArenaBoss, Liftable, PartOwner {
  readonly name = RB.name;
  readonly subtitle = RB.subtitle;
  readonly maxHp = RB.maxHp;
  readonly phase2Title = 'ROBOT MODE!';
  readonly defeatTitle = RB.defeatTitle;
  readonly countsAsEnemy = true;
  readonly stopsThrows = true;
  readonly height = 34;
  /** A thrown war rig flattens whatever it lands on. */
  readonly impactDamage = 20;
  hp: number = RB.maxHp;
  phase = 0;
  lastDamage = 0;
  x: number;
  facing: 1 | -1 = -1;
  mode: Mode = 'truck';
  /** Driving or walking speed this frame (attacks set it). */
  vx = 0;
  /** How far the robot's torso is lowered (slam follow-through, kneeling). */
  crouch = 0;
  /** Arm swing in degrees for a robot facing right (0: hanging, -90: forward, -160: overhead). */
  armAngle = 0;
  ramming = false;
  revving = false;
  dazed = false;
  shake = 0;
  ventOpen = false;
  heat = 0;
  readonly tires: RbTire[];
  readonly plates: RbPlate[];
  readonly saws: RbSaw[];
  readonly fist = new FistImpact();
  /** Robot shoulder wheels thrown and not grown back yet (ms). */
  readonly shoulderGone = [0, 0];

  private state: RbState = 'intro';
  private stateT = 0;
  private attack: RbAttackState | null = null;
  private bag: RbAttackKind[] = [];
  private sinceKey = 0;
  private pendingTransform = false;
  /** Just landed on its roof: righting itself, can't be lifted again until it's back on its wheels. */
  private flipped = false;
  private stallLeft = 0;
  private ventLeft = 0;
  private flashLeft = 0;
  private explodeTimer = 0;
  private spin = 0;
  private airY = 0;
  private readonly truck: Phaser.GameObjects.Sprite;
  private readonly legs: Phaser.GameObjects.Sprite;
  private readonly torso: Phaser.GameObjects.Sprite;
  private readonly arms: Phaser.GameObjects.Image[];
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly startX: number;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly w: BossWorld,
    x: number,
  ) {
    const { arena } = w;
    this.startX = arena.right - 20;
    this.x = this.startX;
    this.shadow = scene.add.image(x, arena.floorY, TEX.shadow).setDepth(DEPTH.decor).setAlpha(0.5);
    this.truck = scene.add.sprite(this.x, arena.floorY - 1, TEX.rbTruck, 0).setOrigin(0.5, 1).setDepth(DEPTH.boss);
    this.legs = scene.add.sprite(x, arena.floorY, TEX.rbLegs, 0).setOrigin(0.5, 1).setDepth(DEPTH.boss).setVisible(false);
    this.torso = scene.add.sprite(x, arena.floorY - LEGS_H, TEX.rbTorso, 0).setOrigin(0.5, 1).setDepth(DEPTH.boss + 1).setVisible(false);
    this.arms = [0, 1].map(() => scene.add.image(x, 0, TEX.rbArm).setOrigin(0.5, 0.08).setDepth(DEPTH.boss + 3).setVisible(false));
    this.tires = [0, 1].map(() => new RbTire(scene, this));
    this.plates = [0, 1, 2].map(() => new RbPlate(scene, this));
    this.saws = [0, 1].map(() => new RbSaw(scene, w.fx, arena));
    this.fist.floorY = arena.floorY;
    this.airY = -230;
    playSfx(horn, 1, 0.7);
  }

  // ------------------------------------------------------------ Status

  get fx() {
    return this.w.fx;
  }

  get alive(): boolean {
    return this.state !== 'dying' && this.state !== 'dead';
  }

  get introducing(): boolean {
    return this.state === 'intro';
  }

  get defeated(): boolean {
    return this.state === 'dead';
  }

  get floorY(): number {
    return this.w.arena.floorY;
  }

  get tiresPopped(): number {
    return this.tires.filter((t) => t.popped).length;
  }

  get platesBroken(): number {
    return this.plates.filter((p) => p.broken).length;
  }

  get tiresExposed(): boolean {
    return this.mode === 'truck' && (this.state === 'idle' || this.state === 'attack' || this.state === 'stalled');
  }

  get platesExposed(): boolean {
    return this.mode === 'robot' && (this.state === 'idle' || this.state === 'attack' || this.state === 'seized');
  }

  get extraTargets(): readonly Damageable[] {
    return [...this.tires, ...this.plates, ...this.saws];
  }

  get extraHazards(): readonly Hazard[] {
    return [...this.saws, this.fist];
  }

  get liftables(): readonly Liftable[] {
    return [this];
  }

  /** Top of the robot's torso (world y). */
  get torsoTop(): number {
    return this.floorY - LEGS_H + this.crouch - RB_TORSO.h;
  }

  /** The chest core (where plates sit and the beam comes from). */
  get coreY(): number {
    return this.torsoTop + 28;
  }

  /** Where the front fist is right now (robot mode). */
  fistPoint(): { x: number; y: number } {
    const sx = this.x + this.facing * SHOULDER_DX;
    const sy = this.torsoTop + 18;
    const a = Phaser.Math.DegToRad(this.armAngle * this.facing);
    return { x: sx - Math.sin(a) * ARM_LEN, y: sy + Math.cos(a) * ARM_LEN };
  }

  private enter(state: RbState): void {
    this.state = state;
    this.stateT = 0;
  }

  // ------------------------------------------------------------ Damageable / Hazard

  private get hittable(): boolean {
    return this.state === 'idle' || this.state === 'attack' || this.state === 'stalled' || this.state === 'seized';
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive || this.state === 'intro' || this.state === 'held' || this.state === 'thrown') return false;
    if (this.mode === 'truck') {
      out.x = this.x - 58;
      out.y = this.floorY - 58;
      out.w = 116;
      out.h = 32;
    } else {
      out.x = this.x - 32;
      out.y = this.torsoTop + 2;
      out.w = 64;
      out.h = this.floorY - out.y;
    }
    return true;
  }

  get active(): boolean {
    if (!this.alive) return false;
    if (this.state !== 'idle' && this.state !== 'attack') return false;
    return !this.dazed;
  }

  get damage(): number {
    return this.ramming ? RB.truck.ram.damage : RB.contactDamage;
  }

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    if (this.mode === 'truck') {
      const top = this.ramming ? RB.truck.ram.height : 40;
      out.x = this.x - (this.ramming ? 58 : 48);
      out.y = this.floorY - top;
      out.w = this.ramming ? 116 : 96;
      out.h = top - 4;
    } else {
      out.x = this.x - 24;
      out.y = this.torsoTop + 10;
      out.w = 48;
      out.h = this.floorY - out.y;
    }
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    if (!this.hittable) {
      this.w.fx.burst('spark', hit.x, hit.y, 4);
      playSfx('armorTink', 0.5, 0.8);
      return 'blocked';
    }
    const mult = coreMultiplier(
      { mode: this.mode, stalled: this.state === 'stalled', seized: this.state === 'seized', ventOpen: this.ventOpen, platesBroken: this.platesBroken },
      hit.kind,
    );
    const dmg = hit.damage * mult;
    this.lastDamage = dmg;
    this.hp = Math.max(0, this.hp - dmg);
    this.flashLeft = 70;
    const weak = mult < 0.5;
    this.w.fx.burst(weak ? 'spark' : 'fire', hit.x, hit.y, weak ? 3 : 7);
    playSfx(weak ? 'armorTink' : 'droneHit', 0.8, weak ? 1 : 0.7);
    if (weak && this.mode === 'truck' && hit.kind !== 'smash') this.w.tip('rbArmor', 'ITS ARMOR SHRUGS THAT OFF... GO FOR THE TIRES!', 3000);
    if (weak && this.mode === 'robot' && hit.kind !== 'smash' && !this.ventOpen) this.w.tip('rbPlates', 'THOSE STRIPED PLATES NEED SMASHING. FOUR ARMS!', 3000);
    this.w.onHealth(this.hp / this.maxHp, this.phase);
    if (this.hp <= 0) {
      this.startDying();
      return 'killed';
    }
    if (this.mode === 'truck' && this.hp <= this.maxHp * RB.robotAt) this.pendingTransform = true;
    if (this.mode === 'robot' && this.ventOpen && isFire(hit.kind)) {
      this.heat += dmg;
      if (this.heat >= RB.robot.vent.overheatAt && this.state !== 'seized') this.seize();
    }
    return 'hit';
  }

  // ------------------------------------------------------------ Parts

  onTirePopped(): void {
    this.w.fx.shake(FX.shakeMedium, 200);
    if (this.tiresPopped === 1) this.w.tip('rbTire', 'POP! ONE MORE TIRE!', 2000);
  }

  onPlateBroken(): void {
    this.w.time.slowMo(0.4, 300, 200);
    this.w.fx.shake(FX.shakeMedium, 240);
    if (this.platesBroken === RB.robot.plates) {
      this.w.tip('rbCore', 'THE CORE IS EXPOSED! HIT IT WITH EVERYTHING!', 3000);
      this.w.fx.ring(this.x, this.coreY, PALETTE.enemy, 50, 400);
    }
  }

  /** A wheel batted back hit the robot. */
  private sawReturned(saw: RbSaw): void {
    saw.burst();
    if (!this.hittable) return;
    this.hp = Math.max(0, this.hp - RB.robot.saw.returnDamage);
    this.flashLeft = 120;
    this.w.fx.explosion(saw.x, saw.y, 'medium');
    this.w.fx.popText(this.x, this.torsoTop - 6, 'RIGHT BACK AT YA!', PALETTE.omnitrix);
    this.w.onHealth(this.hp / this.maxHp, this.phase);
    if (this.hp <= 0) this.startDying();
  }

  // ------------------------------------------------------------ Liftable (a stalled truck)

  get liftable(): boolean {
    // Not while it rights itself after a flip: one flip per stall.
    return this.mode === 'truck' && this.state === 'stalled' && this.alive && !this.flipped;
  }

  get self(): Damageable {
    return this;
  }

  liftBox(out: Rect): boolean {
    if (!this.liftable) return false;
    out.x = this.x - 64;
    out.y = this.floorY - 60;
    out.w = 128;
    out.h = 60;
    return true;
  }

  lift(): void {
    this.enter('held');
    this.w.cancelThreat();
    this.truck.setDepth(DEPTH.player + 1);
    for (const t of this.tires) t.sprite.setVisible(false);
    this.shadow.setVisible(false);
    this.w.fx.shake(FX.shakeHeavy, 400);
    this.w.time.slowMo(0.35, 500, 300);
    this.w.fx.popText(this.x, this.floorY - 70, 'HEAVE!', PALETTE.gold, 1.4);
    playSfx('grab', 1, 0.5);
    playSfx(crunch, 1, 0.7);
    this.w.tip('rbThrow', '{J} THROW IT!', 3000);
  }

  carry(x: number, bottomY: number, facing: 1 | -1): void {
    this.x = this.clampX(x);
    this.truck.setPosition(Math.round(this.x), Math.round(bottomY + 6)).setFlipY(true).setFlipX(facing < 0).setRotation(0).setOrigin(0.5, 1);
  }

  fly(x: number, y: number, angle: number): void {
    this.enter('thrown');
    this.x = this.clampX(x);
    this.truck.setOrigin(0.5, 0.5).setPosition(this.x, y).setRotation(angle);
    this.w.fx.trail('smoke', this.x, y);
    this.w.fx.trail('spark', this.x, y);
  }

  /** It comes down on its roof: a huge hit, then it rights itself (or stands up as a robot). */
  shatter(x: number): void {
    this.x = this.clampX(x);
    this.truck.setOrigin(0.5, 1).setRotation(0).setFlipY(false).setDepth(DEPTH.boss);
    this.shadow.setVisible(true);
    const { fx } = this.w;
    fx.explosion(this.x, this.floorY - 20, 'big');
    fx.burst('debris', this.x, this.floorY - 10, 30);
    fx.crack(this.x, this.floorY, 1);
    fx.hitStop(140);
    fx.popText(this.x, this.floorY - 80, 'FLIPPED!', PALETTE.gold, 1.6);
    playSfx('slam');
    playSfx(crunch);
    this.hp = Math.max(0, this.hp - RB.truck.flipDamage);
    this.flashLeft = 160;
    this.w.onHealth(this.hp / this.maxHp, this.phase);
    if (this.hp <= 0) {
      this.startDying();
      return;
    }
    if (this.hp <= this.maxHp * RB.robotAt) this.pendingTransform = true;
    this.enter('stalled');
    this.stallLeft = 900;
    this.flipped = true;
  }

  private clampX(x: number): number {
    return Phaser.Math.Clamp(x, this.w.arena.left + 66, this.w.arena.right - 66);
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number): void {
    if (this.state === 'dead') return;
    const dt = dtMs / 1000;
    this.stateT += dtMs;
    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    this.fist.life -= dtMs;
    if (this.fist.life <= 0) this.fist.active = false;
    for (const saw of this.saws) {
      saw.update(dtMs);
      if (saw.returned && saw.rolling && Math.abs(saw.x - this.x) < (this.mode === 'robot' ? 30 : 60)) this.sawReturned(saw);
    }
    for (let i = 0; i < 2; i++) this.shoulderGone[i] = Math.max(0, this.shoulderGone[i] - dtMs);

    switch (this.state) {
      case 'intro':
        this.updateIntro();
        break;
      case 'idle':
        this.updateIdle(dt);
        break;
      case 'attack':
        if (this.attack) {
          this.attack.t += dtMs;
          if (RB_ATTACKS[this.attack.kind](this, this.w, this.attack, dtMs)) this.endAttack();
        }
        this.x = Phaser.Math.Clamp(this.x + this.vx * dt, this.w.arena.left + 60, this.w.arena.right - 60);
        break;
      case 'stalled':
        this.updateStalled(dtMs);
        break;
      case 'seized':
        this.updateSeized(dtMs);
        break;
      case 'transform':
        this.updateTransform();
        break;
      case 'dying':
        this.updateDying(dtMs);
        break;
      default:
        break;
    }
    this.updateVent(dtMs);
    // Both tires gone: whatever it was doing, it spins out (the ram handles its own skid).
    if (this.mode === 'truck' && this.tiresPopped === 2 && (this.state === 'idle' || (this.state === 'attack' && !this.attack?.skids))) this.stall();
    if (this.pendingTransform && this.mode === 'truck' && (this.state === 'idle' || this.state === 'attack' || this.state === 'stalled') && this.stateT > 0) {
      this.startTransform();
    }
    this.render(dtMs);
  }

  private updateIntro(): void {
    // Leaps off the mesa into the arena, lands hard, revs.
    const LAND = 900;
    if (this.stateT < LAND) {
      const k = this.stateT / LAND;
      this.x = this.startX - 150 * k;
      this.airY = -230 * (1 - k) * (1 - k) - 30 * Math.sin(k * Math.PI) * (1 - k);
      this.spin = -0.25 * (1 - k);
      return;
    }
    if (this.airY !== 0) {
      this.airY = 0;
      this.spin = 0;
      const { fx } = this.w;
      fx.shake(FX.shakeHeavy, 500);
      fx.burst('dust', this.x, this.floorY - 2, 30);
      fx.burst('debris', this.x, this.floorY - 4, 16);
      fx.crack(this.x, this.floorY, 1);
      playSfx('slam');
      playSfx(crunch, 1, 0.8);
    }
    this.revving = this.stateT > LAND + 500;
    this.facing = this.w.player.x < this.x ? -1 : 1;
    if (this.stateT > LAND + 500 && this.stateT < LAND + 560) {
      playSfx('roar', 0.9);
      playSfx(horn, 1, 0.6);
    }
    if (this.stateT >= RB.introMs) {
      this.revving = false;
      this.enter('idle');
    }
  }

  private updateIdle(dt: number): void {
    const p = this.w.player;
    this.facing = p.x < this.x ? -1 : 1;
    if (this.mode === 'robot') {
      // Lumbers toward Ben between attacks.
      const gap = p.x - this.x;
      this.vx = Math.abs(gap) > 90 ? Math.sign(gap) * RB.robot.walkSpeed : 0;
      this.armAngle *= Math.exp(-6 * dt);
      this.crouch *= Math.exp(-6 * dt);
    } else {
      this.vx = 0;
    }
    this.x = Phaser.Math.Clamp(this.x + this.vx * dt, this.w.arena.left + 60, this.w.arena.right - 60);
    if (this.stateT >= pace.bossRest(RB.idleMs[this.phase])) this.startAttack();
  }

  private startAttack(): void {
    const truck = this.mode === 'truck';
    if (this.bag.length === 0) this.bag = Phaser.Utils.Array.Shuffle([...(truck ? TRUCK_BAG : ROBOT_BAG)]);
    let kind = this.bag.shift()!;
    // The key attack (the ram that exposes tires, the slam that opens the vents) never goes missing for long.
    const key: RbAttackKind = truck ? 'ram' : 'slam';
    if (kind !== key && this.sinceKey >= (truck ? 1 : 2)) {
      const i = this.bag.indexOf(key);
      if (i >= 0) this.bag.splice(i, 1);
      this.bag.unshift(kind);
      kind = key;
    }
    if (kind === 'dispatch' && this.w.aliveAdds() >= RB.maxAdds[this.phase]) kind = key;
    if (kind === 'saw' && this.shoulderGone.every((g) => g > 0)) kind = 'beam';
    this.sinceKey = kind === key ? 0 : this.sinceKey + 1;
    this.attack = newRbAttack(kind);
    this.enter('attack');
  }

  private endAttack(): void {
    this.attack = null;
    this.ramming = false;
    this.revving = false;
    this.dazed = false;
    this.vx = 0;
    this.shake = 0;
    this.spin = 0;
    this.enter('idle');
  }

  // ------------------------------------------------------------ Truck: stalls

  /** Both tires shredded: it slews to a stop and sits there smoking. */
  stall(): void {
    this.attack = null;
    this.ramming = false;
    this.revving = false;
    this.dazed = false;
    this.vx = 0;
    this.spin = 0;
    this.w.cancelThreat();
    this.enter('stalled');
    this.stallLeft = pace.punish(RB.truck.stallMs);
    this.w.fx.burst('smoke', this.x, this.floorY - 30, 16);
    this.w.fx.shake(FX.shakeMedium, 300);
    this.w.fx.popText(this.x, this.floorY - 76, 'STALLED!', PALETTE.fire1, 1.3);
    playSfx(crunch, 0.9, 0.7);
    this.w.tip('rbStalled', "IT'S STALLED! FOUR ARMS: {J} TO LIFT IT, {J} TO THROW!", 3500);
  }

  private updateStalled(dtMs: number): void {
    this.stallLeft -= dtMs;
    if (Math.random() < 0.3) this.w.fx.trail('smoke', this.x + (Math.random() - 0.5) * 60, this.floorY - 40);
    if (Math.random() < 0.15) this.w.fx.burst('spark', this.x + (Math.random() - 0.5) * 80, this.floorY - 20, 2);
    if (this.stallLeft > 0 || this.pendingTransform) return;
    this.flipped = false;
    // Fresh tires bolt on and it's back in business.
    for (const t of this.tires) {
      if (t.popped || !t.sprite.visible) t.restore();
    }
    this.w.fx.burst('spark', this.x, this.floorY - 12, 14);
    playSfx('clamp', 0.9);
    playSfx(horn, 0.8, 0.8);
    this.enter('idle');
  }

  // ------------------------------------------------------------ Robot: vents and seizing

  /** After a slam the radiator opens: fire builds heat until it seizes up. */
  openVents(): void {
    this.ventOpen = true;
    this.ventLeft = RB.robot.vent.openMs;
    this.heat = 0;
    playSfx('burn', 0.4, 1.4);
    this.w.tip('rbVent', 'ITS VENTS ARE OPEN! HEATBLAST CAN OVERHEAT IT!', 3000);
  }

  private updateVent(dtMs: number): void {
    if (!this.ventOpen) return;
    this.ventLeft -= dtMs;
    if (Math.random() < 0.35) this.w.fx.trail('smoke', this.x + (Math.random() - 0.5) * 20, this.torsoTop + 46);
    if (this.ventLeft <= 0) {
      this.ventOpen = false;
      this.heat = 0;
    }
  }

  private seize(): void {
    this.attack = null;
    this.vx = 0;
    this.ventOpen = false;
    this.heat = 0;
    this.armAngle = 0;
    this.fist.active = false;
    this.w.cancelThreat();
    this.enter('seized');
    this.w.time.slowMo(0.35, 400, 250);
    this.w.fx.explosion(this.x, this.torsoTop + 46, 'medium');
    this.w.fx.popText(this.x, this.torsoTop - 8, 'OVERHEATED!', PALETTE.fire2, 1.4);
    playSfx('bigExplode', 0.5);
    this.w.tip('rbSeized', "IT'S OVERHEATED! HIT IT WITH EVERYTHING!", 3000);
  }

  private updateSeized(dtMs: number): void {
    const T = pace.punish(RB.robot.vent.seizeMs);
    this.crouch += (20 - this.crouch) * 0.15;
    this.armAngle += (20 - this.armAngle) * 0.1;
    if (Math.random() < 0.4) this.w.fx.trail('smoke', this.x + (Math.random() - 0.5) * 50, this.torsoTop + 10);
    if (Math.random() < 0.2) this.w.fx.burst('spark', this.x + (Math.random() - 0.5) * 60, this.torsoTop + 30, 2);
    void dtMs;
    if (this.stateT >= T) this.enter('idle');
  }

  // ------------------------------------------------------------ Transformation

  private startTransform(): void {
    this.pendingTransform = false;
    this.flipped = false;
    this.attack = null;
    this.bag = [];
    this.sinceKey = 0;
    this.ramming = false;
    this.revving = false;
    this.dazed = false;
    this.vx = 0;
    this.spin = 0;
    this.w.cancelThreat();
    this.w.hazards.clear();
    this.w.projectiles.clear('enemy', true);
    for (const s of this.saws) s.burst();
    this.enter('transform');
    this.w.time.slowMo(0.3, 600, 400);
    playSfx('roar');
    this.w.fx.shake(FX.shakeHeavy, 700);
  }

  private updateTransform(): void {
    const t = this.stateT;
    const { fx } = this.w;
    const cx = (this.w.arena.left + this.w.arena.right) / 2;
    if (t < 700) {
      // Skids to the middle of the lot.
      this.x += (cx - this.x) * 0.06;
      this.shake = 2;
      if (Math.random() < 0.5) fx.burst('dust', this.x, this.floorY - 2, 2);
    } else if (t < 1200) {
      // Rears up on its back wheels.
      this.spin = -this.facing * 1.1 * ((t - 700) / 500);
      this.shake = 3;
    } else if (this.mode === 'truck') {
      this.mode = 'robot';
      this.phase = 1;
      this.spin = 0;
      this.shake = 0;
      this.truck.setVisible(false);
      for (const s of [this.legs, this.torso, ...this.arms]) s.setVisible(true).setScale(0.6);
      this.scene.tweens.add({ targets: [this.legs, this.torso, ...this.arms], scale: 1, duration: 380, ease: 'Back.easeOut' });
      for (const t2 of this.tires) t2.restore();
      for (const p of this.plates) p.attach(false);
      fx.flash(this.x, this.floorY - 50, PALETTE.white, 120, 300);
      fx.burst('debris', this.x, this.floorY - 50, 40);
      fx.burst('spark', this.x, this.floorY - 50, 30);
      fx.shake(FX.shakeHeavy, 500);
      playSfx('bigExplode', 0.7);
      playSfx('transformBoom', 0.6, 0.6);
      this.w.onPhase2();
    } else {
      // Chest plates clank on one at a time.
      this.plates.forEach((p, i) => {
        if (t > 1400 + i * 160 && !p.sprite.visible) {
          p.sprite.setVisible(true);
          fx.burst('spark', p.x, p.y, 6);
          playSfx('clamp', 0.8, 1 + i * 0.15);
        }
      });
      if (t > 1950 && t < 2010) {
        playSfx('roar', 1, 0.8);
        fx.ring(this.x, this.torsoTop + 6, PALETTE.enemy, 90, 500);
      }
    }
    if (t >= RB.transformMs) {
      for (const p of this.plates) p.sprite.setVisible(!p.broken);
      this.enter('idle');
    }
  }

  // ------------------------------------------------------------ Death

  private startDying(): void {
    this.w.cancelThreat();
    this.attack = null;
    this.ventOpen = false;
    this.fist.active = false;
    this.ramming = false;
    this.vx = 0;
    this.w.hazards.clear();
    this.w.projectiles.clear('enemy', true);
    for (const s of this.saws) s.burst();
    this.w.time.slowMo(0.25, RB.deathMs, 600);
    this.enter('dying');
    playSfx('roar', 1, 0.7);
  }

  private updateDying(dtMs: number): void {
    this.shake = 4;
    if (this.mode === 'robot') this.crouch = Math.min(26, this.crouch + 0.5);
    this.explodeTimer -= dtMs;
    const top = this.mode === 'robot' ? this.torsoTop : this.floorY - 56;
    if (this.explodeTimer <= 0) {
      this.explodeTimer = 140 + Math.random() * 120;
      this.w.fx.explosion(this.x + (Math.random() - 0.5) * 90, top + Math.random() * (this.floorY - top), Math.random() < 0.3 ? 'medium' : 'small');
      playSfx('explode', 0.8, 0.8 + Math.random() * 0.4);
    }
    if (this.stateT < RB.deathMs * 0.6) return;
    this.enter('dead');
    const cy = (top + this.floorY) / 2;
    const { fx } = this.w;
    fx.explosion(this.x, cy, 'big');
    fx.burst('debris', this.x, cy, 50);
    fx.burst('fire', this.x, cy, 60);
    fx.rays(this.x, cy, PALETTE.fire1, 300, 1200);
    fx.ring(this.x, cy, PALETTE.white, 220, 800);
    fx.light(this.x, cy, 400, PALETTE.fire1, 1500);
    playSfx('bigExplode');
    for (const s of [this.truck, this.legs, this.torso, ...this.arms, this.shadow]) s.setVisible(false);
    for (const t of this.tires) t.sprite.setVisible(false);
    for (const p of this.plates) p.sprite.setVisible(false);
    this.w.onDefeated(this.x, cy);
  }

  // ------------------------------------------------------------ Look

  private render(dtMs: number): void {
    if (this.state === 'dead') return;
    const sx = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 2 : 0;
    const x = Math.round(this.x + sx);
    const floor = this.floorY;
    const flash = this.flashLeft > 0;
    const { lighting } = this.w;
    const carried = this.state === 'held' || this.state === 'thrown';
    if (this.mode === 'truck') {
      if (!carried) {
        const frame = this.state === 'stalled' || this.dazed ? 3 : this.revving ? 2 : -1;
        if (frame >= 0) this.truck.stop().setFrame(frame);
        else if (Math.abs(this.vx) > 10 || this.state === 'intro') {
          if (!this.truck.anims.isPlaying) this.truck.play('rb-drive');
        } else this.truck.stop().setFrame(0);
        this.truck.setPosition(x, floor - 1 + Math.round(this.airY)).setFlipX(this.facing < 0).setRotation(this.spin);
        const spinning = Math.abs(this.vx) > 10 || this.state === 'intro';
        WHEEL_DX.forEach((dx, i) => {
          const t = this.tires[i];
          t.sprite.setDepth(DEPTH.boss + 1).setVisible(this.state !== 'dead');
          const rx = dx * this.facing;
          // Wheels follow the body when it rears up (transformation) or wobbles.
          const ry = -WHEEL_Y;
          const cos = Math.cos(this.spin);
          const sin = Math.sin(this.spin);
          t.place(x + rx * cos - ry * sin, floor - 1 + this.airY + rx * sin + ry * cos, spinning, dtMs);
        });
      }
      this.tintAll([this.truck], flash);
      if (!carried) {
        // Headlights and the core glaring through the windshield.
        lighting.add(x + this.facing * 70, floor - 34, this.revving ? 140 : 90, 0xfff0c0, this.revving ? 1 : 0.6);
        lighting.add(x + this.facing * 28, floor - 42, 26, PALETTE.enemy, 0.9);
      }
    } else {
      const torsoBottom = floor - LEGS_H + this.crouch;
      const walking = Math.abs(this.vx) > 5;
      if (this.state === 'seized' || this.state === 'dying') this.legs.stop().setFrame(3);
      else if (walking) {
        if (!this.legs.anims.isPlaying) this.legs.play('rb-walk');
      } else this.legs.stop().setFrame(0);
      this.legs.setPosition(x, floor).setFlipX(this.facing < 0);
      this.torso.setPosition(x, Math.round(torsoBottom)).setFlipX(this.facing < 0).setFrame(this.state === 'seized' ? 2 : this.ventOpen ? 1 : 0);
      const top = this.torsoTop;
      // Arms: both swing together; the back one sits a little behind.
      this.arms.forEach((arm, i) => {
        const side = i === 0 ? this.facing : -this.facing;
        arm.setPosition(x + side * SHOULDER_DX, top + 18).setAngle(this.armAngle * this.facing + (i === 0 ? 0 : -this.facing * 6)).setDepth(i === 0 ? DEPTH.boss + 3 : DEPTH.boss - 1);
      });
      // Shoulder wheels (the saw attack throws them).
      this.tires.forEach((t, i) => {
        const side = i === 0 ? this.facing : -this.facing;
        t.sprite.setDepth(DEPTH.boss).setVisible(this.shoulderGone[i] <= 0);
        t.place(x + side * (SHOULDER_DX + 2), top + 8, false, dtMs);
      });
      const core = { x, y: this.coreY };
      const offsets = [[-10, -6], [10, -6], [0, 8]] as const;
      this.plates.forEach((p, i) => p.place(core.x + offsets[i][0], core.y + offsets[i][1], dtMs));
      this.tintAll([this.legs, this.torso, ...this.arms], flash);
      lighting.add(x, top + 4, 40, PALETTE.enemy, 0.9);
      if (this.platesBroken === RB.robot.plates) lighting.add(core.x, core.y, 30, PALETTE.enemy, 1);
      if (this.ventOpen || this.state === 'seized') lighting.add(x, top + 46, 46, PALETTE.fire2, 1);
    }
    const shadowX = carried ? this.x : x;
    this.shadow.setPosition(shadowX, floor - 1).setScale(this.mode === 'truck' ? 3 : 2.2, 1).setAlpha(this.airY < 0 ? 0.25 : 0.5);
  }

  private tintAll(parts: Array<Phaser.GameObjects.Components.Tint>, flash: boolean): void {
    for (const p of parts) {
      if (flash) p.setTint(PALETTE.white).setTintMode(Phaser.TintModes.FILL);
      else if (this.state === 'seized') p.setTint(0xffb080).setTintMode(Phaser.TintModes.MULTIPLY);
      else p.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    }
  }

  /** Launches a wheel from the front shoulder (the saw attack). */
  throwWheel(): void {
    const i = this.shoulderGone[0] <= 0 ? 0 : 1;
    const saw = this.saws.find((s) => !s.rolling);
    if (!saw) return;
    this.shoulderGone[i] = RB.robot.saw.regrowMs + RB.robot.saw.lifeMs;
    saw.launch(this.x + this.facing * 40, this.facing);
  }

  /** The fists hit the floor at `fx`: blast, shockwaves both ways. */
  slamFloor(fistX: number): void {
    const { fx, hazards } = this.w;
    this.fist.x = fistX;
    this.fist.active = true;
    this.fist.life = 140;
    fx.explosion(fistX, this.floorY - 6, 'medium');
    fx.burst('dust', fistX, this.floorY - 2, 26);
    fx.burst('debris', fistX, this.floorY - 4, 14);
    fx.crack(fistX, this.floorY, 0.8);
    fx.shake(FX.shakeHeavy, 380);
    fx.hitStop(FX.hitStopHeavyMs);
    playSfx('slam');
    hazards.spawnShockwave(fistX - 30, -1);
    hazards.spawnShockwave(fistX + 30, 1);
  }

  destroy(): void {
    for (const s of [this.truck, this.legs, this.torso, ...this.arms, this.shadow]) s.destroy();
  }
}
