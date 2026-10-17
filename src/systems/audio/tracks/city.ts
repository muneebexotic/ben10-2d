import { ARP_SHAPE, arpBar, BOSS_BASS, bassBar, CREEP_ARP, n, seq, type Track } from '../musicKit';

/** Chapter 4's music (the arcade, Line 11, KEVIN 11), loaded with the chapter. */

const BOUNCE: Array<[number, number]> = [
  [0, 0],
  [2, 12],
  [4, 0],
  [6, 12],
  [8, 0],
  [10, 12],
  [12, 7],
  [14, 12],
];

/** The GAME ZONE: a bouncy C major coin-op tune, all octave bass and sugar. */
export const ARCADE: Track = {
  bpm: 140,
  bars: 4,
  loop: true,
  bass: [
    ...bassBar(n('C2'), BOUNCE),
    ...bassBar(n('A1'), BOUNCE),
    ...bassBar(n('F1'), BOUNCE),
    ...bassBar(n('G1'), BOUNCE),
  ],
  arp: [
    ...arpBar([n('C5'), n('E5'), n('G5')], ARP_SHAPE),
    ...arpBar([n('A4'), n('C5'), n('E5')], ARP_SHAPE),
    ...arpBar([n('F4'), n('A4'), n('C5')], ARP_SHAPE),
    ...arpBar([n('G4'), n('B4'), n('D5')], ARP_SHAPE),
  ],
  lead: seq('E5 G5 C6 - B5 - G5 - A5 - E5 - C5 - E5 - F5 A5 C6 - B5 - G5 - G5 A5 B5 - D6 - B5 -', 2),
  drums: 'k-h-s-hkk-h-s-hh'.repeat(4),
};

const DRIVE: Array<[number, number]> = [
  [0, 0],
  [2, 0],
  [4, 12],
  [6, 0],
  [8, 0],
  [10, 0],
  [12, 12],
  [14, 7],
];

/** Line 11: a dark, driving F# minor ride through the tunnels. */
export const SUBWAY: Track = {
  bpm: 150,
  bars: 4,
  loop: true,
  bass: [
    ...bassBar(n('F#1'), DRIVE),
    ...bassBar(n('D2'), DRIVE),
    ...bassBar(n('E2'), DRIVE),
    ...bassBar(n('C#2'), DRIVE),
  ],
  arp: [
    ...arpBar([n('F#4'), n('A4'), n('C#5')], CREEP_ARP),
    ...arpBar([n('D4'), n('F#4'), n('A4')], CREEP_ARP),
    ...arpBar([n('E4'), n('G#4'), n('B4')], CREEP_ARP),
    ...arpBar([n('C#4'), n('F4'), n('G#4')], CREEP_ARP),
  ],
  lead: seq('C#5 - - - A4 - - - B4 - C#5 - - - - - D5 - - - C#5 - A4 - B4 - - - G#4 - - -', 2),
  drums: 'k-hhk-hhs-hhk-hh'.repeat(3) + 'k-hhk-hhs-hss-ss',
};

/** KEVIN 11: a twitchy E minor boss theme with a chromatic sneer. */
export const KEVIN: Track = {
  bpm: 156,
  bars: 4,
  loop: true,
  bass: [
    ...bassBar(n('E2'), BOSS_BASS),
    ...bassBar(n('C2'), BOSS_BASS),
    ...bassBar(n('A1'), BOSS_BASS),
    ...bassBar(n('B1'), BOSS_BASS),
  ],
  arp: [
    ...arpBar([n('E5'), n('G5'), n('B5')], ARP_SHAPE),
    ...arpBar([n('C5'), n('E5'), n('G5')], ARP_SHAPE),
    ...arpBar([n('A4'), n('C5'), n('E5')], ARP_SHAPE),
    ...arpBar([n('B4'), n('D#5'), n('F#5')], ARP_SHAPE),
  ],
  lead: seq('E5 - B5 - A#5 - B5 - G5 - E5 - F#5 - D#5 - E5 - G5 - C6 - B5 A5 G5 - F#5 - D#5 - B4 -', 2),
  stabs: [
    ...seq('E4 - E4 - - E4 - - E4 - E4 - - E4 - -', 1),
    ...seq('C4 - C4 - - C4 - - C4 - C4 - - C4 - -', 1),
    ...seq('A3 - A3 - - A3 - - A3 - A3 - - A3 - -', 1),
    ...seq('B3 - B3 - - B3 - - B3 - B3 - B3 - B3 -', 1),
  ],
  drums: 'k-hsk-hhk-hsk-hs'.repeat(3) + 'k-sss-hhk-sssss-',
};
