import type { CartoonManifest } from './types';

/** Kevin Levin, eleven: tall and lanky, long shaggy black hair, grey eyes, a black shirt over grey sleeves, jeans; purple when he uses his power. */
export const KEVIN_CARTOON: CartoonManifest = {
  id: 'kevin',
  name: 'KEVIN LEVIN',
  sheets: [{ texture: 'char-kevin-actor', frame: { w: 24, h: 36, feetY: 35 } }],
  colors: {
    skin: 0xecc09a,
    skinShade: 0xc8946c,
    hair: 0x2a2234,
    hairLight: 0x5e4e72,
    eye: 0x6a6a7a,
    glow: 0xc89cff,
    glowDark: 0x6a3aa8,
    brow: 0x14101a,
    shirt: 0x24242e,
    shirtLight: 0x3e3e4c,
    sleeve: 0x7a7a8a,
    sleeveShade: 0x55556a,
    jeans: 0x2e4068,
    jeansShade: 0x1e2a46,
    shoe: 0x2a2a30,
    shoeToe: 0x8a8a96,
    sole: 0xd0d0d8,
    mouth: 0x6a2228,
    tongue: 0xd06a72,
  },
  style: { runMs: 420, stride: 42, armSwing: 40, runLean: 14, bounce: 0.8, idleMs: 1900, idleSway: 3, weight: 0.25, armRest: 4 },
  clips: {
    idle: 'a slouch, hands loose, blinking', run: 'a loping run', walk: 'a swagger (story)', jump: 'push off', fall: 'arms out', land: 'landing',
    absorb: 'palms out, drinking in power, eyes and hands glowing purple', windup: 'a bolt charging in his hand', throw: 'hurling a bolt',
    hurt: 'knocked back', laugh: 'head back, laughing', lunge: 'grabbing forward', point: 'pointing',
    defeat: 'down', talk: 'talking with his hands', smirk: 'hands in pockets, smirking', surprise: 'caught out', angry: 'scowling',
    wave: 'waving (a stolen badge)', cheer: 'fists up', think: 'scheming', shrug: 'shrugging', sad: 'sulking', lookHands: 'staring at his hands',
    swim: 'swimming', tread: 'treading water', drown: 'out of air',
  },
};
