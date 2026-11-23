import type Phaser from 'phaser';
import { RollGate } from '../../entities/props/RollGate';
import { playSfx } from '../../systems/audio/Sfx';
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
  /** Aliens on the dial (a ball gate only shows once the alien it waits for is). */
  aliens: readonly string[];
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
const GATE_BREAK_SPEED = 170;

export class SpecialTerrain {
  readonly doors: HiddenDoor[] = [];
  readonly vines: Vines[] = [];
  readonly glass: GlassFloor[] = [];
  readonly gates: RollGate[] = [];
  /** The ball's speed a moment ago (a bounce into a ceiling gate stops dead before the gate is checked). */
  private recentSpeed = 0;
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
      } else if (e.type === 'rollGate') {
        // Until the alien it waits for is on the dial, the rock stays plain rock.
        if (e.requires && !d.aliens.includes(e.requires)) continue;
        this.gates.push(new RollGate(scene, e.id, e.x, e.y, e.w, e.h));
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

  /** A rolling ball that hits a gate hard enough (rolling into it, or bouncing up under it) breaks through. */
  private updateGates(): void {
    const p = this.d.player;
    const speed = Math.hypot(p.vx, p.vy);
    this.recentSpeed = Math.max(speed, this.recentSpeed * 0.85);
    if (!p.rolling || this.recentSpeed < GATE_BREAK_SPEED) return;
    const by = p.y - 11;
    for (const g of this.gates) {
      if (g.broken || !g.touches(p.x, by, 12)) continue;
      g.break();
      const r = g.rect;
      this.d.world.clearCells({ x: r.x / TILE, y: r.y / TILE, w: r.w / TILE, h: r.h / TILE });
      this.d.fx.burst('debris', r.x + r.w / 2, r.y + r.h / 2, 16);
      this.d.fx.burst('spark', r.x + r.w / 2, r.y + r.h / 2, 10);
      this.d.fx.shake(0.008, 180);
      this.d.fx.popText(r.x + r.w / 2, r.y - 10, 'BREAKTHROUGH!', 0xe8884a);
      playSfx('rockBreak');
    }
  }

  update(dtMs: number): void {
    if (this.gates.length > 0) this.updateGates();
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
