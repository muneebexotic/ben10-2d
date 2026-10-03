import type Phaser from 'phaser';
import { TILE } from '../../config/constants';
import type { Player } from '../../entities/Player';
import type { Projectiles } from '../../entities/Projectiles';
import { GlassFloor } from '../../entities/museum/GlassFloor';
import { HiddenDoor } from '../../entities/museum/HiddenDoor';
import { Puddles } from '../../entities/museum/Puddles';
import { Vines } from '../../entities/museum/Vines';
import type { EntitySpawn, LevelData } from '../../levels/types';
import { autotile, cellAt, type TileGrid } from '../../levels/buildLevel';
import { CELL, isSolidCell } from '../../levels/tiles';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import type { Combat } from './Combat';
import type { LevelWorld } from './LevelWorld';

export interface SpecialTerrainDeps {
  scene: Phaser.Scene;
  level: LevelData;
  world: LevelWorld;
  fx: Fx;
  lighting: Lighting;
  combat: Combat;
  projectiles: Projectiles;
  player: Player;
  /** The tileset hidden doors are disguised as. */
  tilesKey: string;
  onSecretFound(id: string): void;
}

/**
 * The tiles a hidden door's cells would show if they were ordinary terrain:
 * fill the door with whatever it's set into (rock or ground, by majority of
 * its neighbours) and autotile, so it matches the wall around it.
 */
function disguise(grid: TileGrid, door: Extract<EntitySpawn, { type: 'hiddenDoor' }>): number[][] {
  let ground = 0;
  let rock = 0;
  for (let y = door.y - 1; y <= door.y + door.h; y++) {
    for (let x = door.x - 1; x <= door.x + door.w; x++) {
      const c = cellAt(grid, x, y);
      if (c === CELL.GROUND) ground++;
      else if (c === CELL.ROCK) rock++;
    }
  }
  const fill = ground > rock ? CELL.GROUND : CELL.ROCK;
  const cells = grid.cells.map((row) => [...row]);
  for (let y = door.y; y < door.y + door.h; y++) for (let x = door.x; x < door.x + door.w; x++) if (!isSolidCell(cells[y][x])) cells[y][x] = fill;
  const frames = autotile({ width: grid.width, height: grid.height, cells });
  return Array.from({ length: door.h }, (_, j) => Array.from({ length: door.w }, (_, i) => frames[door.y + j][door.x + i]));
}

/**
 * Terrain that changes during play: hidden doors a sensing form opens,
 * mutant vines fire burns away, skylight glass a big smash breaks, and the
 * mutagen puddles spit leaves behind. Each blocks like terrain until it's gone.
 */
export class SpecialTerrain {
  readonly doors: HiddenDoor[] = [];
  readonly vines: Vines[] = [];
  readonly glass: GlassFloor[] = [];
  readonly puddles: Puddles;

  constructor(private readonly d: SpecialTerrainDeps) {
    const { scene, level, world, fx, combat, player } = d;
    for (const e of level.entities) {
      if (e.type === 'hiddenDoor') {
        const door = new HiddenDoor(scene, e.id, e.x, e.y, e.w, e.h, fx, d.tilesKey, disguise(world.grid, e));
        world.addSolid(door.rect);
        scene.physics.add.collider(player.zone, door.body);
        door.onOpened = () => {
          world.removeSolid(door.rect);
          d.onSecretFound(e.id);
        };
        this.doors.push(door);
      } else if (e.type === 'vines') {
        const v = new Vines(scene, e.id, e.x, e.y, e.w, e.h, fx);
        combat.addTarget(v);
        scene.physics.add.collider(player.zone, v.body);
        this.vines.push(v);
      } else if (e.type === 'glassFloor') {
        const g = new GlassFloor(scene, e.id, e.x, e.y, e.w, fx);
        world.addSolid(g.rect);
        combat.addTarget(g);
        scene.physics.add.collider(player.zone, g.body);
        g.onBroken = () => world.removeSolid(g.rect);
        this.glass.push(g);
      }
    }
    this.puddles = new Puddles(scene);
    combat.addHazard(this.puddles);
    // Enemy mutagen spit that hits the floor leaves a stinging puddle.
    d.projectiles.onImpact = (p) => {
      if (p.kind !== 'spit' || p.team !== 'enemy') return;
      const floor = world.groundBelow(p.x, p.y - 4);
      if (floor - p.y < TILE * 1.5 && world.liquidAt(p.x, floor) === null) this.puddles.spill(p.x, floor);
    };
  }

  update(dtMs: number): void {
    const p = this.d.player;
    for (const door of this.doors) door.update(dtMs, p.x, p.centerY, p.senseRadius);
    for (const v of this.vines) v.update(dtMs);
    this.puddles.update(dtMs, this.d.lighting);
  }

  /** A door some set piece opens itself. */
  openDoor(id: string): void {
    this.doors.find((door) => door.id === id)?.openNow();
  }
}
