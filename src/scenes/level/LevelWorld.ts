import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { autotile, buildCells, cellAt, type TileGrid } from '../../levels/buildLevel';
import { CELL, ONE_WAY_FRAMES, SOLID_FRAMES } from '../../levels/tiles';
import type { LevelData } from '../../levels/types';
import { TEX } from '../preload/assetKeys';
import type { Rect } from '../../entities/types';
import { BakedGraphics } from '../../ui/BakedGraphics';

const TILESETS = { forest: TEX.tiles, sim: TEX.tilesSim, highway: TEX.tilesDesert, museum: TEX.tilesMuseum } as const;

/** How each liquid looks: its surface texture and the colour it fades to when deeper than one texture. */
const LIQUIDS = {
  water: { texture: TEX.water, deep: 0x0c2440, drift: 0.012 },
  mutagen: { texture: TEX.mutagenPool, deep: 0x06261c, drift: 0.008 },
  tar: { texture: TEX.tarPool, deep: 0x08070c, drift: 0.002 },
} as const;

/** Tilemap, collision setup and spatial queries for a level. */
export class LevelWorld {
  readonly grid: TileGrid;
  readonly layer: Phaser.Tilemaps.TilemapLayer;
  readonly widthPx: number;
  readonly heightPx: number;
  /** The tileset this level is drawn with (hidden doors disguise themselves in it). */
  readonly tilesKey: string;
  private readonly waterSprites: Array<{ sprite: Phaser.GameObjects.TileSprite; drift: number }> = [];
  /** Thin one-way floors on every water surface. The level only lets them collide for forms that run on water. */
  readonly waterSurfaces: Phaser.Physics.Arcade.StaticGroup;
  /**
   * Moving solids that aren't tiles (the Rustbucket's roof during the chase).
   * Drones, shots and ground checks treat them like terrain.
   */
  private readonly extraSolids: Rect[] = [];

  constructor(
    scene: Phaser.Scene,
    readonly data: LevelData,
  ) {
    this.grid = buildCells(data);
    this.widthPx = data.width * TILE;
    this.heightPx = data.height * TILE;

    const frames = autotile(this.grid);
    const map = scene.make.tilemap({ data: frames, tileWidth: TILE, tileHeight: TILE });
    const tilesKey = TILESETS[data.theme ?? 'forest'];
    this.tilesKey = tilesKey;
    const tileset = map.addTilesetImage(tilesKey, tilesKey, TILE, TILE, 0, 0)!;
    this.layer = map.createLayer(0, tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer;
    this.layer.setDepth(DEPTH.terrain);
    this.layer.setCollision([...SOLID_FRAMES, ...ONE_WAY_FRAMES]);
    this.layer.forEachTile((tile: Phaser.Tilemaps.Tile) => {
      if (ONE_WAY_FRAMES.includes(tile.index)) tile.setCollision(false, false, true, false);
    });

    // Carved tunnels and alcoves get a dark back wall so they read as caves, not floating blocks.
    // Each wall is baked once (a Graphics would be rebuilt every frame, on screen or not).
    for (const c of data.carves) {
      const left = c.x * TILE;
      const w = c.w * TILE;
      const h = c.h * TILE;
      const wall = new BakedGraphics(scene, 0, 0, w, h).draw((g) => {
        g.fillStyle(0x120c14, 1);
        g.fillRect(0, 0, w, h);
        g.fillStyle(0x1e1622, 1);
        for (let x = left; x < left + w; x += 12) g.fillRect(x - left + ((x / 12) % 2) * 5, 2, 3, h - 4);
      });
      wall.image.setPosition(left, c.y * TILE).setDepth(DEPTH.decorBack - 1);
    }

    // Asphalt laid over the ground where the highway runs.
    for (const r of data.roads ?? []) {
      scene.add.tileSprite(r.x * TILE, r.y * TILE, r.w * TILE, TILE, TEX.roadCap).setOrigin(0, 0).setDepth(DEPTH.terrain + 1);
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
      // Tar is too sticky to run across: no surface to stand on.
      if (w.kind === 'tar') floor.disableBody(true, true);
      else this.waterSurfaces.add(floor);
      // The texture is one surface deep (64 px); deeper liquid continues in its darkest colour.
      const look = LIQUIDS[w.kind ?? 'water'];
      const surfaceH = Math.min(w.depth * TILE, 64);
      const sprite = scene.add
        .tileSprite(w.x * TILE, w.surface * TILE + 4, w.w * TILE, surfaceH, look.texture)
        .setOrigin(0, 0)
        .setDepth(DEPTH.water);
      this.waterSprites.push({ sprite, drift: look.drift });
      if (w.depth * TILE > surfaceH) {
        scene.add.rectangle(w.x * TILE, w.surface * TILE + 4 + surfaceH, w.w * TILE, w.depth * TILE - surfaceH, look.deep).setOrigin(0, 0).setDepth(DEPTH.water);
      }
    }
  }

  update(dtMs: number): void {
    for (const w of this.waterSprites) w.sprite.tilePositionX += dtMs * w.drift;
  }

  isSolid(x: number, y: number): boolean {
    const c = cellAt(this.grid, Math.floor(x / TILE), Math.floor(y / TILE));
    if (c === CELL.GROUND || c === CELL.ROCK) return true;
    for (const r of this.extraSolids) if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return true;
    return false;
  }

  /** Solid tiles in this rect (tiles) are gone for good: the grid, the collision and the look (neighbours re-tile). */
  clearCells(rect: { x: number; y: number; w: number; h: number }): void {
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        if (y < 0 || y >= this.grid.height || x < 0 || x >= this.grid.width) continue;
        this.grid.cells[y][x] = CELL.EMPTY;
        this.layer.removeTileAt(x, y);
      }
    }
    const frames = autotile(this.grid);
    for (let y = rect.y - 1; y <= rect.y + rect.h; y++) {
      for (let x = rect.x - 1; x <= rect.x + rect.w; x++) {
        if (y < 0 || y >= this.grid.height || x < 0 || x >= this.grid.width || this.grid.cells[y][x] === CELL.EMPTY) continue;
        const tile = this.layer.putTileAt(frames[y][x], x, y);
        if (ONE_WAY_FRAMES.includes(tile.index)) tile.setCollision(false, false, true, false);
        else tile.setCollision(true);
      }
    }
  }

  /** Registers a moving solid; the caller keeps updating the same rect object. */
  addSolid(rect: Rect): void {
    if (!this.extraSolids.includes(rect)) this.extraSolids.push(rect);
  }

  removeSolid(rect: Rect): void {
    const i = this.extraSolids.indexOf(rect);
    if (i >= 0) this.extraSolids.splice(i, 1);
  }

  isOneWay(x: number, y: number): boolean {
    return cellAt(this.grid, Math.floor(x / TILE), Math.floor(y / TILE)) === CELL.PLATFORM;
  }

  /** World y of the first solid or platform surface at or below y (level floor if none). */
  groundBelow(x: number, y: number): number {
    const tx = Math.floor(x / TILE);
    let ground = this.heightPx;
    for (let ty = Math.max(0, Math.floor(y / TILE)); ty < this.data.height; ty++) {
      if (cellAt(this.grid, tx, ty) !== CELL.EMPTY) {
        ground = ty * TILE;
        break;
      }
    }
    for (const r of this.extraSolids) if (x >= r.x && x < r.x + r.w && r.y >= y && r.y < ground) ground = r.y;
    return ground;
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

  /** The liquid under (x, feetY), if any (mutagen glows, tar is black). */
  liquidAt(x: number, feetY: number): 'water' | 'mutagen' | 'tar' | null {
    const w = this.data.water.find((s) => x >= s.x * TILE && x < (s.x + s.w) * TILE && feetY > s.surface * TILE - 2);
    return w ? (w.kind ?? 'water') : null;
  }

  ambientAt(x: number): LevelData['ambience'][number]['ambient'] {
    let zone = this.data.ambience[0].ambient;
    for (const a of this.data.ambience) if (x >= a.x * TILE) zone = a.ambient;
    return zone;
  }
}
