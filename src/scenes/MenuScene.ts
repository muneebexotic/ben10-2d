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

/** Title screen: night sky, the Omnitrix emblem, and Ben flipping into Heatblast on a loop. */
export class MenuScene extends Phaser.Scene {
  private menu!: MenuList;
  private emblem!: Phaser.GameObjects.Image;
  private hero!: Phaser.GameObjects.Sprite;
  private heroGlow!: Phaser.GameObjects.Image;
  private pines!: Phaser.GameObjects.TileSprite;
  private pinesFar!: Phaser.GameObjects.TileSprite;
  private embers!: Phaser.GameObjects.Particles.ParticleEmitter;
  private heroTimer = 0;
  private heroAlien = false;
  private starting = false;
  private hint!: Phaser.GameObjects.BitmapText;

  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    this.starting = false;
    this.heroAlien = false;
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
    this.embers = this.add.particles(GAME_WIDTH / 2, 300, TEX.soft, {
      lifespan: 700,
      speedY: { min: -60, max: -20 },
      speedX: { min: -20, max: 20 },
      scale: { start: 0.7, end: 0 },
      color: [PALETTE.fire0, PALETTE.fire2, PALETTE.fire3],
      frequency: 50,
      blendMode: 'ADD',
      emitting: false,
    });

    const record = saveSystem.getChapter(CHAPTER_1.id);
    if (record.completed && record.bestTimeMs !== null) {
      pixelText(this, GAME_WIDTH / 2, 342, `BEST ${formatTime(record.bestTimeMs)}   RANK ${record.bestRank ?? '-'}   CARDS ${record.cards.length}/3`, {
        originX: 0.5,
        originY: 0.5,
        color: PALETTE.gold,
      });
    }

    this.menu = new MenuList(
      this,
      GAME_WIDTH / 2,
      178,
      [
        { label: 'START', action: () => this.startGame() },
        { label: () => (audio.muted ? 'SOUND: OFF' : 'SOUND: ON'), action: () => toggleMute() },
      ],
      22,
      2,
    );
    this.hint = pixelText(this, GAME_WIDTH / 2, 226, 'ARROWS/WASD MOVE   SPACE JUMP   J ATTACK   K SPECIAL   T TRANSFORM', {
      originX: 0.5,
      originY: 0.5,
      color: PALETTE.uiDim,
    });

    if (this.sys.game.device.input.touch && !this.sys.game.device.os.desktop) {
      const note = pixelText(this, GAME_WIDTH / 2, 252, 'KEYBOARD NEEDED FOR NOW - TOUCH CONTROLS ARE COMING!', {
        originX: 0.5,
        originY: 0.5,
        color: PALETTE.gold,
      });
      this.tweens.add({ targets: note, alpha: 0.4, yoyo: true, repeat: -1, duration: 800 });
    }

    bindMuteKey(this);
    bindAudioUnlock(this, () => music.play('title'));
    if (audio.ready) music.play('title');
  }

  private startGame(): void {
    if (this.starting) return;
    this.starting = true;
    this.menu.enabled = false;
    audio.unlock();
    playSfx('transformBoom', 0.7);
    this.cameras.main.flash(300, 120, 255, 110);
    music.stop(300);
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SCENES.level, {}));
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
      this.cameras.main.flash(160, 120, 255, 110);
      this.emblem.setAlpha(0.6);
      this.tweens.add({ targets: this.emblem, alpha: 0.22, duration: 600 });
      if (this.heroAlien) {
        this.hero.setTexture(TEX.heatblast).setOrigin(0.5, 35 / 36).play('heatblast-idle');
        this.heroGlow.setTint(PALETTE.fire2);
        this.embers.start();
      } else {
        this.hero.setTexture(TEX.ben).setOrigin(0.5, 27 / 28).play('ben-idle');
        this.heroGlow.setTint(PALETTE.omnitrix);
        this.embers.stop();
      }
      this.hero.setScale(3, 1.2);
      this.tweens.add({ targets: this.hero, scaleX: 2, scaleY: 2, duration: 350, ease: 'Back.easeOut' });
    }
  }
}
