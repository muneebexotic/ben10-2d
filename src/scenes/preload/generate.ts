import Phaser from 'phaser';
import type { AssetDef } from './assetTypes';
import { ALL_ANIMS, ALL_ASSETS } from './catalog';
import { PixelCanvas } from './PixelCanvas';

/** Queues real art files for any asset that has a `url`. Call from Preload.preload(). */
export function queueAssetFiles(scene: Phaser.Scene): void {
  for (const asset of ALL_ASSETS) {
    if (!asset.url) continue;
    scene.load.spritesheet(asset.key, asset.url, { frameWidth: asset.frameWidth, frameHeight: asset.frameHeight });
  }
}

/** Generates placeholder art for every asset without a `url`. */
export function generateAssets(scene: Phaser.Scene): void {
  for (const asset of ALL_ASSETS) {
    if (asset.url || scene.textures.exists(asset.key)) continue;
    generate(scene, asset);
  }
}

function generate(scene: Phaser.Scene, asset: AssetDef): void {
  const { key, frameWidth: fw, frameHeight: fh, frames } = asset;
  const texture = scene.textures.createCanvas(key, fw * frames, fh);
  if (!texture) return;
  const ctx = texture.getContext();
  ctx.imageSmoothingEnabled = false;
  for (let f = 0; f < frames; f++) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(f * fw, 0, fw, fh);
    ctx.clip();
    asset.draw(new PixelCanvas(ctx, f * fw, 0, fw, fh), f);
    ctx.restore();
  }
  texture.refresh();
  for (let f = 0; f < frames; f++) texture.add(f, 0, f * fw, 0, fw, fh);
}

export function createAnimations(scene: Phaser.Scene): void {
  for (const anim of ALL_ANIMS) {
    if (scene.anims.exists(anim.key)) continue;
    scene.anims.create({
      key: anim.key,
      frames: anim.frames.map((frame) => ({ key: anim.texture, frame })),
      frameRate: anim.frameRate,
      repeat: anim.repeat,
    });
  }
}
