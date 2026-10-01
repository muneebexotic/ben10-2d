import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { autotile, buildCells, cellAt, type TileGrid } from '../../levels/buildLevel';
import { CELL, ONE_WAY_FRAMES, SOLID_FRAMES } from '../../levels/tiles';
import type { LevelData } from '../../levels/types';
import { TEX } from '../preload/assetKeys';

/** Tilemap, collision setup and spatial queries for a level. */
export class LevelWorld {
  readonly grid: TileGrid;
  readonly layer: Phaser.Tilemaps.TilemapLayer;
  readonly widthPx: number;
  readonly heightPx: number;
  private readonly waterSprites: Phaser.GameObjects.TileSprite[] = [];
  /** Thin one-way floors on every water surface. The level only lets them collide for forms that run on water. */
  readonly waterSurfaces: Phaser.Physics.Arcade.StaticGroup;

  constructor(
    scene: Phaser.Scene,
    readonly data: LevelData,
  ) {
    this.grid = buildCells(data);
    this.widthPx = data.width * TILE;
    this.heightPx = data.height * TILE;

    const frames = autotile(this.grid);
    const map = scene.make.tilemap({ data: frames, tileWidth: TILE, tileHeight: TILE });
    const tilesKey = data.theme === 'sim' ? TEX.tilesSim : TEX.tiles;
    const tileset = map.addTilesetImage(tilesKey, tilesKey, TILE, TILE, 0, 0)!;
    this.layer = map.createLayer(0, tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer;
    this.layer.setDepth(DEPTH.terrain);
    this.layer.setCollision([...SOLID_FRAMES, ...ONE_WAY_FRAMES]);
    this.layer.forEachTile((tile: Phaser.Tilemaps.Tile) => {
      if (ONE_WAY_FRAMES.includes(tile.index)) tile.setCollision(false, false, true, false);
    });

    // Carved tunnels and alcoves get a dark back wall so they read as caves, not floating blocks.
    const caves = scene.add.graphics().setDepth(DEPTH.decorBack - 1);
    for (const c of data.carves) {
      caves.fillStyle(0x120c14, 1);
      caves.fillRect(c.x * TILE, c.y * TILE, c.w * TILE, c.h * TILE);
      caves.fillStyle(0x1e1622, 1);
      for (let x = c.x * TILE; x < (c.x + c.w) * TILE; x += 12) caves.fillRect(x + ((x / 12) % 2) * 5, c.y * TILE + 2, 3, c.h * TILE - 4);
    }

    this.waterSurfaces = scene.physics.add.staticGroup();
    for (const w of data.water) {
      const top = w.surface * TILE;
      const floor = scene.physics.add.staticImage(w.x * TILE + (w.w * TILE) / 2, top + 4, TEX.whitePx).setVisible(false);
      floor.setDisplaySize(w.w * TILE, 8).refreshBody();
      const body = floor.body as Phaser.Physics.Arcade.StaticBody;
      body.checkCollision.down = false;
      body.checkCollision.left = false;
      body.checkCollision.right = false;
      this.waterSurfaces.add(floor);
      const sprite = scene.add
        .tileSprite(w.x * TILE, w.surface * TILE + 4, w.w * TILE, w.depth * TILE, TEX.water)
        .setOrigin(0, 0)
        .setDepth(DEPTH.water);
      this.waterSprites.push(sprite);
    }
  }

  update(dtMs: number): void {
    for (const s of this.waterSprites) s.tilePositionX += dtMs * 0.012;
  }

  isSolid(x: number, y: number): boolean {
    const c = cellAt(this.grid, Math.floor(x / TILE), Math.floor(y / TILE));
    return c === CELL.GROUND || c === CELL.ROCK;
  }

  isOneWay(x: number, y: number): boolean {
    return cellAt(this.grid, Math.floor(x / TILE), Math.floor(y / TILE)) === CELL.PLATFORM;
  }

  /** World y of the first solid or platform surface at or below y (level floor if none). */
  groundBelow(x: number, y: number): number {
    const tx = Math.floor(x / TILE);
    for (let ty = Math.max(0, Math.floor(y / TILE)); ty < this.data.height; ty++) {
      if (cellAt(this.grid, tx, ty) !== CELL.EMPTY) return ty * TILE;
    }
    return this.heightPx;
  }

  inWater(x: number, feetY: number): boolean {
    return this.data.water.some(
      (w) => x >= w.x * TILE && x < (w.x + w.w) * TILE && feetY > w.surface * TILE + 8,
    );
  }

  /** Feet resting on a water surface (running on water). */
  onWaterSurface(x: number, feetY: number): boolean {
    return this.data.water.some((w) => x >= w.x * TILE && x < (w.x + w.w) * TILE && Math.abs(feetY - w.surface * TILE) <= 3);
  }

  ambientAt(x: number): LevelData['ambience'][number]['ambient'] {
    let zone = this.data.ambience[0].ambient;
    for (const a of this.data.ambience) if (x >= a.x * TILE) zone = a.ambient;
    return zone;
  }
}
