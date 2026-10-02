import Phaser from 'phaser';
import { CHASE } from '../../../../config/chapter2';
import { PALETTE } from '../../../../config/palette';
import { Hauler } from '../../../../entities/vehicles/Hauler';
import { EventBus } from '../../../../systems/EventBus';
import { activeDifficultyId } from '../../../../systems/Difficulty';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { StoryKit } from '../StoryKit';
import type { ChaseRig } from './ChaseRig';

const H = CHASE.hauler;

function between(range: readonly [number, number]): number {
  return range[0] + Math.random() * (range[1] - range[0]);
}

/**
 * The runaway rig: it overtakes, cuts in ahead and dumps fuel barrels (and
 * Hornets) out of its trailer hatch onto the roof. Four Arms can catch a
 * barrel and throw it back: two BULLSEYES and the driver loses it early.
 * Otherwise it loses control on its own once it runs out of barrels.
 */
export class HaulerStage {
  readonly hauler: Hauler;
  private t = 0;
  private barrels = 0;
  private nextBarrel: number = H.firstBarrelMs;
  private releases = 0;
  private lastBarrelAt = -1;
  private crashed = false;
  private readonly hornets: number;

  constructor(
    private readonly kit: StoryKit,
    private readonly rig: ChaseRig,
  ) {
    this.hauler = new Hauler(kit.scene, rig);
    this.hauler.onBullseye = (n) => this.onBullseye(n);
    kit.combat.addTarget(this.hauler);
    this.hornets = H.hornets[activeDifficultyId()];
    kit.dialogue.say('max', "THAT'S THE RIG THEY'RE ALL GUARDING! WHAT'S IN THERE?", 2400);
  }

  /** The rig is off the road and the dust has settled. */
  get done(): boolean {
    return this.crashed && this.hauler.gone;
  }

  update(dtMs: number): void {
    this.hauler.update(dtMs);
    if (this.crashed || !this.hauler.cruising) return;
    this.t += dtMs;
    if (this.releases === 0 && this.t > 600) this.releaseHornets();
    if (this.releases === 1 && this.barrels >= 2) this.releaseHornets();
    // The hatch glows open just before something comes out.
    this.hauler.hatchOpen = this.t > this.nextBarrel - 500 || (this.releases > 0 && this.t < 1400);
    if (this.barrels < H.barrels && this.t >= this.nextBarrel) this.tossBarrel();
    if (this.barrels >= H.barrels && this.t - this.lastBarrelAt > H.finaleAfterMs) this.finish(false);
  }

  private releaseHornets(): void {
    this.releases++;
    const hatch = this.hauler.hatch;
    playSfx('buzz', 1, 1.1);
    for (let i = 0; i < this.hornets; i++) {
      const d = this.kit.spawnDrone('hornet', hatch.x + i * 8, hatch.y - 6, { delayMs: 900 + i * 400 });
      const rv = this.rig.rv;
      d.homeX = rv.x - 40 + i * 50;
      d.homeY = rv.roofY - 90 - i * 20;
      d.ky = -160;
      this.rig.drones.push(d);
    }
    if (this.releases === 1) this.kit.scene.time.delayedCall(700, () => this.kit.dialogue.say('gwen', 'HORNETS. OF COURSE IT HAS HORNETS.', 1800));
  }

  private tossBarrel(): void {
    const rv = this.rig.rv;
    this.barrels++;
    this.nextBarrel = this.t + between(H.barrelEveryMs);
    this.lastBarrelAt = this.t;
    const landX = Phaser.Math.Clamp(this.kit.player.x + (Math.random() - 0.5) * 60, rv.roofLeft + 18, rv.roofRight - 18);
    this.rig.spawnJunk('barrel', this.hauler.hatch, landX);
    if (this.barrels === 1) {
      const fourArms = this.kit.hasAlien('fourarms');
      this.kit.tutorial.tip('barrel', fourArms ? 'FOUR ARMS CAN CATCH A BARREL: {J} TO GRAB, {J} TO THROW IT BACK!' : 'BARRELS! JUMP THEM OR KNOCK THEM AWAY!', 4500, 8);
    }
  }

  private onBullseye(n: number): void {
    const { kit } = this;
    kit.time.slowMo(0.3, 500, 260);
    kit.fx.hitStop(80);
    kit.tutorial.complete('barrel');
    if (n >= H.bullseyesToWin) {
      EventBus.emit('hud:banner', { title: 'BULLSEYE!', subtitle: 'RIG DOWN', color: PALETTE.gold, durationMs: 1600, style: 'slam' });
      this.finish(true);
    } else {
      kit.speech.show('BULLSEYE! ONE MORE!', 1400);
    }
  }

  private finish(early: boolean): void {
    if (this.crashed) return;
    this.crashed = true;
    this.hauler.crash();
    this.kit.combat.removeTarget(this.hauler);
    this.kit.dialogue.say('max', early ? 'NICE ARM, BEN! HE LOST IT!' : "HE'S LOSING IT! HE'S GONNA CRASH!", 2000);
  }

  destroy(): void {
    this.kit.combat.removeTarget(this.hauler);
    this.hauler.destroy();
  }
}
