import { ARP_SHAPE, arpBar, BOSS_BASS, bassBar, n, seq, type Track } from '../musicKit';

/** Chapter 2's music (the highway, the chase, ROADBREAKER), loaded with the chapter. */

const ROCK_BASS: Array<[number, number]> = [
  [0, 0],
  [2, 0],
  [4, 12],
  [6, 0],
  [8, 0],
  [10, 0],
  [12, 12],
  [14, 7],
];

/** Road Trip: an open-road groove in A (I, bVII, IV, V), windows down at golden hour. */
export const HIGHWAY: Track = {
  bpm: 132,
  bars: 4,
  loop: true,
  bass: [
    ...bassBar(n('A2'), ROCK_BASS),
    ...bassBar(n('G2'), ROCK_BASS),
    ...bassBar(n('D2'), ROCK_BASS),
    ...bassBar(n('E2'), ROCK_BASS),
  ],
  arp: [
    ...arpBar([n('A4'), n('C#5'), n('E5')], ARP_SHAPE),
    ...arpBar([n('G4'), n('B4'), n('D5')], ARP_SHAPE),
    ...arpBar([n('F#4'), n('A4'), n('D5')], ARP_SHAPE),
    ...arpBar([n('E4'), n('G#4'), n('B4')], ARP_SHAPE),
  ],
  lead: seq('E5 - C#5 E5 A5 - G5 E5 D5 - B4 D5 G5 - F#5 D5 A4 - D5 F#5 A5 - F#5 D5 E5 - G#5 B5 E6 - - -', 2),
  drums: 'k-h-s-hhk-k-s-hh'.repeat(4),
};

const GALLOP: Array<[number, number]> = [
  [0, 0],
  [1, 0],
  [2, 12],
  [4, 0],
  [5, 0],
  [6, 12],
  [8, 0],
  [9, 0],
  [10, 12],
  [12, 0],
  [13, 0],
  [14, 7],
];

/** The Rustbucket chase: a galloping E minor run, foot to the floor. */
export const CHASE: Track = {
  bpm: 160,
  bars: 4,
  loop: true,
  bass: [
    ...bassBar(n('E2'), GALLOP),
    ...bassBar(n('C2'), GALLOP),
    ...bassBar(n('D2'), GALLOP),
    ...bassBar(n('B1'), GALLOP),
  ],
  arp: [
    ...arpBar([n('E5'), n('G5'), n('B5')], ARP_SHAPE),
    ...arpBar([n('C5'), n('E5'), n('G5')], ARP_SHAPE),
    ...arpBar([n('D5'), n('F#5'), n('A5')], ARP_SHAPE),
    ...arpBar([n('B4'), n('D#5'), n('F#5')], ARP_SHAPE),
  ],
  lead: seq('B5 - - B5 A5 G5 A5 - G5 - - G5 F#5 E5 F#5 - F#5 - - F#5 G5 A5 B5 - D#5 - F#5 - B5 - A5 -', 2),
  stabs: [
    ...seq('E4 - - E4 - - E4 - - - - - E4 - - -', 1),
    ...seq('C4 - - C4 - - C4 - - - - - C4 - - -', 1),
    ...seq('D4 - - D4 - - D4 - - - - - D4 - - -', 1),
    ...seq('B3 - - B3 - - B3 - - - B3 - B3 - B3 -', 1),
  ],
  drums: 'k-hhs-hkk-hhs-hh'.repeat(4),
};

/** ROADBREAKER: heavy D minor stomp with brassy stabs. */
export const ROADBREAKER: Track = {
  bpm: 146,
  bars: 4,
  loop: true,
  bass: [
    ...bassBar(n('D2'), BOSS_BASS),
    ...bassBar(n('A#1'), BOSS_BASS),
    ...bassBar(n('G1'), BOSS_BASS),
    ...bassBar(n('A1'), BOSS_BASS),
  ],
  arp: [
    ...arpBar([n('D5'), n('F5'), n('A5')], ARP_SHAPE),
    ...arpBar([n('A#4'), n('D5'), n('F5')], ARP_SHAPE),
    ...arpBar([n('G4'), n('A#4'), n('D5')], ARP_SHAPE),
    ...arpBar([n('A4'), n('C#5'), n('E5')], ARP_SHAPE),
  ],
  lead: seq('D5 - A5 - G5 F5 E5 F5 D5 - - - A#4 - D5 - G5 - F5 - E5 D5 C#5 - E5 - A5 - G5 - E5 -', 2),
  stabs: [
    ...seq('D4 - D4 - - - D4 - D4 - - - D4 - - -', 1),
    ...seq('A#3 - A#3 - - - A#3 - A#3 - - - A#3 - - -', 1),
    ...seq('G3 - G3 - - - G3 - G3 - - - G3 - - -', 1),
    ...seq('A3 - A3 - - - A3 - A3 - A3 - A3 - A3 -', 1),
  ],
  drums: 'k-hhs-hhk-hhs-hk'.repeat(3) + 'k-hhs-sss-ssk-ss',
};
