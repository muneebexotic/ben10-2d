import Phaser from 'phaser';
import { ALL_ASSETS } from './preload/catalog';
import { SCENES } from './SceneKeys';
import { pixelText } from '../ui/text';
import { PALETTE } from '../config/palette';

/**
 * Dev tool (?gallery=1): every generated texture at 2x, for checking placeholder
 * or real art. ?gallery=1&key=<texture> shows one sheet frame by frame at 4x.
 */
export class GalleryScene extends Phaser.Scene {
  constructor() {
    super(SCENES.gallery);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x2a2f45);
    const key = new URLSearchParams(window.location.search).get('key');
    if (key) {
      this.showSheet(key);
      return;
    }
    let x = 4;
    let y = 4;
    let rowH = 0;
    const page = Number(new URLSearchParams(window.location.search).get('page') ?? 0);
    const scale = 2;
    const items = ALL_ASSETS.filter((a) => a.frameWidth * a.frames * scale < 1200);
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

  private showSheet(key: string): void {
    const asset = ALL_ASSETS.find((a) => a.key === key);
    if (!asset) return;
    const q = new URLSearchParams(window.location.search);
    const scale = Number(q.get('scale') ?? 4);
    const from = Number(q.get('from') ?? 0);
    const w = asset.frameWidth * scale + 8;
    const h = asset.frameHeight * scale + 14;
    const cols = Math.max(1, Math.floor(636 / w));
    for (let f = from; f < asset.frames; f++) {
      const x = 4 + ((f - from) % cols) * w;
      const y = 4 + Math.floor((f - from) / cols) * h;
      this.add.rectangle(x, y + 10, asset.frameWidth * scale, asset.frameHeight * scale, 0x3a4060).setOrigin(0, 0);
      this.add.image(x, y + 10, key, f).setOrigin(0, 0).setScale(scale);
      pixelText(this, x, y, String(f), { color: PALETTE.uiDim });
    }
  }
}
