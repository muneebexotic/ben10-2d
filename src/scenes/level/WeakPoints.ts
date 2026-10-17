import Phaser from 'phaser';
import { DEPTH } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { GREYMATTER_TEX } from '../../aliens/greymatter/art';
import { blinkOn } from '../../systems/Accessibility';
import type { Combat } from './Combat';

/** How many reticles can show at once (a swap-in scan can mark a crowd). */
const POOL = 8;

/**
 * The reticles on Grey Matter's weak points: green corner brackets that
 * close in and turn slowly over each analysed target, blinking in their last
 * second. A small pool, positioned every frame from Combat's weak points.
 */
export class WeakPoints {
  private readonly pool: Phaser.GameObjects.Image[] = [];
  private used = 0;
  private t = 0;

  constructor(scene: Phaser.Scene, private readonly combat: Combat) {
    for (let i = 0; i < POOL; i++) {
      this.pool.push(scene.add.image(0, 0, GREYMATTER_TEX.reticle).setTint(PALETTE.greymatter).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.fxTop).setVisible(false));
    }
  }

  update(dtMs: number): void {
    this.t += dtMs;
    this.used = 0;
    this.combat.forEachWeak(this.place);
    for (let i = this.used; i < POOL; i++) this.pool[i].setVisible(false);
  }

  private readonly place = (x: number, y: number, leftMs: number): void => {
    if (this.used >= POOL) return;
    const r = this.pool[this.used++];
    const pulse = 1.6 + Math.sin(this.t * 0.012) * 0.15;
    r.setPosition(x, y).setScale(pulse).setAngle((this.t * 0.06) % 90).setVisible(leftMs > 1000 || blinkOn(leftMs, 120));
  };

  destroy(): void {
    for (const r of this.pool) r.destroy();
  }
}
