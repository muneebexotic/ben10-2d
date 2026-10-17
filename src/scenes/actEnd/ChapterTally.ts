import Phaser from 'phaser';
import { PALETTE } from '../../config/palette';
import type { ChapterInfo } from '../../levels/chapters';
import { playSfx } from '../../systems/audio/Sfx';
import { formatTime } from '../../systems/RunStats';
import { pixelText } from '../../ui/text';

export interface TallyRow {
  chapter: ChapterInfo;
  bestMs: number | null;
  rank: string | null;
  cards: number;
  totalCards: number;
}

interface Live {
  row: TallyRow;
  time: Phaser.GameObjects.BitmapText;
  startAt: number;
  done: boolean;
}

/**
 * ACT COMPLETE's table: every chapter so far, its best time counting up from
 * zero row by row, its best rank stamped on when the count lands, then the
 * total.
 */
export class ChapterTally {
  private readonly live: Live[] = [];
  private totalText: Phaser.GameObjects.BitmapText | null = null;
  private totalAt = 0;
  private t = 0;
  private finished = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
    private readonly rows: readonly TallyRow[],
    private readonly totalLabel: string,
    rowMs: number,
    private readonly countMs: number,
  ) {
    rows.forEach((row, i) => {
      const ry = y + i * 18;
      pixelText(scene, x, ry, `${row.chapter.number}. ${row.chapter.title}`, { color: PALETTE.cream });
      const time = pixelText(scene, x + 150, ry, row.bestMs ? '0:00.0' : '--:--', { color: PALETTE.white });
      const got = row.cards >= row.totalCards;
      pixelText(scene, x + 230, ry, `${row.cards}/${row.totalCards}`, { color: got ? PALETTE.gold : PALETTE.uiDim });
      this.live.push({ row, time, startAt: i * rowMs, done: !row.bestMs });
      time.setAlpha(0);
    });
    this.totalAt = rows.length * rowMs + countMs;
  }

  /** The whole summer so far (null when a chapter has no best time yet). */
  get totalMs(): number | null {
    let sum = 0;
    for (const r of this.rows) {
      if (!r.bestMs) return null;
      sum += r.bestMs;
    }
    return sum;
  }

  get cards(): { found: number; total: number } {
    return this.rows.reduce((a, r) => ({ found: a.found + r.cards, total: a.total + r.totalCards }), { found: 0, total: 0 });
  }

  update(dtMs: number): void {
    if (this.finished) return;
    this.t += dtMs;
    for (const l of this.live) {
      if (this.t < l.startAt) continue;
      l.time.setAlpha(1);
      if (l.done) continue;
      const k = Math.min(1, (this.t - l.startAt) / this.countMs);
      l.time.setText(formatTime(Math.round(l.row.bestMs! * Phaser.Math.Easing.Cubic.Out(k))));
      if (k < 1) continue;
      l.done = true;
      playSfx('tick', 0.4, 1.4);
      if (l.row.rank) this.stampRank(l);
    }
    if (this.t >= this.totalAt && !this.totalText) this.showTotal();
  }

  private stampRank(l: Live): void {
    const r = pixelText(this.scene, l.time.x + 66, l.time.y + 4, l.row.rank!, { originX: 0.5, originY: 0.5, color: PALETTE.gold }).setScale(3).setAlpha(0);
    this.scene.tweens.add({ targets: r, scale: 1, alpha: 1, duration: 160, ease: 'Quad.In' });
    playSfx('stamp', 0.35, 1.3);
  }

  private showTotal(): void {
    const y = this.y + this.rows.length * 18 + 6;
    this.scene.add.rectangle(this.x - 4, y - 3, 280, 1, PALETTE.omnitrixDark).setOrigin(0, 0.5);
    pixelText(this.scene, this.x, y + 2, this.totalLabel, { color: PALETTE.omnitrix });
    const total = this.totalMs;
    this.totalText = pixelText(this.scene, this.x + 150, y + 2, total ? formatTime(total) : '--:--', { color: PALETTE.omnitrix });
    const { found, total: all } = this.cards;
    pixelText(this.scene, this.x + 230, y + 2, `${found}/${all}`, { color: found >= all ? PALETTE.gold : PALETTE.omnitrix });
    this.totalText.setScale(1.5).setAlpha(0);
    this.scene.tweens.add({ targets: this.totalText, scale: 1, alpha: 1, duration: 200, ease: 'Back.easeOut' });
    playSfx('uiConfirm', 0.6);
    this.finished = true;
  }
}
