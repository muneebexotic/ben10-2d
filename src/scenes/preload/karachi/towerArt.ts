import type { PixelCanvas } from '../PixelCanvas';
import { seeded } from '../PixelCanvas';
import { KARACHI as K } from './colors';

/**
 * THE TOWER WRAP's tower: a tile of its stone (pale sandstone, string courses,
 * a pointed window with a lamp behind it now and then), a ledge stone, and
 * the merlons around the top. White-ish, so the renderer can shade it per
 * strip as the tower turns.
 */

/** 96x64, tiles both ways. */
export function drawTowerWall(pc: PixelCanvas): void {
  const base = 0xd8c8b4;
  const joint = 0xa89884;
  const light = 0xf0e4d4;
  pc.rect(0, 0, 96, 64, base);
  const rnd = seeded(404);
  for (let y = 0; y < 64; y += 8) {
    pc.hline(0, 95, y, joint);
    pc.hline(0, 95, y + 1, light);
    for (let x = (y / 8) % 2 === 0 ? 0 : 12; x < 96; x += 24) pc.vline(x, y + 1, y + 7, joint);
  }
  for (let i = 0; i < 30; i++) pc.px(Math.floor(rnd() * 96), Math.floor(rnd() * 64), rnd() < 0.5 ? joint : light);
  // A string course, and a pointed window (lit).
  pc.rect(0, 30, 96, 3, light).rect(0, 33, 96, 1, joint);
  const wx = 40;
  pc.rect(wx, 44, 14, 20, 0x2a2030);
  for (let i = 0; i <= 7; i++) {
    const h = Math.round(Math.sin((i / 7) * (Math.PI / 2)) * 7);
    pc.rect(wx + i, 44 - h, 1, h, 0x2a2030).rect(wx + 13 - i, 44 - h, 1, h, 0x2a2030);
  }
  pc.rect(wx + 3, 46, 8, 14, K.window, 0.85);
  pc.vline(wx + 7, 40, 63, joint);
}

/** A ledge stone, seen from the front: its top lit by the moon. 12x8. */
export function drawTowerLedge(pc: PixelCanvas): void {
  pc.rect(0, 0, 12, 8, 0xb8a894);
  pc.rect(0, 0, 12, 2, 0xf4ecdc);
  pc.rect(0, 6, 12, 2, 0x6a5a4a);
  pc.vline(11, 0, 7, 0x8a7a6a);
}

/** A merlon on the tower's top rim. 10x12. */
export function drawTowerMerlon(pc: PixelCanvas): void {
  pc.rect(0, 0, 10, 12, 0xd8c8b4);
  pc.rect(0, 0, 10, 2, 0xf4ecdc);
  pc.vline(9, 0, 11, 0x8a7a6a);
}
