import Phaser from 'phaser';
import { jokeCatalog, type Joke } from '../../aliens/jokes';
import { allAliens, getAlien } from '../../aliens/registry';
import { PALETTE } from '../../config/palette';
import { playSfx } from '../../systems/audio/Sfx';
import type { SlotData } from '../../systems/SaveSystem';
import { drawPanel } from '../menu/widgets';
import { pixelText } from '../text';
import type { ExtrasPage } from './pages';

const LIST_X = 22;
const LIST_W = 160;
const ROW_Y = 106;
const ROW_H = 38;
const JOKE_X = 200;
const JOKE_W = 420;

/**
 * JOKES FOUND: the misfire log. Every reaction line Ben can blurt out when the
 * watch gives him the wrong alien, grouped by the alien he got. Lines not
 * heard yet stay hidden, with who he'd have to want to hear them.
 */
export class JokesPage implements ExtrasPage {
  readonly root: Phaser.GameObjects.Container;
  private readonly catalog: Joke[] = jokeCatalog();
  private readonly found: Set<string>;
  private readonly rowBgs: Phaser.GameObjects.Graphics[] = [];
  private index = 0;
  private list: Phaser.GameObjects.Container | null = null;

  constructor(private readonly scene: Phaser.Scene, file: SlotData | null) {
    this.found = new Set(file?.jokes ?? []);
    const items: Phaser.GameObjects.GameObject[] = [];
    const total = this.catalog.length;
    const got = this.catalog.filter((j) => this.found.has(j.id)).length;
    items.push(pixelText(scene, 320, 84, `JOKES FOUND  ${got} / ${total}`, { originX: 0.5, originY: 0.5, color: got === total ? PALETTE.gold : PALETTE.cream }));
    allAliens().forEach((alien, i) => {
      const y = ROW_Y + i * ROW_H;
      const jokes = this.catalog.filter((j) => j.gotId === alien.id);
      const have = jokes.filter((j) => this.found.has(j.id)).length;
      const bg = scene.add.graphics();
      this.rowBgs.push(bg);
      const icon = scene.add.image(LIST_X + 16, y, alien.hudIcon).setScale(2);
      const name = pixelText(scene, LIST_X + 34, y - 6, alien.name, { originY: 0.5, color: alien.theme.color });
      const count = pixelText(scene, LIST_X + 34, y + 6, `${have}/${jokes.length}`, { originY: 0.5, color: have === jokes.length ? PALETTE.gold : PALETTE.uiDim });
      const zone = scene.add.zone(LIST_X + LIST_W / 2, y, LIST_W, ROW_H - 4).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.select(i));
      items.push(bg, icon, name, count, zone);
    });
    items.push(pixelText(scene, LIST_X, ROW_Y + 5 * ROW_H - 10, 'HEAR THEM ALL: TURN MISFIRES TO CHAOS IN TRAINING', { color: PALETTE.uiDim, maxWidth: LIST_W + 10 }));
    this.root = scene.add.container(0, 0, items);
    this.select(0, true);
  }

  move(_dx: number, dy: number): void {
    const n = allAliens().length;
    this.select(Phaser.Math.Clamp(this.index + dy, 0, n - 1));
  }

  private select(i: number, quiet = false): void {
    if (!quiet && i !== this.index) playSfx('uiMove', 0.8, 1 + i * 0.05);
    this.index = i;
    const aliens = allAliens();
    this.rowBgs.forEach((g, r) => {
      g.clear();
      const on = r === i;
      drawPanel(g, LIST_X + LIST_W / 2, ROW_Y + r * ROW_H, LIST_W, ROW_H - 4, { fill: on ? PALETTE.uiPanel : PALETTE.ink, fillAlpha: on ? 0.95 : 0.6, stroke: on ? aliens[r].theme.color : PALETTE.uiPanelLight, strokeAlpha: on ? 1 : 0.4, radius: 4 });
    });
    this.showJokes(aliens[i].id);
  }

  private showJokes(gotId: string): void {
    const scene = this.scene;
    this.list?.destroy();
    const g = scene.add.graphics();
    drawPanel(g, JOKE_X + JOKE_W / 2, 196, JOKE_W, 206, { fill: PALETTE.ink, fillAlpha: 0.8, stroke: getAlien(gotId).theme.color, strokeAlpha: 0.6, radius: 6 });
    const items: Phaser.GameObjects.GameObject[] = [g];
    const jokes = this.catalog.filter((j) => j.gotId === gotId);
    const step = Math.min(24, 196 / Math.max(1, jokes.length));
    jokes.forEach((j, k) => {
      const y = 104 + k * step;
      const heard = this.found.has(j.id);
      const wanted = j.wanted.map((w) => getAlien(w).name).join(' / ');
      items.push(pixelText(scene, JOKE_X + 10, y, `WANTED ${wanted}`, { originY: 0.5, color: PALETTE.uiDim }));
      items.push(pixelText(scene, JOKE_X + 10, y + 10, heard ? `"${j.text}"` : '? ? ?', { originY: 0.5, color: heard ? PALETTE.cream : PALETTE.uiDim }));
    });
    this.list = scene.add.container(0, 0, items);
    this.root.add(this.list);
  }
}
