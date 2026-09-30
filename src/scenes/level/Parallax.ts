import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, GAME_WIDTH } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../preload/assetKeys';

interface Layer {
  sprite: Phaser.GameObjects.TileSprite;
  fill?: Phaser.GameObjects.Rectangle;
  fx: number;
  fy: number;
  baseY: number;
  drift: number;
}

/** Night sky and layered forest silhouettes, scrolled manually for parallax depth. */
export class Parallax {
  private readonly layers: Layer[] = [];
  private readonly stars: Phaser.GameObjects.TileSprite;
  private readonly moon: Phaser.GameObjects.Image;
  private readonly moonGlow: Phaser.GameObjects.Image;
  private readonly trunks: Phaser.GameObjects.TileSprite;
  private readonly crashGlow: Phaser.GameObjects.Image;
  private time = 0;

  constructor(scene: Phaser.Scene, crashX: number) {
    scene.add.image(0, 0, TEX.sky).setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setScrollFactor(0).setDepth(DEPTH.sky);
    this.stars = scene.add.tileSprite(0, 0, GAME_WIDTH, 220, TEX.stars).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.stars);
    this.moonGlow = scene.add.image(520, 58, TEX.light).setScrollFactor(0).setDepth(DEPTH.moon).setScale(1.8).setAlpha(0.18).setTint(PALETTE.moon).setBlendMode(Phaser.BlendModes.ADD);
    this.moon = scene.add.image(520, 58, TEX.moon).setScrollFactor(0).setDepth(DEPTH.moon);

    // The crash site glows red on the horizon and slides closer as Ben approaches.
    this.crashGlow = scene.add
      .image(crashX * 0.35 + GAME_WIDTH * 0.5, 0, TEX.crashGlow)
      .setOrigin(0.5, 1)
      .setScale(3, 1.6)
      .setScrollFactor(0.35, 0)
      .setDepth(DEPTH.mountains - 1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.9);

    this.addLayer(scene, TEX.mountains, 0.08, 0.05, 150, DEPTH.mountains, 0, undefined);
    this.addLayer(scene, TEX.pinesFar, 0.22, 0.14, 200, DEPTH.pinesFar, 0, PALETTE.pineFar);
    this.addLayer(scene, TEX.fog, 0.3, 0.18, 230, DEPTH.fog, 0.004, undefined, 0.8);
    this.addLayer(scene, TEX.pinesMid, 0.45, 0.28, 250, DEPTH.pinesMid, 0, PALETTE.pineMid);

    this.trunks = scene.add
      .tileSprite(0, GAME_HEIGHT - 40, GAME_WIDTH, 40, TEX.trunks)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.foreground);
  }

  private addLayer(
    scene: Phaser.Scene,
    texture: string,
    fx: number,
    fy: number,
    baseY: number,
    depth: number,
    drift: number,
    fillColor: number | undefined,
    alpha = 1,
  ): void {
    const tex = scene.textures.get(texture).getSourceImage();
    const sprite = scene.add.tileSprite(0, 0, GAME_WIDTH, tex.height, texture).setOrigin(0, 0).setScrollFactor(0).setDepth(depth).setAlpha(alpha);
    let fill: Phaser.GameObjects.Rectangle | undefined;
    if (fillColor !== undefined) {
      fill = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, fillColor).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);
    }
    this.layers.push({ sprite, fill, fx, fy, baseY, drift });
  }

  setForegroundVisible(visible: boolean): void {
    this.trunks.setVisible(visible);
  }

  update(camera: Phaser.Cameras.Scene2D.Camera, dtMs: number): void {
    this.time += dtMs;
    const sx = camera.scrollX;
    const sy = camera.scrollY;
    this.stars.tilePositionX = sx * 0.02;
    this.stars.y = -sy * 0.02;
    this.moon.y = 58 - sy * 0.03;
    this.moonGlow.y = this.moon.y;
    this.crashGlow.y = 300 - sy * 0.12;
    for (const l of this.layers) {
      l.sprite.tilePositionX = sx * l.fx + this.time * l.drift;
      const top = Math.round(l.baseY - sy * l.fy);
      l.sprite.y = top - l.sprite.height + 60;
      if (l.fill) l.fill.y = l.sprite.y + l.sprite.height - 1;
    }
    this.trunks.tilePositionX = sx * 1.35;
  }
}
