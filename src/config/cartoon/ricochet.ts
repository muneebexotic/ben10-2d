import type { CartoonManifest } from './types';

/**
 * Ricochet (Chapter 8, an original alien): a stocky creature under a round back
 * of copper shell plates with glowing teal seams, a pale lilac-grey hide, amber
 * eyes under the shell's rim, broad three-fingered hands. He curls into a ball.
 */
export const RICOCHET_CARTOON: CartoonManifest = {
  id: 'ricochet',
  name: 'RICOCHET',
  sheets: [{ texture: 'ricochet', frame: { w: 36, h: 34, feetY: 32 } }],
  colors: {
    shell: 0xd07a3e,
    shellLight: 0xffb070,
    shellShade: 0x8a4220,
    shellDeep: 0x4e2412,
    seam: 0x5ae8c8,
    seamDeep: 0x1e8a78,
    hide: 0xbab4c8,
    hideLight: 0xe8e2f0,
    hideShade: 0x7a7290,
    eye: 0xffc83a,
    claw: 0xf2ecda,
    omnitrix: 0x5dff5a,
  },
  clips: {
    idle: 'planted on his short legs, shell rising and falling', run: 'a stomping waddle, the shell rocking', jump: 'a heavy hop, arms up', fall: 'arms out, legs tucked', land: 'a thud',
    bashA: 'a forearm bash with the near arm', bashB: 'a forearm bash with the far arm', slam: 'the shell slam: the whole body thrown forward',
    roll: 'curled into a ball, spinning (faster the faster he rolls)', hurt: 'knocked back into his shell', defeat: 'flat on his back, legs in the air',
    swim: 'rolling along the bottom (he sinks)', tread: 'standing on the bottom', drown: 'out of air',
  },
};
