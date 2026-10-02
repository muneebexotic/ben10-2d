import Phaser from 'phaser';
import { CHASE, ROAD } from '../../../../config/chapter2';
import { DEPTH } from '../../../../config/constants';
import { WAVES } from '../../../../config/enemies';
import { TEX } from '../../../preload/assetKeys';
import type { Drone } from '../../../../entities/enemies/Drone';
import type { Hazard, Rect } from '../../../../entities/types';
import type { ChaseWorld } from '../../../../entities/vehicles/chaseWorld';
import { RoadJunk, type JunkKind } from '../../../../entities/vehicles/RoadJunk';
import type { Rustbucket } from '../../../../entities/vehicles/Rustbucket';
import type { DroneKind } from '../../../../levels/types';
import { playSfx } from '../../../../systems/audio/Sfx';
import { pothole as potholeSound } from '../../../../entities/vehicles/audio';
import { RoadScroller } from '../RoadScroller';
import type { StoryKit } from '../StoryKit';

/** A short explosion on the roof (a shell or a barrel going off). */
class RoofBlast implements Hazard {
  active = false;
  damage = 1;
  x = 0;
  y = 0;
  r = 0;
  life = 0;
  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    out.x = this.x - this.r;
    out.y = this.y - this.r * 1.4;
    out.w = this.r * 2;
    out.h = this.r * 1.4;
    return true;
  }
  onHitPlayer(): void {
    this.active = false;
  }
}

export type WaveFrom = 'left' | 'right' | 'above';

/**
 * The chase's moving set: the Rustbucket parked mid-arena while the road
 * rushes past (a treadmill), its roof as a platform with rails at both ends,
 * the camera framing it, and everything that happens on and around the roof
 * (junk, blasts, escort drones). Stages (ride, convoy, hauler) drive it.
 */
export class ChaseRig implements ChaseWorld {
  readonly road: RoadScroller;
  readonly junk: RoadJunk[] = [];
  readonly drones: Drone[] = [];
  private readonly rails: Phaser.Physics.Arcade.Image[] = [];
  private readonly colliders: Phaser.Physics.Arcade.Collider[] = [];
  private readonly blasts: RoofBlast[] = [];
  private rampT = 0;
  private chaseT = 0;

  constructor(
    private readonly kit: StoryKit,
    readonly rv: Rustbucket,
    arenaX: number,
    roadY: number,
    rampFromZero: boolean,
  ) {
    const { scene, player, world, combat } = kit;
    rv.moveTo(arenaX, roadY);
    rv.sprite.setVisible(true).setDepth(DEPTH.terrain + 5);
    rv.setBraking(false);
    rv.setDriving(true);
    rv.enableRoof(player.zone);
    world.addSolid(rv.roofRect);
    for (const x of [rv.roofLeft, rv.roofRight - 4]) {
      const rail = scene.physics.add.staticImage(x + 2, rv.roofY - CHASE.railHeight / 2, TEX.whitePx).setVisible(false);
      rail.setDisplaySize(4, CHASE.railHeight).refreshBody();
      this.rails.push(rail);
      this.colliders.push(scene.physics.add.collider(player.zone, rail));
    }
    for (let i = 0; i < 4; i++) {
      const b = new RoofBlast();
      this.blasts.push(b);
      combat.addHazard(b);
    }
    this.road = new RoadScroller(scene, kit.fx, kit.backdrop, arenaX, roadY);
    this.road.speed = rampFromZero ? 0 : ROAD.cruiseSpeed;
    this.rampT = rampFromZero ? 0 : CHASE.rampMs;
    kit.camera.lockTo(arenaX - CHASE.cameraBehind, roadY - CHASE.cameraAbove);
    kit.camera.snap(arenaX - CHASE.cameraBehind, roadY - CHASE.cameraAbove + 62);
  }

  // ------------------------------------------------------------ ChaseWorld

  now(): number {
    return this.kit.now();
  }

  get fx() {
    return this.kit.fx;
  }

  get lighting() {
    return this.kit.lighting;
  }

  get telegraph() {
    return this.kit.telegraph;
  }

  get projectiles() {
    return this.kit.projectiles;
  }

  get player() {
    return this.kit.player;
  }

  get roadSpeed(): number {
    return this.road.speed;
  }

  get night(): number {
    return this.kit.backdrop?.timeOfDay ?? 1;
  }

  blast(x: number, y: number, radius: number, damage: number): void {
    const b = this.blasts.find((it) => !it.active);
    this.kit.fx.explosion(x, y - 4, 'small');
    playSfx('explode', 0.6, 1.1);
    if (!b) return;
    Object.assign(b, { active: true, x, y, r: radius, damage, life: 140 });
  }

  threat(key: object, at: number): void {
    this.kit.threat(key, at);
  }

  cancelThreat(key: object): void {
    this.kit.cancelThreat(key);
  }

  // ------------------------------------------------------------ Helpers for the stages

  /** Ben is standing on the roof (not jumping, not fallen off). */
  get onRoof(): boolean {
    const p = this.kit.player;
    return !p.dead && p.grounded && Math.abs(p.y - this.rv.roofY) < 3;
  }

  /** The RV gets hit from behind (a ram or a yank): whoever stands at the back is hurt and flung forward. */
  jolt(zoneW: number, damage: number, kick: { x: number; y: number }): void {
    const { player, fx } = this.kit;
    const rv = this.rv;
    rv.bump();
    fx.shake(0.012, 260);
    if (!this.onRoof) return;
    if (player.x < rv.roofLeft + zoneW) {
      const outcome = player.takeDamage(damage, rv.rearX - 40, 'contact');
      if (outcome.applied) this.kit.onPlayerHurt(outcome);
      player.setVelocity(kick.x, kick.y);
    } else {
      player.setVelocityY(-110);
    }
  }

  /** A pothole: the whole RV bucks and everyone standing on it gets tossed up. */
  pothole(kick: number): void {
    this.rv.bump();
    this.kit.fx.shake(0.01, 200);
    this.kit.fx.burst('dust', this.rv.x - 40, this.rv.roadY - 2, 10);
    playSfx(potholeSound);
    if (this.onRoof) this.kit.player.setVelocityY(kick);
    for (const j of this.junk) if (j.onRoof) j.y -= 2;
  }

  spawnJunk(kind: JunkKind, from: { x: number; y: number }, landX: number): RoadJunk {
    const j = new RoadJunk(this.kit.scene, this, kind, from, landX);
    this.junk.push(j);
    this.kit.combat.addTarget(j);
    this.kit.combat.addHazard(j);
    if (kind === 'barrel') this.kit.combat.addLiftable(j);
    return j;
  }

  /** An escort drone flying in from off screen to a spot around the RV (dx, dy from the roof's centre). */
  spawnDrone(kind: DroneKind, from: WaveFrom, dx: number, dy: number, index: number): Drone {
    const view = this.kit.scene.cameras.main.worldView;
    const rv = this.rv;
    const hx = (rv.roofLeft + rv.roofRight) / 2 + dx;
    const hy = rv.roofY + dy;
    const x = from === 'right' ? view.right + 30 + index * 20 : from === 'left' ? view.x - 30 - index * 20 : hx;
    const y = from === 'above' ? view.y - 30 - index * 16 : hy;
    const d = this.kit.spawnDrone(kind, x, y, { delayMs: WAVES.firstAttackMs + index * WAVES.staggerMs });
    d.homeX = hx;
    d.homeY = hy;
    this.drones.push(d);
    return d;
  }

  get aliveDrones(): number {
    return this.drones.filter((d) => d.alive).length;
  }

  /** Real milliseconds the RV has been rolling (the sky darkens with it). */
  get elapsed(): number {
    return this.chaseT;
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number): void {
    const { kit, rv } = this;
    const dt = dtMs / 1000;
    this.chaseT += dtMs;
    if (this.rampT < CHASE.rampMs) {
      this.rampT += dtMs;
      this.road.speed = ROAD.cruiseSpeed * Phaser.Math.Easing.Quadratic.In(Math.min(1, this.rampT / CHASE.rampMs));
    }
    const view = kit.scene.cameras.main.worldView;
    this.road.update(dtMs, view);
    rv.update(dtMs, kit.fx, kit.lighting, this.night);
    if (kit.backdrop) kit.backdrop.override = CHASE.skyFrom + (CHASE.skyTo - CHASE.skyFrom) * Math.min(1, this.chaseT / 100_000);

    for (const b of this.blasts) {
      if (!b.active) continue;
      b.life -= dtMs;
      if (b.life <= 0) b.active = false;
    }
    for (let i = this.junk.length - 1; i >= 0; i--) {
      const j = this.junk[i];
      j.update(dtMs);
      if (!j.gone) continue;
      this.forgetJunk(j);
      this.junk.splice(i, 1);
    }
    // Drones knocked down onto the asphalt are left behind.
    for (const d of this.drones) {
      if (!d.alive || !(d.downed || d.state === 'stuck') || d.y < rv.roofY + 20) continue;
      d.x -= this.road.speed * dt;
      if (d.x < view.x - 30) d.vanish();
    }
    this.checkFall();
  }

  private checkFall(): void {
    const { player } = this.kit;
    const rv = this.rv;
    if (player.dead || !player.controlsEnabled) return;
    if (player.y > rv.roofY + CHASE.fallBelowRoof) {
      this.kit.rescue(Phaser.Math.Clamp(player.x, rv.roofLeft + 24, rv.roofRight - 24), rv.roofY);
      this.kit.speech.show('WHOA! ALMOST LOST ME THERE!', 1400);
    }
  }

  private forgetJunk(j: RoadJunk): void {
    const { combat } = this.kit;
    combat.removeTarget(j);
    combat.removeHazard(j);
    combat.removeLiftable(j);
    j.destroy();
  }

  /** Puts Ben on the roof (a restart mid-chase, or boarding). */
  placePlayer(): void {
    const rv = this.rv;
    const x = rv.roofLeft + (rv.roofRight - rv.roofLeft) * 0.55;
    this.kit.player.teleport(x, rv.roofY);
    this.kit.player.setVelocity(0, 0);
  }

  destroy(): void {
    const { kit } = this;
    this.road.destroy();
    for (const r of this.rails) r.destroy();
    for (const c of this.colliders) c.destroy();
    this.rails.length = 0;
    for (const b of this.blasts) kit.combat.removeHazard(b);
    for (const j of this.junk) this.forgetJunk(j);
    this.junk.length = 0;
    for (const d of this.drones) d.vanish();
    this.rv.disableRoof();
    kit.world.removeSolid(this.rv.roofRect);
    kit.camera.unlock();
    if (kit.backdrop) kit.backdrop.override = null;
  }
}
