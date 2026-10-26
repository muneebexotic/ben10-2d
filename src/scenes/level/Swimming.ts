import { BREATH } from '../../config/swim';
import type { DamageOutcome, Player } from '../../entities/Player';
import { EventBus } from '../../systems/EventBus';
import { playSfx } from '../../systems/audio/Sfx';
import type { BreathTick } from '../../systems/events';
import type { SwimWater } from '../../systems/swim/SwimMotor';
import type { LevelWorld } from './LevelWorld';
import type { Tutorial } from './Tutorial';

/** Water a chapter brings beyond its level data (Act 3's tanks): swimmable for every form, with air pockets. */
export interface WaterProvider {
  waterAt(x: number, y: number): SwimWater | null;
  airAt(x: number, y: number): boolean;
}

/**
 * Hooks the Player's swimming up to the level: the water it can swim in
 * (a chapter's tanks for everyone, the older chapters' water and mutagen for
 * a form that swims anywhere), air pockets, breath news, and the HUD's
 * breath ring.
 */
export class Swimming {
  private provider: WaterProvider | null = null;
  private shown = false;
  private readonly tick: BreathTick = { ratio: 1, under: false };

  constructor(
    private readonly player: Player,
    private readonly world: LevelWorld,
    private readonly tutorial: Tutorial,
    private readonly hurt: (outcome: DamageOutcome) => void,
    easy: boolean,
  ) {
    player.waterAt = (x, y, anyWater) => this.provider?.waterAt(x, y) ?? (anyWater ? world.swimWaterAt(x, y) : null);
    player.airAt = (x, y) => this.provider?.airAt(x, y) ?? false;
    player.onBreath = (ev) => this.onBreath(ev);
    player.breathScale = easy ? BREATH.easyScale : 1;
  }

  setProvider(provider: WaterProvider | null): void {
    this.provider = provider;
  }

  /** The older chapters' water is a pit, unless the form swims there (Ripjaws). */
  swimsAt(x: number, feetY: number): boolean {
    if (this.player.submerged) return true;
    if (this.player.swimStats.anyWater !== true) return false;
    const liquid = this.world.liquidAt(x, feetY);
    return liquid === 'water' || liquid === 'mutagen';
  }

  private onBreath(ev: 'low' | 'empty' | 'choke'): void {
    if (ev === 'low') {
      playSfx('breathLow', 0.9);
      this.tutorial.tip('breath-low', 'AIR RUNNING OUT! SWIM UP {JUMP}!', 2600, 8);
    } else if (ev === 'empty') {
      playSfx('breathLow', 1);
      this.tutorial.tip('breath-out', 'NO AIR! GET TO THE SURFACE OR A BUBBLE!', 2600, 9);
    } else {
      this.hurt(this.player.choke());
    }
  }

  /** Each frame: the breath ring on the HUD while there's something to show. */
  update(): void {
    const p = this.player;
    const b = p.breath;
    const show = !p.dead && b.needsAir && (p.underwater || b.ratio < 1);
    if (show) {
      this.tick.ratio = b.ratio;
      this.tick.under = p.underwater;
      EventBus.emit('swim:breath', this.tick);
      this.shown = true;
    } else if (this.shown) {
      this.shown = false;
      EventBus.emit('swim:breath', null);
    }
  }
}
