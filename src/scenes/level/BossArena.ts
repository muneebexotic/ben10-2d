import Phaser from 'phaser';
import { BOSS } from '../../config/boss';
import { DEPTH, LIGHTING, TILE } from '../../config/constants';
import type { DroneKind, EntitySpawn } from '../../levels/types';
import { BossHazards } from '../../entities/bosses/BossHazards';
import { HunterDrone, type BossWorld } from '../../entities/bosses/HunterDrone';
import type { Player } from '../../entities/Player';
import type { Projectiles } from '../../entities/Projectiles';
import type { Telegraphs } from '../../entities/enemies/Telegraphs';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import type { TimeController } from '../../systems/TimeController';
import { EventBus } from '../../systems/EventBus';
import { music } from '../../systems/audio/Music';
import { playSfx } from '../../systems/audio/Sfx';
import { TEX } from '../preload/assetKeys';
import type { CameraRig } from './CameraRig';
import type { Combat } from './Combat';

type BossSpawn = Extract<EntitySpawn, { type: 'boss' }>;

export interface ArenaDeps {
  scene: Phaser.Scene;
  player: Player;
  fx: Fx;
  lighting: Lighting;
  telegraph: Telegraphs;
  projectiles: Projectiles;
  time: TimeController;
  combat: Combat;
  camera: CameraRig;
  now(): number;
  spawnAdd(kind: DroneKind, x: number, y: number): void;
  aliveAdds(): number;
  dropPickup(x: number, y: number): void;
  setAlarm(on: boolean): void;
  onStart(left: number, right: number): void;
  onDefeated(x: number, y: number): void;
}

/** Locks Ben into the crash site, runs the boss intro and hands the fight to the HunterDrone. */
export class BossArena {
  started = false;
  boss: HunterDrone | null = null;
  private hazards: BossHazards | null = null;
  private readonly walls: Phaser.Physics.Arcade.Image[] = [];
  private readonly wallSprites: Phaser.GameObjects.Sprite[] = [];
  private readonly left: number;
  private readonly right: number;
  private readonly floorY: number;

  constructor(
    private readonly spawn: BossSpawn,
    private readonly d: ArenaDeps,
  ) {
    this.left = spawn.arenaFrom * TILE;
    this.right = spawn.arenaTo * TILE;
    this.floorY = 24 * TILE;
  }

  get fighting(): boolean {
    return this.started && this.boss !== null && !this.boss.defeated;
  }

  update(dtMs: number): void {
    if (!this.started) {
      if (this.d.player.x >= this.spawn.triggerX * TILE && !this.d.player.dead) this.start();
      return;
    }
    this.boss?.update(dtMs);
    this.hazards?.update(dtMs, this.d.now());
    for (const s of this.wallSprites) {
      if (s.visible) this.d.lighting.add(s.x, s.y, 36, 0xff3048, 0.6);
    }
  }

  private start(): void {
    const d = this.d;
    const { scene, combat, camera } = d;
    this.started = true;

    for (const x of [this.left + 4, this.right - 4]) {
      const top = this.floorY - 14 * TILE;
      const wall = scene.physics.add.staticImage(x, top + 7 * TILE, TEX.whitePx).setVisible(false);
      wall.setDisplaySize(8, 14 * TILE).refreshBody();
      scene.physics.add.collider(this.d.player.zone, wall);
      this.walls.push(wall);
      for (let y = top; y < this.floorY; y += TILE) {
        const s = scene.add.sprite(x, y + 8, TEX.arenaWall, 0).setDepth(DEPTH.emissive).setBlendMode(Phaser.BlendModes.ADD);
        s.play('arena-hum');
        s.setScale(1, 0);
        scene.tweens.add({ targets: s, scaleY: 1, duration: 300, delay: (this.floorY - y) * 2 });
        this.wallSprites.push(s);
      }
    }
    playSfx('gateDown', 0.8, 1.4);
    d.onStart(this.left, this.right);

    camera.lockTo((this.left + this.right) / 2, this.floorY - 112);
    this.hazards = new BossHazards(scene, this.floorY, this.d.fx, this.d.lighting, this.d.telegraph);
    for (const h of this.hazards.all()) combat.addHazard(h);

    const world: BossWorld = {
      get now() {
        return d.now();
      },
      fx: this.d.fx,
      lighting: this.d.lighting,
      telegraph: this.d.telegraph,
      projectiles: this.d.projectiles,
      hazards: this.hazards,
      time: this.d.time,
      player: this.d.player,
      arena: { left: this.left + 8, right: this.right - 8, floorY: this.floorY, top: this.floorY - 16 * TILE },
      spawnAdd: (kind, x, y) => this.d.spawnAdd(kind, x, y),
      aliveAdds: () => this.d.aliveAdds(),
      dropPickup: (x, y) => this.d.dropPickup(x, y),
      onPhase2: () => {
        this.d.setAlarm(true);
        EventBus.emit('hud:banner', { title: 'IT\'S ANGRY NOW!', color: 0xff3048, durationMs: 1400, style: 'slam' });
      },
      onHealth: (ratio, phase) => EventBus.emit('boss:health', { ratio, phase }),
      onDefeated: (x, y) => this.defeated(x, y),
    };
    this.boss = new HunterDrone(scene, world, (this.left + this.right) / 2);
    combat.addTarget(this.boss);
    combat.addHazard(this.boss);

    music.play('boss');
    EventBus.emit('boss:show', { name: BOSS.name, subtitle: BOSS.subtitle });
    EventBus.emit('boss:health', { ratio: 1, phase: 0 });
    EventBus.emit('hud:letterbox', { visible: true });
    scene.time.delayedCall(BOSS.introMs - 400, () => EventBus.emit('hud:letterbox', { visible: false }));
    this.d.lighting.setAmbient(LIGHTING.ambientCrash, 600);
  }

  private defeated(x: number, y: number): void {
    this.hazards?.clear();
    this.d.setAlarm(false);
    for (const w of this.walls) w.disableBody(true, true);
    for (const s of this.wallSprites) s.setVisible(false);
    EventBus.emit('boss:hide');
    this.d.onDefeated(x, y);
  }
}
