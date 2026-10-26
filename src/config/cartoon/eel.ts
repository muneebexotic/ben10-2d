import type { CartoonManifest } from './types';

/**
 * A zapper eel (Chapter 7): a long dark-blue eel with a pale belly, a frill
 * of fin along its back, a wide grumpy mouth, and glowing cyan spots down its
 * flanks that blaze when it charges.
 */
export const EEL_CARTOON: CartoonManifest = {
  id: 'eel',
  name: 'ZAPPER EEL',
  sheets: [{ texture: 'deep-eel', frame: { w: 40, h: 24, feetY: 12 } }],
  colors: { body: 0x1e3a6a, bodyLight: 0x4a7ab8, belly: 0xc8d8e8, fin: 0x3a6ab0, spot: 0x8af0ff, mouth: 0x2a0a1a, eye: 0xf0ff6a },
  clips: { swim: 'a slow ripple through the water', charge: 'the tell: coiled tight, spots blazing, crackling', zap: 'the shock: body rigid, arcs off every spot', flop: 'drained out of its tank: flopping on the floor' },
};
