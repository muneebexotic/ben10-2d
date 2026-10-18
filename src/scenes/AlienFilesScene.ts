import Phaser from 'phaser';
import { allAliens } from '../aliens/registry';
import type { FormDefinition } from '../aliens/types';
import { ALIEN_DEMOS } from '../config/alienFiles';
import { GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { prepareLevel } from '../chapters/start';
import { completedChapters } from '../levels/registry';
import { playSfx } from '../systems/audio/Sfx';
import { EventBus } from '../systems/EventBus';
import { inputMode } from '../systems/InputMode';
import { saveSystem } from '../systems/SaveSystem';
import { session } from '../systems/Session';
import { bindMuteKey } from '../systems/Settings';
import { trainingAliens } from '../systems/Unlocks';
import { MenuBackdrop } from '../ui/menu/MenuBackdrop';
import { enterMenu, isLeaving, leaveTo } from '../ui/menu/transition';
import { backButton, menuHeader, MenuButton } from '../ui/menu/widgets';
import { pixelText } from '../ui/text';
import { sideMargin } from '../ui/view';
import type { LevelStartData } from './LevelScene';
import { SCENES } from './SceneKeys';

/** The live demo's window (frame coordinates). */
const DEMO_BOX = { x: 318, y: 104, w: 296, h: 160 };
const LIST_X = 24;
const LIST_W = 272;
const ICON_Y = 68;
/** Wait this long after the last change before the bot starts the next demo (a held key flicks past). */
const SETTLE_MS = 260;

/**
 * ALIEN FILES: every alien's moves with the keys that do them, and a live
 * demo window where a bot plays the selected move on a loop in the Training
 * arena (the real game, not a recording). TRY IT drops the player into
 * Training as that alien. Aliens not on the file's dial yet are classified.
 */
export class AlienFilesScene extends Phaser.Scene {
  private backdrop!: MenuBackdrop;
  private aliens: readonly FormDefinition[] = [];
  private known = new Set<string>();
  private alien = 0;
  private move = 0;
  private icons: Phaser.GameObjects.Container[] = [];
  private page: Phaser.GameObjects.Container | null = null;
  private rows: Array<{ zone: Phaser.GameObjects.Zone; bar: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.BitmapText }> = [];
  private caption!: Phaser.GameObjects.BitmapText;
  private loading!: Phaser.GameObjects.BitmapText;
  private tryIt!: MenuButton;
  private hint!: Phaser.GameObjects.BitmapText;
  private launchIn = -1;
  /** The level running behind is this screen's demo (never stop a level that TRY IT started). */
  private demoUp = false;

  constructor() {
    super(SCENES.alienFiles);
  }

  create(): void {
    enterMenu(this);
    // The same dial Training gives this file (what TRY IT can play).
    session.useSlot(saveSystem.lastSlot);
    const file = session.file;
    const completedIds = Object.entries(file?.chapters ?? {})
      .filter(([, r]) => r.completed)
      .map(([id]) => id);
    this.known = new Set(trainingAliens(completedChapters(completedIds)));
    this.aliens = allAliens();
    this.alien = Math.max(0, this.aliens.findIndex((a) => this.known.has(a.id)));
    this.move = 0;
    this.icons = [];
    this.rows = [];
    this.page = null;
    this.launchIn = -1;
    this.demoUp = false;

    this.backdrop = new MenuBackdrop(this, { dim: 0.7, moon: false });
    menuHeader(this, 'ALIEN FILES', 'EVERY MOVE, PLAYED FOR YOU. THEN TRY IT.');
    backButton(this, () => this.back());
    this.buildIcons();
    // The demo window's frame (the level draws inside it, on top of this scene).
    const g = this.add.graphics();
    g.fillStyle(PALETTE.ink, 1).fillRect(DEMO_BOX.x - 3, DEMO_BOX.y - 3, DEMO_BOX.w + 6, DEMO_BOX.h + 6);
    g.lineStyle(2, PALETTE.omnitrixDark, 1).strokeRect(DEMO_BOX.x - 4, DEMO_BOX.y - 4, DEMO_BOX.w + 8, DEMO_BOX.h + 8);
    this.loading = pixelText(this, DEMO_BOX.x + DEMO_BOX.w / 2, DEMO_BOX.y + DEMO_BOX.h / 2, '', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    pixelText(this, DEMO_BOX.x, DEMO_BOX.y - 12, 'LIVE DEMO', { originY: 0.5, color: PALETTE.omnitrix });
    this.caption = pixelText(this, DEMO_BOX.x, DEMO_BOX.y + DEMO_BOX.h + 12, '', { color: PALETTE.cream, maxWidth: DEMO_BOX.w });
    this.tryIt = new MenuButton(this, LIST_X + LIST_W / 2, 318, 150, 'TRY IT', PALETTE.omnitrix, () => this.tryAlien(), 22);
    this.tryIt.setFocused(true);
    this.hint = pixelText(this, GAME_WIDTH / 2, 348, '', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });

    const kb = this.input.keyboard!;
    for (const [keys, dx, dy] of [
      [['LEFT', 'A', 'Q'], -1, 0],
      [['RIGHT', 'D', 'E'], 1, 0],
      [['UP', 'W'], 0, -1],
      [['DOWN', 'S'], 0, 1],
    ] as const) {
      for (const key of keys) kb.on(`keydown-${key}`, () => (dx !== 0 ? this.pickAlien(this.alien + dx) : this.pickMove(this.move + dy)));
    }
    kb.on('keydown-ENTER', () => this.tryAlien());
    kb.on('keydown-SPACE', () => this.tryAlien());
    bindMuteKey(this);
    EventBus.on('input:mode', () => this.refreshHint(true), this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.offContext(this);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
      this.stopDemo();
    });
    this.showAlien(true);
    this.refreshHint(false);
  }

  private buildIcons(): void {
    const n = this.aliens.length;
    this.aliens.forEach((a, i) => {
      const x = GAME_WIDTH / 2 + (i - (n - 1) / 2) * 44;
      const known = this.known.has(a.id);
      const ring = this.add.circle(0, 0, 15, PALETTE.ink, 0.9).setStrokeStyle(2, known ? a.theme.color : PALETTE.uiPanelLight);
      const icon = this.add.image(0, 0, a.hudIcon).setScale(1.5).setTint(known ? a.theme.color : 0x2a3048);
      const items: Phaser.GameObjects.GameObject[] = [ring, icon];
      if (!known) items.push(pixelText(this, 0, 0, '?', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim }));
      const zone = this.add.zone(0, 0, 40, 40).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.pickAlien(i));
      items.push(zone);
      this.icons.push(this.add.container(x, ICON_Y, items));
    });
  }

  private pickAlien(i: number): void {
    const n = this.aliens.length;
    const next = ((i % n) + n) % n;
    if (next === this.alien) return;
    playSfx('uiMove', 0.9, 1 + next * 0.04);
    this.alien = next;
    this.move = 0;
    this.showAlien(false);
  }

  private pickMove(i: number): void {
    const a = this.aliens[this.alien];
    if (!this.known.has(a.id)) return;
    const next = Phaser.Math.Clamp(i, 0, a.moves.length - 1);
    if (next === this.move) return;
    playSfx('uiMove', 0.8, 1.1 + next * 0.05);
    this.move = next;
    this.highlightMove();
    this.queueDemo();
  }

  /** The selected alien's page: name, tagline, moves (classified until it's on the dial). */
  private showAlien(first: boolean): void {
    const a = this.aliens[this.alien];
    const known = this.known.has(a.id);
    this.icons.forEach((c, i) => c.setScale(i === this.alien ? 1.25 : 1).setAlpha(i === this.alien ? 1 : 0.7));
    this.page?.destroy();
    this.rows = [];
    const items: Phaser.GameObjects.GameObject[] = [];
    items.push(pixelText(this, LIST_X, 102, known ? a.name : '? ? ?', { scale: 2, originY: 0.5, color: known ? a.theme.color : PALETTE.uiDim }));
    if (known) {
      items.push(pixelText(this, LIST_X, 120, a.unlock?.tagline ?? '', { color: PALETTE.cream, maxWidth: LIST_W }));
      let y = 142;
      a.moves.forEach((m, i) => {
        const text = pixelText(this, LIST_X + 8, y, inputMode.format(m), { color: PALETTE.white, maxWidth: LIST_W - 12 });
        const h = Math.ceil(text.height) + 6;
        const bar = this.add.rectangle(LIST_X, y - 3, LIST_W, h, a.theme.color, 0.22).setOrigin(0, 0).setVisible(false);
        const zone = this.add.zone(LIST_X, y - 3, LIST_W, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => this.pickMove(i));
        items.push(bar, text, zone);
        this.rows.push({ zone, bar, text });
        y += h + 2;
      });
    } else {
      items.push(pixelText(this, LIST_X, 120, `CLASSIFIED. THIS ONE JOINS THE DIAL IN CHAPTER ${a.unlockChapter}.`, { color: PALETTE.uiDim, maxWidth: LIST_W }));
    }
    this.page = this.add.container(0, 0, items);
    this.tryIt.setEnabled(known).setText(known ? `TRY ${a.name}` : 'TRY IT');
    this.highlightMove();
    if (!first) this.page.setAlpha(0);
    this.tweens.add({ targets: this.page, alpha: 1, duration: 140 });
    this.queueDemo();
  }

  private highlightMove(): void {
    const a = this.aliens[this.alien];
    const known = this.known.has(a.id);
    this.rows.forEach((r, i) => {
      r.bar.setVisible(i === this.move);
      r.text.setTint(i === this.move ? PALETTE.white : PALETTE.uiDim);
    });
    this.caption.setText(known ? `MOVE ${this.move + 1} / ${a.moves.length}` : '');
  }

  /** The bot starts the selected move once the selection settles. */
  private queueDemo(): void {
    this.stopDemo();
    const a = this.aliens[this.alien];
    const has = this.known.has(a.id) && ALIEN_DEMOS[a.id]?.[this.move] !== undefined;
    this.loading.setText(has ? 'LOADING...' : this.known.has(a.id) ? '' : 'CLASSIFIED');
    this.launchIn = has ? SETTLE_MS : -1;
  }

  private launchDemo(): void {
    const a = this.aliens[this.alien];
    const margin = sideMargin(this);
    const data: LevelStartData = {
      levelId: 'training',
      demo: { alienId: a.id, move: this.move, viewport: { x: DEMO_BOX.x + margin, y: DEMO_BOX.y, w: DEMO_BOX.w, h: DEMO_BOX.h } },
    };
    void prepareLevel(this.game, 'training').then(() => {
      if (!this.sys.isActive() || isLeaving(this)) return;
      this.demoUp = true;
      this.scene.launch(SCENES.level, data);
      // The level draws its window over this screen.
      this.scene.bringToTop(SCENES.level);
    });
  }

  private stopDemo(): void {
    if (!this.demoUp) return;
    this.demoUp = false;
    const s = this.scene;
    if (s.isActive(SCENES.level) || s.isPaused(SCENES.level) || s.isSleeping(SCENES.level)) s.stop(SCENES.level);
  }

  private readonly onResize = () => this.queueDemo();

  private tryAlien(): void {
    const a = this.aliens[this.alien];
    if (!this.known.has(a.id) || isLeaving(this)) {
      playSfx('denied');
      return;
    }
    this.launchIn = -1;
    this.stopDemo();
    playSfx('transformBoom', 0.7);
    const data: LevelStartData = { levelId: 'training', tryAlien: a.id };
    leaveTo(this, SCENES.level, data, null, { ready: prepareLevel(this.game, 'training') });
  }

  /** The keys or taps line, and (`rebuild`) the moves again with the right control names. */
  private refreshHint(rebuild = true): void {
    const touch = inputMode.current === 'touch';
    this.hint.setText(touch ? 'TAP AN ALIEN, THEN A MOVE TO WATCH IT' : '[LEFT]/[RIGHT] ALIEN   [UP]/[DOWN] MOVE   [ENTER] TRY IT   [ESC] BACK');
    if (rebuild) this.showAlien(true);
  }

  private back(): void {
    if (isLeaving(this)) return;
    this.launchIn = -1;
    this.stopDemo();
    playSfx('uiBack');
    leaveTo(this, SCENES.menu, undefined, null);
  }

  override update(time: number, delta: number): void {
    this.backdrop.update();
    this.tryIt.pulse(time);
    if (this.launchIn >= 0) {
      this.launchIn -= delta;
      if (this.launchIn < 0) this.launchDemo();
    }
    if (this.loading.text && this.scene.isActive(SCENES.level)) this.loading.setText('');
  }
}
