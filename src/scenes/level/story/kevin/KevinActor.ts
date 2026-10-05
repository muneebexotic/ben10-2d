import { DEPTH } from '../../../../config/constants';
import { PALETTE } from '../../../../config/palette';
import { KevinLook, type KevinPose } from '../../../../entities/bosses/kevin/KevinLook';
import { chance } from '../../../../systems/Pacing';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { StoryKit } from '../StoryKit';

/** Who is moving Kevin right now: nobody (hidden), a set piece, or the buddy AI. */
export type KevinMode = 'hidden' | 'scripted' | 'buddy' | 'watch';

/**
 * Kevin in person, shared by every Chapter 4 set piece: the buddy who tags
 * along, the kid watching through the glass, the rival who turns. Set pieces
 * take him over (`scripted`) and hand him back.
 */
export class KevinActor {
  readonly look: KevinLook;
  mode: KevinMode = 'hidden';
  x = 0;
  feetY = 0;
  facing: 1 | -1 = 1;
  /** Purple glow while he's holding stolen power (0-1). */
  glow = 0;
  private beam: { x: number; y: number; ms: number } | null = null;
  private tween: Phaser.Tweens.Tween | null = null;

  constructor(private readonly kit: StoryKit) {
    this.look = new KevinLook(kit.scene, 0, 0, DEPTH.enemies - 1);
    this.look.setVisible(false);
  }

  get visible(): boolean {
    return this.mode !== 'hidden';
  }

  /** Where his hands are (bolts and beams leave from here). */
  get handX(): number {
    return this.x + this.facing * 9;
  }

  get handY(): number {
    return this.feetY - 21;
  }

  place(x: number, feetY: number, mode: KevinMode = 'scripted'): void {
    this.stopTween();
    this.x = x;
    this.feetY = feetY;
    this.mode = mode;
    this.look.setVisible(true);
  }

  /** Pops in (or out) with a crackle. */
  appear(x: number, feetY: number, mode: KevinMode): void {
    this.place(x, feetY, mode);
    this.kit.fx.burst('volt', x, feetY - 16, 12);
    this.kit.fx.flash(x, feetY - 16, PALETTE.kevin, 24, 200);
  }

  hide(): void {
    this.stopTween();
    this.mode = 'hidden';
    this.look.setVisible(false);
    this.beam = null;
  }

  pose(p: KevinPose): void {
    this.look.setPose(p);
  }

  face(dir: 1 | -1): void {
    this.facing = dir;
  }

  faceBen(): void {
    this.facing = this.kit.player.x < this.x ? -1 : 1;
  }

  /** Runs to `x` on the same floor, then calls `onDone`. */
  runTo(x: number, speed: number, onDone?: () => void): void {
    this.stopTween();
    this.facing = x < this.x ? -1 : 1;
    this.pose('run');
    const ms = (Math.abs(x - this.x) / speed) * 1000;
    this.tween = this.kit.scene.tweens.add({
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
    this.facing = x < this.x ? -1 : x > this.x ? 1 : this.facing;
    const fromX = this.x;
    const fromY = this.feetY;
    const height = Math.max(18, (fromY - feetY) + 18);
    const state = { t: 0 };
    this.pose('jump');
    this.tween = this.kit.scene.tweens.add({
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

  /** A crackling purple beam from (x, y) into his hands for `ms`: him drinking power. */
  drink(x: number, y: number, ms: number): void {
    this.beam = { x, y, ms };
    this.pose('absorb');
    playSfx('absorb', 0.7);
  }

  /** A bolt of stolen power at (tx, ty), as Ben's friend: it hurts enemies. */
  throwBolt(tx: number, ty: number, damage: number, speed: number, knockback: number): void {
    this.facing = tx < this.x ? -1 : 1;
    this.pose('attack');
    const a = Math.atan2(ty - this.handY, tx - this.handX);
    this.kit.projectiles.spawn('bolt', 'player', this.handX, this.handY, Math.cos(a) * speed, Math.sin(a) * speed, damage, 1400, 5, { hitKind: 'burst', knockback, tint: PALETTE.kevin });
    this.kit.fx.flash(this.handX, this.handY, PALETTE.kevin, 14, 120);
    playSfx('kevinBolt', 0.6, 1.1);
    this.kit.scene.time.delayedCall(260, () => {
      if (this.mode !== 'hidden' && !this.moving) this.pose('idle');
    });
  }

  update(dtMs: number): void {
    if (this.mode === 'hidden') return;
    if (this.beam) {
      this.beam.ms -= dtMs;
      if (chance(0.8)) this.kit.fx.beam(this.beam.x, this.beam.y, this.handX, this.handY, PALETTE.kevin, 2, 50);
      this.glow = Math.min(1, this.glow + dtMs / 500);
      if (this.beam.ms <= 0) {
        this.beam = null;
        this.pose('idle');
      }
    } else this.glow = Math.max(0, this.glow - dtMs / 2500);
    this.look.place(this.x, this.feetY, this.facing, dtMs, false, this.glow);
    this.kit.lighting.add(this.x, this.feetY - 18, 30 + this.glow * 30, PALETTE.kevin, 0.35 + this.glow * 0.5);
  }

  private stopTween(): void {
    this.tween?.stop();
    this.tween = null;
  }

  destroy(): void {
    this.stopTween();
    this.look.destroy();
  }
}
