import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, GAME_MAX_WIDTH as W, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import type { LevelData } from '../../levels/types';
import { TEX } from '../preload/assetKeys';

/**
 * Chapter 3's backdrop: the town's night sky and rooftops outside, and
 * inside the museum a back wall that sits in the world (moonlit arched
 * windows in the halls, tiled walls and pipes in Animo's lab). Moonbeams
 * slant down from the windows; dust drifts through them.
 */
export class MuseumBackdrop {
  private readonly stars: Phaser.GameObjects.TileSprite;
  private readonly city: Phaser.GameObjects.TileSprite;
  private readonly beams: Phaser.GameObjects.Image[] = [];
  private time = 0;

  constructor(scene: Phaser.Scene, level: LevelData) {
    scene.add.image(0, 0, TEX.citySky).setOrigin(0, 0).setDisplaySize(W, GAME_HEIGHT).setScrollFactor(0).setDepth(DEPTH.sky);
    this.stars = scene.add.tileSprite(0, 0, W, 200, TEX.stars).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.stars).setAlpha(0.8);
    scene.add.image(560, 54, TEX.light).setScrollFactor(0).setDepth(DEPTH.moon).setScale(1.6).setAlpha(0.2).setTint(PALETTE.moon).setBlendMode(Phaser.BlendModes.ADD);
    scene.add.image(560, 54, TEX.moon).setScrollFactor(0).setDepth(DEPTH.moon);
    this.city = scene.add.tileSprite(0, GAME_HEIGHT - 170, W, 120, TEX.city).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.mountains);

    const heightPx = level.height * TILE;
    for (const room of level.interiors ?? []) {
      const x = room.x * TILE;
      const w = room.w * TILE;
      const tex = room.wall === 'lab' ? TEX.labWall : TEX.hallWall;
      // Lined up so the panelling sits on the main floor (row 30): the pattern is 192 px tall.
      const wall = scene.add.tileSprite(x, 0, w, heightPx, tex).setOrigin(0, 0).setDepth(DEPTH.pinesMid);
      wall.tilePositionY = 192 - ((30 * TILE) % 192);
      if (room.wall !== 'hall') continue;
      // Moonbeams from each window pair, faint and additive.
      for (let bx = x + 32; bx < x + w - 16; bx += 64) {
        const beam = scene.add
          .image(bx + 30, 120, TEX.light)
          .setOrigin(0.5, 0)
          .setScale(0.5, 4)
          .setAngle(-14)
          .setTint(PALETTE.moonbeam)
          .setAlpha(0.08)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(DEPTH.decorBack - 2);
        this.beams.push(beam);
      }
    }
    scene.add
      .particles(0, 0, TEX.px, {
        x: { min: 0, max: W },
        y: { min: 0, max: GAME_HEIGHT },
        lifespan: { min: 3000, max: 6000 },
        speedX: { min: -4, max: 4 },
        speedY: { min: 2, max: 8 },
        scale: { start: 0.6, end: 0.3 },
        alpha: { start: 0.35, end: 0 },
        tint: [PALETTE.moonbeam, 0xffffff],
        frequency: 260,
        blendMode: 'ADD',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.fog);
  }

  update(camera: Phaser.Cameras.Scene2D.Camera, dtMs: number): void {
    this.time += dtMs;
    this.stars.tilePositionX = camera.scrollX * 0.02;
    this.city.tilePositionX = camera.scrollX * 0.12;
    this.city.y = GAME_HEIGHT - 170 - camera.scrollY * 0.06;
    for (const [i, b] of this.beams.entries()) b.setAlpha(0.07 + Math.sin(this.time * 0.0006 + i) * 0.02);
  }
}
