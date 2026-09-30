import Phaser from 'phaser';
import { ASSETS } from './preload/assetKeys';
import { SCENES } from './SceneKeys';
import { pixelText } from '../ui/text';
import { PALETTE } from '../config/palette';

/** Dev tool (?gallery=1): every generated texture at 2x, for checking placeholder or real art. */
export class GalleryScene extends Phaser.Scene {
  constructor() {
    super(SCENES.gallery);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x2a2f45);
    let x = 4;
    let y = 4;
    let rowH = 0;
    const page = Number(new URLSearchParams(window.location.search).get('page') ?? 0);
    const scale = 2;
    const items = ASSETS.filter((a) => a.frameWidth * a.frames * scale < 1200);
    const perPage = Number(new URLSearchParams(window.location.search).get('per') ?? 40);
    for (const asset of items.slice(page * perPage, page * perPage + perPage)) {
      const w = Math.min(asset.frameWidth * asset.frames, 600) * scale;
      const h = asset.frameHeight * scale;
      if (x + w > 636) {
        x = 4;
        y += rowH + 12;
        rowH = 0;
      }
      this.add.image(x, y + 10, asset.key, '__BASE').setOrigin(0, 0).setScale(scale);
      pixelText(this, x, y, asset.key, { color: PALETTE.uiDim });
      x += Math.max(w, 60) + 6;
      rowH = Math.max(rowH, h);
    }
    pixelText(this, 4, 350, 'THE QUICK BROWN FOX JUMPS OVER 0123456789 !?:-+/()%', { color: PALETTE.omnitrix });
  }
}
