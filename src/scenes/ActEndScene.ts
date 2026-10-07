import Phaser from 'phaser';
import { ACT_END } from '../config/actEnd';
import { GAME_HEIGHT, GAME_WIDTH, PHYSICS } from '../config/constants';
import { PALETTE } from '../config/palette';
import { allAliens } from '../aliens/registry';
import { ACTS, CHAPTERS } from '../levels/chapters';
import { countedCards } from '../levels/secrets';
import { getLevel, hasLevel } from '../levels/registry';
import { flashCamera, shakeCamera } from '../systems/Accessibility';
import { music } from '../systems/audio/Music';
import { playSfx } from '../systems/audio/Sfx';
import { formatTime } from '../systems/RunStats';
import { bestOn, saveSystem } from '../systems/SaveSystem';
import { session } from '../systems/Session';
import { bindMuteKey } from '../systems/Settings';
import { inputMode } from '../systems/InputMode';
import { enterMenu, leaveTo } from '../ui/menu/transition';
import { pixelText } from '../ui/text';
import { COVER_W, COVER_X, frameView } from '../ui/view';
import { TEX } from './preload/assetKeys';
import { SCENES } from './SceneKeys';
import { AchievementTracker, fileAchievements } from '../systems/Achievements';
import { AchievementToast } from '../ui/AchievementToast';
import { chance, setFrameLength } from '../systems/Pacing';

export interface ActEndData {
  act: number;
  levelId: string;
  /** Where Chapter Select goes afterwards (the cleared chapter, first clear or not). */
  then: { cleared: string; firstClear: boolean };
}

type Phase = 'meanwhile' | 'arcade' | 'title' | 'complete';

/**
 * The end of an act. First a cliffhanger: somewhere across town a kid at an
 * arcade has seen the news about a boy with a magic watch; he drains the
 * cabinets of their power with one hand, turns, and grins. KEVIN 11 smashes
 * in. Then ACT 1 COMPLETE, as an event: the stamp, the five aliens of the
 * act flying in, the act's best times and cards, and the next act teased.
 */
export class ActEndScene extends Phaser.Scene {
  private data0!: ActEndData;
  private phase: Phase = 'meanwhile';
  private t = 0;
  private readonly steps = new Set<string>();
  private kevin!: Phaser.GameObjects.Sprite;
  private cabinets: Phaser.GameObjects.Image[] = [];
  private caption!: Phaser.GameObjects.BitmapText;
  private stage!: Phaser.GameObjects.Container;
  private bolts!: Phaser.GameObjects.Graphics;
  private ready = false;

  constructor() {
    super(SCENES.actEnd);
  }

  create(data: ActEndData): void {
    this.data0 = data;
    this.phase = 'meanwhile';
    this.t = 0;
    this.steps.clear();
    this.ready = false;
    this.cabinets = [];
    enterMenu(this);
    frameView(this);
    bindMuteKey(this);
    music.stop(600);
    this.add.rectangle(COVER_X, 0, COVER_W, GAME_HEIGHT, 0x000000).setOrigin(0, 0);
    this.caption = pixelText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 'MEANWHILE...', { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.cream, depth: 10 }).setAlpha(0);
    this.tweens.add({ targets: this.caption, alpha: 1, duration: 500 });
    this.buildArcade();

    const kb = this.input.keyboard!;
    kb.on('keydown', () => this.press());
    this.input.on('pointerdown', () => this.press());
  }

  private once(id: string, at: number): boolean {
    if (this.t < at || this.steps.has(id)) return false;
    this.steps.add(id);
    return true;
  }

  /** Any key skips the cliffhanger beat by beat; on the final screen it continues. */
  private press(): void {
    if (this.t < ACT_END.skipGraceMs) return;
    if (this.phase === 'complete') {
      if (this.ready) this.finish();
      return;
    }
    if (this.phase === 'title') {
      this.toComplete();
      return;
    }
    this.toTitle();
  }

  override update(_time: number, delta: number): void {
    setFrameLength(Math.min(delta, PHYSICS.maxFrameMs));
    this.t += delta;
    if (this.phase === 'meanwhile' && this.t >= ACT_END.meanwhileMs) {
      this.phase = 'arcade';
      this.t = 0;
      this.tweens.add({ targets: this.caption, alpha: 0, duration: 300 });
      this.tweens.add({ targets: this.stage, alpha: 1, duration: 600 });
      playSfx('beep', 0.4, 1.6);
    }
    if (this.phase === 'arcade') this.updateArcade();
    if (this.phase === 'complete') this.updateComplete();
  }

  // ------------------------------------------------------------ The arcade

  private buildArcade(): void {
    const items: Phaser.GameObjects.GameObject[] = [];
    const floorY = 270;
    items.push(this.add.rectangle(COVER_X, 0, COVER_W, GAME_HEIGHT, 0x0c0814).setOrigin(0, 0));
    items.push(this.add.rectangle(COVER_X, floorY, COVER_W, GAME_HEIGHT - floorY, 0x1a1024).setOrigin(0, 0));
    // A flickering neon ARCADE sign.
    const sign = pixelText(this, GAME_WIDTH / 2, 70, 'ARCADE', { scale: 3, originX: 0.5, originY: 0.5, color: PALETTE.neonPink });
    this.tweens.add({ targets: sign, alpha: 0.6, duration: 90, yoyo: true, repeat: -1, repeatDelay: 1700 });
    items.push(sign);
    // A row of glowing cabinets.
    for (let i = 0; i < 5; i++) {
      const cab = this.add.image(GAME_WIDTH / 2 - 160 + i * 80, floorY, TEX.arcade, 0).setOrigin(0.5, 1).setScale(2);
      this.cabinets.push(cab);
      items.push(this.add.image(cab.x, floorY - 60, TEX.light).setTint(0x5a8aff).setAlpha(0.25).setScale(1.2).setBlendMode(Phaser.BlendModes.ADD));
      items.push(cab);
    }
    // Kevin, back to us, at the middle machine.
    this.kevin = this.add.sprite(GAME_WIDTH / 2 + 22, floorY, TEX.kevin, 0).setOrigin(0.5, 1).setScale(2.5);
    items.push(this.kevin);
    this.bolts = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    items.push(this.bolts);
    this.stage = this.add.container(0, 0, items).setAlpha(0);
  }

  private updateArcade(): void {
    // The news on the screen behind him; his lines in a caption under the scene.
    const cut = ACT_END.beats.reduce((a, b) => a + b.ms, 0);
    for (const [i, b] of ACT_END.beats.entries()) {
      const at = ACT_END.beats.slice(0, i).reduce((a, x) => a + x.ms, 0) + 400;
      if (this.once(`line${i}`, at)) this.say(b.line);
    }
    const drainAt = cut + 400;
    if (this.t >= drainAt && this.t < drainAt + ACT_END.drainMs) this.drain((this.t - drainAt) / ACT_END.drainMs);
    if (this.once('dark', drainAt + ACT_END.drainMs)) {
      this.bolts.clear();
      this.kevin.setFrame(0);
      this.say(ACT_END.lastLine.line);
    }
    if (this.once('turn', drainAt + ACT_END.drainMs + ACT_END.lastLine.ms)) {
      this.kevin.setFrame(2);
      playSfx('zap', 0.9, 0.6);
      this.add.image(this.kevin.x - 2, this.kevin.y - 70, TEX.light).setTint(PALETTE.kevin).setScale(0.6).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.9);
    }
    if (this.t >= drainAt + ACT_END.drainMs + ACT_END.lastLine.ms + ACT_END.turnMs) this.toTitle();
  }

  private say(text: string): void {
    this.caption.setText(`???: ${text}`).setScale(1).setPosition(GAME_WIDTH / 2, 320).setTint(PALETTE.kevin).setAlpha(0);
    this.tweens.add({ targets: this.caption, alpha: 1, duration: 200 });
    playSfx('beep', 0.25, 1.9);
  }

  /** Lightning crawls from the cabinets into his arm and the screens die one by one. */
  private drain(k: number): void {
    this.kevin.setFrame(1);
    const g = this.bolts;
    g.clear();
    const hx = this.kevin.x + 28;
    const hy = this.kevin.y - 46;
    for (const [i, cab] of this.cabinets.entries()) {
      const deadAt = 0.15 + i * 0.17;
      if (k >= deadAt) {
        if (String(cab.frame.name) !== '1') {
          cab.setFrame(1);
          playSfx('lightClunk', 0.6, 1.2 - i * 0.05);
        }
        continue;
      }
      // A jagged bolt from this cabinet's screen to his hand.
      let x = cab.x;
      let y = cab.y - 60;
      g.lineStyle(2, PALETTE.kevin, 0.9);
      g.beginPath();
      g.moveTo(x, y);
      for (let s = 1; s <= 5; s++) {
        x += (hx - cab.x) / 5;
        y += (hy - (cab.y - 60)) / 5;
        g.lineTo(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10);
      }
      g.strokePath();
    }
    if (chance(0.15)) playSfx('zap', 0.4, 0.8 + Math.random() * 0.4);
  }

  // ------------------------------------------------------------ KEVIN 11

  private toTitle(): void {
    if (this.phase === 'title' || this.phase === 'complete') return;
    this.phase = 'title';
    this.t = 0;
    this.bolts.clear();
    for (const c of this.cabinets) c.setFrame(1);
    this.kevin.setFrame(2);
    this.stage.setAlpha(0.35);
    this.caption.setAlpha(0);
    const shadow = pixelText(this, GAME_WIDTH / 2 + 4, 154, 'KEVIN 11', { scale: 6, originX: 0.5, originY: 0.5, color: PALETTE.ink });
    const title = pixelText(this, GAME_WIDTH / 2, 150, 'KEVIN 11', { scale: 6, originX: 0.5, originY: 0.5, color: PALETTE.kevin });
    title.setTint(PALETTE.white, PALETTE.white, PALETTE.kevin, PALETTE.kevin);
    const act = pixelText(this, GAME_WIDTH / 2, 206, `ACT 2: ${ACTS[2] ?? ''}`, { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.cream });
    const c = this.add.container(0, 0, [shadow, title, act]);
    c.setScale(2.4).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 240, ease: 'Back.easeOut', onComplete: () => shakeCamera(this.cameras.main, 300, 0.012, false) });
    flashCamera(this.cameras.main, 300, 200, 160, 255);
    playSfx('zap', 1, 0.5);
    playSfx('explode', 0.6, 0.6);
    this.time.delayedCall(ACT_END.titleHoldMs, () => this.toComplete());
  }

  // ------------------------------------------------------------ ACT COMPLETE

  private toComplete(): void {
    if (this.phase === 'complete') return;
    this.phase = 'complete';
    this.t = 0;
    this.children.removeAll(true);
    this.add.image(COVER_X, 0, TEX.sky).setOrigin(0, 0).setDisplaySize(COVER_W, GAME_HEIGHT);
    this.add.tileSprite(COVER_X, 0, COVER_W, 200, TEX.stars).setOrigin(0, 0);
    const rays = this.add.image(GAME_WIDTH / 2, 90, TEX.rays).setScale(6).setAlpha(0.18).setTint(PALETTE.gold).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: rays, angle: 360, duration: 24000, repeat: -1 });
    const emblem = this.add.image(GAME_WIDTH / 2, 90, TEX.hourglass).setTint(PALETTE.omnitrix).setAlpha(0.18).setScale(2.2).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: emblem, scale: 2.5, alpha: 0.28, duration: 900, yoyo: true, repeat: -1 });
    music.play('victory');
  }

  private updateComplete(): void {
    const A = ACT_END;
    const act = this.data0.act;
    if (this.once('stamp', A.stampAt)) {
      const shadow = pixelText(this, GAME_WIDTH / 2 + 4, 64, `ACT ${act}`, { scale: 5, originX: 0.5, originY: 0.5, color: PALETTE.ink });
      const title = pixelText(this, GAME_WIDTH / 2, 60, `ACT ${act}`, { scale: 5, originX: 0.5, originY: 0.5, color: PALETTE.gold });
      title.setTint(PALETTE.white, PALETTE.white, PALETTE.gold, PALETTE.gold);
      const done = pixelText(this, GAME_WIDTH / 2, 104, 'COMPLETE!', { scale: 3, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });
      const name = pixelText(this, GAME_WIDTH / 2, 130, ACTS[act] ?? '', { originX: 0.5, originY: 0.5, color: PALETTE.cream });
      const c = this.add.container(0, 0, [shadow, title, done, name]).setScale(3).setAlpha(0);
      this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut', onComplete: () => shakeCamera(this.cameras.main, 280, 0.014, false) });
      flashCamera(this.cameras.main, 400, 255, 230, 160);
      playSfx('fanfare');
      this.confetti();
      // THE SUMMER BEGINS: a toast once the stats are up.
      const toast = new AchievementToast(this, 300, 50);
      toast.setLeft(frameView(this).left);
      const tracker = new AchievementTracker(fileAchievements(session.slot), (def) => this.time.delayedCall(A.statsAt, () => toast.show(def)));
      tracker.unlock(`act-${act}`);
    }
    // The act's aliens fly in one by one.
    const aliens = allAliens().filter((a) => a.unlockChapter > 0 && CHAPTERS.find((c) => c.number === a.unlockChapter)?.act === act);
    aliens.forEach((a, i) => {
      if (!this.once(`alien${i}`, A.aliensAt + i * A.alienEveryMs)) return;
      const x = GAME_WIDTH / 2 + (i - (aliens.length - 1) / 2) * 72;
      const ring = this.add.circle(x, 172, 20, PALETTE.ink, 0.85).setStrokeStyle(2, a.theme.color);
      const icon = this.add.image(x, 172, a.hudIcon).setTint(a.theme.color).setScale(2);
      const label = pixelText(this, x, 198, a.name, { originX: 0.5, originY: 0.5, color: a.theme.color });
      const c = this.add.container(0, 0, [ring, icon, label]);
      c.setY(-120).setAlpha(0);
      this.tweens.add({ targets: c, y: 0, alpha: 1, duration: 260, ease: 'Back.easeOut' });
      playSfx('beep', 0.6, 1 + i * 0.15);
    });
    if (this.once('aliensLabel', A.aliensAt + aliens.length * A.alienEveryMs)) {
      pixelText(this, GAME_WIDTH / 2, 146, `${aliens.length} ALIENS ON THE DIAL`, { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    }
    if (this.once('stats', A.statsAt)) this.showStats(act);
    if (this.once('prompt', A.promptAt)) {
      this.ready = true;
      const label = inputMode.current === 'touch' ? 'TAP TO CONTINUE' : '[ENTER] CONTINUE';
      const t = pixelText(this, GAME_WIDTH / 2, 340, label, { originX: 0.5, originY: 0.5, color: PALETTE.white });
      this.tweens.add({ targets: t, alpha: 0.4, yoyo: true, repeat: -1, duration: 700 });
    }
  }

  /** The act's chapters: best time on this file's difficulty and cards found. */
  private showStats(act: number): void {
    const chapters = CHAPTERS.filter((c) => c.act === act && c.levelId && hasLevel(c.levelId));
    const slot = session.slot;
    const difficulty = session.file?.difficulty ?? 'normal';
    let totalMs = 0;
    let found = 0;
    let total = 0;
    let complete = true;
    chapters.forEach((c, i) => {
      const id = c.levelId!;
      const record = slot === null ? null : saveSystem.getChapter(slot, id);
      const best = record ? bestOn(record, difficulty) : null;
      const cards = countedCards(getLevel(id)).length;
      const have = record?.cards.length ?? 0;
      found += have;
      total += cards;
      if (best?.bestTimeMs) totalMs += best.bestTimeMs;
      else complete = false;
      const y = 228 + i * 16;
      pixelText(this, GAME_WIDTH / 2 - 150, y, `${c.number}. ${c.title}`, { color: PALETTE.cream });
      pixelText(this, GAME_WIDTH / 2 + 40, y, best?.bestTimeMs ? formatTime(best.bestTimeMs) : '--:--', { color: PALETTE.white });
      pixelText(this, GAME_WIDTH / 2 + 120, y, `${have}/${cards} CARDS`, { color: have >= cards ? PALETTE.gold : PALETTE.uiDim });
      if (best?.bestRank) pixelText(this, GAME_WIDTH / 2 + 196, y, best.bestRank, { color: PALETTE.gold });
    });
    const y = 228 + chapters.length * 16 + 6;
    this.add.rectangle(GAME_WIDTH / 2, y - 3, 360, 1, PALETTE.omnitrixDark);
    pixelText(this, GAME_WIDTH / 2 - 150, y + 2, 'ACT TOTAL', { color: PALETTE.omnitrix });
    pixelText(this, GAME_WIDTH / 2 + 40, y + 2, complete ? formatTime(totalMs) : '--:--', { color: PALETTE.omnitrix });
    pixelText(this, GAME_WIDTH / 2 + 120, y + 2, `${found}/${total} CARDS`, { color: found >= total ? PALETTE.gold : PALETTE.omnitrix });
    playSfx('beep', 0.5, 0.9);
  }

  private confetti(): void {
    this.add
      .particles(0, 0, TEX.px, {
        x: { min: -100, max: GAME_WIDTH + 100 },
        y: -10,
        lifespan: 4000,
        speedY: { min: 60, max: 160 },
        speedX: { min: -40, max: 40 },
        rotate: { min: 0, max: 360 },
        scale: { min: 1.5, max: 3 },
        tint: [PALETTE.omnitrix, PALETTE.gold, PALETTE.neonPink, 0x52a4ff, 0xff9a3c, PALETTE.slime],
        quantity: 3,
        frequency: 40,
        duration: 2500,
      })
      .setDepth(5);
  }

  private finish(): void {
    leaveTo(this, SCENES.chapterSelect, this.data0.then, null);
  }
}
