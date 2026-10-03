import Phaser from 'phaser';
import { ACHIEVEMENTS, type LifetimeCounter } from '../../config/achievements';
import { PALETTE } from '../../config/palette';
import type { SlotData } from '../../systems/SaveSystem';
import { achievementProgress, fileCounter } from '../../systems/Achievements';
import { achievementBadge } from '../achievementBadge';
import { pixelText } from '../text';
import type { ExtrasPage } from './pages';

const COL_X = [22, 326];
const COL_W = 292;
const ROW_Y = 104;
const ROW_H = 22;

/** Every achievement in two columns: earned ones in gold, the rest with their progress. */
export class AchievementsPage implements ExtrasPage {
  readonly root: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, file: SlotData | null) {
    const items: Phaser.GameObjects.GameObject[] = [];
    const earned = (id: string) => file?.achievements[id] !== undefined;
    const lifetime = (c: LifetimeCounter) => fileCounter(file, c);
    const count = ACHIEVEMENTS.filter((a) => earned(a.id)).length;
    items.push(pixelText(scene, 320, 84, `${count} / ${ACHIEVEMENTS.length} UNLOCKED`, { originX: 0.5, originY: 0.5, color: count === ACHIEVEMENTS.length ? PALETTE.gold : PALETTE.cream }));
    const rows = Math.ceil(ACHIEVEMENTS.length / 2);
    ACHIEVEMENTS.forEach((a, i) => {
      const x = COL_X[Math.floor(i / rows)];
      const y = ROW_Y + (i % rows) * ROW_H;
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
    });
    this.root = scene.add.container(0, 0, items);
  }

  move(): void {
    // Everything is on screen at once.
  }
}
