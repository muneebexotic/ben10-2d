import type { CartoonManifest } from './types';

/** A gnasher swarm (Chapter 7): a school of seven fist-sized fish, orange and gold, all underbite and teeth. */
export const GNASHER_CARTOON: CartoonManifest = {
  id: 'gnasher',
  name: 'GNASHER SWARM',
  sheets: [{ texture: 'deep-gnasher', frame: { w: 44, h: 32, feetY: 16 } }],
  colors: { body: 0xff9a3a, bodyLight: 0xffd07a, bodyDark: 0xb85a1a, belly: 0xfff0c8, fin: 0xe86a2a, teeth: 0xfffef0, eye: 0xffffff },
  clips: { swim: 'circling as a loose school', bunch: 'the tell: bunched into a tight ball, all turned one way', dart: 'darting in a line, jaws first', flop: 'drained: a heap of flapping fish' },
};
