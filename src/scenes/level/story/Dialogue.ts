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
}

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

  constructor(private readonly speech: SpeechBubble) {}

  get playing(): boolean {
    return this.run !== null;
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
    if (line.bubble || !isCastId(line.who)) {
      EventBus.emit('hud:dialogClear');
      this.speech.show(line.text, line.ms);
      return;
    }
    const c = CAST[line.who];
    EventBus.emit('hud:dialog', { speaker: c.name, text: line.text, color: c.color, voicePitch: c.voicePitch, skip: r.skippable, portrait: c.portrait });
  }
}
