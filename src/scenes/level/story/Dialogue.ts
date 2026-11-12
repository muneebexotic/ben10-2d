import { STORY } from '../../../config/story';
import { EventBus } from '../../../systems/EventBus';
import type { Controls } from '../../../systems/InputMap';
import type { SpeechBubble } from '../../../ui/SpeechBubble';
import { CAST, isCastId } from './cast';

export interface Line {
  who: string;
  text: string;
  ms: number;
  /** Ben says it out loud in the world (speech bubble) instead of the dialogue box. */
  bubble?: boolean;
  /** A picture shown under the dialogue box while the line plays (a texture key: Chapter 7's surface camera). */
  still?: string;
  /** The speaker's face, where their portrait has one drawn (Chapter 7's family); else their usual portrait. */
  mood?: Mood;
}

/** The faces a portrait can show (the owner's model-sheet close-ups). */
export type Mood = 'neutral' | 'happy' | 'angry' | 'shocked' | 'hurt' | 'talk';

interface Running {
  lines: readonly Line[];
  index: number;
  left: number;
  skippable: boolean;
  age: number;
  /** How long the current line has been up, and whether a press already finished its typing. */
  lineAge: number;
  filled: boolean;
  onDone?: () => void;
}

/** Presses this soon after a conversation starts never skip it (a held button from gameplay). */
const SKIP_GRACE_MS = 450;

/**
 * Plays conversations: each line goes to the dialogue box with the speaker's
 * portrait (or Ben's speech bubble), one after another. In cinematic ones an
 * action press reads on (finishes the line being typed, or moves to the next
 * line) and Enter, Esc or the SKIP corner on touch skips the whole thing, so a
 * stray press mid-scene costs a line, not the scene. Banter during play just runs.
 */
export class Dialogue {
  private run: Running | null = null;
  /** The picture on screen with the line, if any. */
  private still: string | null = null;

  constructor(private readonly speech: SpeechBubble) {}

  get playing(): boolean {
    return this.run !== null;
  }

  /** Who is speaking the line on screen now, or null. */
  get speaker(): string | null {
    const r = this.run;
    return r && r.index >= 0 ? (r.lines[r.index]?.who ?? null) : null;
  }

  play(lines: readonly Line[], opts: { skippable?: boolean; onDone?: () => void } = {}): void {
    this.stop(false);
    this.run = { lines, index: -1, left: 0, skippable: opts.skippable ?? false, age: 0, lineAge: 0, filled: false, onDone: opts.onDone };
    this.next();
  }

  /** One line of banter, without interrupting what's on screen for long. */
  say(who: string, text: string, ms: number): void {
    this.play([{ who, text, ms }]);
  }

  update(realDtMs: number, controls: Controls): void {
    const r = this.run;
    if (!r) return;
    r.age += realDtMs;
    r.lineAge += realDtMs;
    if (r.skippable && r.age > SKIP_GRACE_MS) {
      if (controls.skip || controls.pause) {
        this.stop(true);
        return;
      }
      if (controls.anyPressed && r.lineAge > STORY.dialog.advanceGraceMs) {
        this.readOn(r);
        return;
      }
    }
    r.left -= realDtMs;
    if (r.left <= 0) this.next();
  }

  /** A press: the line still typing shows in full; one already shown gives way to the next. */
  private readOn(r: Running): void {
    const line = r.lines[r.index];
    const typed = line && !line.bubble && isCastId(line.who) ? (r.lineAge / 1000) * STORY.dialog.charsPerSecond >= line.text.length : true;
    if (!typed && !r.filled) {
      r.filled = true;
      EventBus.emit('hud:dialogFill');
      return;
    }
    this.next();
  }

  /** Ends the conversation now. `finish` still runs its onDone. */
  stop(finish: boolean): void {
    const r = this.run;
    if (!r) return;
    this.run = null;
    this.showStill(null);
    EventBus.emit('hud:dialogClear');
    if (finish) r.onDone?.();
  }

  private next(): void {
    const r = this.run;
    if (!r) return;
    r.index++;
    r.lineAge = 0;
    r.filled = false;
    const line = r.lines[r.index];
    if (!line) {
      this.stop(true);
      return;
    }
    r.left = line.ms;
    this.showStill(line.still ?? null);
    if (line.bubble || !isCastId(line.who)) {
      EventBus.emit('hud:dialogClear');
      this.speech.show(line.text, line.ms);
      return;
    }
    const c = CAST[line.who];
    EventBus.emit('hud:dialog', { speaker: c.name, text: line.text, color: c.color, voicePitch: c.voicePitch, skip: r.skippable, portrait: c.portrait, mood: line.mood });
  }

  /** Lines without a picture say nothing unless one is up (the older chapters' conversations never send this). */
  private showStill(key: string | null): void {
    if (key === this.still) return;
    this.still = key;
    EventBus.emit('hud:still', { key });
  }
}
