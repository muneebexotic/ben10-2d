import { SUMO } from '../config/sumo';

export type SumoPhase = 'intro' | 'bout' | 'between' | 'won' | 'lost';

export type SumoEvent =
  | { type: 'round'; round: number }
  | { type: 'push' }
  | { type: 'tell' }
  | { type: 'shove'; dodged: boolean }
  | { type: 'dodge' }
  | { type: 'roundWon'; round: number }
  | { type: 'roundLost'; round: number }
  | { type: 'matchWon' }
  | { type: 'matchLost' };

interface Tuning {
  rounds: number;
  roundMs: number;
  pushPerTap: number;
  kevPushPerSec: readonly number[];
  shove: { tellMs: number; everyMs: readonly number[]; hit: number; dodgeSwing: number; dodgeWindowMs: number };
  maxTapsPerSec: number;
  betweenMs: number;
  introMs: number;
}

/**
 * The SUMO SLAMMERS bout as plain rules: ring position, KEV's push and shoves,
 * the sidestep window, rounds. No Phaser, so it can be tested; the arcade
 * scene draws it.
 */
export class SumoMatch {
  phase: SumoPhase = 'intro';
  round = 0;
  /** -1: Ben's out. +1: KEV's out. */
  pos = 0;
  /** KEV's arms are up: a shove is coming. */
  telling = false;
  /** Ms left in the round. */
  timeLeft: number;
  private t = 0;
  private shoveIn: number;
  private tellLeft = 0;
  /** Ms since the player last sidestepped (Infinity: not this shove). */
  private sinceDodge = Infinity;
  private readonly taps: number[] = [];
  private clock = 0;

  constructor(private readonly s: Tuning = SUMO) {
    this.timeLeft = s.roundMs;
    this.shoveIn = s.shove.everyMs[0];
  }

  get done(): boolean {
    return this.phase === 'won' || this.phase === 'lost';
  }

  /** ATTACK: a slap that pushes KEV back (rate-capped). */
  push(): SumoEvent[] {
    if (this.phase !== 'bout') return [];
    while (this.taps.length > 0 && this.clock - this.taps[0] > 1000) this.taps.shift();
    if (this.taps.length >= this.s.maxTapsPerSec) return [];
    this.taps.push(this.clock);
    this.pos += this.s.pushPerTap;
    return [{ type: 'push' }, ...this.checkRing()];
  }

  /** SPECIAL: a sidestep. Only one counts per shove, and only while his arms are up. */
  dodge(): SumoEvent[] {
    if (this.phase !== 'bout' || !this.telling || this.sinceDodge !== Infinity) return [];
    this.sinceDodge = 0;
    return [{ type: 'dodge' }];
  }

  update(dtMs: number): SumoEvent[] {
    this.clock += dtMs;
    const events: SumoEvent[] = [];
    if (this.phase === 'intro' || this.phase === 'between') {
      this.t += dtMs;
      const wait = this.phase === 'intro' ? this.s.introMs : this.s.betweenMs;
      if (this.t >= wait) {
        this.phase = 'bout';
        this.t = 0;
        events.push({ type: 'round', round: this.round });
      }
      return events;
    }
    if (this.phase !== 'bout') return events;
    const r = Math.min(this.round, this.s.kevPushPerSec.length - 1);
    this.timeLeft -= dtMs;
    this.pos -= this.s.kevPushPerSec[r] * (dtMs / 1000);
    if (this.sinceDodge !== Infinity) this.sinceDodge += dtMs;
    if (this.telling) {
      this.tellLeft -= dtMs;
      if (this.tellLeft <= 0) {
        this.telling = false;
        const dodged = this.sinceDodge <= this.s.shove.dodgeWindowMs;
        this.pos += dodged ? this.s.shove.dodgeSwing : -this.s.shove.hit;
        this.sinceDodge = Infinity;
        this.shoveIn = this.s.shove.everyMs[r];
        events.push({ type: 'shove', dodged });
      }
    } else {
      this.shoveIn -= dtMs;
      if (this.shoveIn <= 0) {
        this.telling = true;
        this.tellLeft = this.s.shove.tellMs;
        events.push({ type: 'tell' });
      }
    }
    events.push(...this.checkRing());
    if (this.phase === 'bout' && this.timeLeft <= 0) events.push(...this.endRound(this.pos > 0));
    return events;
  }

  private checkRing(): SumoEvent[] {
    if (this.pos >= 1) return this.endRound(true);
    if (this.pos <= -1) return this.endRound(false);
    return [];
  }

  private endRound(won: boolean): SumoEvent[] {
    const round = this.round;
    this.telling = false;
    this.sinceDodge = Infinity;
    if (!won) {
      this.phase = 'lost';
      return [{ type: 'roundLost', round }, { type: 'matchLost' }];
    }
    this.round++;
    if (this.round >= this.s.rounds) {
      this.phase = 'won';
      return [{ type: 'roundWon', round }, { type: 'matchWon' }];
    }
    this.phase = 'between';
    this.t = 0;
    this.pos = 0;
    this.timeLeft = this.s.roundMs;
    this.shoveIn = this.s.shove.everyMs[Math.min(this.round, this.s.shove.everyMs.length - 1)];
    return [{ type: 'roundWon', round }];
  }
}
