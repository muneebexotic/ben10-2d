import type { CartoonManifest } from './types';

/** A jelly mine (Chapter 7): a glassy pink bell with a glowing core and a tangle of stinging tendrils. */
export const JELLY_CARTOON: CartoonManifest = {
  id: 'jelly',
  name: 'JELLY MINE',
  sheets: [{ texture: 'deep-jelly', frame: { w: 28, h: 32, feetY: 14 } }],
  colors: { bell: 0xff8ad8, bellLight: 0xffd0f0, bellDark: 0xa83a8a, core: 0xfff0a0, tendril: 0xff6ac0 },
  clips: { pulse: 'drifting: the bell pulsing, tendrils trailing' },
};
