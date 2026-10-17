import Phaser from 'phaser';
import { DIARY_LAST_PAGE, DIARY_MOMENTS, diaryCatalog } from '../../aliens/diary';
import { getAlien, hasAlien } from '../../aliens/registry';
import { PALETTE } from '../../config/palette';
import type { SlotData } from '../../systems/SaveSystem';
import { drawPanel } from '../menu/widgets';
import { pixelText } from '../text';
import type { ExtrasPage } from './pages';

const COL_X = [22, 326];
const COL_W = 292;
const ROW_Y = 104;
const ROW_H = 22;
const LAST_Y = 306;

/**
 * GHOSTFREAK'S DIARY: every whisper the thing in the watch has said to this
 * file, grouped by when he says it, with the rest left as "? ? ?" and a hint
 * of when to listen. The last page stays stuck shut until Chapter 9.
 */
export class DiaryPage implements ExtrasPage {
  readonly root: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, file: SlotData | null) {
    const heard = new Set(file?.diary ?? []);
    const entries = diaryCatalog();
    const got = entries.filter((e) => heard.has(e.id)).length;
    const items: Phaser.GameObjects.GameObject[] = [];
    const ghost = hasAlien('ghostfreak') ? getAlien('ghostfreak') : null;
    const eye = PALETTE.ghostfreakEye;
    if (ghost) items.push(scene.add.image(214, 84, ghost.hudIcon).setScale(2));
    items.push(pixelText(scene, 232, 84, `GHOSTFREAK'S DIARY   ${got} / ${entries.length}`, { originY: 0.5, color: got === entries.length ? PALETTE.gold : PALETTE.ghostfreak }));
    const rows = Math.ceil(entries.length / 2);
    entries.forEach((e, i) => {
      const x = COL_X[Math.floor(i / rows)];
      const y = ROW_Y + (i % rows) * ROW_H;
      const have = heard.has(e.id);
      const g = scene.add.graphics();
      g.fillStyle(have ? 0x1a1430 : PALETTE.ink, 0.75).fillRoundedRect(x, y - 10, COL_W, 21, 4);
      if (have) g.lineStyle(1, eye, 0.5).strokeRoundedRect(x + 0.5, y - 9.5, COL_W - 1, 20, 4);
      items.push(g);
      items.push(pixelText(scene, x + 8, y - 5, DIARY_MOMENTS[e.moment], { originY: 0.5, color: PALETTE.uiDim }));
      items.push(pixelText(scene, x + 8, y + 5, have ? `"${e.text}"` : '? ? ?', { originY: 0.5, color: have ? PALETTE.ghostfreakGlow : PALETTE.uiDim }));
    });
    // The last page: stuck shut until he gets out.
    const open = file?.chapters[DIARY_LAST_PAGE.levelId]?.completed === true;
    const g = scene.add.graphics();
    drawPanel(g, 320, LAST_Y, 596, 34, { fill: PALETTE.ink, fillAlpha: 0.85, stroke: eye, strokeAlpha: open ? 0.9 : 0.35, radius: 5 });
    items.push(g);
    items.push(pixelText(scene, 320, LAST_Y - 7, 'THE LAST PAGE', { originX: 0.5, originY: 0.5, color: open ? eye : PALETTE.uiDim }));
    items.push(
      pixelText(scene, 320, LAST_Y + 6, open ? `"${DIARY_LAST_PAGE.text}"` : `STUCK SHUT. SOMETHING IS HOLDING IT CLOSED... (CHAPTER ${DIARY_LAST_PAGE.chapter})`, {
        originX: 0.5,
        originY: 0.5,
        color: open ? PALETTE.ghostfreakGlow : PALETTE.uiDim,
      }),
    );
    this.root = scene.add.container(0, 0, items);
  }

  move(_dx: number, _dy: number): void {
    // One page: nothing to browse.
  }
}
