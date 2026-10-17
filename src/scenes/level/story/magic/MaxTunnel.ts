import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../../config/constants';
import { CH6_BEATS } from '../../../../config/chapter6';
import type { MagicPlan } from '../../../../levels/types';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { CH6_TEX } from '../../../preload/karachi/keys';
import { MAGIC_SFX } from '../../../../entities/enemies/magic/sfx';
import type { FamilyActor } from '../../family/FamilyActor';
import type { SetPiece, StoryKit } from '../StoryKit';
import { MAX_LINES } from './lines';

type Phase = 'wait' | 'hold' | 'done';

/**
 * Grandpa Max in the old tunnel. Rocklings ambush Ben from both sides; Max
 * comes running out of the dark with a fire extinguisher and foams them
 * stiff. He handles himself a little too well ("...THE NAVY."), then stays
 * behind to hold them off while the kids go on.
 */
export class MaxTunnel implements SetPiece {
  private phase: Phase = 'wait';
  private sprayIn = 0;
  private readonly floorY: number;
  private readonly clouds: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: MagicPlan['max'],
    private readonly max: FamilyActor,
    resumeX: number,
  ) {
    this.floorY = spec.floor * TILE;
    if (resumeX > (spec.x + 6) * TILE) this.phase = 'done';
  }

  get cinematic(): boolean {
    return false;
  }

  get storyLock(): boolean {
    return false;
  }

  update(dtMs: number, realDtMs: number, _controls: Controls): void {
    if (this.phase === 'done') return;
    const kit = this.kit;
    const p = kit.player;
    if (this.phase === 'wait') {
      if (!p.dead && p.x >= this.spec.x * TILE) this.ambush();
      return;
    }
    this.max.update(realDtMs);
    this.sprayIn -= dtMs;
    if (!this.max.moving && this.sprayIn <= 0) this.spray();
    // The kids are well on their way: Max stays behind with the rocklings.
    if (p.x > (this.spec.x + 40) * TILE) {
      this.max.hide();
      this.phase = 'done';
    }
  }

  private ambush(): void {
    const kit = this.kit;
    const p = kit.player;
    this.phase = 'hold';
    for (const dx of [130, 170, -120]) kit.spawnDrone('rockling', p.x + dx, this.floorY - 6, { roam: true, delayMs: 200 });
    // Max runs in from the dark behind.
    const fromX = kit.scene.cameras.main.worldView.x - 20;
    this.max.place(fromX, this.floorY);
    this.max.runTo(
      p.x - 40,
      220,
      () => {
        this.max.face(1);
        this.spray();
      },
      'walk',
    );
    kit.dialogue.play(MAX_LINES);
    this.sprayIn = CH6_BEATS.max.runMs;
  }

  /** A blast of foam ahead of him: every rockling it catches is frozen stiff for a moment. */
  private spray(): void {
    const kit = this.kit;
    const M = CH6_BEATS.max;
    this.sprayIn = M.sprayEveryMs;
    const target = kit.nearestEnemy(this.max.x, this.floorY - 10, M.sprayRange * 1.6);
    if (!target) return;
    this.max.faceTo(target.x);
    this.max.hold('spray', 600);
    const dir = this.max.facing;
    const cx = this.max.x + dir * (M.sprayRange * 0.5);
    for (let i = 0; i < 5; i++) {
      const img = kit.scene.add.image(this.max.handX, this.max.handY, CH6_TEX.extinguisher).setDepth(DEPTH.fx).setScale(0.4).setAlpha(0.9);
      this.clouds.push(img);
      kit.scene.tweens.add({
        targets: img,
        x: this.max.x + dir * (20 + i * 16),
        y: this.max.handY + (Math.random() - 0.5) * 16,
        scale: 1 + i * 0.15,
        alpha: 0,
        duration: 500 + i * 60,
        onComplete: () => {
          img.destroy();
          const k = this.clouds.indexOf(img);
          if (k >= 0) this.clouds.splice(k, 1);
        },
      });
    }
    kit.combat.blast(cx, this.floorY - 10, M.sprayRange * 0.6, { damage: 0.5, kind: 'burst', x: this.max.x, y: this.floorY - 10, knockback: 60, stunMs: M.sprayStunMs }, false);
    playSfx(MAGIC_SFX.spray, 0.8);
  }

  destroy(): void {
    for (const c of this.clouds) c.destroy();
  }
}
