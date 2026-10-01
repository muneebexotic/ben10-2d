import Phaser from 'phaser';
import { getAlien, hasAlien } from '../../aliens/registry';
import { PALETTE } from '../../config/palette';
import type { ChapterInfo } from '../../levels/chapters';
import { TEX } from '../../scenes/preload/assetKeys';
import { SILHOUETTE_KEYS, type SilhouetteId } from '../../scenes/preload/silhouettes';
import { seededRng } from '../../systems/Rng';
import { pixelText } from '../text';

/** Rim colour per act on locked cards. */
export const ACT_COLORS: Record<number, number> = {
  1: PALETTE.omnitrix,
  2: PALETTE.fire2,
  3: PALETTE.jammer,
  4: PALETTE.enemy,
};

const SHADOW = 0x090b16;

/**
 * The picture window on a chapter card. Open chapters get a little diorama;
 * locked ones show who's coming as solid silhouettes with a coloured rim.
 * Everything is placed around (0, 0), the window's centre, and kept inside w x h.
 */
export function chapterArt(scene: Phaser.Scene, chapter: ChapterInfo, open: boolean, w: number, h: number): Phaser.GameObjects.GameObject[] {
  const bg = scene.add.graphics();
  const out: Phaser.GameObjects.GameObject[] = [bg];
  if (open && chapter.number === 1) {
    out.push(...campCrash(scene, bg, w, h));
  } else {
    const rim = ACT_COLORS[chapter.act] ?? PALETTE.omnitrix;
    bg.fillGradientStyle(0x05070f, 0x05070f, 0x141a33, 0x141a33, 1).fillRect(-w / 2, -h / 2, w, h);
    out.push(scene.add.image(0, h * 0.1, TEX.light).setScale(2.2, 1.2).setTint(rim).setAlpha(0.22).setBlendMode(Phaser.BlendModes.ADD));
    out.push(...cast(scene, chapter.cast, rim, w, h));
  }
  const frame = scene.add.graphics();
  frame.lineStyle(1, PALETTE.uiPanelLight, 1).strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
  out.push(frame);
  return out;
}

/** Chapter 1's window: the camp at night, the RV, the campfire, Ben, and the green meteor coming down. */
function campCrash(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, w: number, h: number): Phaser.GameObjects.GameObject[] {
  const left = -w / 2;
  const top = -h / 2;
  const ground = h / 2 - 10;
  g.fillGradientStyle(PALETTE.sky0, PALETTE.sky0, PALETTE.sky3, PALETTE.sky3, 1).fillRect(left, top, w, h);
  const rng = seededRng(7);
  for (let i = 0; i < 26; i++) {
    g.fillStyle(PALETTE.star, 0.4 + rng() * 0.6).fillRect(Math.round(left + rng() * w), Math.round(top + rng() * h * 0.55), 1, 1);
  }
  // Two rows of pines.
  for (const [color, base, size, step] of [
    [PALETTE.pineFar, ground - 6, 16, 13],
    [PALETTE.pineMid, ground + 2, 22, 19],
  ] as const) {
    g.fillStyle(color, 1);
    for (let x = left - 6; x < w / 2 + 12; x += step) {
      const s = size * (0.75 + rng() * 0.4);
      g.fillTriangle(x, base, x + s * 0.45, base - s, x + s * 0.9, base);
    }
  }
  g.fillStyle(PALETTE.grass0, 1).fillRect(left, ground, w, 3);
  g.fillStyle(PALETTE.dirt0, 1).fillRect(left, ground + 3, w, h / 2 - ground - 3);

  const out: Phaser.GameObjects.GameObject[] = [];
  out.push(scene.add.image(w / 2 - 20, top + 14, TEX.moon).setScale(0.5));
  out.push(scene.add.image(left + 36, ground, TEX.rv).setOrigin(0.5, 1).setScale(0.6));
  out.push(scene.add.image(left + 82, ground, TEX.tent, 0).setOrigin(0.5, 1).setScale(0.6));
  const fireGlow = scene.add.image(left + 108, ground - 4, TEX.light).setScale(0.7).setTint(PALETTE.fire2).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: fireGlow, alpha: 0.25, yoyo: true, repeat: -1, duration: 260, ease: 'Sine.easeInOut' });
  out.push(fireGlow, scene.add.image(left + 108, ground, TEX.campfire).setOrigin(0.5, 1).setScale(0.7));
  out.push(scene.add.sprite(left + 132, ground, TEX.ben, 0).setOrigin(0.5, 27 / 28).setFlipX(true));

  // The Omnitrix pod streaks across the sky, again and again.
  const streak = scene.add.image(0, 0, TEX.streak).setTint(PALETTE.omnitrix).setScale(1.6, 2).setBlendMode(Phaser.BlendModes.ADD);
  const head = scene.add.image(0, 0, TEX.soft).setTint(PALETTE.omnitrixGlow).setScale(0.5).setBlendMode(Phaser.BlendModes.ADD);
  const fall = { t: 0 };
  const place = () => {
    const x = left + 10 + fall.t * (w - 40);
    const y = top + 6 + fall.t * (h * 0.5);
    streak.setPosition(x - 20, y - 8).setRotation(Math.atan2(h * 0.5, w - 40)).setAlpha(Math.sin(fall.t * Math.PI));
    head.setPosition(x, y).setAlpha(Math.sin(fall.t * Math.PI));
  };
  place();
  scene.tweens.add({ targets: fall, t: 1, duration: 1300, repeat: -1, repeatDelay: 1800, onUpdate: place });
  out.push(streak, head);
  return out;
}

/** Up to two mystery silhouettes, side by side, standing on the window's floor. */
function cast(scene: Phaser.Scene, ids: readonly string[], rim: number, w: number, h: number): Phaser.GameObjects.GameObject[] {
  const out: Phaser.GameObjects.GameObject[] = [];
  const floor = h / 2 - 4;
  const spread = ids.length > 1 ? w * 0.26 : 0;
  ids.forEach((id, i) => {
    const x = ids.length > 1 ? (i === 0 ? -spread : spread) : 0;
    if (id === 'omnitrix') {
      out.push(...selfDestruct(scene, h));
      return;
    }
    const tex = textureFor(id);
    if (!tex) return;
    const fit = id === 'greymatter' ? 1 : Math.min(2, (h - 10) / tex.h);
    const giant = id === 'waybig';
    const scale = giant ? 1.7 : fit;
    // Way Big doesn't fit: he stands below the window and only his head and shoulders show.
    const base = giant ? floor + 30 : floor;
    // Texture rows that would spill out of the window, top and bottom.
    const crop = giant
      ? { top: Math.max(0, Math.ceil((-h / 2 - (base - tex.h * scale)) / scale)), bottom: Math.max(0, Math.ceil((base - h / 2) / scale)) }
      : null;
    // Rim light first (offset copies), then the solid shadow on top.
    for (const [dx, dy] of [[-1, -1], [1, -1]]) {
      out.push(silhouette(scene, tex, x + dx, base + dy, scale, rim, 0.9, crop));
    }
    out.push(silhouette(scene, tex, x, base, scale, SHADOW, 1, crop));
    if (id === 'greymatter') out.push(pixelText(scene, x + 10, floor - 18, '?', { originX: 0.5, originY: 0.5, color: rim }));
  });
  if (!ids.includes('omnitrix')) out.push(pixelText(scene, 0, -h / 2 + 12, '?', { scale: 2, originX: 0.5, originY: 0.5, color: rim }).setAlpha(0.7));
  return out;
}

function silhouette(
  scene: Phaser.Scene,
  tex: { key: string; frame: number; h: number },
  x: number,
  floor: number,
  scale: number,
  color: number,
  alpha: number,
  crop: { top: number; bottom: number } | null,
): Phaser.GameObjects.Image {
  const img = scene.add
    .image(x, floor, tex.key, tex.frame)
    .setOrigin(0.5, 1)
    .setScale(scale)
    .setTint(color)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(alpha);
  // Keep only the rows inside the window.
  if (crop) img.setCrop(0, crop.top, img.width, tex.h - crop.top - crop.bottom);
  return img;
}

/** A registered alien uses its real sprite; future ones their drawn silhouette; plus Vilgax. */
function textureFor(id: string): { key: string; frame: number; h: number } | null {
  if (hasAlien(id)) {
    const a = getAlien(id);
    return { key: a.texture, frame: 0, h: a.frame.h };
  }
  if (id === 'vilgax') return { key: TEX.vilgax, frame: 0, h: 76 };
  if (id in SILHOUETTE_KEYS) {
    const key = SILHOUETTE_KEYS[id as SilhouetteId];
    const heights: Record<SilhouetteId, number> = {
      wildmutt: 26, stinkfly: 30, upgrade: 34, diamondhead: 38, ghostfreak: 35, greymatter: 11,
      ripjaws: 35, cannonbolt: 33, wildvine: 39, waybig: 64, kevin: 30,
    };
    return { key, frame: 0, h: heights[id as SilhouetteId] };
  }
  return null;
}

/** Chapter 11: no silhouette, just the Omnitrix glowing red with a countdown. */
function selfDestruct(scene: Phaser.Scene, h: number): Phaser.GameObjects.GameObject[] {
  const glow = scene.add.image(0, -4, TEX.light).setScale(1.4).setTint(PALETTE.enemy).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD);
  const watch = scene.add.image(0, -4, TEX.hourglass).setScale(0.7).setTint(PALETTE.enemy);
  const count = pixelText(scene, 0, h / 2 - 10, '00:10', { originX: 0.5, originY: 0.5, color: PALETTE.enemy });
  scene.tweens.add({ targets: [glow, watch], alpha: { from: 1, to: 0.35 }, yoyo: true, repeat: -1, duration: 500 });
  return [glow, watch, count];
}
