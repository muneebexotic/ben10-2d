import type { CartoonManifest } from './types';

/**
 * A Plumber security sentry (Chapter 7): a floating steel ball from the
 * 1970s, Plumber grey-blue with yellow trim and the badge on its flank, one
 * big camera lens for an eye (green on patrol, red when it locks), stubby
 * fins, a stun emitter under its chin and a thruster glow below.
 */
export const WARDEN_CARTOON: CartoonManifest = {
  id: 'warden',
  name: 'PLUMBER SENTRY',
  sheets: [{ texture: 'deep-warden', frame: { w: 32, h: 32, feetY: 16 } }],
  colors: { steel: 0x6a7c98, steelLight: 0xb4c6e0, steelDark: 0x2e3a52, trim: 0xe8d040, lens: 0x0a1a1c, green: 0x7dffb0, red: 0xff4a3a, jet: 0x8ad8ff },
  clips: {
    idle: 'on its beat: bobbing, fins sculling, the lens looking about (green)',
    lock: 'locked on: leaning in, fins out, the lens red and staring',
    fire: 'the stun beam: a kick back off the shot',
  },
};
