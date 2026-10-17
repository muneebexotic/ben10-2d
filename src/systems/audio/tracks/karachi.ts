import { arpBar, bassBar, BOSS_BASS, n, seq, type Track } from '../musicKit';

/**
 * Chapter 6's music: original compositions with a local flavour on top of the
 * chiptune: qawwali handclaps, a dhol's "dhum" and "ta", a harmonium-like
 * reed pad, a plucked sitar-like line and a tanpura drone. The melodies lean
 * on a flattened second and a raised third (a Bhairav-like colour), not on
 * any existing song.
 */

const PULSE: Array<[number, number]> = [
  [0, 0],
  [6, 0],
  [8, 7],
  [12, 0],
];
const SWAY = [0, null, 1, 2, null, 1, 0, null, 2, null, 1, 2, 3, 2, 1, null];

/** The seafront fair: D with a flattened second, clapping on the off-beats, the dhol rolling underneath. */
export const FAIR: Track = {
  bpm: 124,
  bars: 4,
  loop: true,
  bass: [...bassBar(n('D2'), PULSE), ...bassBar(n('Eb2'), PULSE), ...bassBar(n('C2'), PULSE), ...bassBar(n('D2'), PULSE)],
  arp: [
    ...arpBar([n('D4'), n('F#4'), n('A4')], SWAY),
    ...arpBar([n('Eb4'), n('G4'), n('Bb4')], SWAY),
    ...arpBar([n('C4'), n('Eb4'), n('G4')], SWAY),
    ...arpBar([n('D4'), n('F#4'), n('A4')], SWAY),
  ],
  lead: seq('D5 Eb5 F#5 G5 A5 - G5 F#5 Eb5 - F#5 - D5 - - - G5 A5 Bb5 A5 G5 - F#5 Eb5 D5 - Eb5 - D5 - - -', 2),
  raga: seq('A4 - - Bb4 A4 - G4 - F#4 - G4 - A4 - - - Bb4 - A4 - G4 F#4 Eb4 - D4 - - - - - - -', 2),
  drums: 'd-c-g-cdd-c-gcg-'.repeat(4),
  pad: [
    [n('D3'), n('F#3'), n('A3')],
    [n('Eb3'), n('G3'), n('Bb3')],
    [n('C3'), n('Eb3'), n('G3')],
    [n('D3'), n('F#3'), n('A3')],
  ],
  drone: n('D2'),
};

const STEPS: Array<[number, number]> = [
  [0, 0],
  [8, 7],
];
const CANDLE = [0, null, 2, null, 1, null, 2, null, 0, null, 2, null, 3, null, 2, null];

/** The pink palace: A minor, slow and stately, a harpsichord-ish arpeggio and the sitar answering. */
export const MANOR: Track = {
  bpm: 96,
  bars: 4,
  loop: true,
  bass: [...bassBar(n('A1'), STEPS), ...bassBar(n('F1'), STEPS), ...bassBar(n('D2'), STEPS), ...bassBar(n('E1'), STEPS)],
  arp: [
    ...arpBar([n('A4'), n('C5'), n('E5')], CANDLE),
    ...arpBar([n('F4'), n('A4'), n('C5')], CANDLE),
    ...arpBar([n('D4'), n('F4'), n('A4')], CANDLE),
    ...arpBar([n('E4'), n('G#4'), n('B4')], CANDLE),
  ],
  lead: seq('E5 - - - C5 - D5 E5 F5 - - - E5 - D5 - C5 - - - A4 - B4 C5 B4 - - - G#4 - - -', 2),
  raga: seq('- - - - - - A5 G#5 A5 - - - - - - - - - - - - - F5 E5 D5 - - - E5 - - -', 2),
  drums: 't-------c---t-c-'.repeat(4),
  pad: [
    [n('A3'), n('C4'), n('E4')],
    [n('F3'), n('A3'), n('C4')],
    [n('D3'), n('F3'), n('A3')],
    [n('E3'), n('G#3'), n('B3')],
  ],
  drone: n('A1'),
};

const PENDULUM: Array<[number, number]> = [
  [0, 0],
  [8, 5],
];
const COGS = [0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 4, 3, 2, 1];

/** The Spell Engine: inside the clock. Tick, tock, a slow pendulum bass and cogs turning in the arpeggio. */
export const ENGINE: Track = {
  bpm: 100,
  bars: 4,
  loop: true,
  bass: [...bassBar(n('E2'), PENDULUM), ...bassBar(n('E2'), PENDULUM), ...bassBar(n('C2'), PENDULUM), ...bassBar(n('B1'), PENDULUM)],
  arp: [
    ...arpBar([n('E4'), n('G4'), n('B4')], COGS),
    ...arpBar([n('E4'), n('A4'), n('C5')], COGS),
    ...arpBar([n('C4'), n('E4'), n('G4')], COGS),
    ...arpBar([n('B3'), n('D#4'), n('F#4')], COGS),
  ],
  lead: seq('B4 - - - E5 - - - G5 - F#5 - E5 - - - C5 - - - E5 - A5 - G5 - F#5 - D#5 - - -', 2),
  drums: 'h---w---h---w---'.repeat(4),
  drone: n('E2'),
};

/** HEX AND CHARMCASTER: E with a flattened second at a run, the dhol pounding, claps on every off-beat. */
export const HEX: Track = {
  bpm: 144,
  bars: 4,
  loop: true,
  bass: [...bassBar(n('E1'), BOSS_BASS), ...bassBar(n('F1'), BOSS_BASS), ...bassBar(n('D2'), BOSS_BASS), ...bassBar(n('E1'), BOSS_BASS)],
  arp: [
    ...arpBar([n('E4'), n('G#4'), n('B4')], [0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 4, 3, 2, 1]),
    ...arpBar([n('F4'), n('A4'), n('C5')], [0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 4, 3, 2, 1]),
    ...arpBar([n('D4'), n('F4'), n('A4')], [0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 4, 3, 2, 1]),
    ...arpBar([n('E4'), n('G#4'), n('B4')], [0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 4, 3, 2, 1]),
  ],
  lead: seq('E5 F5 G#5 - B5 - A5 G#5 F5 - G#5 - E5 - - - A5 B5 C6 - B5 A5 G#5 F5 E5 - F5 - G#5 - B5 -', 2),
  raga: seq('E5 - F5 E5 - - G#5 - - - F5 - E5 - - - D5 - - - E5 - F5 - E5 - - - - - - -', 2),
  drums: 'dgcgd-cgdgcgdgcc'.repeat(4),
  stabs: [
    ...[null, null, null, null, n('E3'), null, null, null, null, null, null, null, n('E3'), null, null, null],
    ...[null, null, null, null, n('F3'), null, null, null, null, null, null, null, n('F3'), null, null, null],
    ...[null, null, null, null, n('D3'), null, null, null, null, null, null, null, n('D3'), null, null, null],
    ...[null, null, null, null, n('E3'), null, null, null, null, null, null, null, n('E3'), null, null, null],
  ],
  drone: n('E2'),
};
