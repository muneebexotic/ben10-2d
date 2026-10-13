import Phaser from 'phaser';
import { ACHIEVEMENTS, type LifetimeCounter } from '../../config/achievements';
import { PALETTE } from '../../config/palette';
import type { SlotData } from '../../systems/SaveSystem';
import { achievementProgress, fileCounter } from '../../systems/Achievements';
import { achievementBadge } from '../achievementBadge';
import { playSfx } from '../../systems/audio/Sfx';
import { pixelText } from '../text';
import type { ExtrasPage } from './pages';

const COL_X = [22, 326];
const COL_W = 292;
const ROW_Y = 104;
const ROW_H = 22;
/** Two columns of ten fit above the screen's bottom edge; more go on another page. */
const PER_PAGE = 20;

/** Every achievement in two columns, a page at a time: earned ones in gold, the rest with their progress. */
export class AchievementsPage implements ExtrasPage {
  readonly root: Phaser.GameObjects.Container;
  private readonly pages: Phaser.GameObjects.Container[] = [];
  private readonly pageLabel: ReturnType<typeof pixelText> | null = null;
  private page = 0;

  constructor(scene: Phaser.Scene, file: SlotData | null) {
    const items: Phaser.GameObjects.GameObject[] = [];
    const earned = (id: string) => file?.achievements[id] !== undefined;
    const lifetime = (c: LifetimeCounter) => fileCounter(file, c);
    const count = ACHIEVEMENTS.filter((a) => earned(a.id)).length;
    items.push(pixelText(scene, 320, 84, `${count} / ${ACHIEVEMENTS.length} UNLOCKED`, { originX: 0.5, originY: 0.5, color: count === ACHIEVEMENTS.length ? PALETTE.gold : PALETTE.cream }));
    const pageCount = Math.ceil(ACHIEVEMENTS.length / PER_PAGE);
    let pageItems: Phaser.GameObjects.GameObject[] = [];
    ACHIEVEMENTS.forEach((a, n) => {
      const i = n % PER_PAGE;
      const onPage = Math.min(PER_PAGE, ACHIEVEMENTS.length - (n - i));
      const rows = Math.ceil(onPage / 2);
      const x = COL_X[Math.floor(i / rows)];
      const y = ROW_Y + (i % rows) * ROW_H;
      const items = pageItems;
      const got = earned(a.id);
      const hidden = a.secret && !got;
      const g = scene.add.graphics();
      g.fillStyle(got ? 0x2a2210 : PALETTE.ink, 0.75).fillRoundedRect(x, y - 10, COL_W, 21, 4);
      if (got) g.lineStyle(1, PALETTE.gold, 0.5).strokeRoundedRect(x + 0.5, y - 9.5, COL_W - 1, 20, 4);
      items.push(g, achievementBadge(scene, x + 11, y, a.icon, got, 8));
      items.push(pixelText(scene, x + 24, y - 5, hidden ? '? ? ?' : a.title, { originY: 0.5, color: got ? PALETTE.gold : PALETTE.white }));
      items.push(pixelText(scene, x + 24, y + 5, hidden ? 'KEEP PLAYING...' : a.text, { originY: 0.5, color: PALETTE.uiDim }));
      if (!got && a.counter && a.goal && a.goal > 1) {
        const p = achievementProgress(a, false, (c) => lifetime(c));
        const have = Math.min(a.goal, Math.floor(lifetime(a.counter)));
        items.push(pixelText(scene, x + COL_W - 6, y - 5, `${have}/${a.goal}`, { originX: 1, originY: 0.5, color: PALETTE.cream }));
        const bar = scene.add.graphics();
        bar.fillStyle(PALETTE.uiPanelLight, 1).fillRect(x + COL_W - 92, y - 6, 40, 2);
        bar.fillStyle(PALETTE.omnitrix, 1).fillRect(x + COL_W - 92, y - 6, Math.round(40 * p), 2);
        items.push(bar);
      }
      if (i === onPage - 1) {
        this.pages.push(scene.add.container(0, 0, pageItems).setVisible(this.pages.length === 0));
        pageItems = [];
      }
    });
    items.push(...this.pages);
    if (pageCount > 1) {
      // The page counter turns the page on a tap; arrows do it from the keyboard.
      const label = pixelText(scene, 618, 84, '', { originX: 1, originY: 0.5, color: PALETTE.cream });
      label.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.turn(1, true));
      this.pageLabel = label;
      items.push(label);
    }
    this.root = scene.add.container(0, 0, items);
    this.showPage();
  }

  move(dx: number, dy: number): void {
    this.turn(dx !== 0 ? dx : dy, false);
  }

  private turn(dir: number, wrap: boolean): void {
    const n = this.pages.length;
    if (n < 2 || dir === 0) return;
    const next = wrap ? (this.page + Math.sign(dir) + n) % n : Phaser.Math.Clamp(this.page + Math.sign(dir), 0, n - 1);
    if (next === this.page) return;
    this.page = next;
    playSfx('uiMove', 0.8, 1 + next * 0.1);
    this.showPage();
  }

  private showPage(): void {
    this.pages.forEach((c, i) => c.setVisible(i === this.page));
    this.pageLabel?.setText(`< ${this.page + 1}/${this.pages.length} >`);
  }
}
