import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { cellAt } from '../../levels/buildLevel';
import { CELL } from '../../levels/tiles';
import type { DecorKind, LevelData } from '../../levels/types';
import type { Lighting } from '../../systems/Lighting';
import { TEX } from '../preload/assetKeys';
import type { LevelWorld } from './LevelWorld';

interface FireSpot {
  x: number;
  y: number;
  radius: number;
  seed: number;
}

const DECOR_TEXTURE: Record<DecorKind, { key: string; frame?: number }> = {
  rv: { key: TEX.rv },
  tent: { key: TEX.tent },
  campfire: { key: TEX.campfire },
  sign: { key: TEX.sign },
  log: { key: TEX.log },
  rock: { key: TEX.rock },
  bush: { key: TEX.bush },
  stump: { key: TEX.stump },
  wreck: { key: TEX.wreck },
  crater: { key: TEX.crater },
  debris: { key: TEX.debris },
  fire: { key: TEX.burningLogs },
};

function hash(x: number, salt: number): number {
  let h = (x * 374761393 + salt * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Static set dressing: authored props plus deterministic grass, bushes, rocks and glowing mushrooms. */
export class Decor {
  private readonly fires: FireSpot[] = [];
  private readonly mushrooms: Array<{ x: number; y: number }> = [];
  private readonly fireflies: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly windowLight: { x: number; y: number } | null = null;

  constructor(scene: Phaser.Scene, level: LevelData, world: LevelWorld) {
    let tentCount = 0;
    for (const e of level.entities) {
      if (e.type !== 'decor') continue;
      const tex = DECOR_TEXTURE[e.kind];
      const x = e.x * TILE + TILE / 2;
      const y = e.y * TILE;
      const frame = e.kind === 'tent' ? tentCount++ % 2 : 0;
      const img = scene.add.image(x, y + (e.kind === 'crater' ? 3 : 0), tex.key, frame).setOrigin(0.5, 1);
      img.setDepth(e.kind === 'crater' ? DEPTH.terrain + 1 : e.kind === 'rv' || e.kind === 'tent' || e.kind === 'wreck' ? DEPTH.decorBack : DEPTH.decor);
      img.setFlipX(e.flip === true);
      if (e.kind === 'campfire' || e.kind === 'fire') {
        this.fires.push({ x, y: y - 6, radius: e.kind === 'campfire' ? 120 : 90, seed: e.x });
        const emitter = scene.add.particles(x, y - 4, TEX.soft, {
          lifespan: { min: 300, max: 650 },
          speedY: { min: -60, max: -20 },
          speedX: { min: -12, max: 12 },
          scale: { start: e.kind === 'campfire' ? 0.8 : 0.9, end: 0 },
          color: [PALETTE.fire0, PALETTE.fire1, PALETTE.fire2, PALETTE.fire3],
          frequency: 45,
          blendMode: 'ADD',
          x: { min: -5, max: 5 },
        });
        emitter.setDepth(DEPTH.emissive);
        scene.add
          .particles(x, y - 8, TEX.ember, {
            lifespan: { min: 800, max: 1600 },
            speedY: { min: -50, max: -20 },
            speedX: { min: -15, max: 15 },
            scale: { start: 1, end: 0 },
            color: [PALETTE.fire1, PALETTE.fire2],
            frequency: 260,
            blendMode: 'ADD',
          })
          .setDepth(DEPTH.emissive);
      }
      if (e.kind === 'rv') this.windowLight = { x: x - 12, y: y - 30 };
    }

    this.sprinkle(scene, level, world);

    this.fireflies = scene.add.particles(0, 0, TEX.soft, {
      lifespan: { min: 2200, max: 4000 },
      speedX: { min: -12, max: 12 },
      speedY: { min: -10, max: 6 },
      scale: { start: 0.22, end: 0.1 },
      alpha: { start: 1, end: 0 },
      tint: [0xd8ff7a, 0xb8ffb0, 0xfff3a0],
      frequency: 320,
      blendMode: 'ADD',
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, 0, 640, 200), quantity: 1 } as Phaser.Types.GameObjects.Particles.EmitZoneData,
    });
    this.fireflies.setDepth(DEPTH.emissive);
  }

  private sprinkle(scene: Phaser.Scene, level: LevelData, world: LevelWorld): void {
    const grid = world.grid;
    const avoid = level.entities.filter((e) => e.type !== 'drone').map((e) => e.x);
    for (let x = 2; x < level.width - 2; x++) {
      for (let y = 1; y < level.height; y++) {
        const c = cellAt(grid, x, y);
        if (c !== CELL.GROUND && c !== CELL.ROCK) continue;
        if (cellAt(grid, x, y - 1) !== CELL.EMPTY) continue;
        if (level.water.some((w) => x >= w.x && x < w.x + w.w && y >= w.surface)) break;
        const wx = x * TILE + TILE / 2;
        const wy = y * TILE;
        const r = hash(x, y);
        const nearEntity = avoid.some((ax) => Math.abs(ax - x) <= 1);
        if (c === CELL.GROUND && r < 0.45) {
          scene.add.image(wx + (hash(x, 7) - 0.5) * 8, wy, TEX.grass, r < 0.2 ? 0 : 1).setOrigin(0.5, 1).setDepth(DEPTH.decor);
        }
        if (!nearEntity) {
          const r2 = hash(x, y + 91);
          if (c === CELL.GROUND && r2 < 0.07) scene.add.image(wx, wy + 1, TEX.bush, r2 < 0.03 ? 1 : 0).setOrigin(0.5, 1).setDepth(DEPTH.decorBack);
          else if (r2 > 0.93) scene.add.image(wx, wy + 1, TEX.rock, r2 > 0.97 ? 0 : 1).setOrigin(0.5, 1).setDepth(DEPTH.decor);
          else if (c === CELL.GROUND && r2 > 0.9 && r2 <= 0.93) scene.add.image(wx, wy + 1, TEX.stump).setOrigin(0.5, 1).setDepth(DEPTH.decor);
          else if (r2 > 0.2 && r2 < 0.25 && x > 40) {
            scene.add.image(wx, wy, TEX.mushroom).setOrigin(0.5, 1).setDepth(DEPTH.emissive);
            this.mushrooms.push({ x: wx, y: wy - 3 });
          }
        }
        break;
      }
    }
  }

  update(camera: Phaser.Cameras.Scene2D.Camera, lighting: Lighting, now: number): void {
    const view = camera.worldView;
    const zone = this.fireflies.emitZones[0] as unknown as { source: Phaser.Geom.Rectangle } | undefined;
    if (zone?.source) zone.source.setTo(view.x, view.y + 40, view.width, view.height - 60);

    for (const f of this.fires) {
      if (f.x < view.x - 200 || f.x > view.right + 200) continue;
      const flicker = 0.85 + Math.sin(now * 0.013 + f.seed) * 0.08 + Math.sin(now * 0.031 + f.seed * 3) * 0.07;
      lighting.add(f.x, f.y, f.radius * flicker, PALETTE.fire2, 1);
    }
    for (const m of this.mushrooms) {
      if (m.x < view.x - 60 || m.x > view.right + 60) continue;
      lighting.add(m.x, m.y, 26, 0x5ee6ff, 0.7);
    }
    if (this.windowLight) lighting.add(this.windowLight.x, this.windowLight.y, 70, 0xffd890, 0.8);
  }
}
