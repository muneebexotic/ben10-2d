import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, GAME_MAX_WIDTH as W, TILE } from '../../config/constants';
import { lerpColor, PALETTE } from '../../config/palette';
import type { SkyKey } from '../../levels/types';
import { TEX } from '../preload/assetKeys';

interface Layer {
  sprite: Phaser.GameObjects.TileSprite;
  fill: Phaser.GameObjects.Rectangle | null;
  fx: number;
  fy: number;
  baseY: number;
  /** The texture's ground colour (the fill below it matches it), and the tint it takes at night. */
  base: number;
  night: number;
}

/** Multiplies two colours channel by channel (what a sprite tint does). */
function multiply(a: number, b: number): number {
  const r = (((a >> 16) & 0xff) * ((b >> 16) & 0xff)) / 255;
  const g = (((a >> 8) & 0xff) * ((b >> 8) & 0xff)) / 255;
  const bl = ((a & 0xff) * (b & 0xff)) / 255;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}

const smooth = (a: number, b: number, t: number) => {
  const k = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** Time of day (0 golden hour .. 1 night) at world x, from the level's sky keys. */
export function timeOfDayAt(keys: readonly SkyKey[], tileX: number): number {
  if (keys.length === 0) return 0;
  if (tileX <= keys[0].x) return keys[0].t;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (tileX <= b.x) return a.t + ((tileX - a.x) / (b.x - a.x)) * (b.t - a.t);
  }
  return keys[keys.length - 1].t;
}

/**
 * Road Trip's sky: a golden-hour desert that sinks into night as Ben travels.
 * The sun goes down, the sky cools through dusk, stars come out, and the mesas
 * darken. `travel` scrolls the layers without the camera moving (the chase).
 */
export class HighwayBackdrop {
  private readonly dusk: Phaser.GameObjects.Image;
  private readonly sunset: Phaser.GameObjects.Image;
  private readonly sun: Phaser.GameObjects.Image;
  private readonly sunGlow: Phaser.GameObjects.Image;
  private readonly stars: Phaser.GameObjects.TileSprite;
  private readonly moon: Phaser.GameObjects.Image;
  private readonly layers: Layer[] = [];
  private readonly scrub: Phaser.GameObjects.TileSprite;
  /** Extra horizontal scroll (px) added by set pieces: the world rushing past during the chase. */
  travel = 0;
  /** Set pieces can pin the time of day (the opening drive at golden hour); null follows the camera. */
  override: number | null = null;
  private t = 0;

  constructor(scene: Phaser.Scene, private readonly keys: readonly SkyKey[]) {
    scene.add.image(0, 0, TEX.sky).setOrigin(0, 0).setDisplaySize(W, GAME_HEIGHT).setScrollFactor(0).setDepth(DEPTH.sky);
    this.dusk = scene.add.image(0, 0, TEX.duskSky).setOrigin(0, 0).setDisplaySize(W, GAME_HEIGHT).setScrollFactor(0).setDepth(DEPTH.sky);
    this.sunset = scene.add.image(0, 0, TEX.sunsetSky).setOrigin(0, 0).setDisplaySize(W, GAME_HEIGHT).setScrollFactor(0).setDepth(DEPTH.sky);
    this.stars = scene.add.tileSprite(0, 0, W, 220, TEX.stars).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.stars);
    this.moon = scene.add.image(110, 50, TEX.moon).setScrollFactor(0).setDepth(DEPTH.moon);
    this.sunGlow = scene.add.image(0, 0, TEX.light).setScrollFactor(0).setDepth(DEPTH.moon).setScale(4.5).setTint(PALETTE.sunsetGlow).setBlendMode(Phaser.BlendModes.ADD);
    this.sun = scene.add.image(0, 0, TEX.sun).setScrollFactor(0).setDepth(DEPTH.moon);

    this.addLayer(scene, TEX.farMesas, 0.06, 0.04, 214, DEPTH.mountains, lerpColor(PALETTE.mesa0, PALETTE.sunsetMid, 0.45), 0x4a4a8a);
    this.addLayer(scene, TEX.nearButtes, 0.2, 0.12, 250, DEPTH.pinesFar, PALETTE.mesa0, 0x3a3a6a);
    this.addLayer(scene, TEX.poles, 0.5, 0.3, 270, DEPTH.pinesMid, 0x170c18, 0x8a8aaa, false);
    this.scrub = scene.add.tileSprite(0, GAME_HEIGHT - 40, W, 40, TEX.scrub).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.foreground);
  }

  private addLayer(scene: Phaser.Scene, texture: string, fx: number, fy: number, baseY: number, depth: number, base: number, night: number, filled = true): void {
    const tex = scene.textures.get(texture).getSourceImage();
    const sprite = scene.add.tileSprite(0, 0, W, tex.height, texture).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);
    const fill = filled ? scene.add.rectangle(0, 0, W, GAME_HEIGHT, base).setOrigin(0, 0).setScrollFactor(0).setDepth(depth) : null;
    this.layers.push({ sprite, fill, fx, fy, baseY, base, night });
  }

  /** 0 golden hour .. 1 night. */
  get timeOfDay(): number {
    return this.t;
  }

  setForegroundVisible(visible: boolean): void {
    this.scrub.setVisible(visible);
  }

  update(camera: Phaser.Cameras.Scene2D.Camera, _dtMs: number): void {
    const target = this.override ?? timeOfDayAt(this.keys, camera.worldView.centerX / TILE);
    this.t += (target - this.t) * 0.08;
    const t = this.t;
    const sx = camera.scrollX + this.travel;
    const sy = camera.scrollY;

    this.sunset.setAlpha(1 - smooth(0.05, 0.55, t));
    this.dusk.setAlpha(1 - smooth(0.55, 1, t));
    this.stars.setAlpha(smooth(0.4, 0.95, t)).setY(-sy * 0.02);
    this.stars.tilePositionX = sx * 0.02;
    this.moon.setAlpha(smooth(0.7, 1, t)).setY(50 - sy * 0.03);

    // The sun sinks behind the mesas on the right of the screen.
    const sunX = camera.width * 0.72;
    const sunY = 120 + smooth(0, 0.6, t) * 170 - sy * 0.04;
    this.sun.setPosition(sunX, sunY).setAlpha(1 - smooth(0.45, 0.65, t));
    this.sunGlow.setPosition(sunX, sunY).setAlpha((1 - smooth(0.3, 0.7, t)) * 0.55);

    for (const l of this.layers) {
      l.sprite.tilePositionX = sx * l.fx;
      const top = Math.round(l.baseY - sy * l.fy);
      l.sprite.y = top - l.sprite.height + 60;
      // Silhouettes cool and darken as the light goes.
      const tint = lerpColor(0xffffff, l.night, smooth(0.1, 1, t));
      l.sprite.setTint(tint);
      if (l.fill) {
        l.fill.y = l.sprite.y + l.sprite.height - 1;
        l.fill.setFillStyle(multiply(l.base, tint));
      }
    }
    this.scrub.tilePositionX = sx * 1.35;
  }
}
