import { TILE } from '../../../config/constants';
import { WAVES } from '../../../config/enemies';
import type { EntitySpawn } from '../../../levels/types';
import { playSfx } from '../../../systems/audio/Sfx';
import type { SetPiece, StoryKit } from './StoryKit';

type WaveSpawn = Extract<EntitySpawn, { type: 'wave' }>;

/**
 * Ambushes: when Ben passes a trigger, a group of drones flies in from off
 * screen toward their positions (the Hornet swarms over the river). Waves
 * behind a restart checkpoint don't come back.
 */
export class WaveTriggers implements SetPiece {
  readonly cinematic = false;
  readonly storyLock = false;
  private readonly pending: WaveSpawn[];

  constructor(private readonly kit: StoryKit, resumeX: number) {
    this.pending = kit.level.entities.filter((e): e is WaveSpawn => e.type === 'wave' && e.triggerX * TILE >= resumeX);
  }

  update(): void {
    const { player } = this.kit;
    if (player.dead) return;
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const w = this.pending[i];
      if (player.x < w.triggerX * TILE) continue;
      this.pending.splice(i, 1);
      this.launch(w);
    }
  }

  private launch(w: WaveSpawn): void {
    const view = this.kit.scene.cameras.main.worldView;
    w.spawns.forEach((s, i) => {
      const tx = s.x * TILE + TILE / 2;
      const ty = s.y * TILE + TILE / 2;
      const x = w.from === 'right' ? view.right + 30 + i * 20 : w.from === 'left' ? view.x - 30 - i * 20 : tx;
      const y = w.from === 'above' ? view.y - 30 - i * 16 : ty;
      const d = this.kit.spawnDrone(s.kind, x, y, { delayMs: WAVES.firstAttackMs + i * WAVES.staggerMs });
      d.homeX = tx;
      d.homeY = ty;
    });
    playSfx('buzz', 1, 0.8);
  }

  destroy(): void {}
}
