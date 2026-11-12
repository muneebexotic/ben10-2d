import { describe, expect, it, vi } from 'vitest';
import EventEmitter from 'eventemitter3';

// Phaser needs a browser; the dialogue only uses the event bus (eventemitter3).
vi.mock('phaser', () => ({ default: { Events: { EventEmitter } } }));
vi.mock('../src/scenes/level/story/cast', () => ({
  CAST: { max: { name: 'GRANDPA MAX', color: 1, portrait: 'p', voicePitch: 1 }, gwen: { name: 'GWEN', color: 2, portrait: 'q', voicePitch: 1 } },
  isCastId: (id: string) => id === 'max' || id === 'gwen',
}));

import { EventBus } from '../src/systems/EventBus';
import { STORY } from '../src/config/story';
import { Dialogue, type Line } from '../src/scenes/level/story/Dialogue';
import type { Controls } from '../src/systems/InputMap';

const blank = (): Controls => ({
  left: false, right: false, up: false, down: false,
  jumpPressed: false, jumpHeld: false, attackPressed: false, attackHeld: false,
  specialPressed: false, specialHeld: false, specialReleased: false,
  dialPrev: false, dialNext: false, dialPick: null, transform: false, transformLeadMs: 0,
  pause: false, confirm: false, skip: false, anyPressed: false, spellPressed: false, spellPick: null,
});
const press = (): Controls => ({ ...blank(), jumpPressed: true, anyPressed: true });
const enter = (): Controls => ({ ...blank(), confirm: true, skip: true, anyPressed: true });

const LINES: Line[] = [
  { who: 'max', text: 'A LONG LINE THAT TAKES A WHILE TO TYPE OUT IN FULL, ABOUT A SECOND.', ms: 3000 },
  { who: 'gwen', text: 'SHORT.', ms: 2000 },
  { who: 'max', text: 'LAST.', ms: 2000 },
];

function setup() {
  const speech = { show: vi.fn() };
  const dialogue = new Dialogue(speech as never);
  const shown: string[] = [];
  let fills = 0;
  const ctx = {};
  EventBus.on('hud:dialog', (p) => shown.push(p.text), ctx);
  EventBus.on('hud:dialogFill', () => fills++, ctx);
  const done = vi.fn();
  dialogue.play(LINES, { skippable: true, onDone: done });
  return { dialogue, shown, fills: () => fills, done, cleanup: () => EventBus.offContext(ctx) };
}

describe('cinematic dialogue', () => {
  it('a press right as a conversation starts is ignored (a button held from play)', () => {
    const t = setup();
    t.dialogue.update(100, press());
    expect(t.fills()).toBe(0);
    expect(t.shown).toHaveLength(1);
    t.cleanup();
  });

  it('a press finishes the line being typed, the next one moves on, and the last ends it', () => {
    const t = setup();
    t.dialogue.update(500, blank());
    // Halfway through typing the long line: the press shows it in full and stays on it.
    expect((0.5 * STORY.dialog.charsPerSecond) < LINES[0].text.length).toBe(true);
    t.dialogue.update(16, press());
    expect(t.fills()).toBe(1);
    expect(t.shown).toEqual([LINES[0].text]);
    // Read on: the next line.
    t.dialogue.update(16, press());
    expect(t.shown).toEqual([LINES[0].text, LINES[1].text]);
    // Too soon after the line appeared: a double press doesn't jump a line nobody saw.
    t.dialogue.update(16, press());
    expect(t.shown).toHaveLength(2);
    t.dialogue.update(STORY.dialog.advanceGraceMs, blank());
    t.dialogue.update(16, press());
    expect(t.shown).toEqual(LINES.map((l) => l.text));
    expect(t.done).not.toHaveBeenCalled();
    t.dialogue.update(STORY.dialog.advanceGraceMs + 1, blank());
    t.dialogue.update(16, press());
    expect(t.done).toHaveBeenCalledTimes(1);
    expect(t.dialogue.playing).toBe(false);
    t.cleanup();
  });

  it('Enter (or the touch SKIP corner) skips the whole conversation, and so does pause', () => {
    const t = setup();
    t.dialogue.update(600, enter());
    expect(t.done).toHaveBeenCalledTimes(1);
    expect(t.shown).toHaveLength(1);
    t.cleanup();
    const u = setup();
    u.dialogue.update(600, { ...blank(), pause: true });
    expect(u.done).toHaveBeenCalledTimes(1);
    u.cleanup();
  });

  it('left alone, lines run on their timers as before', () => {
    const t = setup();
    for (let ms = 0; ms < 7100; ms += 50) t.dialogue.update(50, blank());
    expect(t.shown).toEqual(LINES.map((l) => l.text));
    expect(t.done).toHaveBeenCalledTimes(1);
    t.cleanup();
  });

  it('banter that is not skippable ignores presses', () => {
    const speech = { show: vi.fn() };
    const d = new Dialogue(speech as never);
    const done = vi.fn();
    d.play(LINES, { onDone: done });
    d.update(800, enter());
    d.update(800, press());
    expect(done).not.toHaveBeenCalled();
    expect(d.playing).toBe(true);
  });

  it("a line's mood goes to the box with the speaker's portrait (the box shows that face where one is drawn)", () => {
    const got: Array<{ portrait?: string; mood?: string }> = [];
    const ctx = {};
    EventBus.on('hud:dialog', (p) => got.push({ portrait: p.portrait, mood: p.mood }), ctx);
    const d = new Dialogue({ show: vi.fn() } as never);
    d.play([{ who: 'max', text: 'DEEPMAW.', ms: 1000, mood: 'angry' }, { who: 'gwen', text: 'SHORT.', ms: 1000 }]);
    d.update(1050, blank());
    expect(got).toEqual([{ portrait: 'p', mood: 'angry' }, { portrait: 'q', mood: undefined }]);
    EventBus.offContext(ctx);
  });

  it('a line with a picture shows it while it plays, the next line without one takes it away, and lines without pictures say nothing', () => {
    const stills: Array<string | null> = [];
    const ctx = {};
    EventBus.on('hud:still', (p) => stills.push(p.key), ctx);
    const d = new Dialogue({ show: vi.fn() } as never);
    d.play(LINES);
    for (let ms = 0; ms < 7100; ms += 50) d.update(50, blank());
    expect(stills).toEqual([]);
    const withPicture: Line[] = [LINES[0], { ...LINES[1], still: 'feed' }, { ...LINES[2], still: 'feed' }, { who: 'max', text: 'AFTER.', ms: 1000 }];
    d.play(withPicture);
    for (let ms = 0; ms < 8100; ms += 50) d.update(50, blank());
    expect(stills).toEqual(['feed', null]);
    // Skipped while the picture is up: it goes with the box.
    d.play(withPicture.slice(1), { skippable: true });
    d.update(600, enter());
    expect(stills).toEqual(['feed', null, 'feed', null]);
    EventBus.offContext(ctx);
  });
});
