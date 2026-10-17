import { ARP_SHAPE, arpBar, BOSS_BASS, bassBar, CREEP_ARP, n, seq, type Track } from '../musicKit';

/** Chapter 3's music (the museum at night, Dr. Animo), loaded with the chapter. */

const CREEP: Array<[number, number]> = [
  [0, 0],
  [3, 0],
  [6, 7],
  [8, 0],
  [10, 6],
  [11, 7],
  [14, 12],
];

/** The museum at night: a creeping B minor monster-movie walk with a tritone sting. */
export const MUSEUM: Track = {
  bpm: 116,
  bars: 4,
  loop: true,
  bass: [
    ...bassBar(n('B1'), CREEP),
    ...bassBar(n('G1'), CREEP),
    ...bassBar(n('E2'), CREEP),
    ...bassBar(n('F#1'), CREEP),
  ],
  arp: [
    ...arpBar([n('B4'), n('D5'), n('F#5')], CREEP_ARP),
    ...arpBar([n('G4'), n('B4'), n('D5')], CREEP_ARP),
    ...arpBar([n('E4'), n('G4'), n('B4')], CREEP_ARP),
    ...arpBar([n('F#4'), n('A#4'), n('C#5')], CREEP_ARP),
  ],
  lead: seq('F#5 - - - F5 - - - D5 - - B4 - - D5 - E5 - - - G5 - F#5 - E5 - D5 - C#5 - - -', 2),
  drums: 'k---h-s-k-k-h-s-'.repeat(3) + 'k---h-s-k-s-sss-',
};

/** Dr. Animo's boss theme: a manic C minor organ waltz turned up to eleven. */
export const ANIMO: Track = {
  bpm: 152,
  bars: 4,
  loop: true,
  bass: [
    ...bassBar(n('C2'), BOSS_BASS),
    ...bassBar(n('G#1'), BOSS_BASS),
    ...bassBar(n('F1'), BOSS_BASS),
    ...bassBar(n('G1'), BOSS_BASS),
  ],
  arp: [
    ...arpBar([n('C5'), n('D#5'), n('G5')], ARP_SHAPE),
    ...arpBar([n('G#4'), n('C5'), n('D#5')], ARP_SHAPE),
    ...arpBar([n('F4'), n('G#4'), n('C5')], ARP_SHAPE),
    ...arpBar([n('G4'), n('B4'), n('D5')], ARP_SHAPE),
  ],
  lead: seq('G5 - D#5 - C5 - G5 F#5 G5 - G#5 - G5 - D#5 - F5 - C5 - G#4 - C5 D5 D#5 - D5 - B4 - G4 -', 2),
  stabs: [
    ...seq('C4 - - C4 - - C4 - - - C4 - C4 - - -', 1),
    ...seq('G#3 - - G#3 - - G#3 - - - G#3 - G#3 - - -', 1),
    ...seq('F3 - - F3 - - F3 - - - F3 - F3 - - -', 1),
    ...seq('G3 - - G3 - - G3 - G3 - G3 - B3 - D4 -', 1),
  ],
  drums: 'k-hsk-hsk-hsk-ss'.repeat(3) + 'k-hsk-hsk-sssss-',
};
