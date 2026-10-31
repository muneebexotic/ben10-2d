import Phaser from 'phaser';
import { presentationIsHd } from '../../../systems/hd/Presentation';
import { approach } from '../../../systems/Pacing';
import { GAIT, GAIT_RATE } from '../../../config/cartoon/gait';

/** Who is moving the actor right now: nobody (hidden), a set piece, or the companion AI. */
export type ActorMode = 'hidden' | 'scripted' | 'buddy';

/** A family sprite sheet (scenes/preload/family.ts): anims are `${prefix}-${pose}`. */
export interface FamilyLook {
  texture: string;
  prefix: string;
  frameWidth: number;
  frameHeight: number;
  feetY: number;
  frames: Readonly<Record<string, readonly number[]>>;
  /** Hands height above the feet (bolts and sprays leave from here). */
  handHeight: number;
}

/**
 * Gwen or Grandpa Max standing in the world: a sprite with poses, runs and
 * hops. Set pieces move them (`scripted`); Gwen's companion AI takes her over
 * as `buddy`. Same idea as Chapter 4's KevinActor, on a plain sprite sheet.
 */
export class FamilyActor {
  readonly sprite: Phaser.GameObjects.Sprite;
  mode: ActorMode = 'hidden';
  x = 0;
  feetY = 0;
  facing: 1 | -1 = 1;
  private tween: Phaser.Tweens.Tween | null = null;
  private current = '';
  /** A one-shot pose (a cast) holds until this time (ms of the actor's own clock). */
  private holdMs = 0;
  /** Where the actor was last update (HD: how fast it's moving, for the cycle's rate). */
  private lastX = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly look: FamilyLook,
    depth: number,
  ) {
    this.sprite = scene.add.sprite(0, 0, look.texture, 0).setOrigin(0.5, (look.feetY + 1) / look.frameHeight).setDepth(depth).setVisible(false);
  }

  get visible(): boolean {
    return this.mode !== 'hidden';
  }

  get handX(): number {
    return this.x + this.facing * 7;
  }

  get handY(): number {
    return this.feetY - this.look.handHeight;
  }

  get centerY(): number {
    return this.feetY - this.look.feetY / 2;
  }

  place(x: number, feetY: number, mode: ActorMode = 'scripted'): void {
    this.stopTween();
    this.x = x;
    this.lastX = x;
    this.feetY = feetY;
    this.mode = mode;
    this.sprite.setVisible(true);
    this.sync();
  }

  hide(): void {
    this.stopTween();
    this.mode = 'hidden';
    this.sprite.setVisible(false);
  }

  /** A looping pose (idle, run, cast) or a held frame (jump, point, hurt). */
  pose(name: string): void {
    if (this.holdMs > 0) return;
    this.show(name);
  }

  /** A pose that wins over `pose()` for `ms` (a cast mid-run). */
  hold(name: string, ms: number): void {
    this.holdMs = ms;

    this.show(name);
  }

  face(dir: 1 | -1): void {
    this.facing = dir;
  }

  faceTo(x: number): void {
    if (Math.abs(x - this.x) > 1) this.facing = x < this.x ? -1 : 1;
  }

  /** Runs to `x` on the same floor at `speed` px/s, then calls `onDone`. */
  runTo(x: number, speed: number, onDone?: () => void, pose = 'run'): void {
    this.stopTween();
    this.faceTo(x);
    this.pose(pose);
    const ms = (Math.abs(x - this.x) / speed) * 1000;
    this.tween = this.scene.tweens.add({
      targets: this,
      x,
      duration: Math.max(1, ms),
      onComplete: () => {
        this.tween = null;
        this.pose('idle');
        onDone?.();
      },
    });
  }

  /** A hop in an arc to (x, feetY). */
  hopTo(x: number, feetY: number, ms: number, onDone?: () => void): void {
    this.stopTween();
    this.faceTo(x);
    const fromX = this.x;
    const fromY = this.feetY;
    const height = Math.max(16, fromY - feetY + 16);
    const state = { t: 0 };
    this.pose('jump');
    this.tween = this.scene.tweens.add({
      targets: state,
      t: 1,
      duration: ms,
      onUpdate: () => {
        const t = state.t;
        this.x = fromX + (x - fromX) * t;
        this.feetY = fromY + (feetY - fromY) * t - Math.sin(t * Math.PI) * height;
        if (t > 0.5) this.pose('fall');
      },
      onComplete: () => {
        this.tween = null;
        this.x = x;
        this.feetY = feetY;
        this.pose('idle');
        onDone?.();
      },
    });
  }

  get moving(): boolean {
    return this.tween !== null;
  }

  update(dtMs: number): void {
    if (this.mode === 'hidden') return;
    if (this.holdMs > 0) {
      this.holdMs -= dtMs;
      if (this.holdMs <= 0) {
        this.holdMs = 0;
        this.show(this.moving ? 'fall' : 'idle');
      }
    }
    this.sync();
    if (presentationIsHd()) this.matchGait(dtMs);
  }

  /** HD: a drawn run or walk plays as fast as the actor really moves, so the planted foot stays put (config/cartoon/gait.ts). */
  private matchGait(dtMs: number): void {
    const gait = GAIT[this.look.prefix]?.[this.current];
    const speed = dtMs > 0 ? (Math.abs(this.x - this.lastX) * 1000) / dtMs : 0;
    this.lastX = this.x;
    const anims = this.sprite.anims;
    if (!gait || speed < 1) {
      anims.timeScale = 1;
      return;
    }
    const target = Math.min(GAIT_RATE.max, Math.max(GAIT_RATE.min, speed / gait));
    anims.timeScale = approach(anims.timeScale, target, GAIT_RATE.perFrame);
  }

  private show(name: string): void {
    if (name === this.current) return;
    const frames = this.look.frames[name];
    if (!frames) return;
    this.current = name;
    const key = `${this.look.prefix}-${name}`;
    if (frames.length > 1 && this.scene.anims.exists(key)) this.sprite.play(key, true);
    else {
      this.sprite.stop();
      this.sprite.setFrame(frames[0]);
    }
  }

  private sync(): void {
    // Whole pixels keep pixel art crisp; an HD chapter draws the actor smoothly in between.
    if (presentationIsHd()) this.sprite.setPosition(this.x, this.feetY);
    else this.sprite.setPosition(Math.round(this.x), Math.round(this.feetY));
    this.sprite.setFlipX(this.facing < 0);
  }

  private stopTween(): void {
    this.tween?.stop();
    this.tween = null;
  }

  destroy(): void {
    this.stopTween();
    this.sprite.destroy();
  }
}
