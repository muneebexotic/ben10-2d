import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { DIFFICULTY_IDS, getDifficulty } from '../config/difficulty';
import { PALETTE } from '../config/palette';
import { RANK_COLOR } from '../config/scoring';
import { MENU } from '../config/ui';
import { ACTS, CHAPTERS, chapterState, defaultChapterIndex, titleRevealed, type ChapterInfo, type ChapterState } from '../levels/chapters';
import { getLevel } from '../levels/registry';
import { availableCards, countedCards, waitingSecrets } from '../levels/secrets';
import { isOmnitrixMaster } from '../systems/Mastery';
import { clippedSheen } from '../ui/sheen';
import { flashCamera } from '../systems/Accessibility';
import { audio } from '../systems/audio/AudioEngine';
import { music } from '../systems/audio/Music';
import { playSfx } from '../systems/audio/Sfx';
import { EventBus } from '../systems/EventBus';
import { inputMode } from '../systems/InputMode';
import { checkpointLabel, completedLevelIds, fileAliens, summarize } from '../systems/Progress';
import { formatTime } from '../systems/RunStats';
import { bestOn, saveSystem, type SlotData } from '../systems/SaveSystem';
import { session } from '../systems/Session';
import { bindAudioUnlock, bindMuteKey } from '../systems/Settings';
import { ACT_COLORS, chapterArt } from '../ui/menu/chapterArt';
import { MenuBackdrop } from '../ui/menu/MenuBackdrop';
import { enterMenu, isLeaving, leaveTo } from '../ui/menu/transition';
import { backButton, cornerButton, drawPanel, MenuButton } from '../ui/menu/widgets';
import { FONT_KEY, SOFT_FONT_KEY } from '../ui/PixelFont';
import { boxed, pixelText } from '../ui/text';
import { TEX } from './preload/assetKeys';
import type { LevelStartData } from './LevelScene';
import { SCENES } from './SceneKeys';

export interface ChapterSelectData {
  /** A file was just created: a little welcome. */
  newFile?: boolean;
  /** Back from Chapter Complete: celebrate this chapter (and reveal the next one on a first clear). */
  cleared?: string;
  firstClear?: boolean;
  /** Reopen on this chapter (after Settings changed the difficulty). */
  focus?: number;
}

const CARD_W = 212;
const CARD_H = 208;
const CARD_Y = 166;
const ART_W = 192;
const ART_H = 80;

interface Card {
  info: ChapterInfo;
  state: ChapterState;
  root: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Graphics;
  title: Phaser.GameObjects.BitmapText;
  /** Every text on the card: side cards draw them in the soft font (they sit at a fractional scale). */
  texts: Phaser.GameObjects.BitmapText[];
  /** Darkens side cards (alpha would let the silhouettes' rim light show through). */
  shade: Phaser.GameObjects.Graphics;
  /** S rank on every difficulty: a gold card. */
  master: boolean;
}

/**
 * The file's hub: every chapter in a carousel. Open ones show their bests on
 * each difficulty and the cards found; locked ones are silhouettes and a
 * cryptic line about what's coming.
 */
export class ChapterSelectScene extends Phaser.Scene {
  private backdrop!: MenuBackdrop;
  private cards: Card[] = [];
  private focus = 0;
  private file: SlotData | null = null;
  private completed: string[] = [];
  private actTitle!: Phaser.GameObjects.BitmapText;
  private primary!: MenuButton;
  private secondary!: MenuButton;
  private buttonFocus = 0;
  private hint!: Phaser.GameObjects.BitmapText;
  private busy = false;

  constructor() {
    super(SCENES.chapterSelect);
  }

  create(data: ChapterSelectData = {}): void {
    enterMenu(this);
    this.cards = [];
    this.busy = false;
    this.buttonFocus = 0;
    this.file = session.file;
    if (!this.file || session.slot === null) {
      // No file (a stale scene start): back to the title.
      this.scene.start(SCENES.menu);
      return;
    }
    this.completed = completedLevelIds(this.file);
    this.backdrop = new MenuBackdrop(this, { dim: 0.35, emblem: false, moon: false });

    this.actTitle = pixelText(this, GAME_WIDTH / 2, 22, '', { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });
    const d = getDifficulty(this.file.difficulty);
    const fileLabel = pixelText(this, GAME_WIDTH / 2 - 4, 38, `FILE ${session.slot + 1}  -`, { originX: 1, originY: 0.5, color: PALETTE.uiDim });
    pixelText(this, fileLabel.x + 6, 38, d.label, { originX: 0, originY: 0.5, color: d.color });
    backButton(this, () => this.back());
    cornerButton(this, inputMode.current === 'touch' ? 'SETTINGS' : 'SETTINGS [S]', () => this.openSettings());
    // On key-up, so Settings doesn't also see the key press and move its cursor.
    this.input.keyboard?.on('keyup-S', () => this.openSettings());

    CHAPTERS.forEach((info) => this.cards.push(this.buildCard(info)));
    const clearedIndex = data.cleared ? CHAPTERS.findIndex((c) => c.levelId === data.cleared) : -1;
    this.focus = data.focus ?? (clearedIndex >= 0 ? clearedIndex : defaultChapterIndex(this.completed));

    this.primary = new MenuButton(this, GAME_WIDTH / 2, 292, 190, 'PLAY', PALETTE.omnitrix, () => this.playPrimary(), 24);
    this.secondary = new MenuButton(this, GAME_WIDTH / 2 + 104, 292, 104, 'RESTART', PALETTE.uiDim, () => this.restart(), 24);
    this.primary.onFocus = () => this.setButtonFocus(0);
    this.secondary.onFocus = () => this.setButtonFocus(1);

    // Left/right arrows for thumbs and mice.
    for (const dir of [-1, 1] as const) {
      const arrow = pixelText(this, GAME_WIDTH / 2 + dir * 300, CARD_Y, dir < 0 ? '<' : '>', { scale: 3, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });
      this.tweens.add({ targets: arrow, x: arrow.x + dir * 3, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut' });
      this.add.zone(arrow.x, CARD_Y, 44, 120).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.setFocus(this.focus + dir));
    }

    const summary = summarize(session.slot);
    if (summary) {
      pixelText(this, GAME_WIDTH / 2, 320, `CHAPTERS ${summary.chaptersDone}/${summary.chaptersTotal}     CARDS ${summary.cards}/${summary.cardsTotal}     ALIENS ${summary.aliens.length}/${summary.aliensTotal}`, {
        originX: 0.5,
        originY: 0.5,
        color: PALETTE.cream,
      });
    }
    this.hint = pixelText(this, GAME_WIDTH / 2, 341, '', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.setFocus(this.focus - 1));
    kb.on('keydown-A', () => this.setFocus(this.focus - 1));
    kb.on('keydown-RIGHT', () => this.setFocus(this.focus + 1));
    kb.on('keydown-D', () => this.setFocus(this.focus + 1));
    kb.on('keydown-UP', () => this.setButtonFocus(0));
    kb.on('keydown-DOWN', () => this.setButtonFocus(1));
    for (const key of ['ENTER', 'SPACE', 'J']) kb.on(`keydown-${key}`, () => (this.buttonFocus === 1 && this.secondary.visible ? this.secondary.press() : this.primary.press()));
    kb.on('keydown-R', () => this.secondary.visible && this.secondary.press());
    this.bindSwipe();
    bindMuteKey(this);
    bindAudioUnlock(this, () => music.play('title'));
    if (audio.ready) music.play('title');
    EventBus.on('input:mode', () => this.refresh(true), this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => EventBus.offContext(this));
    this.refresh(true);

    if (data.newFile) this.welcome();
    if (clearedIndex >= 0) this.celebrate(clearedIndex, data.firstClear === true);
  }

  // ---------------------------------------------------------------- Cards

  private buildCard(info: ChapterInfo): Card {
    const state = chapterState(info, this.completed);
    const open = state === 'open';
    const frame = this.add.graphics();
    const top = -CARD_H / 2;
    const items: Phaser.GameObjects.GameObject[] = [frame];
    const record = info.levelId && this.file ? this.file.chapters[info.levelId] : undefined;

    items.push(pixelText(this, -CARD_W / 2 + 12, top + 14, `CHAPTER ${info.number}`, { originY: 0.5, color: PALETTE.uiDim }));
    // A secret in a cleared chapter that a newer alien can now open: worth a trip back.
    const waiting = open && record?.completed && info.levelId && this.file ? waitingSecrets(getLevel(info.levelId), fileAliens(this.file), record?.cards ?? []).length > 0 : false;
    const master = open && isOmnitrixMaster(record);
    const chip = waiting
      ? ['SECRET WAITING!', PALETTE.gold]
      : master
        ? ['OMNITRIX MASTER', PALETTE.gold]
        : open
        ? record?.completed
          ? ['COMPLETE', PALETTE.omnitrix]
          : ['NEW!', PALETTE.gold]
        : state === 'locked'
          ? ['LOCKED', PALETTE.uiDim]
          : ['COMING SOON', PALETTE.uiDim];
    const chipText = pixelText(this, CARD_W / 2 - 12, top + 14, chip[0] as string, { originX: 1, originY: 0.5, color: chip[1] as number });
    if (waiting) this.tweens.add({ targets: chipText, alpha: 0.45, yoyo: true, repeat: -1, duration: 520, ease: 'Sine.easeInOut' });
    items.push(chipText);
    const revealed = titleRevealed(info, this.completed);
    const title = pixelText(this, 0, top + 32, revealed ? info.title : '? ? ?', { scale: 2, originX: 0.5, originY: 0.5, color: open ? PALETTE.white : PALETTE.cream });
    items.push(title);

    const art = this.add.container(0, top + 46 + ART_H / 2, chapterArt(this, info, open, ART_W, ART_H));
    items.push(art);
    const below = top + 46 + ART_H;

    if (open && info.levelId) items.push(...this.openDetails(info, below));
    else items.push(...this.lockedDetails(info, state, below));

    const shade = this.add.graphics();
    shade.fillStyle(PALETTE.ink, 0.55).fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 8);
    items.push(shade);
    const zone = this.add.zone(0, 0, CARD_W, CARD_H).setInteractive({ useHandCursor: true });
    zone.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.busy || isLeaving(this) || this.swiped(p)) return;
      const i = this.cards.findIndex((c) => c.root === root);
      // Tap a side card to bring it in; tap the middle one to play it.
      if (i === this.focus) this.primary.press();
      else this.setFocus(i);
    });
    items.push(zone);
    for (const it of items) if (it instanceof Phaser.GameObjects.BitmapText) boxed(it, -CARD_W / 2 + 3, -CARD_H / 2 + 2, CARD_W - 6, CARD_H - 4);
    const root = this.add.container(GAME_WIDTH / 2, CARD_Y, items);
    if (master) {
      // A slow gold glint across the card.
      root.add(clippedSheen(this, -CARD_W / 2 + 3, -CARD_H / 2 + 3, CARD_W - 6, CARD_H - 6, { color: PALETTE.gold, alpha: 0.1, durationMs: 1600, repeatDelayMs: 2400, band: 0.12 }));
    }
    const texts: Phaser.GameObjects.BitmapText[] = [];
    const collect = (list: Phaser.GameObjects.GameObject[]) => {
      for (const it of list) {
        if (it instanceof Phaser.GameObjects.BitmapText) texts.push(it);
        else if (it instanceof Phaser.GameObjects.Container) collect(it.list);
      }
    };
    collect(items);
    return { info, state, root, frame, title, texts, shade, master };
  }

  /** Bests on the file's difficulty, a medal per difficulty, and the cards found. */
  private openDetails(info: ChapterInfo, y0: number): Phaser.GameObjects.GameObject[] {
    const out: Phaser.GameObjects.GameObject[] = [];
    const file = this.file!;
    const record = file.chapters[info.levelId!];
    const best = record ? bestOn(record, file.difficulty) : null;
    const d = getDifficulty(file.difficulty);

    out.push(pixelText(this, -CARD_W / 2 + 14, y0 + 12, `BEST ON ${d.label}`, { originY: 0.5, color: PALETTE.uiDim }));
    out.push(pixelText(this, CARD_W / 2 - 14, y0 + 12, best?.bestTimeMs ? formatTime(best.bestTimeMs) : '--:--.--', { originX: 1, originY: 0.5, color: PALETTE.white }));
    const rank = best?.bestRank ?? null;
    out.push(pixelText(this, CARD_W / 2 - 14, y0 + 26, rank ? `RANK ${rank}` : 'NO RANK YET', { originX: 1, originY: 0.5, color: rank ? RANK_COLOR[rank] : PALETTE.uiDim }));

    // One medal per difficulty: mastery on every setting is the long game.
    DIFFICULTY_IDS.forEach((id, i) => {
      const dd = getDifficulty(id);
      const r = record?.bests[id]?.bestRank ?? null;
      const x = -CARD_W / 2 + 26 + i * 30;
      const g = this.add.graphics();
      drawPanel(g, x, y0 + 26, 26, 14, { fill: PALETTE.ink, fillAlpha: 0.9, stroke: r ? dd.color : PALETTE.uiPanelLight, strokeAlpha: id === file.difficulty ? 1 : 0.6, radius: 3 });
      out.push(g, pixelText(this, x - 7, y0 + 26, dd.label[0], { originX: 0.5, originY: 0.5, color: r ? dd.color : PALETTE.uiDim }));
      out.push(pixelText(this, x + 6, y0 + 26, r ?? '-', { originX: 0.5, originY: 0.5, color: r ? RANK_COLOR[r] : PALETTE.uiDim }));
    });

    // Sumo Slammers cards: found, missing, or waiting behind an alien this file doesn't have yet.
    const level = getLevel(info.levelId!);
    const counted = countedCards(level);
    const reachable = availableCards(level, fileAliens(file)).map((c) => c.id);
    const found = record?.cards ?? [];
    const startX = -((counted.length - 1) * 13) / 2;
    counted.forEach((c, i) => {
      const got = found.includes(c.id);
      const img = this.add.image(startX + i * 13, y0 + 46, TEX.cardIcon, got ? 1 : 0);
      if (!got && !reachable.includes(c.id)) img.setAlpha(0.35);
      // A card behind an alien the file has now: it glints.
      if (!got && c.requires && reachable.includes(c.id)) this.tweens.add({ targets: img, scale: 1.3, yoyo: true, repeat: -1, duration: 420, ease: 'Sine.easeInOut' });
      out.push(img);
    });
    out.push(pixelText(this, CARD_W / 2 - 14, y0 + 46, `${found.filter((id) => counted.some((c) => c.id === id)).length}/${counted.length}`, { originX: 1, originY: 0.5, color: PALETTE.gold }));
    out.push(pixelText(this, 0, y0 + 66, info.tease, { originX: 0.5, originY: 0.5, color: PALETTE.uiDim, maxWidth: CARD_W - 24, align: 'center' }));
    return out;
  }

  private lockedDetails(info: ChapterInfo, state: ChapterState, y0: number): Phaser.GameObjects.GameObject[] {
    const out: Phaser.GameObjects.GameObject[] = [];
    out.push(pixelText(this, 0, y0 + 18, info.tease, { originX: 0.5, originY: 0.5, color: PALETTE.cream, maxWidth: CARD_W - 24, align: 'center' }));
    const previous = CHAPTERS.find((c) => c.number === info.number - 1);
    const line = state === 'locked' && previous ? `FINISH CHAPTER ${previous.number} TO UNLOCK` : 'ARRIVES IN A FUTURE UPDATE';
    out.push(pixelText(this, 0, y0 + 48, line, { originX: 0.5, originY: 0.5, color: ACT_COLORS[info.act] ?? PALETTE.uiDim }));
    // A little padlock.
    const g = this.add.graphics();
    g.lineStyle(2, PALETTE.uiDim, 1).strokeCircle(CARD_W / 2 - 22, -CARD_H / 2 + 54, 4);
    g.fillStyle(PALETTE.uiDim, 1).fillRect(CARD_W / 2 - 28, -CARD_H / 2 + 54, 12, 9);
    g.fillStyle(PALETTE.ink, 1).fillRect(CARD_W / 2 - 23, -CARD_H / 2 + 57, 2, 3);
    out.push(g);
    return out;
  }

  // ---------------------------------------------------------------- Focus

  private setFocus(i: number): void {
    const next = Phaser.Math.Clamp(i, 0, this.cards.length - 1);
    if (next === this.focus || this.busy) {
      if (next === this.focus && i !== next) this.nudge(i < 0 ? -1 : 1);
      return;
    }
    this.focus = next;
    this.buttonFocus = 0;
    playSfx('uiMove', 1, 0.9 + (next % 4) * 0.06);
    this.refresh();
  }

  /** Bumping the end of the list wobbles the card instead of doing nothing. */
  private nudge(dir: number): void {
    const card = this.cards[this.focus];
    playSfx('denied', 0.5);
    this.tweens.add({ targets: card.root, x: card.root.x + dir * 8, yoyo: true, duration: 70 });
  }

  private refresh(instant = false): void {
    this.cards.forEach((card, i) => {
      const offset = i - this.focus;
      const focused = offset === 0;
      const color = card.master ? PALETTE.gold : card.state === 'open' ? PALETTE.omnitrix : (ACT_COLORS[card.info.act] ?? PALETTE.uiDim);
      const g = card.frame;
      g.clear();
      drawPanel(g, 0, 0, CARD_W, CARD_H, { fill: focused ? PALETTE.uiPanel : PALETTE.ink, fillAlpha: 0.93, stroke: focused || card.master ? color : PALETTE.uiPanelLight, radius: 8, bevel: true });
      if (focused) g.lineStyle(1, color, 0.35).strokeRoundedRect(-CARD_W / 2 - 3.5, -CARD_H / 2 - 3.5, CARD_W + 7, CARD_H + 7, 10);
      const props = {
        x: GAME_WIDTH / 2 + offset * MENU.chapterSpacing,
        scale: focused ? 1 : MENU.chapterSideScale,
        alpha: Math.abs(offset) > 1 ? 0 : 1,
      };
      for (const t of card.texts) if (t.font !== (focused ? FONT_KEY : SOFT_FONT_KEY)) t.setFont(focused ? FONT_KEY : SOFT_FONT_KEY);
      this.tweens.killTweensOf(card.shade);
      this.tweens.add({ targets: card.shade, alpha: focused ? 0 : MENU.chapterSideShade, duration: instant ? 0 : MENU.focusMs });
      card.root.setVisible(Math.abs(offset) <= 2);
      this.tweens.killTweensOf(card.root);
      if (instant) card.root.setPosition(props.x, CARD_Y).setScale(props.scale).setAlpha(props.alpha);
      else this.tweens.add({ targets: card.root, ...props, duration: MENU.focusMs + 60, ease: 'Cubic.easeOut' });
    });
    const card = this.cards[this.focus];
    this.actTitle.setText(`ACT ${card.info.act}  -  ${ACTS[card.info.act] ?? ''}`).setTint(ACT_COLORS[card.info.act] ?? PALETTE.omnitrix);
    this.refreshButtons();
  }

  private refreshButtons(): void {
    const card = this.cards[this.focus];
    const resume = this.resumeFor(card.info);
    if (card.state === 'open') {
      const done = this.file?.chapters[card.info.levelId!]?.completed ?? false;
      this.primary.setEnabled(true).setText(resume ? `CONTINUE: ${checkpointLabel(resume.levelId, resume.checkpoint)}` : done ? 'PLAY AGAIN' : 'PLAY').setColor(PALETTE.omnitrix);
    } else {
      this.primary.setEnabled(false).setText(card.state === 'locked' ? 'LOCKED' : 'COMING SOON');
    }
    this.secondary.setVisible(resume !== null && card.state === 'open');
    this.primary.root.setX(this.secondary.visible ? GAME_WIDTH / 2 - 56 : GAME_WIDTH / 2);
    if (!this.secondary.visible) this.buttonFocus = 0;
    this.primary.setFocused(this.buttonFocus === 0);
    this.secondary.setFocused(this.buttonFocus === 1);
    const touch = inputMode.current === 'touch';
    this.hint.setText(
      touch
        ? 'SWIPE OR TAP THE ARROWS FOR MORE CHAPTERS'
        : this.secondary.visible
          ? '[LEFT]/[RIGHT] CHAPTERS   [ENTER] CONTINUE   [R] RESTART CHAPTER'
          : '[LEFT]/[RIGHT] CHAPTERS   [ENTER] PLAY   [ESC] BACK',
    );
  }

  private setButtonFocus(i: number): void {
    const next = i === 1 && this.secondary.visible ? 1 : 0;
    if (next === this.buttonFocus) return;
    this.buttonFocus = next;
    playSfx('uiMove');
    this.refreshButtons();
  }

  private resumeFor(info: ChapterInfo): SlotData['resume'] {
    const resume = this.file?.resume ?? null;
    return resume && info.levelId && resume.levelId === info.levelId ? resume : null;
  }

  // ---------------------------------------------------------------- Swipes

  private bindSwipe(): void {
    this.input.on(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => {
      if (!this.swiped(p) || this.busy) return;
      this.setFocus(this.focus + (p.upX < p.downX ? 1 : -1));
    });
  }

  private swiped(p: Phaser.Input.Pointer): boolean {
    const dx = p.upX - p.downX;
    return Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(p.upY - p.downY);
  }

  // ---------------------------------------------------------------- Actions

  private playPrimary(): void {
    if (this.busy || isLeaving(this)) return;
    const card = this.cards[this.focus];
    if (card.state !== 'open' || !card.info.levelId) return;
    const resume = this.resumeFor(card.info);
    this.startLevel(resume ? { levelId: resume.levelId, checkpoint: resume.checkpoint, stats: resume.stats } : { levelId: card.info.levelId });
  }

  /** Start the chapter over: the saved checkpoint is dropped. */
  private restart(): void {
    if (this.busy || isLeaving(this) || session.slot === null) return;
    const card = this.cards[this.focus];
    if (!card.info.levelId) return;
    saveSystem.setResume(session.slot, null);
    this.startLevel({ levelId: card.info.levelId });
  }

  private startLevel(data: LevelStartData): void {
    playSfx('transformBoom', 0.7);
    flashCamera(this.cameras.main, 300, 120, 255, 110);
    music.stop(300);
    leaveTo(this, SCENES.level, data, null);
  }

  private back(): void {
    if (isLeaving(this)) return;
    playSfx('uiBack');
    leaveTo(this, SCENES.fileSelect, undefined, null);
  }

  /** Settings over the hub. A new difficulty redraws the cards (bests are per difficulty). */
  private openSettings(): void {
    if (this.busy || isLeaving(this) || !this.file) return;
    const shown = this.file.difficulty;
    this.events.once(Phaser.Scenes.Events.RESUME, () => {
      if (session.file && session.file.difficulty !== shown) this.scene.restart({ focus: this.focus });
    });
    playSfx('uiSelect');
    this.scene.launch(SCENES.settings, { returnTo: SCENES.chapterSelect });
    this.scene.pause();
  }

  // ---------------------------------------------------------------- Moments

  private welcome(): void {
    const t = pixelText(this, GAME_WIDTH / 2, 52, 'A NEW SUMMER BEGINS!', { originX: 0.5, originY: 0.5, color: PALETTE.gold }).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, y: 50, duration: 300, delay: 250 });
    this.tweens.add({ targets: t, alpha: 0, delay: 2600, duration: 500, onComplete: () => t.destroy() });
  }

  /**
   * Back from beating a chapter: a COMPLETE stamp on its card; on a first clear
   * the carousel slides to the next chapter and its title decodes letter by letter.
   */
  private celebrate(index: number, firstClear: boolean): void {
    const card = this.cards[index];
    const stamp = pixelText(this, 0, -6, firstClear ? 'CLEARED!' : 'COMPLETE!', { scale: 3, originX: 0.5, originY: 0.5, color: PALETTE.gold });
    stamp.setAngle(-10).setScale(3).setAlpha(0);
    card.root.add(stamp);
    this.time.delayedCall(350, () => {
      playSfx('stamp');
      this.tweens.add({ targets: stamp, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
      this.tweens.add({ targets: stamp, alpha: 0, delay: 1600, duration: 400 });
    });
    const next = this.cards[index + 1];
    if (!firstClear || !next) return;
    // The next title stays a mystery until it decodes.
    next.title.setText('? ? ?');
    this.busy = true;
    this.time.delayedCall(1500, () => {
      this.busy = false;
      this.setFocus(index + 1);
      this.busy = true;
      this.time.delayedCall(320, () => this.decodeTitle(next));
    });
  }

  private decodeTitle(card: Card): void {
    const target = card.info.title;
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789?!';
    let step = 0;
    let done = false;
    playSfx('reveal');
    const timer = this.time.addEvent({
      delay: MENU.revealStepMs,
      repeat: target.length + 6,
      callback: () => {
        // After a long frame Phaser replays missed repeats in one go, and remove() inside that catch-up
        // doesn't stop the next call: without this the reveal finished twice (two notes, a double pop).
        if (done) return;
        step++;
        const settled = Math.max(0, step - 6);
        const text = target
          .split('')
          .map((ch, i) => (i < settled || ch === ' ' ? ch : glyphs[Math.floor(Math.random() * glyphs.length)]))
          .join('');
        card.title.setText(text).setTint(step % 2 ? PALETTE.omnitrixGlow : PALETTE.white);
        if (settled >= target.length) {
          done = true;
          timer.remove();
          card.title.setText(target).setTint(PALETTE.white);
          card.title.setScale(1.3);
          this.tweens.add({ targets: card.title, scale: 1, duration: 260, ease: 'Back.easeOut' });
          const note = pixelText(this, GAME_WIDTH / 2, 50, 'NEW CHAPTER REVEALED', { originX: 0.5, originY: 0.5, color: PALETTE.omnitrix }).setAlpha(0);
          this.tweens.add({ targets: note, alpha: 1, duration: 200 });
          this.tweens.add({ targets: note, alpha: 0, delay: 2400, duration: 400, onComplete: () => note.destroy() });
          this.busy = false;
        }
      },
    });
  }

  override update(time: number): void {
    this.backdrop?.update();
    this.primary?.pulse(time);
    this.secondary?.pulse(time);
  }
}
