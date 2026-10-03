import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { playSfx } from '../systems/audio/Sfx';
import { formatTime } from '../systems/RunStats';
import { formatDelta, type SplitReviewRow } from '../systems/Splits';
import { drawPanel } from './menu/widgets';
import { pixelText } from './text';

const W = 456;
const AHEAD = 0x6dff8a;
const BEHIND = 0xff6a6a;

/**
 * The run's splits, side by side with the bests they were up against: time at
 * each checkpoint, the delta (green ahead, red behind), each segment with a
 * gold star where it beat its best ever, and the sum of best underneath.
 */
export class SplitsReview {
  private root: Phaser.GameObjects.Container | null = null;

  constructor(private readonly scene: Phaser.Scene) {}

  get open(): boolean {
    return this.root !== null;
  }

  toggle(rows: readonly SplitReviewRow[], sumOfBestMs: number | null, finalMs: number): void {
    if (this.root) this.close();
    else this.show(rows, sumOfBestMs, finalMs);
  }

  close(): void {
    if (!this.root) return;
    const root = this.root;
    this.root = null;
    playSfx('uiBack');
    this.scene.tweens.add({ targets: root, alpha: 0, scale: 0.96, duration: 140, onComplete: () => root.destroy() });
  }

  private show(rows: readonly SplitReviewRow[], sumOfBestMs: number | null, finalMs: number): void {
    const scene = this.scene;
    const h = 74 + rows.length * 14;
    const g = scene.add.graphics();
    drawPanel(g, 0, 0, W, h, { fill: PALETTE.ink, fillAlpha: 1, stroke: PALETTE.omnitrix, radius: 6, bevel: true });
    const items: Phaser.GameObjects.GameObject[] = [g];
    const top = -h / 2;
    const colTime = 60;
    const colDelta = 140;
    const colSeg = 214;
    items.push(pixelText(scene, 0, top + 12, 'SPLITS', { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix }));
    const head = top + 30;
    for (const [x, label] of [[colTime, 'TIME'], [colDelta, 'VS BEST'], [colSeg, 'SEGMENT']] as const) {
      items.push(pixelText(scene, x, head, label, { originX: 1, originY: 0.5, color: PALETTE.uiDim }));
    }
    rows.forEach((r, i) => {
      const y = head + 14 + i * 14;
      items.push(pixelText(scene, -W / 2 + 14, y, r.label, { originY: 0.5, color: PALETTE.cream }));
      items.push(pixelText(scene, colTime, y, formatTime(r.timeMs), { originX: 1, originY: 0.5, color: PALETTE.white }));
      const delta = r.deltaMs === null ? 'FIRST' : formatDelta(r.deltaMs);
      const dColor = r.deltaMs === null ? PALETTE.uiDim : r.deltaMs < 0 ? AHEAD : BEHIND;
      items.push(pixelText(scene, colDelta, y, delta, { originX: 1, originY: 0.5, color: dColor }));
      items.push(pixelText(scene, colSeg, y, formatTime(r.segmentMs), { originX: 1, originY: 0.5, color: r.goldSegment ? PALETTE.gold : PALETTE.white }));
      if (r.goldSegment) items.push(scene.add.star(colSeg + 9, y, 5, 2, 4.5, PALETTE.gold));
    });
    const foot = top + h - 18;
    if (sumOfBestMs !== null) {
      const save = Math.max(0, finalMs - sumOfBestMs);
      items.push(pixelText(scene, -W / 2 + 14, foot, `SUM OF BEST  ${formatTime(sumOfBestMs)}`, { originY: 0.5, color: PALETTE.gold }));
      items.push(pixelText(scene, W / 2 - 14, foot, save > 0 ? `POSSIBLE TIME SAVE  ${formatTime(save)}` : 'A PERFECT RUN!', { originX: 1, originY: 0.5, color: save > 0 ? PALETTE.cream : PALETTE.gold }));
    } else {
      items.push(pixelText(scene, 0, foot, 'SUM OF BEST APPEARS ONCE EVERY SEGMENT HAS A TIME', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim }));
    }
    const zone = scene.add.zone(0, 0, W, h).setInteractive();
    zone.on('pointerdown', () => this.close());
    items.push(zone);
    this.root = scene.add.container(GAME_WIDTH / 2, 176, items).setDepth(100).setAlpha(0).setScale(0.96);
    scene.tweens.add({ targets: this.root, alpha: 1, scale: 1, duration: 160, ease: 'Back.easeOut' });
    playSfx('uiSelect');
  }
}
