import type { FormDefinition, FxApi } from '../../aliens/types';
import { EventBus } from '../../systems/EventBus';

/** How long the picture tears when a haunted form arrives (ms). */
const GLITCH_MS = 380;
/** Chance a haunted form whispers as it arrives, and as it leaves. */
const ARRIVE_CHANCE = 0.6;
const LEAVE_CHANCE = 0.5;

/**
 * A form that whispers (Ghostfreak): the picture glitches as he arrives, he
 * whispers now and then in the corner of the screen while he's out, and
 * sometimes as he lets go. Watches Ben's form each frame, so it needs no
 * hooks into the Omnitrix.
 */
export class Haunting {
  private formId = '';
  private nextAt = Infinity;

  constructor(
    private readonly fx: Pick<FxApi, 'glitch'>,
    private readonly rng: () => number = Math.random,
  ) {}

  update(form: FormDefinition, now: number, enabled: boolean): void {
    const prev = this.formId;
    this.formId = form.id;
    const w = form.whispers;
    if (form.id !== prev) {
      if (w && enabled) {
        this.fx.glitch(GLITCH_MS);
        if (this.rng() < ARRIVE_CHANCE) this.say(w.arrive, form.theme.color);
        this.schedule(now, w.everyMs);
      } else {
        this.nextAt = Infinity;
      }
      return;
    }
    if (!w || !enabled || now < this.nextAt) return;
    this.say(w.idle, form.theme.color);
    this.schedule(now, w.everyMs);
  }

  /** The haunted form just let go (reverted): sometimes it has a last word. */
  onLeft(form: FormDefinition): void {
    const w = form.whispers;
    if (w && this.rng() < LEAVE_CHANCE) this.say(w.leave, form.theme.color);
  }

  private schedule(now: number, every: readonly [number, number]): void {
    this.nextAt = now + every[0] + this.rng() * (every[1] - every[0]);
  }

  private say(lines: readonly string[], color: number): void {
    if (lines.length === 0) return;
    EventBus.emit('hud:whisper', { text: lines[Math.floor(this.rng() * lines.length)], color });
  }
}
