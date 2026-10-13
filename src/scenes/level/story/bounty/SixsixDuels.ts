import { TILE } from '../../../../config/constants';
import { SixsixFighter } from '../../../../entities/hunters/SixsixFighter';
import type { BountyPlan } from '../../../../levels/types';
import type { SetPiece, StoryKit } from '../StoryKit';
import { kitWorld } from './kitWorld';
import { DUEL_TAUNTS } from './lines';

/**
 * Sixsix's hunt on Main Street: between the tracker drones' salvos, he drops
 * out of the sky for a short blade duel at each spot, then blasts off again
 * (time up, or he's taken enough). Duels behind a restart are skipped.
 */
export class SixsixDuels implements SetPiece {
  readonly cinematic = false;
  readonly storyLock = false;
  private readonly fighter: SixsixFighter;
  private readonly queue: BountyPlan['duels'][number][];

  constructor(
    private readonly kit: StoryKit,
    duels: BountyPlan['duels'],
    resumeX: number,
  ) {
    this.fighter = new SixsixFighter(kit.scene, kitWorld(kit));
    kit.addTarget(this.fighter, this.fighter);
    this.queue = duels.filter((d) => d.x * TILE > resumeX).sort((a, b) => a.triggerX - b.triggerX);
  }

  update(dtMs: number): void {
    const p = this.kit.player;
    const next = this.queue[0];
    if (next && !this.fighter.busy && !p.dead && p.x >= next.triggerX * TILE && p.y > (next.floor - 6) * TILE) {
      this.queue.shift();
      this.fighter.startDuel(next.x * TILE, next.floor * TILE);
      this.fighter.onDone = () => this.kit.dialogue.say('sixsix', DUEL_TAUNTS[Math.floor(Math.random() * DUEL_TAUNTS.length)], 1800);
    }
    this.fighter.update(dtMs);
  }

  destroy(): void {
    this.fighter.destroy();
  }
}
