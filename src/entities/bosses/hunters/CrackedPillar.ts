import Phaser from 'phaser';
import { DEPTH } from '../../../config/constants';
import { KRAAB } from '../../../config/hunters';
import { PALETTE } from '../../../config/palette';
import { CH5_TEX } from '../../../scenes/preload/bounty/keys';
import type { Fx } from '../../../systems/Fx';
import { playSfx } from '../../../systems/audio/Sfx';
import { crystalBreak } from '../../../systems/audio/bountySfx';
import { cracksPillar } from '../../hunters/huntRules';
import type { Damageable, Hit, HitResult, Rect } from '../../types';

/**
 * The cracked crystal pillar holding up the chamber's roof in THE HUNTERS.
 * A few heavy hits and it gives: the ceiling comes down around it (on Kraab,
 * if he's near enough). The fight's shortcut, for players who lure him over.
 */
export class CrackedPillar implements Damageable {
  readonly countsAsEnemy = false;
  alive = true;
  lastDamage = 0;
  private cracks = 0;
  private readonly image: Phaser.GameObjects.Image;

  constructor(
    scene: Phaser.Scene,
    readonly x: number,
    private readonly floorY: number,
    private readonly fx: Fx,
    private readonly onFall: () => void,
  ) {
    this.image = scene.add.image(x, floorY, CH5_TEX.crystalSpire).setOrigin(0.5, 1).setDepth(DEPTH.props).setScale(1, 1.2);
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive) return false;
    out.x = this.x - 12;
    out.y = this.floorY - 100;
    out.w = 24;
    out.h = 100;
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    if (!cracksPillar(hit)) {
      this.fx.burst('crystal', hit.x, hit.y, 3);
      return 'blocked';
    }
    this.cracks++;
    this.fx.burst('crystal', this.x, hit.y, 14);
    this.fx.shake(0.006, 160);
    this.fx.popText(this.x, this.floorY - 110, this.cracks >= KRAAB.boss.pillarHits ? 'TIMBER!' : 'CRACK!', PALETTE.diamondhead);
    playSfx(crystalBreak, 0.8, 1.2 - this.cracks * 0.1);
    this.image.setTint(this.cracks === 1 ? 0xd0e8ff : 0xa0b8e0);
    this.image.setAngle(this.cracks * 2);
    if (this.cracks < KRAAB.boss.pillarHits) return 'hit';
    this.alive = false;
    this.image.setVisible(false);
    this.fx.burst('crystal', this.x, this.floorY - 50, 40);
    this.onFall();
    return 'killed';
  }

  destroy(): void {
    this.image.destroy();
  }
}
