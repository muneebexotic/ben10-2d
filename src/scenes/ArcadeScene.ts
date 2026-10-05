import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { SUMO } from '../config/sumo';
import { blinkOn, shakeCamera } from '../systems/Accessibility';
import { inputMode } from '../systems/InputMode';
import { SumoMatch, type SumoEvent } from '../systems/SumoMatch';
import { playSfx } from '../systems/audio/Sfx';
import { BakedGraphics } from '../ui/BakedGraphics';
import { pixelText } from '../ui/text';
import { COVER_W, COVER_X, frameView } from '../ui/view';
import { SUMO_FRAME, SUMO_POSE } from './preload/sumo';
import { TEX } from './preload/assetKeys';
import { SCENES } from './SceneKeys';

export interface ArcadeData {
  onDone(won: boolean): void;
}

const SCREEN = { x: 112, y: 34, w: 416, h: 262 } as const;
const RING_Y = SCREEN.y + SCREEN.h - 30;
const STEP_PX = 92;

/**
 * SUMO SLAMMERS on the cabinet's screen, over the frozen level: three rounds
 * against KEV's sumo. Mash ATTACK to push; when KEV raises his arms, SPECIAL
 * sidesteps his shove for a swing toward his edge. On touch the right half of
 * the screen pushes and the left half sidesteps.
 */
export class ArcadeScene extends Phaser.Scene {
  private match!: SumoMatch;
  private data0!: ArcadeData;
  private ben!: Phaser.GameObjects.Sprite;
  private kev!: Phaser.GameObjects.Sprite;
  private meter!: BakedGraphics;
  private meterKey = '';
  private banner!: Phaser.GameObjects.BitmapText;
  private roundText!: Phaser.GameObjects.BitmapText;
  private scoreText!: Phaser.GameObjects.BitmapText;
  private hiText!: Phaser.GameObjects.BitmapText;
  private alert!: Phaser.GameObjects.BitmapText;
  private score = 0;
  private benPoseLeft = 0;
  private kevPoseLeft = 0;
  private finished = false;
  private t = 0;
  private readonly onKey = (e: KeyboardEvent) => this.key(e);

  constructor() {
    super(SCENES.arcade);
  }

  create(data: ArcadeData): void {
    this.data0 = data;
    this.match = new SumoMatch();
    this.score = 0;
    this.finished = false;
    this.t = 0;
    this.scene.bringToTop();
    frameView(this);
    this.add.rectangle(COVER_X, 0, COVER_W, GAME_HEIGHT, 0x05070f, 0.94).setOrigin(0, 0);
    this.drawScreen();
    this.add.image(GAME_WIDTH / 2, RING_Y + 14, TEX.sumoRing);
    this.ben = this.add.sprite(0, RING_Y + 6, TEX.sumoBen, 0).setOrigin(0.5, 1).setScale(2);
    this.kev = this.add.sprite(0, RING_Y + 6, TEX.sumoKev, 0).setOrigin(0.5, 1).setScale(2).setFlipX(true);
    this.meter = new BakedGraphics(this, -160, -6, 320, 12);
    this.meter.image.setPosition(GAME_WIDTH / 2, SCREEN.y + 50);
    pixelText(this, GAME_WIDTH / 2, SCREEN.y + 10, 'SUMO SLAMMERS', { scale: 2, originX: 0.5, color: PALETTE.gold });
    this.scoreText = pixelText(this, SCREEN.x + 12, SCREEN.y + 62, '1UP 000000', { color: PALETTE.omnitrix });
    this.hiText = pixelText(this, SCREEN.x + SCREEN.w - 12, SCREEN.y + 62, `HI ${SUMO.kevScore.toLocaleString('en-US')} KEV`, { originX: 1, color: PALETTE.kevin });
    this.roundText = pixelText(this, GAME_WIDTH / 2, SCREEN.y + 62, '', { originX: 0.5, color: PALETTE.white });
    this.banner = pixelText(this, GAME_WIDTH / 2, SCREEN.y + 110, 'INSERT COIN', { scale: 2, originX: 0.5, color: PALETTE.white });
    this.alert = pixelText(this, 0, 0, '!', { scale: 3, originX: 0.5, originY: 1, color: PALETTE.enemy }).setVisible(false);
    const hint = inputMode.current === 'touch' ? 'TAP RIGHT: PUSH    TAP LEFT: SIDESTEP WHEN HE RAISES HIS ARMS' : inputMode.format('{J} PUSH    {K} SIDESTEP WHEN HE RAISES HIS ARMS');
    pixelText(this, GAME_WIDTH / 2, SCREEN.y + SCREEN.h + 10, hint, { originX: 0.5, color: PALETTE.uiDim });
    this.place();
    playSfx('arcadeBoot', 0.9);
    this.input.keyboard?.on('keydown', this.onKey);
    this.input.on('pointerdown', this.onPointer, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.onKey);
      this.input.off('pointerdown', this.onPointer, this);
    });
  }

  /** The cabinet's screen: a dark CRT in a neon bezel, scanlines over it. Drawn once. */
  private drawScreen(): void {
    const S = SCREEN;
    const g = new BakedGraphics(this, S.x - 10, S.y - 10, S.w + 20, S.h + 20);
    g.draw((p) => {
      p.fillStyle(0x2a0e3a, 1).fillRect(S.x - 10, S.y - 10, S.w + 20, S.h + 20);
      p.lineStyle(2, PALETTE.neonPink, 1).strokeRect(S.x - 8, S.y - 8, S.w + 16, S.h + 16);
      p.lineStyle(1, PALETTE.neonBlue, 1).strokeRect(S.x - 4, S.y - 4, S.w + 8, S.h + 8);
      p.fillStyle(0x0a0f2a, 1).fillRect(S.x, S.y, S.w, S.h);
      p.fillStyle(0x16204a, 1).fillRect(S.x, S.y + S.h * 0.55, S.w, S.h * 0.45);
      // A crowd of tiny pixel fans in the stands.
      for (let x = S.x + 6; x < S.x + S.w - 6; x += 9) {
        const c = [0x3a4a8a, 0x5a3a7a, 0x2a6a6a][(x / 9) % 3 | 0];
        p.fillStyle(c, 1).fillCircle(x, S.y + S.h * 0.55 - 6 - ((x * 7) % 5), 3);
      }
    });
    const lines = new BakedGraphics(this, S.x, S.y, S.w, S.h);
    lines.draw((p) => {
      p.fillStyle(0x000000, 0.18);
      for (let y = S.y; y < S.y + S.h; y += 2) p.fillRect(S.x, y, S.w, 1);
    });
    lines.image.setDepth(5);
  }

  private key(e: KeyboardEvent): void {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === 'j' || k === 'x') this.handle(this.match.push());
    else if (k === 'k' || k === 'c') this.handle(this.match.dodge());
    else if (k === 'escape' || k === 'p') this.finish(false);
  }

  private onPointer(p: Phaser.Input.Pointer): void {
    if (p.x >= this.scale.width / 2) this.handle(this.match.push());
    else this.handle(this.match.dodge());
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta, 50);
    this.t += dt;
    if (!this.finished) this.handle(this.match.update(dt));
    this.benPoseLeft = Math.max(0, this.benPoseLeft - dt);
    this.kevPoseLeft = Math.max(0, this.kevPoseLeft - dt);
    this.place();
  }

  private handle(events: SumoEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'round':
          this.flashBanner(e.round === SUMO.rounds - 1 ? 'FINAL ROUND!' : `ROUND ${e.round + 1}!`, PALETTE.white);
          playSfx('beep', 0.6, 1.4);
          break;
        case 'push':
          this.score += 10;
          this.pose('ben', SUMO_POSE.slap, 110);
          playSfx('sumoSlap', 0.6, 0.9 + Math.random() * 0.3);
          break;
        case 'tell':
          this.pose('kev', SUMO_POSE.tell, SUMO.shove.tellMs);
          playSfx('beepFinal', 0.6, 0.8);
          break;
        case 'dodge':
          this.pose('ben', SUMO_POSE.dodge, 360);
          playSfx('whoosh', 0.7, 1.3);
          break;
        case 'shove':
          playSfx('sumoShove', 0.9);
          if (e.dodged) {
            this.score += 500;
            this.pose('kev', SUMO_POSE.stagger, 420);
            this.flashBanner('SIDESTEP!', PALETTE.gold);
          } else {
            this.pose('ben', SUMO_POSE.stagger, 420);
            this.pose('kev', SUMO_POSE.shove, 300);
            this.flashBanner('OOF!', PALETTE.enemy);
            shakeCamera(this.cameras.main, 160, 0.006);
          }
          break;
        case 'roundWon':
          this.score += 10_000 * (e.round + 1);
          this.pose('kev', SUMO_POSE.down, SUMO.betweenMs);
          this.flashBanner('ROUND WON!', PALETTE.omnitrix);
          playSfx('sumoWin', 0.6, 1.2);
          break;
        case 'roundLost':
          this.pose('ben', SUMO_POSE.down, 99999);
          break;
        case 'matchWon':
          this.score = SUMO.kevScore + 10 + Math.min(9999, this.score);
          this.hiText.setText(`HI ${this.score.toLocaleString('en-US')} BEN`).setTint(PALETTE.omnitrix);
          this.flashBanner('NEW HIGH SCORE!', PALETTE.gold, true);
          playSfx('sumoWin', 1);
          this.time.delayedCall(SUMO.outroMs, () => this.finish(true));
          break;
        case 'matchLost':
          this.flashBanner('GAME OVER', PALETTE.enemy, true);
          playSfx('sumoLose', 1);
          this.time.delayedCall(SUMO.outroMs, () => this.finish(false));
          break;
      }
    }
  }

  private pose(who: 'ben' | 'kev', frame: number, ms: number): void {
    if (who === 'ben') {
      this.ben.setFrame(frame);
      this.benPoseLeft = ms;
    } else {
      this.kev.setFrame(frame);
      this.kevPoseLeft = ms;
    }
  }

  private flashBanner(text: string, color: number, stay = false): void {
    this.banner.setText(text).setTint(color).setVisible(true).setScale(1);
    this.tweens.killTweensOf(this.banner);
    this.banner.setAlpha(1);
    this.tweens.add({ targets: this.banner, scaleX: { from: 1.4, to: 1 }, scaleY: { from: 1.4, to: 1 }, duration: 160, ease: 'Back.easeOut' });
    if (!stay) this.tweens.add({ targets: this.banner, alpha: 0, delay: 650, duration: 250 });
  }

  /** Both wrestlers sit either side of the push point; the meter shows who's winning. */
  private place(): void {
    const m = this.match;
    const mid = GAME_WIDTH / 2 + m.pos * STEP_PX;
    const half = (SUMO_FRAME.w * 2) / 2 - 10;
    const idle = Math.floor(this.t / 300) % 2;
    if (this.benPoseLeft <= 0) this.ben.setFrame(idle);
    if (this.kevPoseLeft <= 0) this.kev.setFrame(m.telling ? SUMO_POSE.tell : idle);
    this.ben.setX(Math.round(mid - half));
    this.kev.setX(Math.round(mid + half));
    // The tell: a big "!" over KEV's head while his arms are up.
    this.alert.setVisible(m.telling && blinkOn(this.t, 90)).setPosition(this.kev.x, this.kev.y - SUMO_FRAME.h * 2 - 4);
    this.scoreText.setText(`1UP ${String(Math.min(999999, this.score)).padStart(6, '0')}`);
    const secs = Math.max(0, Math.ceil(m.timeLeft / 1000));
    this.roundText.setText(m.phase === 'bout' ? `ROUND ${m.round + 1}/${SUMO.rounds}  ${secs}` : `ROUND ${Math.min(m.round + 1, SUMO.rounds)}/${SUMO.rounds}`);
    this.drawMeter();
  }

  private drawMeter(): void {
    const pos = Math.round(((this.match.pos + 1) / 2) * 300);
    const key = `${pos}`;
    if (key === this.meterKey) return;
    this.meterKey = key;
    this.meter.draw((g) => {
      g.fillStyle(PALETTE.ink, 1).fillRect(-152, -5, 304, 10);
      g.fillStyle(0x1e7a34, 1).fillRect(-150, -3, pos, 6);
      g.fillStyle(0x4e2290, 1).fillRect(-150 + pos, -3, 300 - pos, 6);
      g.fillStyle(PALETTE.white, 1).fillRect(-150 + pos - 1, -6, 3, 12);
      g.fillStyle(PALETTE.ink, 1).fillRect(-1, -5, 2, 10);
    });
  }

  private finish(won: boolean): void {
    if (this.finished) return;
    this.finished = true;
    const done = this.data0.onDone;
    this.scene.stop();
    done(won && this.match.phase === 'won');
  }
}


