import type Phaser from 'phaser';
import { DEPTH } from '../../../../config/constants';
import { castRig } from '../../../preload/cartoon/cast';
import { rigTextureKey } from '../../../preload/cartoon/rig';
import { RigActor } from '../../../../systems/hd/RigActor';

/**
 * One of the circus's stars on stage in a set piece (CACKLEJACK, IRONJAW,
 * THE TANGLE): its rig drawn by its own actor, placed by its feet, facing a
 * way, playing a clip, walking somewhere at a pace.
 */
export class StarActor {
  readonly actor: RigActor;
  x = 0;
  y = 0;
  facing: 1 | -1 = -1;
  private target: { x: number; speed: number; onDone?: () => void; clip: string } | null = null;
  private clip = '';
  private settle = 'idle';

  constructor(scene: Phaser.Scene, id: 'cacklejack' | 'ironjaw' | 'tangle', depth = DEPTH.enemies + 1) {
    this.actor = new RigActor(scene, castRig(id), rigTextureKey(id));
    this.actor.container.setDepth(depth).setVisible(false);
  }

  get visible(): boolean {
    return this.actor.container.visible;
  }

  show(x: number, feetY: number, facing: 1 | -1, clip = 'idle'): this {
    this.x = x;
    this.y = feetY;
    this.facing = facing;
    this.actor.container.setVisible(true);
    this.play(clip, true);
    return this;
  }

  hide(): void {
    this.actor.container.setVisible(false);
    this.target = null;
  }

  play(clip: string, restart = false): void {
    if (clip === this.clip && !restart) return;
    this.clip = clip;
    this.settle = clip;
    this.actor.play(clip, restart);
  }

  /** Walks to `x` at `speed` px/s with `clip`, then settles into what it was doing (or `then`). */
  walkTo(x: number, speed: number, onDone?: () => void, clip = 'walk'): void {
    const settle = this.settle;
    this.target = { x, speed, onDone, clip };
    this.facing = x >= this.x ? 1 : -1;
    this.actor.play(clip, false);
    this.clip = clip;
    this.settle = settle;
  }

  update(dtMs: number): void {
    if (!this.visible) return;
    const t = this.target;
    if (t) {
      const step = (t.speed * dtMs) / 1000;
      if (Math.abs(t.x - this.x) <= step) {
        this.x = t.x;
        this.target = null;
        this.play(this.settle, true);
        t.onDone?.();
      } else this.x += Math.sign(t.x - this.x) * step;
    }
    const c = this.actor.container;
    c.setPosition(this.x, this.y);
    c.scaleX = this.facing;
    this.actor.update(dtMs);
  }

  destroy(): void {
    this.actor.destroy();
  }
}
