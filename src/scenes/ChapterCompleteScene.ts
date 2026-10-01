import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import type { Rank } from '../config/scoring';
import { CHAPTER_1 } from '../levels/chapter1';
import { music } from '../systems/audio/Music';
import { playSfx } from '../systems/audio/Sfx';
import { computeRank, formatTime, type RunStats } from '../systems/RunStats';
import { saveSystem, type RecordOutcome } from '../systems/SaveSystem';
import { bindMuteKey } from '../systems/Settings';
import { pixelText } from '../ui/text';
import { TEX } from './preload/assetKeys';
import { SCENES } from './SceneKeys';
import { flashCamera, shakeCamera } from '../systems/Accessibility';
import { formatDelta } from '../systems/Splits';
import { inputMode } from '../systems/InputMode';

const RANK_COLOR: Record<Rank, number> = {
  S: PALETTE.gold,
  A: PALETTE.omnitrix,
  B: PALETTE.jammer,
  C: PALETTE.fire2,
  D: PALETTE.uiDim,
};

const RANK_LINE: Record<Rank, string> = {
  S: 'HERO OF THE SUMMER!',
  A: 'GRANDPA MAX WOULD BE PROUD.',
  B: 'NOT BAD FOR A 10 YEAR OLD.',
  C: 'GWEN SAYS YOU NEED PRACTICE.',
  D: 'AT LEAST THE CAMP IS STILL STANDING.',
};

interface Row {
  label: string;
  value: () => string;
  count?: { to: number; format: (n: number) => string };
  highlight?: string;
  highlightColor?: number;
}

/** Rewarding end screen: stats tally one by one, then the rank stamps down. */
export class ChapterCompleteScene extends Phaser.Scene {
  private stats!: RunStats;
  private rays!: Phaser.GameObjects.Image;
  private outcome!: RecordOutcome;
  private rank: Rank = 'D';
  private score = 0;
  private ready = false;
  private copied!: Phaser.GameObjects.BitmapText;

  constructor() {
    super(SCENES.chapterComplete);
  }

  create(data: { stats: RunStats }): void {
    this.stats = data.stats;
    this.ready = false;
    const result = computeRank(this.stats);
    this.rank = result.rank;
    this.score = result.score;
    const previousBest = saveSystem.getChapter(CHAPTER_1.id).bestTimeMs;
    this.outcome = saveSystem.recordChapter(CHAPTER_1.id, {
      timeMs: this.stats.timeMs,
      rank: this.rank,
      score: this.score,
      cards: this.stats.cardsFound,
      timed: this.stats.fullRun,
    });

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.add.image(0, 0, TEX.sky).setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.tileSprite(0, 0, GAME_WIDTH, 200, TEX.stars).setOrigin(0, 0);
    this.rays = this.add.image(GAME_WIDTH / 2, 70, TEX.rays).setScale(5).setAlpha(0.14).setTint(PALETTE.omnitrix).setBlendMode(Phaser.BlendModes.ADD);
    this.add.rectangle(GAME_WIDTH / 2, 176, 420, 200, PALETTE.ink, 0.78).setStrokeStyle(1, PALETTE.omnitrixDark);
    this.add.rectangle(452, 176, 1, 176, PALETTE.omnitrixDark, 0.6);

    pixelText(this, GAME_WIDTH / 2, 28, 'CHAPTER 1 COMPLETE', { scale: 3, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });
    pixelText(this, GAME_WIDTH / 2, 52, CHAPTER_1.name, { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.white });

    const s = this.stats;
    const rows: Row[] = [
      { label: 'TIME', value: () => formatTime(s.timeMs), ...this.timeHighlight(previousBest) },
      { label: 'DAMAGE TAKEN', value: () => String(s.damageTaken), count: { to: s.damageTaken, format: (n) => (Math.round(n * 2) / 2).toString() } },
      { label: 'DRONES DESTROYED', value: () => String(s.enemiesDefeated), count: { to: s.enemiesDefeated, format: (n) => String(Math.round(n)) } },
      { label: 'BEST COMBO', value: () => `${s.bestCombo} HITS`, count: { to: s.bestCombo, format: (n) => `${Math.round(n)} HITS` } },
      { label: 'LASERS PARRIED', value: () => String(s.parries), count: { to: s.parries, format: (n) => String(Math.round(n)) } },
      { label: 'PERFECT TRANSFORMS', value: () => String(s.perfectTransforms), count: { to: s.perfectTransforms, format: (n) => String(Math.round(n)) } },
      { label: 'DEATHS', value: () => String(s.deaths), highlight: s.deaths === 0 ? 'FLAWLESS!' : undefined },
      { label: 'SUMO SLAMMERS', value: () => `${s.cardsFound.length} / ${s.totalCards}`, highlight: s.cardsFound.length === s.totalCards ? 'ALL FOUND!' : undefined },
      { label: 'SCORE', value: () => String(this.score), count: { to: Math.max(0, this.score), format: (n) => String(Math.round(n)) } },
    ];

    const x0 = 126;
    const x1 = 330;
    rows.forEach((row, i) => {
      const y = 84 + i * 20;
      this.time.delayedCall(500 + i * 280, () => this.revealRow(row, x0, x1, y));
    });

    const rankAt = 500 + rows.length * 280 + 400;
    this.time.delayedCall(rankAt, () => this.stampRank());
    this.time.delayedCall(rankAt + 900, () => this.showFooter());

    bindMuteKey(this);
    const kb = this.input.keyboard!;
    kb.on('keydown-ENTER', () => this.again());
    kb.on('keydown-SPACE', () => this.again());
    kb.on('keydown-ESC', () => this.title());
    kb.on('keydown-C', () => this.share());
  }

  private revealRow(row: Row, x0: number, x1: number, y: number): void {
    playSfx('tick', 1, 0.8);
    pixelText(this, x0, y, row.label, { color: PALETTE.uiDim });
    const value = pixelText(this, x1, y, row.count ? row.count.format(0) : row.value(), { originX: 1, color: PALETTE.white });
    if (row.count && row.count.to > 0) {
      const counter = { n: 0 };
      this.tweens.add({
        targets: counter,
        n: row.count.to,
        duration: 450,
        ease: 'Quad.easeOut',
        onUpdate: () => {
          value.setText(row.count!.format(counter.n));
          playSfx('tick', 0.4, 1.3);
        },
      });
    }
    if (row.highlight) {
      const h = pixelText(this, x1 + 8, y, row.highlight, { color: row.highlightColor ?? PALETTE.gold });
      h.setOrigin(0, 0);
      h.setScale(2).setAlpha(0);
      this.tweens.add({ targets: h, scale: 1, alpha: 1, duration: 300, delay: 350, ease: 'Back.easeOut' });
    }
  }

  private timeHighlight(previousBest: number | null): Pick<Row, 'highlight' | 'highlightColor'> {
    if (!this.stats.fullRun) return { highlight: 'PRACTICE', highlightColor: PALETTE.uiDim };
    if (previousBest === null) return { highlight: 'NEW BEST!' };
    const delta = this.stats.timeMs - previousBest;
    if (this.outcome.newBestTime) return { highlight: `NEW BEST! ${formatDelta(delta)}` };
    return { highlight: formatDelta(delta), highlightColor: 0xff6a6a };
  }

  private stampRank(): void {
    const color = RANK_COLOR[this.rank];
    const x = 492;
    const y = 160;
    pixelText(this, x, 96, 'RANK', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    const glow = this.add.image(x, y, TEX.light).setScale(2.2).setTint(color).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    const letter = pixelText(this, x, y, this.rank, { scale: 8, originX: 0.5, originY: 0.5, color });
    letter.setScale(3).setAlpha(0).setAngle(-20);
    this.tweens.add({
      targets: letter,
      scale: 1,
      alpha: 1,
      angle: -6,
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () => {
        playSfx('stamp');
        shakeCamera(this.cameras.main, 280, 0.012);
        flashCamera(this.cameras.main, 200, 255, 255, 255);
        this.tweens.add({ targets: glow, alpha: 0.5, duration: 200 });
        if (this.rank === 'S' || this.rank === 'A') {
          const burst = this.add.particles(x, y, TEX.spark, {
            lifespan: 900,
            speed: { min: 80, max: 260 },
            scale: { start: 2, end: 0 },
            color: [PALETTE.white, color],
            blendMode: 'ADD',
            emitting: false,
          });
          burst.explode(50);
        }
      },
    });
    pixelText(this, x, y + 52, RANK_LINE[this.rank], { originX: 0.5, originY: 0, color: PALETTE.cream, maxWidth: 70, align: 'center' });
    if (this.outcome.newBestRank && this.outcome.record.clears > 1) {
      pixelText(this, x, y - 50, 'NEW BEST!', { originX: 0.5, originY: 0.5, color: PALETTE.gold });
    }
    music.play('victory');
  }

  private showFooter(): void {
    this.ready = true;
    pixelText(this, GAME_WIDTH / 2, 294, 'NEXT: CHAPTER 2  -  ROAD TRIP', { originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });
    pixelText(this, GAME_WIDTH / 2, 306, 'THE DIAL IS ABOUT TO GET TWO NEW FACES...', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    this.copied = pixelText(this, GAME_WIDTH / 2, 322, '', { originX: 0.5, originY: 0.5, color: PALETTE.gold });
    // Big tappable buttons on every device; the keys still work.
    const touch = inputMode.current === 'touch';
    const buttons: Array<[string, () => void, number]> = [
      [touch ? 'PLAY AGAIN' : '[ENTER] PLAY AGAIN', () => this.again(), PALETTE.white],
      [touch ? 'SHARE SCORE' : '[C] SHARE SCORE', () => this.share(), PALETTE.gold],
      [touch ? 'TITLE' : '[ESC] TITLE', () => this.title(), PALETTE.uiDim],
    ];
    buttons.forEach(([label, action, color], i) => {
      const x = GAME_WIDTH / 2 + (i - 1) * 190;
      const t = pixelText(this, x, 344, label, { originX: 0.5, originY: 0.5, color });
      const zone = this.add.zone(x, 344, 170, 30).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', action);
      if (i === 0) this.tweens.add({ targets: t, alpha: 0.5, yoyo: true, repeat: -1, duration: 700 });
    });
  }

  private shareText(): string {
    const s = this.stats;
    let url = '';
    try {
      url = window.location.origin + window.location.pathname;
    } catch {
      url = '';
    }
    return `I beat BEN 10: OMNITRIX SUMMER - Camp Crash in ${formatTime(s.timeMs)} with an ${this.rank} rank, ${s.bestCombo}-hit best combo and ${s.cardsFound.length}/${s.totalCards} Sumo Slammers cards. Your turn! ${url}`.trim();
  }

  /** The native share sheet where there is one (phones), otherwise the clipboard. */
  private share(): void {
    if (!this.ready) return;
    const text = this.shareText();
    const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string }) => Promise<void> };
    if (typeof nav.share === 'function') {
      nav.share({ title: 'Ben 10: Omnitrix Summer', text }).then(
        () => this.copied.setText('THANKS FOR SHARING!'),
        (err: unknown) => {
          // Closing the share sheet is not a failure; anything else falls back to copying.
          if (!(err instanceof Error && err.name === 'AbortError')) this.copy();
        },
      );
      return;
    }
    this.copy();
  }

  private copy(): void {
    if (!this.ready) return;
    const text = this.shareText();
    const done = (ok: boolean) => {
      this.copied.setText(ok ? 'SCORE COPIED! PASTE IT TO A FRIEND.' : 'COULD NOT COPY. SCREENSHOT IT!');
      playSfx(ok ? 'uiSelect' : 'denied');
    };
    try {
      navigator.clipboard.writeText(text).then(() => done(true), () => done(false));
    } catch {
      done(false);
    }
  }

  private again(): void {
    if (!this.ready) return;
    music.stop(200);
    this.scene.start(SCENES.level, {});
  }

  private title(): void {
    if (!this.ready) return;
    music.stop(200);
    this.scene.start(SCENES.menu);
  }

  override update(_time: number, delta: number): void {
    this.rays.angle += delta * 0.006;
  }
}
