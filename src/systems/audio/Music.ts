import { AUDIO } from '../../config/audio';
import { audio, midiToFreq } from './AudioEngine';

/**
 * Procedural chiptune sequencer. Original compositions (not the show's theme).
 * Two layers: "base" (bass + drums) always plays; "hero" (arp + lead) swells in
 * while Ben is an alien, so the music itself reacts to transforming. Each alien
 * re-voices the hero layer its own way (see MusicLayerSpec).
 */

type Note = number | null;

/** One synth voice of a hero layer. */
export interface MusicVoice {
  wave: OscillatorType;
  volume: number;
  /** Octaves above (or below, negative) the written note. */
  octave: number;
  /** Note length in 16th steps. */
  length: number;
  /** Low-pass cutoff in Hz, or 0 for none. */
  filter: number;
  detune?: number;
}

/**
 * How an alien plays the hero layer over the track's chords and melody. Pure
 * data, so an alien's music lives in its own file.
 */
export interface MusicLayerSpec {
  /** The track's arpeggio. `thin` plays only every other step. */
  arp: (MusicVoice & { thin?: boolean }) | null;
  /** The track's melody, optionally doubled by a second voice. */
  lead: (MusicVoice & { double?: MusicVoice }) | null;
  /** Power chords (root, fifth, octave) on the bar's bass root at these steps (0-15). */
  stabs?: { steps: readonly number[]; voice: MusicVoice };
  /** Hi-hat volume on every 16th step (driving). */
  hats16?: number;
  /** Floor toms at these steps (0-15). */
  toms?: { steps: readonly number[]; volume: number };
}

/** The original hero layer: square arpeggio plus a lead doubled an octave up. Human Ben hears it quietly. */
export const HERO_LAYER: MusicLayerSpec = {
  arp: { wave: 'square', volume: 0.035, octave: 0, length: 0.9, filter: 3200 },
  lead: {
    wave: 'square',
    volume: 0.05,
    octave: 0,
    length: 1.9,
    filter: 4000,
    double: { wave: 'triangle', volume: 0.03, octave: 1, length: 1.6, filter: 0, detune: 6 },
  },
};

interface Track {
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

function n(name: string): number {
  const m = /^([A-G][#b]?)(\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  return NOTE_INDEX[m[1]] + (Number(m[2]) + 1) * 12;
}

/** Expands "E5 - E5 -" style strings; each token lasts `stepsPer` 16th steps. */
function seq(text: string, stepsPer: number): Note[] {
  const out: Note[] = [];
  for (const token of text.trim().split(/\s+/)) {
    out.push(token === '-' || token === '.' ? null : n(token));
    for (let i = 1; i < stepsPer; i++) out.push(null);
  }
  return out;
}

function bassBar(root: number, pattern: Array<[number, number]>): Note[] {
  const bar: Note[] = new Array(16).fill(null);
  for (const [step, interval] of pattern) bar[step] = root + interval;
  return bar;
}

function arpBar(chord: number[], shape: Array<number | null>): Note[] {
  return shape.map((i) => (i === null ? null : chord[i % chord.length] + 12 * Math.floor(i / chord.length)));
}

const FOREST_BASS: Array<[number, number]> = [
  [0, 0],
  [3, 0],
  [6, 12],
  [8, 0],
  [10, 0],
  [11, 7],
  [12, 12],
  [14, 7],
];
const ARP_SHAPE = [0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 4, 3, 2, 1];

const FOREST: Track = {
  bpm: 128,
  bars: 4,
  loop: true,
  bass: [
    ...bassBar(n('A2'), FOREST_BASS),
    ...bassBar(n('F2'), FOREST_BASS),
    ...bassBar(n('C3'), FOREST_BASS),
    ...bassBar(n('G2'), FOREST_BASS),
  ],
  arp: [
    ...arpBar([n('A4'), n('C5'), n('E5')], ARP_SHAPE),
    ...arpBar([n('F4'), n('A4'), n('C5')], ARP_SHAPE),
    ...arpBar([n('C5'), n('E5'), n('G5')], ARP_SHAPE),
    ...arpBar([n('G4'), n('B4'), n('D5')], ARP_SHAPE),
  ],
  lead: seq('E5 - E5 - A5 - G5 E5 F5 - E5 - C5 - D5 - E5 - G5 - C6 - B5 G5 A5 - - - G5 - B5 -', 2),
  drums: 'k-h-s-h-k-khs-hh'.repeat(4),
};

const BOSS_BASS: Array<[number, number]> = [
  [0, 0],
  [2, 0],
  [4, 12],
  [6, 0],
  [8, 0],
  [10, 12],
  [12, 0],
  [14, 10],
];

const BOSS: Track = {
  bpm: 150,
  bars: 4,
  loop: true,
  bass: [
    ...bassBar(n('D2'), BOSS_BASS),
    ...bassBar(n('A#1'), BOSS_BASS),
    ...bassBar(n('C2'), BOSS_BASS),
    ...bassBar(n('A1'), BOSS_BASS),
  ],
  arp: [
    ...arpBar([n('D5'), n('F5'), n('A5')], ARP_SHAPE),
    ...arpBar([n('A#4'), n('D5'), n('F5')], ARP_SHAPE),
    ...arpBar([n('C5'), n('E5'), n('G5')], ARP_SHAPE),
    ...arpBar([n('A4'), n('C#5'), n('E5')], ARP_SHAPE),
  ],
  lead: seq('D5 - F5 - A5 - G5 F5 E5 - F5 - D5 - C5 - C5 - E5 - G5 - A5 G5 E5 - C#5 - E5 - A5 -', 2),
  stabs: [
    ...seq('D4 - - D4 - - D4 - - - D4 - - - - -', 1),
    ...seq('A#3 - - A#3 - - A#3 - - - A#3 - - - - -', 1),
    ...seq('C4 - - C4 - - C4 - - - C4 - - - - -', 1),
    ...seq('A3 - - A3 - - A3 - - - A3 - A3 - A3 -', 1),
  ],
  drums: 'k-hhs-hhk-hhs-hk'.repeat(3) + 'k-hhs-hhk-sss-ss',
};

const TITLE_SHAPE = [0, null, 2, null, 1, null, 3, null, 2, null, 1, null, 3, null, 4, null];

const TITLE: Track = {
  bpm: 84,
  bars: 4,
  loop: true,
  bass: [
    ...bassBar(n('A2'), [[0, 0], [8, 7]]),
    ...bassBar(n('F2'), [[0, 0], [8, 7]]),
    ...bassBar(n('C3'), [[0, 0], [8, 7]]),
    ...bassBar(n('E2'), [[0, 0], [8, 7]]),
  ],
  arp: [
    ...arpBar([n('A4'), n('C5'), n('E5')], TITLE_SHAPE),
    ...arpBar([n('F4'), n('A4'), n('C5')], TITLE_SHAPE),
    ...arpBar([n('C5'), n('E5'), n('G5')], TITLE_SHAPE),
    ...arpBar([n('E4'), n('G#4'), n('B4')], TITLE_SHAPE),
  ],
  lead: [],
  drums: '----------------'.repeat(4),
  pad: [
    [n('A3'), n('C4'), n('E4')],
    [n('F3'), n('A3'), n('C4')],
    [n('C4'), n('E4'), n('G4')],
    [n('E3'), n('G#3'), n('B3')],
  ],
};

const VICTORY: Track = {
  bpm: 140,
  bars: 2,
  loop: false,
  bass: [...seq('C3 - - - G2 - - - C3 - - - - - - -', 1), ...seq('F2 - - - G2 - - - C3 - - - - - - -', 1)],
  arp: [],
  lead: [...seq('C5 E5 G5 C6 - - G5 C6 E6 - - - - - - -', 1), ...seq('F5 A5 C6 D6 - - B5 D6 C6 - - - - - - -', 1)],
  drums: 'k---s---k-k-s---k---s---k-k-s-ss',
};

const SIM_BASS: Array<[number, number]> = [
  [0, 0],
  [2, 0],
  [4, 12],
  [6, 0],
  [8, 0],
  [10, 12],
  [12, 0],
  [14, 7],
];

/** Omnitrix Training: a cool, steady loop for trying aliens out. */
const SIMULATION: Track = {
  bpm: 124,
  bars: 4,
  loop: true,
  bass: [
    ...bassBar(n('E2'), SIM_BASS),
    ...bassBar(n('C2'), SIM_BASS),
    ...bassBar(n('G2'), SIM_BASS),
    ...bassBar(n('D2'), SIM_BASS),
  ],
  arp: [
    ...arpBar([n('E4'), n('G4'), n('B4')], ARP_SHAPE),
    ...arpBar([n('E4'), n('G4'), n('C5')], ARP_SHAPE),
    ...arpBar([n('D4'), n('G4'), n('B4')], ARP_SHAPE),
    ...arpBar([n('D4'), n('F#4'), n('A4')], ARP_SHAPE),
  ],
  lead: seq('B4 - E5 - G5 - F#5 E5 D5 - E5 - B4 - - - G5 - A5 - B5 - D6 - B5 A5 G5 - F#5 - D5 -', 2),
  drums: 'k-h-s-hhk-khs-hh'.repeat(4),
};

export const TRACKS = { forest: FOREST, boss: BOSS, title: TITLE, victory: VICTORY, simulation: SIMULATION } as const;
export type TrackName = keyof typeof TRACKS;

class MusicPlayer {
  private current: TrackName | null = null;
  private track: Track | null = null;
  private step = 0;
  private nextTime = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private baseBus: GainNode | null = null;
  private heroBus: GainNode | null = null;
  private intensity = 0;
  private layer: MusicLayerSpec = HERO_LAYER;

  get playing(): TrackName | null {
    return this.current;
  }

  play(name: TrackName, restart = false): void {
    audio.unlock();
    const ctx = audio.ctx;
    if (!ctx) {
      this.current = name;
      return;
    }
    if (this.current === name && this.timer && !restart) return;
    this.stop(120);
    this.current = name;
    this.track = TRACKS[name];
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.15;
    this.baseBus = ctx.createGain();
    this.heroBus = ctx.createGain();
    this.baseBus.gain.value = 1;
    this.heroBus.gain.value = name === 'forest' || name === 'boss' || name === 'simulation' ? 0.35 + this.intensity * 0.65 : 1;
    this.baseBus.connect(audio.musicBus);
    this.heroBus.connect(audio.musicBus);
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stop(fadeMs: number = AUDIO.musicFadeMs): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const ctx = audio.ctx;
    const buses = [this.baseBus, this.heroBus];
    if (ctx) {
      for (const bus of buses) {
        if (!bus) continue;
        bus.gain.cancelScheduledValues(ctx.currentTime);
        bus.gain.setTargetAtTime(0.0001, ctx.currentTime, fadeMs / 4000);
        setTimeout(() => bus.disconnect(), fadeMs + 200);
      }
    }
    this.baseBus = null;
    this.heroBus = null;
    this.current = null;
    this.track = null;
  }

  /** 0 = human Ben (sparser), 1 = alien (full hero layer). */
  setIntensity(value: number): void {
    this.intensity = value;
    const ctx = audio.ctx;
    if (!ctx || !this.heroBus) return;
    this.heroBus.gain.setTargetAtTime(0.35 + value * 0.65, ctx.currentTime, 0.25);
  }

  /**
   * Record scratch: the music cuts out dead, then fades back after `gapMs`.
   * The track keeps its place, so it picks up on the beat it would have reached.
   */
  scratch(gapMs: number): void {
    const ctx = audio.ctx;
    if (!ctx || !this.baseBus || !this.heroBus) return;
    const t = ctx.currentTime;
    const back = t + gapMs / 1000;
    const hero = 0.35 + this.intensity * 0.65;
    for (const [bus, level] of [[this.baseBus, 1], [this.heroBus, hero]] as const) {
      bus.gain.cancelScheduledValues(t);
      bus.gain.setTargetAtTime(0.0001, t, 0.012);
      bus.gain.setTargetAtTime(level, back, 0.12);
    }
  }

  /** The hero layer voicing: the active alien's, or null for the track's default. Takes effect on the next step. */
  setLayer(spec: MusicLayerSpec | null): void {
    this.layer = spec ?? HERO_LAYER;
  }

  private schedule(): void {
    const ctx = audio.ctx;
    const track = this.track;
    if (!ctx || !track || !this.baseBus || !this.heroBus) return;
    if (!audio.ready) {
      this.nextTime = ctx.currentTime + 0.1;
      return;
    }
    const stepDur = 60 / track.bpm / 4;
    const total = track.bars * 16;
    while (this.nextTime < ctx.currentTime + 0.12) {
      if (this.step >= total) {
        if (!track.loop) {
          this.stop(1500);
          return;
        }
        this.step = 0;
      }
      this.playStep(track, this.step, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  private playStep(track: Track, step: number, t: number, stepDur: number): void {
    const base = this.baseBus!;
    const hero = this.heroBus!;
    const bass = track.bass[step];
    if (bass != null) {
      audio.tone({ type: 'triangle', freq: midiToFreq(bass), duration: stepDur * 1.8, volume: 0.32, when: t, bus: base });
      audio.tone({ type: 'square', freq: midiToFreq(bass), duration: stepDur * 1.2, volume: 0.05, when: t, bus: base, filter: { type: 'lowpass', freq: 700 } });
    }
    this.playHero(track, step, t, stepDur, hero);
    const stab = track.stabs?.[step];
    if (stab != null) {
      for (const interval of [0, 3, 7]) {
        audio.tone({ type: 'sawtooth', freq: midiToFreq(stab + interval), duration: stepDur * 0.9, volume: 0.025, when: t, bus: base, filter: { type: 'lowpass', freq: 1800 } });
      }
    }
    if (track.pad && step % 16 === 0) {
      const chord = track.pad[Math.floor(step / 16) % track.pad.length];
      for (const note of chord) {
        audio.tone({ type: 'sawtooth', freq: midiToFreq(note), duration: stepDur * 16, volume: 0.025, attack: 0.6, when: t, bus: base, detune: -7, filter: { type: 'lowpass', freq: 900 } });
        audio.tone({ type: 'sawtooth', freq: midiToFreq(note), duration: stepDur * 16, volume: 0.025, attack: 0.6, when: t, bus: base, detune: 7, filter: { type: 'lowpass', freq: 900 } });
      }
    }
    const drum = track.drums[step % track.drums.length];
    if (drum === 'k') {
      audio.tone({ type: 'sine', freq: 150, freqEnd: 42, duration: 0.14, volume: 0.55, when: t, bus: base });
    } else if (drum === 's') {
      audio.noise({ duration: 0.12, volume: 0.2, filter: 'bandpass', freq: 1900, q: 0.9, when: t, bus: base });
      audio.tone({ type: 'triangle', freq: 190, freqEnd: 120, duration: 0.07, volume: 0.16, when: t, bus: base });
    } else if (drum === 'h') {
      audio.noise({ duration: 0.03, volume: 0.07, filter: 'highpass', freq: 7500, when: t, bus: base });
    }
  }

  private playHero(track: Track, step: number, t: number, stepDur: number, hero: GainNode): void {
    const layer = this.layer;
    const arp = track.arp[step];
    if (arp != null && layer.arp && !(layer.arp.thin && step % 2 === 1)) this.voice(layer.arp, arp, t, stepDur, hero);
    const lead = track.lead[step];
    if (lead != null && layer.lead) {
      this.voice(layer.lead, lead, t, stepDur, hero);
      if (layer.lead.double) this.voice(layer.lead.double, lead, t, stepDur, hero);
    }
    const inBar = step % 16;
    if (layer.stabs?.steps.includes(inBar)) {
      const root = track.bass[step - inBar];
      if (root != null) for (const interval of [12, 19, 24]) this.voice(layer.stabs.voice, root + interval, t, stepDur, hero);
    }
    if (layer.hats16) audio.noise({ duration: 0.025, volume: layer.hats16 * (inBar % 4 === 2 ? 1.6 : 1), filter: 'highpass', freq: 8500, when: t, bus: hero });
    if (layer.toms?.steps.includes(inBar)) {
      audio.tone({ type: 'sine', freq: 130, freqEnd: 62, duration: 0.2, volume: layer.toms.volume, when: t, bus: hero });
      audio.noise({ duration: 0.06, volume: layer.toms.volume * 0.3, filter: 'lowpass', freq: 900, when: t, bus: hero });
    }
  }

  private voice(v: MusicVoice, note: number, t: number, stepDur: number, bus: GainNode): void {
    audio.tone({
      type: v.wave,
      freq: midiToFreq(note + 12 * v.octave),
      duration: stepDur * v.length,
      volume: v.volume,
      when: t,
      bus,
      detune: v.detune,
      filter: v.filter > 0 ? { type: 'lowpass', freq: v.filter } : undefined,
    });
  }
}

export const music = new MusicPlayer();
