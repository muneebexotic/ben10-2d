import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { getDifficulty } from '../config/difficulty';
import { audio } from '../systems/audio/AudioEngine';
import { music } from '../systems/audio/Music';
import { playSfx } from '../systems/audio/Sfx';
import { saveSystem } from '../systems/SaveSystem';
import { bindAudioUnlock, bindMuteKey, toggleMute } from '../systems/Settings';
import { MenuList, type MenuItem } from '../ui/MenuList';
import { pixelText } from '../ui/text';
import { TEX } from './preload/assetKeys';
import { SCENES } from './SceneKeys';
import { flashCamera } from '../systems/Accessibility';
import { allAliens } from '../aliens/registry';
import { EventBus } from '../systems/EventBus';
import { inputMode } from '../systems/InputMode';
import { session } from '../systems/Session';
import { summarize } from '../systems/Progress';
import { MenuBackdrop } from '../ui/menu/MenuBackdrop';
import { enterMenu, isLeaving, leaveTo } from '../ui/menu/transition';
import type { LevelStartData } from './LevelScene';

const HERO_X = 540;

/** Title screen: night sky, the Omnitrix emblem, and Ben flipping into each alien in turn. */
export class MenuScene extends Phaser.Scene {
  private menu!: MenuList;
  private backdrop!: MenuBackdrop;
  private hero!: Phaser.GameObjects.Sprite;
  private heroGlow!: Phaser.GameObjects.Image;
  private readonly auras = new Map<string, Phaser.GameObjects.Particles.ParticleEmitter>();
  private heroTimer = 0;
  private heroAlien = false;
  private heroIndex = -1;
  private hint!: Phaser.GameObjects.BitmapText;
  private detail!: Phaser.GameObjects.BitmapText;

  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    this.heroAlien = false;
    this.heroIndex = -1;
    this.heroTimer = 2200;
    enterMenu(this);
    // The title is outside every file: Settings hides the difficulty row here.
    session.useSlot(null);

    this.backdrop = new MenuBackdrop(this);
    this.add.image(GAME_WIDTH / 2, 92, TEX.light).setScale(4).setTint(PALETTE.omnitrix).setAlpha(0.14).setBlendMode(Phaser.BlendModes.ADD);

    const title = pixelText(this, GAME_WIDTH / 2, 66, 'BEN 10', { scale: 7, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });
    pixelText(this, GAME_WIDTH / 2, 110, 'OMNITRIX SUMMER', { scale: 3, originX: 0.5, originY: 0.5, color: PALETTE.white });
    pixelText(this, GAME_WIDTH / 2, 129, 'A FAN-MADE PIXEL ADVENTURE', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    this.tweens.add({ targets: title, scale: title.scale * 1.03, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });

    this.heroGlow = this.add.image(HERO_X, 296, TEX.light).setScale(1.6).setAlpha(0.35).setTint(PALETTE.omnitrix).setBlendMode(Phaser.BlendModes.ADD);
    this.hero = this.add.sprite(HERO_X, 318, TEX.ben).setOrigin(0.5, 27 / 28).setScale(2);
    this.hero.play('ben-idle');
    this.auras.clear();
    for (const alien of allAliens()) {
      this.auras.set(
        alien.id,
        this.add.particles(HERO_X, 300, TEX.soft, {
          lifespan: 700,
          speedY: { min: -60, max: -20 },
          speedX: { min: -20, max: 20 },
          scale: { start: 0.7, end: 0 },
          color: [alien.theme.light, alien.theme.color, alien.theme.dark],
          frequency: 50,
          blendMode: 'ADD',
          emitting: false,
        }),
      );
    }

    const items = this.buildItems();
    this.detail = pixelText(this, GAME_WIDTH / 2, 156 + items.length * 20, '', { originX: 0.5, originY: 0.5, color: PALETTE.gold });
    this.menu = new MenuList(this, GAME_WIDTH / 2, 156, items, {
      spacing: 20,
      scale: 2,
      rowWidth: 300,
      onSelect: (_i, item) => this.detail.setText(item.hint ?? ''),
    });
    this.hint = pixelText(this, GAME_WIDTH / 2, 342, '', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    this.refreshHint();
    EventBus.on('input:mode', () => this.refreshHint(), this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => EventBus.offContext(this));
    // Back from Settings: the CONTINUE line may show a new difficulty.
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      const fresh = this.buildItems();
      items.forEach((item, i) => (item.hint = fresh[i]?.hint ?? item.hint));
      this.menu.refresh();
      this.detail.setText(items[this.menu.selectedIndex]?.hint ?? '');
    });

    bindMuteKey(this);
    bindAudioUnlock(this, () => music.play('title'));
    if (audio.ready) music.play('title');
  }

  /** CONTINUE and SAVE FILES once a file exists; NEW GAME before that. */
  private buildItems(): MenuItem[] {
    const items: MenuItem[] = [];
    const last = saveSystem.lastSlot;
    const summary = last === null ? null : summarize(last);
    if (summary) {
      const d = getDifficulty(summary.file.difficulty);
      const where = summary.resumeLabel ?? `${summary.chaptersDone}/${summary.chaptersTotal} CHAPTERS`;
      items.push({ label: 'CONTINUE', action: () => this.continueGame(summary.slot), hint: `FILE ${summary.slot + 1}  -  ${d.label}  -  ${where}` });
      items.push({ label: 'SAVE FILES', action: () => this.go(SCENES.fileSelect), hint: 'PICK A FILE, OR START A NEW SUMMER' });
    } else {
      items.push({ label: 'NEW GAME', action: () => this.go(SCENES.fileSelect), hint: 'A METEOR. A WATCH. A VERY WEIRD SUMMER.' });
    }
    if (summary) items.push({ label: 'EXTRAS', action: () => this.go(SCENES.extras, { slot: summary.slot }), hint: 'ACHIEVEMENTS, THE CARD ALBUM AND EVERY MISFIRE JOKE FOUND' });
    items.push(
      { label: 'OMNITRIX TRAINING', action: () => this.startTraining(), hint: 'TRY EVERY ALIEN. SPAWN ANY ENEMY.' },
      { label: 'SETTINGS', action: () => this.openSettings(), hint: summary ? 'DIFFICULTY, ACCESSIBILITY, SOUND AND TOUCH' : 'ACCESSIBILITY, SOUND AND TOUCH CONTROLS' },
      { label: () => (audio.muted ? 'SOUND: OFF' : 'SOUND: ON'), action: () => toggleMute(), hint: inputMode.current === 'touch' ? 'SOUND ON OR OFF' : '[M] ALSO WORKS ANYWHERE' },
    );
    return items;
  }

  private refreshHint(): void {
    this.hint.setText(
      inputMode.current === 'touch'
        ? 'LEFT THUMB: MOVE    RIGHT THUMB: JUMP, ATTACK, SPECIAL    TAP THE OMNITRIX TO GO HERO'
        : 'ARROWS/WASD MOVE   SPACE JUMP   J ATTACK   K SPECIAL   T TRANSFORM',
    );
  }

  /** Phones: go fullscreen and landscape on the first tap of a menu choice (browsers only allow it at the end of a tap). */
  private requestMobileFullscreen(): void {
    if (inputMode.current !== 'touch' || !this.scale.fullscreen.available || this.scale.isFullscreen) return;
    this.input.once(Phaser.Input.Events.POINTER_UP, () => {
      try {
        this.scale.once(Phaser.Scale.Events.ENTER_FULLSCREEN, () => {
          const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
          orientation.lock?.('landscape').catch(() => undefined);
        });
        this.scale.startFullscreen();
      } catch {
        // Not allowed here (iOS Safari): the game still fits the screen.
      }
    });
  }

  /** From the title, Settings' difficulty row edits the file CONTINUE would load. */
  private openSettings(): void {
    this.scene.launch(SCENES.settings, { returnTo: SCENES.menu, slot: saveSystem.lastSlot });
    this.scene.pause();
  }

  private go(key: string, data?: object): void {
    if (isLeaving(this)) return;
    this.requestMobileFullscreen();
    audio.unlock();
    leaveTo(this, key, data);
  }

  /** Back into the last file: mid-chapter at its checkpoint, otherwise on Chapter Select. */
  private continueGame(slot: number): void {
    session.useSlot(slot);
    const resume = session.file?.resume ?? null;
    if (!resume) {
      this.go(SCENES.chapterSelect);
      return;
    }
    const data: LevelStartData = { levelId: resume.levelId, checkpoint: resume.checkpoint, stats: resume.stats };
    this.startLevel(data);
  }

  private startTraining(): void {
    // Training lends aliens on top of what the last file unlocked.
    session.useSlot(saveSystem.lastSlot);
    this.startLevel({ levelId: 'training' });
  }

  /** The level start keeps its signature burst: the Omnitrix slams and the screen floods green. */
  private startLevel(data: LevelStartData): void {
    if (isLeaving(this)) return;
    this.menu.enabled = false;
    this.requestMobileFullscreen();
    audio.unlock();
    playSfx('transformBoom', 0.7);
    flashCamera(this.cameras.main, 300, 120, 255, 110);
    music.stop(300);
    leaveTo(this, SCENES.level, data, null);
  }

  override update(time: number, delta: number): void {
    this.menu.update(time);
    this.backdrop.update();
    this.hint.setAlpha(0.6 + Math.sin(time * 0.003) * 0.2);

    this.heroTimer -= delta;
    if (this.heroTimer <= 0) {
      this.heroAlien = !this.heroAlien;
      this.heroTimer = this.heroAlien ? 2600 : 2200;
      flashCamera(this.cameras.main, 160, 120, 255, 110);
      const emblem = this.backdrop.emblem;
      if (emblem) {
        emblem.setAlpha(0.6);
        this.tweens.add({ targets: emblem, alpha: 0.22, duration: 600 });
      }
      for (const aura of this.auras.values()) aura.stop();
      if (this.heroAlien) {
        const aliens = allAliens();
        this.heroIndex = (this.heroIndex + 1) % aliens.length;
        const alien = aliens[this.heroIndex];
        this.hero.setTexture(alien.texture).setOrigin(0.5, alien.frame.feetY / alien.frame.h).play(`${alien.animPrefix}-idle`);
        this.heroGlow.setTint(alien.theme.color);
        this.auras.get(alien.id)?.start();
      } else {
        this.hero.setTexture(TEX.ben).setOrigin(0.5, 27 / 28).play('ben-idle');
        this.heroGlow.setTint(PALETTE.omnitrix);
      }
      this.hero.setScale(3, 1.2);
      this.tweens.add({ targets: this.hero, scaleX: 2, scaleY: 2, duration: 350, ease: 'Back.easeOut' });
    }
  }
}
