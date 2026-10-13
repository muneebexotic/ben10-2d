import Phaser from 'phaser';
import { TILE } from '../../config/constants';
import type { DamageOutcome, Player } from '../../entities/Player';
import type { Projectiles } from '../../entities/Projectiles';
import type { Telegraphs } from '../../entities/enemies/Telegraphs';
import { Blasts } from '../../entities/hazards/Blasts';
import { Dynamite } from '../../entities/hazards/Dynamite';
import { LaserGrid, type GateSpec, type LaserSpec, type ReceiverSpec } from '../../entities/hazards/LaserGrid';
import { Missiles } from '../../entities/hazards/Missiles';
import { PhaseWalls, type PhaseWallSpec } from '../../entities/hazards/PhaseWalls';
import { Rockfalls, type RockfallZone } from '../../entities/hazards/Rockfalls';
import type { LevelData } from '../../levels/types';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import type { Combat } from './Combat';
import type { LevelWorld } from './LevelWorld';

export interface HazardDeps {
  scene: Phaser.Scene;
  level: LevelData;
  world: LevelWorld;
  fx: Fx;
  lighting: Lighting;
  telegraph: Telegraphs;
  projectiles: Projectiles;
  combat: Combat;
  player: Player;
  /** Where play resumes (px): what's behind it was already dealt with. */
  resumeX: number;
  onPlayerHurt(outcome: DamageOutcome): void;
  onGateOpened(id: string): void;
  /** Ben poked dynamite with something that doesn't light it. */
  onDud(): void;
  threat(key: object, at: number): void;
}

/** The kinds of level entity this system builds (the level only creates it when one of them is there, or a hunter needs missiles). */
export const HAZARD_ENTITY_TYPES = ['phaseWall', 'dynamite', 'rockfall', 'laser', 'receiver', 'crystalGate'] as const;

/**
 * Chapter 5's hazards, usable in any level: Sixsix's missile strikes,
 * dynamite, falling rocks, phase walls (Ghostfreak) and security lasers with
 * receivers and crystal gates (Diamondhead). Older chapters use the last two
 * for the secrets the new aliens open.
 */
export class HazardSystem {
  readonly blasts = new Blasts();
  readonly missiles: Missiles;
  readonly rockfalls: Rockfalls;
  readonly phaseWalls: PhaseWalls;
  readonly lasers: LaserGrid;
  readonly dynamite: Dynamite[] = [];
  private now = 0;

  constructor(private readonly d: HazardDeps) {
    const { scene, level, world, fx, lighting, telegraph, projectiles, combat, player } = d;
    for (const b of this.blasts.items) combat.addHazard(b);
    const behind = (tx: number) => d.resumeX > 0 && tx * TILE < d.resumeX - TILE;
    const view = scene.cameras.main.worldView;
    const blastEnemies = (x: number, y: number, radius: number, damage = 2) =>
      combat.blast(x, y, radius, { damage, kind: 'burst', x, y: y + 4, knockback: 220, heavy: true }, false);

    this.missiles = new Missiles({
      fx, lighting, telegraph, projectiles, blasts: this.blasts, view,
      blastEnemies: (x, y, r) => blastEnemies(x, y, r),
      onExplode: (x, y, r) => this.lightNear(x, y, r),
      threat: d.threat,
    });

    const zones: RockfallZone[] = [];
    const walls: PhaseWallSpec[] = [];
    const lasers: LaserSpec[] = [];
    const receivers: ReceiverSpec[] = [];
    const gates: GateSpec[] = [];
    const opened: string[] = [];
    for (const e of level.entities) {
      switch (e.type) {
        case 'rockfall':
          zones.push(e);
          break;
        case 'phaseWall':
          walls.push(e);
          break;
        case 'laser':
          lasers.push(e);
          break;
        case 'receiver':
          receivers.push(e);
          break;
        case 'crystalGate':
          gates.push(e);
          if (behind(e.x + e.w)) opened.push(e.id);
          break;
        case 'dynamite':
          // A restart past it: the rock it was stacked against is already gone.
          if (behind(e.x)) {
            if (e.breaks) world.clearCells(e.breaks);
            break;
          }
          this.dynamite.push(
            new Dynamite(scene, e.id, e.x, e.y, e.breaks, {
              fx, lighting,
              blastEnemies: (x, y, r, dmg) => blastEnemies(x, y, r, dmg),
              hurtPlayer: (x, y, r, dmg) => this.blasts.add(x, y, r, dmg),
              clearRock: (rect) => world.clearCells(rect),
              onExplode: (x, y, r) => this.lightNear(x, y, r),
              onDud: d.onDud,
            }),
          );
          break;
        default:
          break;
      }
    }
    for (const dyn of this.dynamite) combat.addTarget(dyn);

    this.rockfalls = new Rockfalls(scene, zones, {
      fx, telegraph,
      groundBelow: (x, y) => world.groundBelow(x, y),
      playerX: () => player.x,
      blastEnemies: (x, y, r, dmg) => blastEnemies(x, y, r, dmg),
    }, (h) => combat.addHazard(h));

    this.phaseWalls = new PhaseWalls(scene, walls, player, fx, lighting, (r) => world.addSolid(r));

    this.lasers = new LaserGrid(scene, lasers, receivers, gates, {
      fx, lighting,
      isSolid: (x, y) => world.isSolid(x, y),
      mirror: () => player.mirror,
      playerBox: (out) => (player.dead || player.phased ? null : player.hurtbox(out)),
      hurtPlayer: (damage, fromX) => {
        const outcome = player.takeDamage(damage, fromX, 'shot');
        d.onPlayerHurt(outcome);
      },
      addSolid: (r) => world.addSolid(r),
      removeSolid: (r) => world.removeSolid(r),
      onGateOpened: (id) => d.onGateOpened(id),
    }, opened);
    for (const body of this.lasers.gateBodies) scene.physics.add.collider(player.zone, body);
  }

  /** Sixsix's salvo on (x, floorY). */
  salvo(x: number, floorY: number, count?: number, spread?: number, warnMs?: number): void {
    this.missiles.salvo(x, floorY, count, spread, warnMs, undefined, (sx) => this.d.world.groundBelow(sx, floorY - 24));
  }

  /** A blast lights any dynamite it reaches. */
  private lightNear(x: number, y: number, radius: number): void {
    for (const dyn of this.dynamite) if (dyn.alive && !dyn.lit && dyn.near(x, y, radius)) dyn.light(250);
  }

  update(dtMs: number): void {
    this.now += dtMs;
    this.blasts.update(dtMs);
    this.missiles.update(dtMs);
    this.rockfalls.update(dtMs, this.now);
    this.phaseWalls.update(this.now);
    this.lasers.update(dtMs, this.d.scene.cameras.main.worldView);
    for (const dyn of this.dynamite) dyn.update(dtMs, this.now);
  }

  destroy(): void {
    this.missiles.clear();
    this.rockfalls.clear();
    this.blasts.clear();
    this.phaseWalls.destroy();
    this.lasers.destroy();
    for (const dyn of this.dynamite) dyn.destroy();
  }
}
