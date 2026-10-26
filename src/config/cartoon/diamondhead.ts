import type { CartoonManifest } from './types';

/** Diamondhead: a Petrosapien. A body of pale blue-green crystal over a black suit, a tall faceted gem of a head with a dark face band and glowing eyes, crystal shards out of his shoulders and back, the Omnitrix on his chest. */
export const DIAMONDHEAD_CARTOON: CartoonManifest = {
  id: 'diamondhead',
  name: 'DIAMONDHEAD',
  sheets: [{ texture: 'diamondhead', frame: { w: 42, h: 42, feetY: 41 } }],
  colors: {
    glow: 0xe0ffff,
    light: 0x9af0ff,
    main: 0x5ad0f0,
    shade: 0x2a90c0,
    deep: 0x1a5a8a,
    core: 0x0e2a40,
    suit: 0x161c2a,
    suit2: 0x283246,
    eye: 0xa8ffd8,
    rim: 0x08202e,
    omnitrix: 0x5dff5a,
  },
  style: { runMs: 500, stride: 36, armSwing: 36, runLean: 8, bounce: 1.2, idleMs: 1800, idleSway: 2, weight: 0.65, armRest: 10 },
  clips: {
    idle: 'a solid stance, crystals glinting', run: 'a heavy, sure run', jump: 'push off', fall: 'arms out', land: 'a hard landing',
    shoot: 'firing crystal shards from the near hand', shootUp: 'shards upward', shield: 'a crystal shield wall held out', shieldUp: 'the shield angled up', shieldDown: 'the shield angled down',
    grow: 'raising a hand as crystal grows', spikes: 'fists to the ground: spikes burst up around him', hurt: 'knocked back, chips flying', defeat: 'down',
    swim: 'sinking, striding along the bottom', tread: 'standing on the bottom, arms paddling', drown: 'thrashing (he does not need air)',
    talk: 'talking', point: 'pointing', cheer: 'arms up', surprise: 'jolted', think: 'chin on fist',
  },
};
