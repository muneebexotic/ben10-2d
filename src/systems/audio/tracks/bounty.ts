import { arpBar, bassBar, n, seq, type Track } from '../musicKit';

/** Chapter 5's music: original compositions in a spaghetti-western spirit, not any film's theme. */

/** A gallop: dum, da-dum, and the long hold. */
const GALLOP: Array<[number, number]> = [
  [0, 0],
  [3, 0],
  [4, 7],
  [8, 0],
  [11, 0],
  [12, 7],
];
const TWANG = [0, null, 1, null, 2, null, 1, null, 0, null, 2, null, 3, null, 2, null];

/** Silver Spur: A minor walking down to E (the Andalusian cadence), a whistled lead over a gallop. */
export const GHOSTTOWN: Track = {
  bpm: 112,
  bars: 4,
  loop: true,
  bass: [...bassBar(n('A1'), GALLOP), ...bassBar(n('G1'), GALLOP), ...bassBar(n('F1'), GALLOP), ...bassBar(n('E1'), GALLOP)],
  arp: [
    ...arpBar([n('A4'), n('C5'), n('E5')], TWANG),
    ...arpBar([n('G4'), n('B4'), n('D5')], TWANG),
    ...arpBar([n('F4'), n('A4'), n('C5')], TWANG),
    ...arpBar([n('E4'), n('G#4'), n('B4')], TWANG),
  ],
  lead: seq('E5 A5 E5 A5 E5 - D5 C5 B4 D5 G5 - F5 E5 D5 - C5 F5 A5 - G5 F5 E5 D5 E5 - G#5 - B5 - E5 -', 2),
  drums: 'k--wk-w-s--wk-w-'.repeat(4),
  pad: [
    [n('A3'), n('C4'), n('E4')],
    [n('G3'), n('B3'), n('D4')],
    [n('F3'), n('A3'), n('C4')],
    [n('E3'), n('G#3'), n('B3')],
  ],
};

const DRONE: Array<[number, number]> = [
  [0, 0],
  [6, 0],
  [10, 12],
];
const ECHO = [0, null, null, 2, null, null, 1, null, 3, null, null, 2, null, null, 1, null];

/** The Diamond Deep: D minor, slow, toms that echo down the tunnels, arpeggios dripping like water. */
export const MINE: Track = {
  bpm: 116,
  bars: 4,
  loop: true,
  bass: [...bassBar(n('D2'), DRONE), ...bassBar(n('Bb1'), DRONE), ...bassBar(n('C2'), DRONE), ...bassBar(n('A1'), DRONE)],
  arp: [
    ...arpBar([n('D5'), n('F5'), n('A5')], ECHO),
    ...arpBar([n('Bb4'), n('D5'), n('F5')], ECHO),
    ...arpBar([n('C5'), n('E5'), n('G5')], ECHO),
    ...arpBar([n('A4'), n('C#5'), n('E5')], ECHO),
  ],
  lead: seq('D5 - - - F5 - E5 - D5 - - - A4 - - - Bb4 - D5 - F5 - - - E5 - - - C#5 - - -', 2),
  drums: 't---k-t-t---k-tt'.repeat(4),
};

const RIDE: Array<[number, number]> = [
  [0, 0],
  [2, 0],
  [4, 12],
  [6, 0],
  [8, 0],
  [10, 12],
  [12, 7],
  [14, 0],
];
const SHOWDOWN = [0, 1, 2, 1, 0, 1, 2, 3, 0, 1, 2, 1, 0, 1, 3, 4];

/** THE HUNTERS: E minor at a gallop turned into a stampede, stabs on the off-beats. */
export const HUNTERS: Track = {
  bpm: 152,
  bars: 4,
  loop: true,
  bass: [...bassBar(n('E1'), RIDE), ...bassBar(n('C2'), RIDE), ...bassBar(n('D2'), RIDE), ...bassBar(n('B1'), RIDE)],
  arp: [
    ...arpBar([n('E4'), n('G4'), n('B4')], SHOWDOWN),
    ...arpBar([n('C4'), n('E4'), n('G4')], SHOWDOWN),
    ...arpBar([n('D4'), n('F#4'), n('A4')], SHOWDOWN),
    ...arpBar([n('B3'), n('D#4'), n('F#4')], SHOWDOWN),
  ],
  lead: seq('E5 G5 B5 - A5 G5 F#5 - E5 - G5 - C6 - B5 - A5 - F#5 - D5 - A5 - B5 - D#5 - F#5 - B5 -', 2),
  drums: 'k-hsk-hskwhsk-ss'.repeat(4),
  stabs: [
    ...[null, null, null, null, n('E3'), null, null, null, null, null, null, null, n('E3'), null, null, null],
    ...[null, null, null, null, n('C3'), null, null, null, null, null, null, null, n('C3'), null, null, null],
    ...[null, null, null, null, n('D3'), null, null, null, null, null, null, null, n('D3'), null, null, null],
    ...[null, null, null, null, n('B2'), null, null, null, null, null, null, null, n('B2'), null, null, null],
  ],
};

const RUNAWAY: Array<[number, number]> = [
  [0, 0],
  [1, 12],
  [2, 0],
  [4, 0],
  [5, 12],
  [6, 0],
  [8, 0],
  [9, 12],
  [10, 0],
  [12, 7],
  [13, 12],
  [14, 7],
];

/** THE DEEP DIVE: a runaway cart in A minor, all sixteenths, no brakes. */
export const DIVE: Track = {
  bpm: 170,
  bars: 4,
  loop: true,
  bass: [...bassBar(n('A1'), RUNAWAY), ...bassBar(n('F1'), RUNAWAY), ...bassBar(n('G1'), RUNAWAY), ...bassBar(n('E1'), RUNAWAY)],
  arp: [
    ...arpBar([n('A4'), n('C5'), n('E5')], SHOWDOWN),
    ...arpBar([n('F4'), n('A4'), n('C5')], SHOWDOWN),
    ...arpBar([n('G4'), n('B4'), n('D5')], SHOWDOWN),
    ...arpBar([n('E4'), n('G#4'), n('B4')], SHOWDOWN),
  ],
  lead: seq('A5 - C6 - E6 - C6 A5 F5 - A5 - C6 - A5 F5 G5 - B5 - D6 - B5 G5 G#5 - B5 - E6 - D6 B5', 2),
  drums: 'kshsk-hskshsk-ss'.repeat(4),
};
