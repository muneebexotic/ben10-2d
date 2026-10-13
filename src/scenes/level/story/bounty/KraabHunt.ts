import { TILE } from '../../../../config/constants';
import { KraabFighter } from '../../../../entities/hunters/KraabFighter';
import type { BountyPlan } from '../../../../levels/types';
import type { SetPiece, StoryKit } from '../StoryKit';
import { kitWorld } from './kitWorld';
import { KRAAB_GONE, KRAAB_INTRO } from './lines';

/** How far ahead of Ben (px) the crack starts racing back at him. */
const CRACK_LEAD = 150;

/**
 * Kraab hunts the rail tunnels. At each ambush spot a crack line races along
 * the floor at Ben from up ahead, stops under him and pulses, and Kraab
 * erupts claw-first; he brawls for a moment (the claw cannon, the snap),
 * then burrows away to the next spot. Hurt him enough and he bails early.
 * The music turns to the mine's as Ben goes underground.
 */
export class KraabHunt implements SetPiece {
  readonly cinematic = false;
  readonly storyLock = false;
  private readonly kraab: KraabFighter;
  private readonly queue: BountyPlan['kraabHunt']['ambushes'][number][];
  private underground = false;
  private introduced = false;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: BountyPlan['kraabHunt'],
    resumeX: number,
  ) {
    this.kraab = new KraabFighter(kit.scene, kitWorld(kit));
    kit.addTarget(this.kraab, this.kraab);
    this.queue = spec.ambushes.filter((a) => a.x * TILE > resumeX - TILE).sort((a, b) => a.x - b.x);
    this.underground = resumeX >= spec.fromX * TILE;
  }

  update(dtMs: number): void {
    const kit = this.kit;
    const p = kit.player;
    if (!this.underground && p.x >= this.spec.fromX * TILE) {
      this.underground = true;
      kit.playMusic('mine');
    }
    const next = this.queue[0];
    if (next && !this.kraab.busy && !p.dead && p.x >= (next.x - 3) * TILE && Math.abs(p.y - next.floor * TILE) < TILE * 3) {
      this.queue.shift();
      const left = Math.max(this.spec.fromX, next.x - 16) * TILE;
      const right = Math.min(this.spec.toX, next.x + 16) * TILE;
      const fromX = Math.min(right - 20, p.x + CRACK_LEAD);
      this.kraab.ambush(fromX, next.floor * TILE, left, right);
      const last = this.queue.length === 0;
      this.kraab.onDone = () => {
        if (last) kit.dialogue.say('kraab', KRAAB_GONE, 2200);
      };
      if (!this.introduced) {
        this.introduced = true;
        kit.scene.time.delayedCall(1800, () => kit.dialogue.say('kraab', KRAAB_INTRO, 2800));
      }
    }
    this.kraab.update(dtMs);
  }

  destroy(): void {
    this.kraab.destroy();
  }
}
