import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The music scheduler runs on a 25 ms timer. Timers stall (a long frame, and
 * background tabs throttle them to about once a second): the notes it missed
 * must be skipped, not played all at once when it wakes up.
 */
const clock = { currentTime: 0 };
const late: number[] = [];
let notes = 0;

vi.mock('../src/systems/audio/AudioEngine', () => {
  const gain = () => ({ gain: { value: 1, setTargetAtTime: () => undefined, cancelScheduledValues: () => undefined }, connect: () => undefined, disconnect: () => undefined });
  const record = (o: { when?: number }) => {
    notes++;
    if (o.when !== undefined && o.when < clock.currentTime - 0.001) late.push(clock.currentTime - o.when);
  };
  return {
    midiToFreq: (n: number) => 440 * 2 ** ((n - 69) / 12),
    audio: {
      ctx: { get currentTime() { return clock.currentTime; }, createGain: gain },
      ready: true,
      musicBus: {},
      unlock: () => undefined,
      tone: record,
      noise: record,
    },
  };
});

describe('music after a stall', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clock.currentTime = 0;
    late.length = 0;
    notes = 0;
  });
  afterEach(() => vi.useRealTimers());

  it('skips the steps it missed instead of playing them all at once', async () => {
    const { music } = await import('../src/systems/audio/Music');
    music.play('forest', true);
    // Play along normally for a second.
    for (let i = 0; i < 40; i++) {
      clock.currentTime += 0.025;
      vi.advanceTimersByTime(25);
    }
    expect(notes).toBeGreaterThan(0);
    expect(late).toEqual([]);
    // The page freezes for 1.5 s, then the timer fires once.
    clock.currentTime += 1.5;
    vi.advanceTimersByTime(25);
    expect(late).toEqual([]);
    // And it carries on in time.
    for (let i = 0; i < 40; i++) {
      clock.currentTime += 0.025;
      vi.advanceTimersByTime(25);
    }
    expect(late).toEqual([]);
    music.stop(0);
  });
});
