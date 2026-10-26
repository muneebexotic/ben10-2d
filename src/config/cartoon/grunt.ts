import type { CartoonManifest } from './types';

/**
 * Deepmaw's crew, the fishbowl grunt (Chapter 7): a bug-eyed orange fish in
 * a patched canvas diving suit with brass fittings and lead boots, wearing a
 * glass fishbowl helmet full of water (bubbles rising in it), carrying a
 * harpoon. With the bowl broken it's a fish out of water.
 */
export const GRUNT_CARTOON: CartoonManifest = {
  id: 'grunt',
  name: 'FISHBOWL GRUNT',
  sheets: [{ texture: 'deep-grunt', frame: { w: 36, h: 36, feetY: 30 } }],
  colors: { suit: 0x3a6a72, suitLight: 0x6aa0a4, suitDark: 0x1e3a42, patch: 0x8a6a3a, brass: 0xd8a03a, brassDark: 0x8a5a1a, boot: 0x3a3a46, fish: 0xff7a3a, fishLight: 0xffc07a, fishDark: 0xb83a1a, fin: 0xffa060, eye: 0xfffff0, glass: 0xbaf0ff, water: 0x4ac0e8, harpoon: 0x9aa8b8, tip: 0xe0e8f0 },
  style: { runMs: 620, stride: 26, armSwing: 20, runLean: 6, bounce: 1.2, idleMs: 1400, idleSway: 3, weight: 0.6, armRest: 10 },
  clips: {
    idle: 'standing guard, harpoon on its shoulder, bubbles in the bowl', walk: 'a heavy lead-booted trudge',
    windup: 'the tell: the harpoon drawn back over its shoulder', throw: 'the throw: arm whipping through, empty-handed',
    flop: 'bowl broken: a fish flopping on the deck in a diving suit',
    idleBare: 'standing, bowl broken (in water)', walkBare: 'walking, bowl broken (in water)', windupBare: 'the tell, bowl broken', throwBare: 'the throw, bowl broken',
  },
};
