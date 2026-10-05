import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { RANK_COLOR, SCORING, type Rank } from '../config/scoring';
import { getDifficulty } from '../config/difficulty';
import { CHAPTERS, chapterForLevel } from '../levels/chapters';
import { getLevel } from '../levels/registry';
import type { LevelTheme } from '../levels/types';
import { music } from '../systems/audio/Music';
import { playSfx } from '../systems/audio/Sfx';
import { computeRank, formatTime, type RunStats } from '../systems/RunStats';
import { bestOn, saveSystem, SaveSystem, type RecordOutcome } from '../systems/SaveSystem';
import { session } from '../systems/Session';
import { enterMenu, leaveTo } from '../ui/menu/transition';
import { bindMuteKey } from '../systems/Settings';
import { pixelText } from '../ui/text';
import { COVER_W, COVER_X, frameView } from '../ui/view';
import { TEX } from './preload/assetKeys';
import { SCENES } from './SceneKeys';
import { flashCamera, shakeCamera } from '../systems/Accessibility';
import { formatDelta } from '../systems/Splits';
import { inputMode } from '../systems/InputMode';
import type { AchievementDef } from '../config/achievements';
import { AchievementTracker, fileAchievements } from '../systems/Achievements';
import { isOmnitrixMaster } from '../systems/Mastery';
import { reviewSplits, sumOfBest } from '../systems/Splits';
import { AchievementToast } from '../ui/AchievementToast';
import { SplitsReview } from '../ui/SplitsReview';
import { achievementBadge } from '../ui/achievementBadge';
import { ghostForms, ghostRecording, ghostStore } from '../systems/Ghost';

/** What the results call the enemies Ben beat, by the level's look. */
const FOES_LABEL: Partial<Record<LevelTheme, string>> = { museum: 'MUTANTS DEFEATED', city: 'ROBOTS WRECKED' };

/** Best tag team names, by how many forms joined one combo. */
const TAG_TEAM_NAMES = ['', '', 'TAG TEAM!', 'TRIPLE THREAT!', 'FULL OMNITRIX!'];

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
  private levelId = 'ch1';
  /** S rank on every difficulty, and whether this run is what made it so. */
  private master = false;
  private newMaster = false;
  private unlocked: AchievementDef[] = [];
  private splitsReview!: SplitsReview;

  constructor() {
    super(SCENES.chapterComplete);
  }

  create(data: { levelId?: string; stats: RunStats }): void {
    this.stats = data.stats;
    this.levelId = data.levelId ?? 'ch1';
    this.ready = false;
    const result = computeRank(this.stats, getLevel(this.levelId).parTimeMs);
    this.rank = result.rank;
    this.score = result.score;
    const difficulty = this.stats.difficulty;
    const slot = session.slot;
    const previousBest = slot === null ? null : bestOn(saveSystem.getChapter(slot, this.levelId), difficulty).bestTimeMs;
    const run = {
      timeMs: this.stats.timeMs,
      rank: this.rank,
      score: this.score,
      cards: this.stats.cardsFound,
      difficulty,
      // Practice runs and runs that changed difficulty count as clears, not records.
      timed: this.stats.fullRun && !this.stats.mixedDifficulty,
    };
    const before = slot === null ? undefined : saveSystem.getSlot(slot)?.chapters[this.levelId];
    const wasMaster = isOmnitrixMaster(before);
    // Without a file (a URL playtest run) nothing is saved; the screen still celebrates.
    this.outcome = slot === null ? new SaveSystem(null).recordChapter(0, this.levelId, run) : saveSystem.recordChapter(slot, this.levelId, run);
    // A new best time: this run becomes the ghost to race next time.
    const ghost = ghostRecording.takeFinished(this.levelId, difficulty);
    if (ghost && slot !== null && this.outcome.newBestTime) ghostStore.save(slot, this.levelId, difficulty, this.stats.timeMs, ghost, ghostForms());
    this.master = slot !== null && isOmnitrixMaster(this.outcome.record);
    this.newMaster = this.master && !wasMaster;
    this.unlocked = [];
    const tracker = new AchievementTracker(fileAchievements(slot), (def) => this.unlocked.push(def));
    if (run.timed && this.stats.timeMs <= (getLevel(this.levelId).parTimeMs ?? SCORING.parTimeMs)) tracker.unlock('speed-demon');
    if (this.stats.fullRun && this.stats.deaths === 0) tracker.unlock('no-sweat');
    if (this.stats.fullRun && difficulty === 'hard' && !this.stats.mixedDifficulty) tracker.unlock('hard-as-nails');
    if (this.master) tracker.unlock('omnitrix-master');
    this.splitsReview = new SplitsReview(this);
    const chapter = chapterForLevel(this.levelId);
    const d = getDifficulty(difficulty);

    enterMenu(this);
    frameView(this);
    this.add.image(COVER_X, 0, TEX.sky).setOrigin(0, 0).setDisplaySize(COVER_W, GAME_HEIGHT);
    this.add.tileSprite(COVER_X, 0, COVER_W, 200, TEX.stars).setOrigin(0, 0);
    this.rays = this.add.image(GAME_WIDTH / 2, 70, TEX.rays).setScale(5).setAlpha(0.14).setTint(PALETTE.omnitrix).setBlendMode(Phaser.BlendModes.ADD);
    this.add.rectangle(GAME_WIDTH / 2, 176, 420, 200, PALETTE.ink, 0.78).setStrokeStyle(1, PALETTE.omnitrixDark);
    this.add.rectangle(452, 176, 1, 176, PALETTE.omnitrixDark, 0.6);

    pixelText(this, GAME_WIDTH / 2, 28, `CHAPTER ${chapter?.number ?? 1} COMPLETE`, { scale: 3, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });
    const name = pixelText(this, GAME_WIDTH / 2 - 4, 52, `${getLevel(this.levelId).name}  -`, { scale: 2, originX: 1, originY: 0.5, color: PALETTE.white });
    pixelText(this, name.x + 8, 52, d.label, { scale: 2, originX: 0, originY: 0.5, color: d.color });

    const s = this.stats;
    const rows: Row[] = [
      { label: 'TIME', value: () => formatTime(s.timeMs), ...this.timeHighlight(previousBest) },
      { label: 'DAMAGE TAKEN', value: () => String(s.damageTaken), count: { to: s.damageTaken, format: (n) => (Math.round(n * 2) / 2).toString() } },
      { label: FOES_LABEL[getLevel(this.levelId).theme ?? 'forest'] ?? 'DRONES DESTROYED', value: () => String(s.enemiesDefeated), count: { to: s.enemiesDefeated, format: (n) => String(Math.round(n)) }, highlight: s.strikes > 0 ? `${s.strikes} STRIKE${s.strikes === 1 ? '' : 'S'}!` : undefined },
      { label: 'BEST COMBO', value: () => `${s.bestCombo} HITS`, count: { to: s.bestCombo, format: (n) => `${Math.round(n)} HITS` }, highlight: s.multiCuts > 0 ? `${s.multiCuts} MULTI-CUT${s.multiCuts === 1 ? '' : 'S'}!` : undefined, highlightColor: 0x9fd8ff },
      { label: 'LASERS PARRIED', value: () => String(s.parries), count: { to: s.parries, format: (n) => String(Math.round(n)) } },
      { label: 'PERFECT TRANSFORMS', value: () => String(s.perfectTransforms), count: { to: s.perfectTransforms, format: (n) => String(Math.round(n)) } },
      ...(s.misfires > 0 || d.wrongTransformChance > 0
        ? [{ label: 'MISFIRES', value: () => String(s.misfires), highlight: s.improvised > 0 ? `${s.improvised} IMPROVISED!` : undefined, highlightColor: PALETTE.gold }]
        : []),
      ...(s.swaps > 0 || s.bestTagTeam >= 2
        ? [
            { label: 'SWAPS', value: () => String(s.swaps), count: { to: s.swaps, format: (n: number) => String(Math.round(n)) } },
            { label: 'BEST TAG TEAM', value: () => (s.bestTagTeam >= 2 ? `${s.bestTagTeam} FORMS` : '-'), highlight: TAG_TEAM_NAMES[Math.min(s.bestTagTeam, TAG_TEAM_NAMES.length - 1)] || undefined, highlightColor: PALETTE.omnitrix },
          ]
        : []),
      { label: 'DEATHS', value: () => String(s.deaths), highlight: s.deaths === 0 ? 'FLAWLESS!' : undefined },
      { label: 'SUMO SLAMMERS', value: () => `${s.cardsFound.length} / ${s.totalCards}`, highlight: s.cardsFound.length === s.totalCards ? 'ALL FOUND!' : undefined },
      { label: 'SCORE', value: () => String(this.score), count: { to: Math.max(0, this.score), format: (n) => String(Math.round(n)) } },
    ];

    const x0 = 126;
    const x1 = 330;
    const spacing = rows.length > 11 ? 15 : rows.length > 9 ? 18 : 20;
    rows.forEach((row, i) => {
      const y = 82 + i * spacing;
      this.time.delayedCall(500 + i * 260, () => this.revealRow(row, x0, x1, y));
    });

    const rankAt = 500 + rows.length * 260 + 400;
    this.time.delayedCall(rankAt, () => this.stampRank());
    this.time.delayedCall(rankAt + 900, () => this.showFooter());
    const toast = new AchievementToast(this, 300, 200);
    toast.setLeft(frameView(this).left);
    this.time.delayedCall(rankAt + 700, () => this.unlocked.forEach((def) => toast.show(def)));

    bindMuteKey(this);
    const kb = this.input.keyboard!;
    const confirm = () => (this.splitsReview.open ? this.splitsReview.close() : this.toChapters());
    kb.on('keydown-ENTER', confirm);
    kb.on('keydown-SPACE', confirm);
    kb.on('keydown-ESC', confirm);
    kb.on('keydown-R', () => this.again());
    kb.on('keydown-C', () => this.share());
    kb.on('keydown-S', () => this.toggleSplits());
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
    if (this.stats.mixedDifficulty) return { highlight: 'DIFFICULTY CHANGED', highlightColor: PALETTE.uiDim };
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
    if (this.outcome.newBestRank && this.outcome.best.clears > 1) {
      pixelText(this, x, y - 50, 'NEW BEST!', { originX: 0.5, originY: 0.5, color: PALETTE.gold });
    }
    if (this.master) this.time.delayedCall(500, () => this.stampMaster(x, 256));
    music.play('victory');
  }

  /** S on every difficulty: the gold medal (and the first time, a proper celebration). */
  private stampMaster(x: number, y: number): void {
    const medal = achievementBadge(this, x - 34, y, 'star', true, 9);
    const text = pixelText(this, x - 22, y, this.newMaster ? 'OMNITRIX\nMASTER!' : 'OMNITRIX\nMASTER', { originY: 0.5, color: PALETTE.gold });
    if (!this.newMaster) return;
    for (const o of [medal, text]) {
      o.setScale(2.5).setAlpha(0);
      this.tweens.add({ targets: o, scale: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });
    }
    playSfx('fanfare', 0.8, 1.1);
    flashCamera(this.cameras.main, 300, 255, 214, 90);
    const burst = this.add.particles(x, y, TEX.spark, { lifespan: 1100, speed: { min: 60, max: 220 }, scale: { start: 2, end: 0 }, color: [PALETTE.white, PALETTE.gold], blendMode: 'ADD', emitting: false });
    burst.explode(60);
  }

  private toggleSplits(): void {
    if (!this.ready) return;
    const rows = reviewSplits(this.stats.splits);
    if (rows.length === 0) return;
    const best = bestOn(this.outcome.record, this.stats.difficulty).bestSegments;
    this.splitsReview.toggle(rows, sumOfBest(rows.map((r) => r.id), best), this.stats.timeMs);
  }

  private showFooter(): void {
    this.ready = true;
    const current = chapterForLevel(this.levelId);
    const next = current ? CHAPTERS.find((c) => c.number === current.number + 1) : undefined;
    if (next) {
      pixelText(this, GAME_WIDTH / 2, 294, `NEXT: CHAPTER ${next.number}  -  ${next.title}${next.levelId ? '' : '  (COMING SOON)'}`, { originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });
      pixelText(this, GAME_WIDTH / 2, 306, next.tease, { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    }
    this.copied = pixelText(this, GAME_WIDTH / 2, 320, '', { originX: 0.5, originY: 0.5, color: PALETTE.gold });
    // Big tappable buttons on every device; the keys still work.
    const touch = inputMode.current === 'touch';
    const buttons: Array<[string, () => void, number]> = [
      [touch ? 'CONTINUE' : '[ENTER] CONTINUE', () => this.toChapters(), PALETTE.white],
      [touch ? 'PLAY AGAIN' : '[R] PLAY AGAIN', () => this.again(), PALETTE.omnitrix],
      ...(this.stats.splits.length > 0 ? [[touch ? 'SPLITS' : '[S] SPLITS', () => this.toggleSplits(), 0x9fd8ff] as [string, () => void, number]] : []),
      [touch ? 'SHARE SCORE' : '[C] SHARE SCORE', () => this.share(), PALETTE.gold],
    ];
    const step = buttons.length > 3 ? 148 : 190;
    const bw = buttons.length > 3 ? 136 : 160;
    buttons.forEach(([label, action, color], i) => {
      const x = GAME_WIDTH / 2 + (i - (buttons.length - 1) / 2) * step;
      const frame = this.add.graphics();
      frame.fillStyle(PALETTE.ink, 0.7).fillRoundedRect(x - bw / 2, 332, bw, 24, 5);
      frame.lineStyle(1, color, 0.8).strokeRoundedRect(x - bw / 2 + 0.5, 332.5, bw - 1, 23, 5);
      const t = pixelText(this, x, 344, label, { originX: 0.5, originY: 0.5, color });
      const zone = this.add.zone(x, 344, bw + 10, 30).setInteractive({ useHandCursor: true });
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
    const chapter = getLevel(this.levelId).name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    const difficulty = getDifficulty(s.difficulty).label;
    const article = this.rank === 'A' || this.rank === 'S' ? 'an' : 'a';
    const misfires = s.misfires > 0 ? ` and survived ${s.misfires} Omnitrix misfire${s.misfires === 1 ? '' : 's'}` : '';
    const tag = s.bestTagTeam >= 3 ? ` with a ${s.bestTagTeam}-form tag team` : '';
    const master = this.master ? ' (OMNITRIX MASTER: S on every difficulty!)' : '';
    return `I beat BEN 10: OMNITRIX SUMMER - ${chapter} on ${difficulty} in ${formatTime(s.timeMs)} with ${article} ${this.rank} rank${master}, a ${s.bestCombo}-hit combo, ${s.cardsFound.length}/${s.totalCards} Sumo Slammers cards${tag}${misfires}. Your turn! ${url}`.trim();
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
    playSfx('transformBoom', 0.7);
    leaveTo(this, SCENES.level, { levelId: this.levelId }, null);
  }

  /** Back to the file's chapters (the title if this run had no file). */
  private toChapters(): void {
    if (!this.ready) return;
    if (this.splitsReview.open) {
      this.splitsReview.close();
      return;
    }
    music.stop(300);
    playSfx('uiConfirm');
    const then = { cleared: this.levelId, firstClear: this.outcome.firstClear };
    // The act's last chapter, cleared for the first time: its cliffhanger and the ACT COMPLETE screen.
    const act = getLevel(this.levelId).story?.actEnd;
    if (act !== undefined && this.outcome.firstClear) leaveTo(this, SCENES.actEnd, { act, levelId: this.levelId, then }, null);
    else if (session.slot === null) leaveTo(this, SCENES.menu, undefined, null);
    else leaveTo(this, SCENES.chapterSelect, then, null);
  }

  override update(_time: number, delta: number): void {
    this.rays.angle += delta * 0.006;
  }
}
