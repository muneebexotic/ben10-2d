import Phaser from 'phaser';
import { ALL_ASSETS as SHARED_ASSETS, LAZY_ART } from './preload/catalog';
import { ensureArt } from './preload/generate';
import { knownLevelIds, loadChapter } from '../chapters/registry';
import type { AssetDef } from './preload/assetTypes';
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

  private assets: AssetDef[] = [];

  create(): void {
    this.cameras.main.setBackgroundColor(0x2a2f45);
    // Every chapter's art lives in its chunk: fetch them all, then show everything.
    void Promise.all(knownLevelIds().map((id) => loadChapter(id))).then((chapters) => {
      const groups = [...Object.values(LAZY_ART), ...chapters.flatMap((c) => c.art ?? [])];
      for (const g of groups) ensureArt(this, g);
      const seen = new Set<string>();
      this.assets = [...SHARED_ASSETS, ...groups.flatMap((g) => g.assets)].filter((a) => !seen.has(a.key) && seen.add(a.key));
      this.show();
    });
  }

  private show(): void {
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
    const items = this.assets.filter((a) => a.frameWidth * a.frames * scale < 1200);
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
    const asset = this.assets.find((a) => a.key === key);
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
