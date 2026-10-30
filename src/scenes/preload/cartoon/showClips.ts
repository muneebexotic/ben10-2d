import { keyframes } from './humanoid';
import { wave, type ClipDef, type RigInfo } from './rig';

/** Draw order that brings the far arm in front of everything (a wave, a watch held up to the face). */
export const SHOW_FRONT = 85;

/**
 * Clips every human redrawn in the show look shares (Act 3, from their action
 * sheets): the near arm hangs at the back of a three-quarter body, so arms flung
 * up go up behind the head and the far arm up in front, never across the face.
 * Also the sheets' wide stance, a deep landing and a breaststroke.
 */
export function showHumanClips(info: RigInfo, base: Readonly<Record<string, ClipDef>>): Record<string, ClipDef> {
  const FRONT = SHOW_FRONT;
  // Jump: the near knee drives up, the far leg tucks under, fists in close.
  const jumpKeys = keyframes(info, [
    [0, { hip: { y: 1.8 }, torso: 14, head: -8, thighF: 40, shinF: -70, footF: 20, thighB: -6, shinB: -60, footB: 30, armUF: -45, armLF: 60, armUB: 20, armLB: 70 }],
    [0.35, { hip: { y: -0.6 }, torso: 4, head: -6, thighF: 78, shinF: -98, footF: 30, thighB: -4, shinB: -112, footB: 40, armUF: -50, armLF: 85, armUB: 48, armLB: 88, mouth: { v: 'open' } }],
    [1, { torso: 6, head: -4, thighF: 72, shinF: -95, footF: 25, thighB: 0, shinB: -105, footB: 35, armUF: -45, armLF: 80, armUB: 42, armLB: 84, mouth: { v: 'smile' } }],
  ]);
  // Landing: a deep crouch, the far hand down to the floor.
  const landKeys = keyframes(info, [
    [0, { hip: { y: 3.6 }, torso: 30, head: -22, thighF: 64, shinF: -112, footF: 44, thighB: 26, shinB: -104, footB: 70, armUB: 14, armLB: -4, handB: { v: 'open' }, armUF: -50, armLF: 80 }],
    [1, { torso: 2, head: -1, thighF: 13, shinF: -6, footF: -6, thighB: -12, shinB: -1, footB: 12, armUF: -6, armLF: 14, armUB: 7, armLB: 16 }],
  ]);
  // Breaststroke: glide, pull, hands in under the chin, then kick and reach.
  const swimKeys = keyframes(info, [
    [0, { armUF: 172, armLF: 4, armUB: 176, armLB: 2, handF: { v: 'open' }, handB: { v: 'open' }, thighF: -4, shinF: -8, footF: 40, thighB: 4, shinB: -10, footB: 40 }],
    [0.35, { armUF: 112, armLF: -40, armUB: 116, armLB: -40, handF: { v: 'open' }, handB: { v: 'open' }, thighF: 30, shinF: -80, footF: 30, thighB: 34, shinB: -86, footB: 30 }],
    [0.55, { armUF: 130, armLF: -100, armUB: 135, armLB: -100, thighF: 50, shinF: -120, footF: 20, thighB: 52, shinB: -122, footB: 20 }],
    [0.75, { armUF: 168, armLF: -10, armUB: 172, armLB: -8, handF: { v: 'open' }, handB: { v: 'open' }, thighF: -8, shinF: -6, footF: 45, thighB: -2, shinB: -4, footB: 45 }],
  ]);
  // Hit: thrown back, arms flung out, one knee up, face screwed shut.
  const hurtKeys = keyframes(info, [
    [0, { hip: { x: -1, y: 0.4 }, torso: -26, head: -20, armUB: 70, armLB: 25, handB: { v: 'open' }, armUF: -35, armLF: 30, handF: { v: 'open' }, thighF: 38, shinF: -45, footF: 20, thighB: -14, shinB: -20, eyes: { v: 'hurt' }, mouth: { v: 'grit' } }],
    [1, { hip: { x: -0.5 }, torso: -16, head: -12, armUB: 55, armLB: 25, handB: { v: 'open' }, armUF: -30, armLF: 30, handF: { v: 'open' }, thighF: 25, shinF: -32, thighB: -10, shinB: -16, eyes: { v: 'hurt' }, mouth: { v: 'grit' } }],
  ]);
  return {
    jump: { ms: base.jump.ms, loop: false, pose: (t, p) => p.keys(jumpKeys, t) },
    fall: {
      ms: base.fall.ms,
      loop: true,
      pose: (t, p) => {
        // Both arms up in a V, hands open, legs dangling.
        base.fall.pose(t, p);
        const f = wave(t);
        p.set('armUF', -135 + f * 8).set('armLF', -18 - f * 6).show('handF', 'open');
        p.set('armUB', 135 - f * 8).set('armLB', 20 + f * 6).show('handB', 'open');
        p.set('thighF', 10 + f * 4).set('shinF', -12).set('footF', 25);
        p.set('thighB', -8 - f * 4).set('shinB', -16).set('footB', 30);
        p.show('eyes', 'wide').show('mouth', 'shout');
      },
    },
    hurt: { ms: base.hurt.ms, loop: false, pose: (t, p) => p.keys(hurtKeys, t) },
    land: { ms: base.land.ms, loop: false, pose: (t, p) => p.keys(landKeys, t) },
    swim: {
      ms: 900,
      loop: true,
      pose: (t, p) => {
        base.swim.pose(t, p);
        p.keys(swimKeys, t, true);
      },
    },
    defeat: {
      ms: base.defeat.ms,
      loop: true,
      pose: (t, p) => {
        base.defeat.pose(t, p);
        p.set('armUF', -140).set('armLF', -20).set('armUB', -120).set('armLB', -10);
      },
    },
    drown: {
      ms: base.drown.ms,
      loop: true,
      pose: (t, p) => {
        base.drown.pose(t, p);
        const f = wave(t);
        p.set('armUF', -130 + f * 30).set('armLF', -30 - f * 20);
        p.set('armUB', 110 - f * 30).set('armLB', 50 + f * 20);
      },
    },
    cheer: {
      ms: base.cheer.ms,
      loop: true,
      pose: (t, p) => {
        base.cheer.pose(t, p);
        p.set('armUF', -160).set('armLF', -10).set('armUB', 140).set('armLB', 30);
      },
    },
    wave: {
      ms: base.wave.ms,
      loop: true,
      pose: (t, p) => {
        base.idle.pose(t, p);
        p.set('armUB', 84).front('armUB', FRONT).set('armLB', 80 + wave(t) * 22).front('armLB', FRONT + 1).show('handB', 'open').front('handB', FRONT + 2);
        p.show('mouth', 'grin').show('eyes', 'happy');
      },
    },
    // The sheet's stance: feet apart, weight back a little.
    idle: {
      ms: base.idle.ms,
      loop: true,
      pose: (t, p) => {
        base.idle.pose(t, p);
        p.set('thighF', 13).set('shinF', -6).set('footF', -6);
        p.set('thighB', -12).set('shinB', -1).set('footB', 12);
      },
    },
  };
}
