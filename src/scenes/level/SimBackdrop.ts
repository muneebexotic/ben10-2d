import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, GAME_WIDTH } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../preload/assetKeys';

/**
 * Omnitrix Training backdrop: the watch's own simulation. A dark teal void,
 * a slowly scrolling hologram grid, data towers on the horizon and a huge
 * faint Omnitrix symbol, with motes drifting upward.
 */
export class SimBackdrop {
  private readonly grid: Phaser.GameObjects.TileSprite;
  private readonly towers: Phaser.GameObjects.TileSprite;
  private readonly emblem: Phaser.GameObjects.Image;
  private time = 0;

  constructor(scene: Phaser.Scene) {
    scene.add.image(0, 0, TEX.simSky).setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setScrollFactor(0).setDepth(DEPTH.sky);
    this.emblem = scene.add
      .image(GAME_WIDTH / 2, 120, TEX.hourglass)
      .setScrollFactor(0)
      .setDepth(DEPTH.stars)
      .setScale(4)
      .setTint(PALETTE.omnitrix)
      .setAlpha(0.07)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.grid = scene.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, TEX.simGrid).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.mountains).setAlpha(0.3);
    this.towers = scene.add.tileSprite(0, GAME_HEIGHT - 190, GAME_WIDTH, 120, TEX.simTowers).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.pinesFar);
    scene.add
      .particles(0, 0, TEX.px, {
        x: { min: 0, max: GAME_WIDTH },
        y: GAME_HEIGHT + 4,
        lifespan: { min: 3000, max: 6000 },
        speedY: { min: -40, max: -14 },
        scale: { start: 1.5, end: 0.5 },
        alpha: { start: 0.7, end: 0 },
        tint: [PALETTE.omnitrix, PALETTE.omnitrixGlow],
        frequency: 120,
        blendMode: 'ADD',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.fog);
  }

  update(camera: Phaser.Cameras.Scene2D.Camera, dtMs: number): void {
    this.time += dtMs;
    this.grid.tilePositionX = camera.scrollX * 0.3;
    this.grid.tilePositionY = camera.scrollY * 0.3 - this.time * 0.004;
    this.towers.tilePositionX = camera.scrollX * 0.15;
    this.towers.y = GAME_HEIGHT - 190 - camera.scrollY * 0.08;
    this.emblem.setAngle(Math.sin(this.time * 0.0003) * 6);
  }
}
