import Phaser from 'phaser';
import { CAMERA, DEPTH, LIGHTING, TILE } from '../../config/constants';
import type { EnemyKind, EntitySpawn } from '../../levels/types';
import { BossHazards } from '../../entities/bosses/BossHazards';
import type { BossWorld } from '../../entities/bosses/HunterDrone';
import type { ArenaBoss } from '../../entities/bosses/ArenaBoss';
import { BOSS_KINDS } from '../../entities/bosses/bossKinds';
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
import type { Controls } from '../../systems/InputMap';
import type { Machine } from '../../entities/tech/Machine';
import { VilgaxHologram } from './VilgaxHologram';
import { inputMode } from '../../systems/InputMode';

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
  spawnAdd(kind: EnemyKind, x: number, y: number): void;
  aliveAdds(): number;
  dropPickup(x: number, y: number): void;
  setAlarm(on: boolean): void;
  onStart(left: number, right: number): void;
  onDefeated(x: number, y: number): void;
  threat(key: object, at: number): void;
  cancelThreat(key: object): void;
  /** Ben's world speech bubble. */
  say(text: string, ms: number): void;
  /** The Vilgax hologram plays once per run. */
  hologramSeen(): boolean;
  onHologramSeen(): void;
  /** A hint at the bottom of the screen (once per id). */
  tip(id: string, text: string, ms: number): void;
  /** A conversation in the dialogue box (bosses with their own speaker). */
  dialogue(lines: ReadonlyArray<{ who: string; text: string; ms: number }>, onDone: () => void): void;
  /** Ben's form right now ('ben' when human). */
  playerForm(): string;
  drainAlienTime(ms: number): void;
  addMachine(m: Machine): void;
  copies(list: ReadonlyArray<{ id: string; level: number }>, current: string | null): void;
  achievement(id: string): void;
}

/** Locks Ben into the boss's arena, runs Vilgax's hologram and the boss's entrance, then hands over the fight. */
export class BossArena {
  started = false;
  boss: ArenaBoss | null = null;
  private hazards: BossHazards | null = null;
  private hologram: VilgaxHologram | null = null;
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
    this.floorY = (spawn.floor ?? 24) * TILE;
  }

  private get kind() {
    return BOSS_KINDS[this.spawn.kind ?? 'hunter'];
  }

  get fighting(): boolean {
    return this.started && this.boss !== null && !this.boss.defeated;
  }

  /** From the walls going up until the boss has finished its entrance (no misfires in here). */
  get introducing(): boolean {
    return this.started && !this.boss?.defeated && (this.hologram !== null || this.boss === null || this.boss.introducing);
  }

  /** True while the Vilgax hologram plays: the world holds still and the run timer pauses. */
  get cinematic(): boolean {
    return this.hologram !== null;
  }

  update(dtMs: number, realDtMs: number, controls: Controls): void {
    if (!this.started) {
      if (this.d.player.x >= this.spawn.triggerX * TILE && !this.d.player.dead) this.start();
      return;
    }
    if (this.hologram) {
      this.hologram.update(realDtMs, controls);
      if (this.hologram.done) {
        this.hologram = null;
        this.d.player.controlsEnabled = true;
        this.beginBoss();
      }
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

    camera.lockTo((this.left + this.right) / 2, this.floorY - (inputMode.current === 'touch' ? CAMERA.arenaLockAboveTouch : CAMERA.arenaLockAbove));
    this.hazards = new BossHazards(scene, this.floorY, this.d.fx, this.d.lighting, this.d.telegraph);
    for (const h of this.hazards.all()) combat.addHazard(h);
    EventBus.emit('hud:letterbox', { visible: true });
    this.d.lighting.setAmbient(LIGHTING.ambientCrash, 600);

    if (!d.hologramSeen() && this.kind.hologram.length > 0) {
      d.onHologramSeen();
      d.player.controlsEnabled = false;
      d.player.setVelocityX(0);
      music.stop(500);
      const { hologram: lines, portrait } = this.kind;
      this.hologram = new VilgaxHologram({ scene, fx: d.fx, lighting: d.lighting, say: (t, ms) => d.say(t, ms), lines, portrait }, (this.left + this.right) / 2, this.floorY);
    } else {
      this.beginBoss();
    }
  }

  /** The boss makes its entrance: boss bar, music, and the fight starts after its intro. */
  private beginBoss(): void {
    const d = this.d;
    const { scene, combat } = d;
    const hazards = this.hazards!;

    const world: BossWorld = {
      get now() {
        return d.now();
      },
      fx: this.d.fx,
      lighting: this.d.lighting,
      telegraph: this.d.telegraph,
      projectiles: this.d.projectiles,
      hazards,
      time: this.d.time,
      player: this.d.player,
      arena: { left: this.left + 8, right: this.right - 8, floorY: this.floorY, top: this.floorY - 16 * TILE },
      spawnAdd: (kind, x, y) => this.d.spawnAdd(kind, x, y),
      aliveAdds: () => this.d.aliveAdds(),
      dropPickup: (x, y) => this.d.dropPickup(x, y),
      onPhase2: () => {
        this.d.setAlarm(true);
        EventBus.emit('hud:banner', { title: this.boss?.phase2Title ?? '', color: 0xff3048, durationMs: 1400, style: 'slam' });
      },
      onHealth: (ratio, phase) => EventBus.emit('boss:health', { ratio, phase }),
      onDefeated: (x, y) => this.defeated(x, y),
      threat: (at) => this.d.threat(this, at),
      cancelThreat: () => this.d.cancelThreat(this),
      tip: (id, text, ms) => this.d.tip(id, text, ms),
      introSeen: d.hologramSeen(),
      dialogue: (lines, onDone) => d.dialogue(lines, onDone),
      holdPlayer: (on) => {
        d.player.controlsEnabled = !on;
        if (on) d.player.setVelocityX(0);
      },
      playerForm: () => d.playerForm(),
      drainAlienTime: (ms) => d.drainAlienTime(ms),
      addMachine: (m) => d.addMachine(m),
      copies: (list, current) => d.copies(list, current),
      achievement: (id) => d.achievement(id),
    };
    if (this.kind.hologram.length === 0) d.onHologramSeen();
    const boss = this.kind.create(scene, world, (this.left + this.right) / 2);
    this.boss = boss;
    combat.addTarget(boss);
    combat.addHazard(boss);
    for (const t of boss.extraTargets) combat.addTarget(t);
    for (const h of boss.extraHazards) combat.addHazard(h);
    for (const l of boss.liftables) combat.addLiftable(l);

    music.play(this.kind.music);
    EventBus.emit('boss:show', { name: boss.name, subtitle: boss.subtitle });
    EventBus.emit('boss:health', { ratio: 1, phase: 0 });
    EventBus.emit('hud:letterbox', { visible: true });
    const clearLetterbox = () => {
      if (boss.introducing) scene.time.delayedCall(100, clearLetterbox);
      else EventBus.emit('hud:letterbox', { visible: false });
    };
    scene.time.delayedCall(600, clearLetterbox);
  }

  destroy(): void {
    if (this.hologram) EventBus.emit('hud:dialogClear');
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
