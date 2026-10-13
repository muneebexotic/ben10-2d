/** The sequencer's notation: tracks are written with these (Music.ts plays them). */

export type Note = number | null;

export interface Track {
  bpm: number;
  bars: number;
  bass: Note[];
  arp: Note[];
  lead: Note[];
  drums: string;
  pad?: number[][];
  stabs?: Note[];
  loop: boolean;
}

const NOTE_INDEX: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11, Bb: 10, Eb: 3 };

export function n(name: string): number {
  const m = /^([A-G][#b]?)(\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  return NOTE_INDEX[m[1]] + (Number(m[2]) + 1) * 12;
}

/** Expands "E5 - E5 -" style strings; each token lasts `stepsPer` 16th steps. */
export function seq(text: string, stepsPer: number): Note[] {
  const out: Note[] = [];
  for (const token of text.trim().split(/\s+/)) {
    out.push(token === '-' || token === '.' ? null : n(token));
    for (let i = 1; i < stepsPer; i++) out.push(null);
  }
  return out;
}

export function bassBar(root: number, pattern: Array<[number, number]>): Note[] {
  const bar: Note[] = new Array(16).fill(null);
  for (const [step, interval] of pattern) bar[step] = root + interval;
  return bar;
}

export function arpBar(chord: number[], shape: Array<number | null>): Note[] {
  return shape.map((i) => (i === null ? null : chord[i % chord.length] + 12 * Math.floor(i / chord.length)));
}

