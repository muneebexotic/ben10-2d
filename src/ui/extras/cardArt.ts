import Phaser from 'phaser';
import { PALETTE } from '../../config/palette';
import type { CardInfo } from '../../levels/cards';
import { clippedSheen } from '../sheen';
import { pixelText } from '../text';

const SKIN = 0xf0c090;
const SKIN_DARK = 0xc8905a;
const HAIR = 0x14101a;

/** Darkens a colour toward ink (0..1). */
function shade(color: number, k: number): number {
  const c = Phaser.Display.Color.IntegerToColor(color);
  return Phaser.Display.Color.GetColor(Math.round(c.red * k), Math.round(c.green * k), Math.round(c.blue * k));
}

/**
 * A Sumo Slammers card drawn in code: a wrestler in his card's colour
 * stomping in front of a sunburst, the card number in the corner. Holo cards
 * get a gold frame and a rainbow sheen. `found` false draws the card back.
 */
export function sumoCard(scene: Phaser.Scene, x: number, y: number, w: number, h: number, info: CardInfo, found: boolean): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  const items: Phaser.GameObjects.GameObject[] = [g];
  const left = -w / 2;
  const top = -h / 2;
  if (!found) {
    g.fillStyle(PALETTE.ink, 1).fillRoundedRect(left, top, w, h, 3);
    g.fillStyle(0x1a2140, 1).fillRoundedRect(left + 2, top + 2, w - 4, h - 4, 2);
    g.lineStyle(1, PALETTE.uiPanelLight, 1).strokeRoundedRect(left + 0.5, top + 0.5, w - 1, h - 1, 3);
    for (let i = 0; i < 4; i++) g.lineStyle(1, 0x2a335a, 1).strokeCircle(0, 0, (w / 2) * (0.3 + i * 0.22));
    items.push(pixelText(scene, 0, 0, '?', { scale: w >= 60 ? 4 : 2, originX: 0.5, originY: 0.5, color: PALETTE.uiDim }));
    return scene.add.container(x, y, items);
  }
  const u = w / 40;
  // Frame and background with a sunburst behind the wrestler.
  g.fillStyle(info.holo ? PALETTE.gold : PALETTE.cream, 1).fillRoundedRect(left, top, w, h, 3);
  g.fillStyle(shade(info.color, 0.35), 1).fillRect(left + 2 * u, top + 2 * u, w - 4 * u, h - 4 * u);
  g.fillStyle(shade(info.color, 0.55), 1);
  const cx = 0;
  const cy = top + h * 0.42;
  sunburst(g, cx, cy, left + 2 * u, top + 2 * u, w - 4 * u, h - 4 * u, 12);
  // The wrestler: legs, belly, belt, arms, head and topknot.
  const by = top + h * 0.56;
  g.fillStyle(SKIN_DARK, 1).fillRect(cx - 9 * u, by + 6 * u, 6 * u, 9 * u).fillRect(cx + 3 * u, by + 6 * u, 6 * u, 9 * u);
  g.fillStyle(SKIN, 1).fillEllipse(cx - 12 * u, by - 2 * u, 7 * u, 10 * u).fillEllipse(cx + 12 * u, by - 2 * u, 7 * u, 10 * u);
  g.fillStyle(SKIN, 1).fillEllipse(cx, by, 24 * u, 22 * u);
  g.fillStyle(0xffe0b8, 1).fillEllipse(cx - 3 * u, by - 3 * u, 9 * u, 8 * u);
  g.fillStyle(info.color, 1).fillRect(cx - 12 * u, by + 4 * u, 24 * u, 4 * u).fillRect(cx - 3 * u, by + 7 * u, 6 * u, 7 * u);
  g.fillStyle(SKIN, 1).fillCircle(cx, by - 13 * u, 5.5 * u);
  g.fillStyle(HAIR, 1).fillRect(cx - 5 * u, by - 19 * u, 10 * u, 3 * u).fillCircle(cx, by - 20 * u, 2.2 * u);
  g.fillStyle(HAIR, 1).fillRect(cx - 3 * u, by - 13 * u, 1.5 * u, 1.5 * u).fillRect(cx + 1.5 * u, by - 13 * u, 1.5 * u, 1.5 * u);
  // Number and (on big cards) the name strip.
  items.push(pixelText(scene, left + 3 * u, top + 3 * u, `#${String(info.number).padStart(3, '0')}`, { color: PALETTE.white, scale: w >= 80 ? 1 : 1 }));
  if (w >= 80) {
    g.fillStyle(PALETTE.ink, 0.85).fillRect(left + 2 * u, top + h - 14, w - 4 * u, 12);
    items.push(pixelText(scene, 0, top + h - 8, info.name, { originX: 0.5, originY: 0.5, color: info.holo ? PALETTE.gold : PALETTE.cream }));
  }
  if (info.holo) items.push(clippedSheen(scene, left + 2 * u, top + 2 * u, w - 4 * u, h - 4 * u, { color: 'rainbow', alpha: 0.28, durationMs: 2400, repeatDelayMs: 600 }));
  return scene.add.container(x, y, items);
}

/** Alternate rays from (cx, cy) out to the edges of a box, every second wedge filled, never past the box. */
function sunburst(g: Phaser.GameObjects.Graphics, cx: number, cy: number, x0: number, y0: number, w: number, h: number, wedges: number): void {
  const edge = (a: number): { x: number; y: number; side: number } => {
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const tx = dx > 0 ? (x0 + w - cx) / dx : dx < 0 ? (x0 - cx) / dx : Infinity;
    const ty = dy > 0 ? (y0 + h - cy) / dy : dy < 0 ? (y0 - cy) / dy : Infinity;
    const t = Math.min(tx, ty);
    // Sides: 0 right, 1 bottom, 2 left, 3 top.
    const side = tx < ty ? (dx > 0 ? 0 : 2) : dy > 0 ? 1 : 3;
    return { x: cx + dx * t, y: cy + dy * t, side };
  };
  const corners = [
    { x: x0 + w, y: y0 + h },
    { x: x0, y: y0 + h },
    { x: x0, y: y0 },
    { x: x0 + w, y: y0 },
  ];
  for (let i = 0; i < wedges; i += 2) {
    const p0 = edge((i / wedges) * Math.PI * 2);
    const p1 = edge(((i + 1) / wedges) * Math.PI * 2);
    const pts = [new Phaser.Math.Vector2(cx, cy), new Phaser.Math.Vector2(p0.x, p0.y)];
    // Walking clockwise from p0's side to p1's side passes these corners.
    for (let side = p0.side; side !== p1.side; side = (side + 1) % 4) pts.push(new Phaser.Math.Vector2(corners[side].x, corners[side].y));
    pts.push(new Phaser.Math.Vector2(p1.x, p1.y));
    g.fillPoints(pts, true);
  }
}
