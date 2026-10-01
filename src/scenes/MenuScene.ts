import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { CHAPTER_1 } from '../levels/chapter1';
import { audio } from '../systems/audio/AudioEngine';
import { music } from '../systems/audio/Music';
import { playSfx } from '../systems/audio/Sfx';
import { formatTime } from '../systems/RunStats';
import { saveSystem } from '../systems/SaveSystem';
import { bindAudioUnlock, bindMuteKey, toggleMute } from '../systems/Settings';
import { MenuList } from '../ui/MenuList';
import { pixelText } from '../ui/text';
import { TEX } from './preload/assetKeys';
import { SCENES } from './SceneKeys';
import { flashCamera } from '../systems/Accessibility';
import { countedCards } from '../levels/secrets';
import { allAliens } from '../aliens/registry';
import { EventBus } from '../systems/EventBus';
import { inputMode } from '../systems/InputMode';

/** Title screen: night sky, the Omnitrix emblem, and Ben flipping into each alien in turn. */
export class MenuScene extends Phaser.Scene {
  private menu!: MenuList;
  private emblem!: Phaser.GameObjects.Image;
  private hero!: Phaser.GameObjects.Sprite;
  private heroGlow!: Phaser.GameObjects.Image;
  private pines!: Phaser.GameObjects.TileSprite;
  private pinesFar!: Phaser.GameObjects.TileSprite;
  private readonly auras = new Map<string, Phaser.GameObjects.Particles.ParticleEmitter>();
  private heroTimer = 0;
  private heroAlien = false;
  private heroIndex = -1;
  private starting = false;
  private hint!: Phaser.GameObjects.BitmapText;

  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    this.starting = false;
    this.heroAlien = false;
    this.heroIndex = -1;
    this.heroTimer = 2200;
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.add.image(0, 0, TEX.sky).setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.tileSprite(0, 0, GAME_WIDTH, 200, TEX.stars).setOrigin(0, 0);
    this.add.image(520, 60, TEX.light).setScale(1.8).setAlpha(0.18).setTint(PALETTE.moon).setBlendMode(Phaser.BlendModes.ADD);
    this.add.image(520, 60, TEX.moon);
    this.add.tileSprite(0, 150, GAME_WIDTH, 140, TEX.mountains).setOrigin(0, 0);
    this.pinesFar = this.add.tileSprite(0, 190, GAME_WIDTH, 150, TEX.pinesFar).setOrigin(0, 0);
    this.pines = this.add.tileSprite(0, 220, GAME_WIDTH, 200, TEX.pinesMid).setOrigin(0, 0);
    this.add.rectangle(0, 318, GAME_WIDTH, 60, PALETTE.pineNear).setOrigin(0, 0);

    this.emblem = this.add.image(GAME_WIDTH / 2, 92, TEX.hourglass).setTint(PALETTE.omnitrix).setAlpha(0.22).setScale(2.4).setBlendMode(Phaser.BlendModes.ADD);
    this.add.image(GAME_WIDTH / 2, 92, TEX.light).setScale(4).setTint(PALETTE.omnitrix).setAlpha(0.14).setBlendMode(Phaser.BlendModes.ADD);

    const title = pixelText(this, GAME_WIDTH / 2, 72, 'BEN 10', { scale: 7, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });
    pixelText(this, GAME_WIDTH / 2, 118, 'OMNITRIX SUMMER', { scale: 3, originX: 0.5, originY: 0.5, color: PALETTE.white });
    pixelText(this, GAME_WIDTH / 2, 138, 'A FAN-MADE PIXEL ADVENTURE', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    this.tweens.add({ targets: title, scale: title.scale * 1.03, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });

    this.heroGlow = this.add.image(GAME_WIDTH / 2, 296, TEX.light).setScale(1.6).setAlpha(0.35).setTint(PALETTE.omnitrix).setBlendMode(Phaser.BlendModes.ADD);
    this.hero = this.add.sprite(GAME_WIDTH / 2, 318, TEX.ben).setOrigin(0.5, 27 / 28).setScale(2);
    this.hero.play('ben-idle');
    this.auras.clear();
    for (const alien of allAliens()) {
      this.auras.set(
        alien.id,
        this.add.particles(GAME_WIDTH / 2, 300, TEX.soft, {
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

    const record = saveSystem.getChapter(CHAPTER_1.id);
    if (record.completed && record.bestTimeMs !== null) {
      const counted = countedCards(CHAPTER_1);
      const totalCards = counted.length;
      const cards = record.cards.filter((id) => counted.some((c) => c.id === id)).length;
      pixelText(this, GAME_WIDTH / 2, 342, `BEST ${formatTime(record.bestTimeMs)}   RANK ${record.bestRank ?? '-'}   CARDS ${cards}/${totalCards}`, {
        originX: 0.5,
        originY: 0.5,
        color: PALETTE.gold,
      });
    }

    this.menu = new MenuList(
      this,
      GAME_WIDTH / 2,
      170,
      [
        { label: 'START', action: () => this.startGame() },
        { label: 'OMNITRIX TRAINING', action: () => this.startGame('training') },
        { label: 'SETTINGS', action: () => this.openSettings() },
        { label: () => (audio.muted ? 'SOUND: OFF' : 'SOUND: ON'), action: () => toggleMute() },
      ],
      21,
      2,
    );
    this.hint = pixelText(this, GAME_WIDTH / 2, 256, '', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    this.refreshHint();
    EventBus.on('input:mode', () => this.refreshHint(), this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => EventBus.offContext(this));

    bindMuteKey(this);
    bindAudioUnlock(this, () => music.play('title'));
    if (audio.ready) music.play('title');
  }

  private refreshHint(): void {
    this.hint.setText(
      inputMode.current === 'touch'
        ? 'LEFT THUMB: MOVE    RIGHT THUMB: JUMP, ATTACK, SPECIAL    TAP THE OMNITRIX TO GO HERO'
        : 'ARROWS/WASD MOVE   SPACE JUMP   J ATTACK   K SPECIAL   T TRANSFORM',
    );
  }

  /** Phones: go fullscreen and landscape on the first tap of START (browsers only allow it at the end of a tap). */
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

  private openSettings(): void {
    this.scene.launch(SCENES.settings, { returnTo: SCENES.menu });
    this.scene.pause();
  }

  private startGame(levelId?: string): void {
    if (this.starting) return;
    this.starting = true;
    this.menu.enabled = false;
    this.requestMobileFullscreen();
    audio.unlock();
    playSfx('transformBoom', 0.7);
    flashCamera(this.cameras.main, 300, 120, 255, 110);
    music.stop(300);
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SCENES.level, levelId ? { levelId } : {}));
  }

  override update(time: number, delta: number): void {
    this.menu.update(time);
    this.emblem.setAngle(Math.sin(time * 0.0006) * 8);
    this.pines.tilePositionX += delta * 0.01;
    this.pinesFar.tilePositionX += delta * 0.004;
    this.hint.setAlpha(0.6 + Math.sin(time * 0.003) * 0.2);

    this.heroTimer -= delta;
    if (this.heroTimer <= 0) {
      this.heroAlien = !this.heroAlien;
      this.heroTimer = this.heroAlien ? 2600 : 2200;
      flashCamera(this.cameras.main, 160, 120, 255, 110);
      this.emblem.setAlpha(0.6);
      this.tweens.add({ targets: this.emblem, alpha: 0.22, duration: 600 });
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
