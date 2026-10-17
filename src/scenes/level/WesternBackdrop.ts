import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, GAME_MAX_WIDTH as W, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import type { InteriorWall, LevelData } from '../../levels/types';
import { TEX } from '../preload/assetKeys';
import { CH5_TEX } from '../preload/bounty/keys';
import { StaticCuller } from './StaticCuller';

const WALLS: Partial<Record<InteriorWall, string>> = {
  saloon: CH5_TEX.saloonWall,
  jail: CH5_TEX.jailWall,
  hotel: CH5_TEX.hotelWall,
  mine: CH5_TEX.mineWall,
  cavern: CH5_TEX.cavernWall,
  shaft: CH5_TEX.shaftWall,
};

/**
 * Chapter 5's backdrop: Silver Spur under a huge full moon, mesas in two
 * layers, and indoors a back wall per room (the saloon's wallpaper, the
 * jail's stone, the hotel's peeling stripes, the mine's timbering, the
 * crystal cavern's glow). Outside, the odd tumbleweed blows across the
 * street; underground, dust hangs in the lantern light.
 */
export class WesternBackdrop {
  private readonly far: Phaser.GameObjects.TileSprite;
  private readonly near: Phaser.GameObjects.TileSprite;
  private readonly stars: Phaser.GameObjects.TileSprite;
  private readonly culler = new StaticCuller();
  private readonly weed: Phaser.GameObjects.Image;
  private weedIn = 6000;
  private weedX = -1;
  private weedVx = 0;
  private time = 0;

  constructor(
    scene: Phaser.Scene,
    level: LevelData,
    /** Open sky over this x (the tumbleweed only blows outdoors). */
    private readonly outdoors: (x: number) => boolean,
    private readonly groundBelow: (x: number, y: number) => number,
  ) {
    scene.add.image(0, 0, CH5_TEX.sky).setOrigin(0, 0).setDisplaySize(W, GAME_HEIGHT).setScrollFactor(0).setDepth(DEPTH.sky);
    this.stars = scene.add.tileSprite(0, 0, W, 200, TEX.stars).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.stars).setAlpha(0.9);
    // The full moon, huge and low over the mesas: the chapter's signature shot.
    scene.add.image(W * 0.7, 92, TEX.light).setScrollFactor(0).setDepth(DEPTH.moon).setScale(3.2).setAlpha(0.22).setTint(0xd8dcff).setBlendMode(Phaser.BlendModes.ADD);
    scene.add.image(W * 0.7, 92, CH5_TEX.bigMoon).setScrollFactor(0).setDepth(DEPTH.moon).setScale(1.5);
    this.far = scene.add.tileSprite(0, GAME_HEIGHT - 190, W, 140, CH5_TEX.mesasFar).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.mountains);
    this.near = scene.add.tileSprite(0, GAME_HEIGHT - 170, W, 170, CH5_TEX.mesasNear).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.pinesFar);

    const heightPx = level.height * TILE;
    for (const room of level.interiors ?? []) {
      const tex = WALLS[room.wall];
      if (!tex) continue;
      const top = (room.top ?? 0) * TILE;
      const wall = this.culler.add(scene.add.tileSprite(room.x * TILE, top, room.w * TILE, heightPx - top, tex).setOrigin(0, 0).setDepth(DEPTH.pinesMid));
      // The pattern is 192 px tall: line its panelling up with the room's floor.
      wall.tilePositionY = (192 - (((room.floor ?? 30) * TILE - top) % 192)) % 192;
    }
    this.weed = scene.add.image(0, 0, TEX.tumbleweed).setDepth(DEPTH.decorBack + 1).setVisible(false);
    scene.add
      .particles(0, 0, TEX.px, {
        x: { min: 0, max: W },
        y: { min: 0, max: GAME_HEIGHT },
        lifespan: { min: 3000, max: 6000 },
        speedX: { min: 4, max: 14 },
        speedY: { min: -2, max: 4 },
        scale: { start: 0.6, end: 0.3 },
        alpha: { start: 0.22, end: 0 },
        tint: [0xe8c890, PALETTE.white],
        frequency: 280,
        blendMode: 'ADD',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.fog);
  }

  update(camera: Phaser.Cameras.Scene2D.Camera, dtMs: number): void {
    this.time += dtMs;
    this.culler.update(camera.worldView);
    this.stars.tilePositionX = camera.scrollX * 0.02;
    this.far.tilePositionX = camera.scrollX * 0.05;
    this.far.y = GAME_HEIGHT - 190 - camera.scrollY * 0.03;
    this.near.tilePositionX = camera.scrollX * 0.12;
    this.near.y = GAME_HEIGHT - 170 - camera.scrollY * 0.07;
    this.updateTumbleweed(camera, dtMs);
  }

  /** Every so often a tumbleweed bounces across the street behind Ben. */
  private updateTumbleweed(camera: Phaser.Cameras.Scene2D.Camera, dtMs: number): void {
    const view = camera.worldView;
    if (this.weedX < 0) {
      this.weedIn -= dtMs;
      if (this.weedIn > 0 || !this.outdoors(view.centerX)) return;
      this.weedIn = 9000 + Math.random() * 9000;
      this.weedVx = 60 + Math.random() * 40;
      this.weedX = view.x - 20;
      this.weed.setVisible(true);
    }
    this.weedX += this.weedVx * (dtMs / 1000);
    const hop = Math.abs(Math.sin(this.time * 0.006)) * 10;
    const ground = this.groundBelow(this.weedX, view.centerY - 40);
    this.weed.setPosition(this.weedX, ground - 6 - hop).setAngle(this.weed.angle + dtMs * 0.4);
    if (this.weedX > view.right + 30 || !this.outdoors(this.weedX)) {
      this.weedX = -1;
      this.weed.setVisible(false);
    }
  }
}
