import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, GAME_MAX_WIDTH as W, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import type { InteriorWall, LevelData } from '../../levels/types';
import { TEX } from '../preload/assetKeys';
import { StaticCuller } from './StaticCuller';

const WALLS: Record<InteriorWall, string> = {
  hall: TEX.hallWall,
  lab: TEX.labWall,
  arcade: TEX.arcadeWall,
  lair: TEX.lairWall,
  subway: TEX.subwayWall,
  tunnel: TEX.tunnelWall,
  substation: TEX.substationWall,
};

/**
 * Chapter 4's backdrop: a dusk sky over two layers of skyline outside, and
 * indoors a back wall per room (the arcade's neon, the laser tag arena's UV
 * grid, the station's tiles, the tunnels, the substation). Dust drifts in the
 * work lights underground.
 */
export class CityBackdrop {
  private readonly far: Phaser.GameObjects.TileSprite;
  private readonly near: Phaser.GameObjects.TileSprite;
  private readonly culler = new StaticCuller();

  constructor(scene: Phaser.Scene, level: LevelData) {
    scene.add.image(0, 0, TEX.citySkyDusk).setOrigin(0, 0).setDisplaySize(W, GAME_HEIGHT).setScrollFactor(0).setDepth(DEPTH.sky);
    scene.add.tileSprite(0, 0, W, 120, TEX.stars).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.stars).setAlpha(0.45);
    // A low sun gone down behind the buildings: a warm glow on the horizon.
    scene.add.image(W * 0.62, GAME_HEIGHT - 120, TEX.light).setScrollFactor(0).setDepth(DEPTH.moon).setScale(5, 2).setAlpha(0.35).setTint(PALETTE.duskLow).setBlendMode(Phaser.BlendModes.ADD);
    this.far = scene.add.tileSprite(0, GAME_HEIGHT - 200, W, 140, TEX.skylineFar).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.mountains);
    this.near = scene.add.tileSprite(0, GAME_HEIGHT - 175, W, 170, TEX.skylineNear).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.pinesFar);

    const heightPx = level.height * TILE;
    for (const room of level.interiors ?? []) {
      const x = room.x * TILE;
      const w = room.w * TILE;
      const wall = this.culler.add(scene.add.tileSprite(x, 0, w, heightPx, WALLS[room.wall]).setOrigin(0, 0).setDepth(DEPTH.pinesMid));
      // The pattern is 192 px tall: line its panelling up with the room's floor.
      wall.tilePositionY = 192 - (((room.floor ?? 30) * TILE) % 192);
    }
    scene.add
      .particles(0, 0, TEX.px, {
        x: { min: 0, max: W },
        y: { min: 0, max: GAME_HEIGHT },
        lifespan: { min: 3000, max: 6000 },
        speedX: { min: -5, max: 5 },
        speedY: { min: 1, max: 6 },
        scale: { start: 0.6, end: 0.3 },
        alpha: { start: 0.25, end: 0 },
        tint: [PALETTE.workLight, 0xffffff],
        frequency: 300,
        blendMode: 'ADD',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.fog);
  }

  update(camera: Phaser.Cameras.Scene2D.Camera): void {
    this.culler.update(camera.worldView);
    this.far.tilePositionX = camera.scrollX * 0.06;
    this.far.y = GAME_HEIGHT - 200 - camera.scrollY * 0.04;
    this.near.tilePositionX = camera.scrollX * 0.14;
    this.near.y = GAME_HEIGHT - 175 - camera.scrollY * 0.08;
  }
}
