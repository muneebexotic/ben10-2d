import { CONVOY } from '../../../../config/chapter2';
import { ConvoyTruck, type TruckHooks } from '../../../../entities/vehicles/ConvoyTruck';
import { activeDifficultyId } from '../../../../systems/Difficulty';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { StoryKit } from '../StoryKit';
import type { UnlockBeat } from '../UnlockBeat';
import type { ChaseRig } from './ChaseRig';

const CONVOY_LINES = [
  { at: 0, who: 'gwen', text: 'UH, GRANDPA? HEADLIGHTS. LOTS OF THEM.', ms: 2000 },
  { at: 2100, who: 'max', text: "VILGAX'S CONVOY! THEY'RE TRYING TO RUN US OFF THE ROAD!", ms: 2400 },
] as const;

/**
 * Vilgax's armoured convoy catches up. The lead rig revs, rams and hooks on
 * to the back of the Rustbucket; the one in the far lane shells the roof.
 * The first hook is where the watch finds Four Arms (if it hasn't already):
 * rip the truck off and throw it off the road.
 */
export class ConvoyStage {
  private t = 0;
  private line = 0;
  private readonly trucks: ConvoyTruck[] = [];
  private spawned = 0;
  private nextAt: number = CONVOY.firstMs;
  private readonly total: number;
  private readonly together: number;
  private lead: ConvoyTruck | null = null;
  private introTruck: ConvoyTruck | null = null;
  private thrownOnce = false;
  private readonly hooks: TruckHooks;

  constructor(
    private readonly kit: StoryKit,
    private readonly rig: ChaseRig,
    private readonly beat: UnlockBeat | null,
  ) {
    const diff = activeDifficultyId();
    this.total = CONVOY.trucks[diff];
    this.together = CONVOY.together[diff];
    this.hooks = {
      onRam: () => rig.jolt(CONVOY.ramZone, CONVOY.ramDamage, CONVOY.joltKick),
      onYank: () => rig.jolt(CONVOY.ramZone, CONVOY.ramDamage, CONVOY.joltKick),
      onClamp: (truck) => this.onClamp(truck),
      onLifted: () => this.onLifted(),
      onDestroyed: (truck, how) => this.onDestroyed(truck, how),
    };
  }

  get done(): boolean {
    return this.spawned >= this.total && this.trucks.every((t) => t.state === 'gone');
  }

  update(dtMs: number): void {
    this.t += dtMs;
    const next = CONVOY_LINES[this.line];
    if (next && this.t >= next.at) {
      this.line++;
      this.kit.dialogue.say(next.who, next.text, next.ms);
    }
    const active = this.trucks.filter((t) => t.state !== 'gone' && t.state !== 'wreck').length;
    if (this.spawned < this.total && active < this.together && this.t >= this.nextAt) this.spawn();
    this.assignSlots();
    for (const truck of this.trucks) truck.update(dtMs);
  }

  private spawn(): void {
    const view = this.kit.scene.cameras.main.worldView;
    const truck = new ConvoyTruck(this.kit.scene, this.rig, this.hooks, view.x - 20 - this.spawned * 30);
    // The first truck waits for the watch to find Four Arms (when the file doesn't have him yet).
    if (this.spawned === 0 && !this.kit.hasAlien('fourarms') && this.beat && !this.beat.done) {
      truck.holdClamp = true;
      this.introTruck = truck;
      this.nextAt = Infinity;
    } else {
      this.nextAt = this.t + CONVOY.nextMs * 2;
    }
    this.spawned++;
    this.trucks.push(truck);
    this.kit.combat.addTarget(truck);
    this.kit.combat.addLiftable(truck);
    playSfx('ramCharge', 0.5, 0.6);
  }

  /** One truck right behind the RV (it rams); the rest in the far lane alongside (they shoot). */
  private assignSlots(): void {
    const rv = this.rig.rv;
    const driving = this.trucks.filter((t) => t.driving);
    if (!this.lead || !this.lead.driving) {
      this.lead = driving.reduce<ConvoyTruck | null>((best, t) => (!best || t.nose > best.nose ? t : best), null);
    }
    let k = 0;
    for (const t of driving) {
      t.lead = t === this.lead;
      t.lane = t.lead ? 0 : 1;
      t.slotX = t.lead ? rv.rearX - CONVOY.tailGap : rv.rearX - 20 - k++ * 80;
    }
  }

  private onClamp(truck: ConvoyTruck): void {
    const { kit } = this;
    if (truck === this.introTruck && this.beat && !this.beat.done) {
      this.beat.start(() => {
        kit.tutorial.tip('convoyLift', 'FOUR ARMS! {J} AT THE CLAMP: RIP THAT TRUCK OFF!', 6000, 9);
        // The rest of the convoy shows up once he's had a moment to try it.
        this.nextAt = Math.min(this.nextAt, this.t + 5000);
      });
      return;
    }
    const p = kit.player;
    if (p.form.id === 'fourarms') kit.tutorial.tip('convoyLift2', '{J} AT THE CLAMP: RIP IT OFF!', 3000, 7);
    else if (kit.hasAlien('fourarms')) kit.tutorial.tip('convoySwap', 'IT HOOKED ON! FOUR ARMS COULD RIP IT OFF...', 3000, 6);
    else kit.tutorial.tip('convoyPunch', 'IT HOOKED ON! HIT THE CLAMP!', 2500, 6);
  }

  private onLifted(): void {
    const { kit } = this;
    kit.time.slowMo(0.35, 420, 260);
    kit.speech.show('HEAVE...', 900);
    kit.tutorial.complete('convoyLift');
    kit.tutorial.tip('convoyThrow', '{J} THROW IT OFF THE ROAD!', 4000, 9);
  }

  private onDestroyed(truck: ConvoyTruck, how: 'thrown' | 'wrecked'): void {
    const { kit } = this;
    kit.combat.removeTarget(truck);
    kit.combat.removeLiftable(truck);
    kit.onEnemyKilled();
    kit.tutorial.complete('convoyThrow');
    if (truck === this.introTruck) this.introTruck = null;
    this.nextAt = Math.min(this.nextAt, this.t + CONVOY.nextMs);
    if (how === 'thrown' && !this.thrownOnce) {
      this.thrownOnce = true;
      kit.time.slowMo(0.3, 600, 300);
      kit.speech.show('...HO!', 900);
      kit.scene.time.delayedCall(900, () => kit.dialogue.say('max', "THAT'S MY GRANDSON!", 1600));
    }
  }

  destroy(): void {
    for (const t of this.trucks) {
      this.kit.combat.removeTarget(t);
      this.kit.combat.removeLiftable(t);
      t.destroy();
    }
    this.trucks.length = 0;
  }
}
