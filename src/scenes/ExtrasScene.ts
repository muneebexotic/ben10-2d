import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { getDifficulty } from '../config/difficulty';
import { PALETTE } from '../config/palette';
import { playSfx } from '../systems/audio/Sfx';
import { EventBus } from '../systems/EventBus';
import { inputMode } from '../systems/InputMode';
import { saveSystem } from '../systems/SaveSystem';
import { bindMuteKey } from '../systems/Settings';
import { AchievementsPage } from '../ui/extras/AchievementsPage';
import { AlbumPage } from '../ui/extras/AlbumPage';
import { JokesPage } from '../ui/extras/JokesPage';
import type { ExtrasPage } from '../ui/extras/pages';
import { MenuBackdrop } from '../ui/menu/MenuBackdrop';
import { enterMenu, isLeaving, leaveTo } from '../ui/menu/transition';
import { backButton, menuHeader, MenuButton } from '../ui/menu/widgets';
import { pixelText } from '../ui/text';
import { SCENES } from './SceneKeys';

export interface ExtrasSceneData {
  /** The file whose extras to show (the title's Continue file). */
  slot: number | null;
}

const TABS = ['ACHIEVEMENTS', 'CARD ALBUM', 'JOKES FOUND'] as const;

/** EXTRAS: a file's achievements, its Sumo Slammers album and the misfire jokes it has heard. */
export class ExtrasScene extends Phaser.Scene {
  private backdrop!: MenuBackdrop;
  private tab = 0;
  private tabs: MenuButton[] = [];
  private pages: ExtrasPage[] = [];
  private hint!: Phaser.GameObjects.BitmapText;
  private swipeStart: { x: number; y: number } | null = null;

  constructor() {
    super(SCENES.extras);
  }

  create(data: ExtrasSceneData): void {
    enterMenu(this);
    const slot = data?.slot ?? null;
    const file = slot === null ? null : saveSystem.getSlot(slot);
    this.backdrop = new MenuBackdrop(this, { dim: 0.6, moon: false });
    menuHeader(this, 'EXTRAS', file && slot !== null ? `FILE ${slot + 1}  -  ${getDifficulty(file.difficulty).label}` : 'NO SAVE FILE YET');
    backButton(this, () => this.back());

    this.pages = [new AchievementsPage(this, file), new AlbumPage(this, file), new JokesPage(this, file)];
    this.tabs = TABS.map((label, i) => new MenuButton(this, GAME_WIDTH / 2 + (i - 1) * 150, 64, 140, label, PALETTE.omnitrix, () => this.setTab(i), 16));
    this.tab = -1;
    this.setTab(0, true);
    this.hint = pixelText(this, GAME_WIDTH / 2, 346, '', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });

    const kb = this.input.keyboard!;
    for (const [key, dx, dy] of [
      ['LEFT', -1, 0],
      ['A', -1, 0],
      ['RIGHT', 1, 0],
      ['D', 1, 0],
      ['UP', 0, -1],
      ['W', 0, -1],
      ['DOWN', 0, 1],
      ['S', 0, 1],
    ] as const) {
      kb.on(`keydown-${key}`, () => this.pages[this.tab].move(dx, dy));
    }
    kb.on('keydown-Q', () => this.setTab(this.tab - 1));
    kb.on('keydown-E', () => this.setTab(this.tab + 1));
    kb.on('keydown-TAB', (e: KeyboardEvent) => {
      e.preventDefault();
      this.setTab((this.tab + 1) % TABS.length);
    });
    // A sideways swipe flips the page on touch.
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => (this.swipeStart = { x: p.x, y: p.y }));
    this.input.on(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => {
      const s = this.swipeStart;
      this.swipeStart = null;
      if (!s) return;
      const dx = p.x - s.x;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(p.y - s.y) * 2) this.setTab(this.tab + (dx < 0 ? 1 : -1));
    });
    bindMuteKey(this);
    EventBus.on('input:mode', () => this.refreshHint(), this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => EventBus.offContext(this));
    this.refreshHint();
  }

  private setTab(i: number, quiet = false): void {
    const next = Phaser.Math.Clamp(i, 0, TABS.length - 1);
    if (next === this.tab) return;
    if (!quiet) playSfx('uiMove', 1, 0.9 + next * 0.1);
    this.tab = next;
    this.pages.forEach((p, k) => p.root.setVisible(k === next));
    this.tabs.forEach((t, k) => t.setFocused(k === next));
    const page = this.pages[next].root;
    page.setAlpha(0);
    this.tweens.add({ targets: page, alpha: 1, duration: 160 });
  }

  private refreshHint(): void {
    this.hint.setText(inputMode.current === 'touch' ? 'TAP A TAB OR SWIPE TO FLIP PAGES   TAP AN ITEM' : '[Q]/[E] PAGES   [ARROWS] BROWSE   [ESC] BACK');
  }

  private back(): void {
    if (isLeaving(this)) return;
    playSfx('uiBack');
    leaveTo(this, SCENES.menu, undefined, null);
  }

  override update(time: number): void {
    this.backdrop.update();
    this.tabs.forEach((t) => t.pulse(time));
  }
}
