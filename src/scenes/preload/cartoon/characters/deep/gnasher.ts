import { GNASHER_CARTOON } from '../../../../../config/cartoon/gnasher';
import { INK, LINE, shadeOf, type Paint } from '../../paint';
import { TAU, wave, type ClipDef, type PartSpec, type Pose, type RigDef } from '../../rig';
import { cutoutImage, cutoutPart } from '../../cutout/cutout';
import { frameNames, type FrameClip } from '../../cutout/frameRig';
import { GNASHER_FRAMES } from '../../cutout/gnasherFrames';

const C = GNASHER_CARTOON.colors;
const COUNT = 7;

/** One gnasher: a fat little fish, all underbite and teeth, facing right. */
function fish(p: Paint, v: string): void {
  const far = v === 'far';
  const bite = v === 'bite';
  const body = far ? shadeOf(C.body, 0.25) : C.body;
  // Tail fin and dorsal.
  p.shape(p.poly([-3.4, 0, -6.0, -2.4, -5.4, 0, -6.0, 2.4]), { fill: far ? shadeOf(C.fin, 0.25) : C.fin, ink: LINE * 0.5 });
  p.shape(p.smooth([-1.6, -2.0, -0.4, -3.6, 1.4, -2.2], true, 0.4), { fill: far ? shadeOf(C.fin, 0.25) : C.fin, ink: LINE * 0.45 });
  const shape = p.smooth([-3.8, 0, -1.6, -2.4, 1.6, -2.4, 3.6, -1.0, 4.0, 0.6, 2.6, 2.2, -1.4, 2.2]);
  p.shape(shape, { fill: { linear: [0, -2.4, 0, 2.2], stops: [[0, C.bodyDark], [0.45, body], [1, C.belly]] }, ink: LINE * 0.6, light: C.bodyLight, lightDepth: 0.25, lightAlpha: far ? 0.2 : 0.6 });
  // The jaw: a big underbite with teeth.
  if (bite) p.fill(p.poly([4.2, -0.2, 1.6, 0.6, 4.0, 1.8]), 0x3a0a10);
  for (let i = 0; i < 3; i++) p.fill(p.poly([3.6 - i * 0.8, bite ? -0.1 : 0.4, 3.2 - i * 0.8, bite ? -0.1 : 0.4, 3.4 - i * 0.8, bite ? 0.7 : -0.4]), C.teeth);
  p.line([1.4, 0.6, 4.0, 0.5], LINE * 0.4, INK, false, bite ? 0 : 0.7);
  // An angry eye.
  p.shape(p.circle(1.8, -1.0, 0.75), { fill: C.eye, ink: LINE * 0.4 });
  p.fill(p.circle(2.0, -0.95, 0.38), INK);
  p.line([1.0, -1.9, 2.6, -1.4], LINE * 0.5, INK);
}

function parts(): PartSpec[] {
  return [{ id: 'fish', w: 12, h: 9, px: 6.4, py: 4.4, variants: ['near', 'far', 'bite'], draw: fish }];
}

const IDS = Array.from({ length: COUNT }, (_, i) => `f${i}`);
/** Each fish's own little offset in the school. */
const SEED = IDS.map((_, i) => ({ ph: i / COUNT, r: 0.75 + ((i * 37) % 10) / 30, y: ((i * 53) % 7) - 3 }));

/** Faces a fish left (it swims that way) and puts the near ones in front. */
function face(p: Pose, id: string, left: boolean, near: boolean): void {
  if (left) p.size(id, -1, 1);
  p.show(id, near ? 'near' : 'far').front(id, near ? 20 : 10);
}

/**
 * The drawings each of the school's moves plays (docs/art-refs/gnasher-model-sheet.webp,
 * one gnasher): its 4-drawing swim, jaws chattering open and shut (the tell),
 * the dart (the leaders' jaws wide) and flopping both ways. Every fish plays
 * them at its own phase; the school's shapes (the circle, the ball, the line,
 * the heap) are the game's, below.
 */
export const GNASHER_FRAME_CLIPS: Readonly<Record<string, FrameClip>> = {
  swim: { frames: ['swim0', 'swim1', 'swim2', 'swim3'], fps: 10, loop: true },
  bunch: { frames: ['dart', 'bite'], fps: 10, loop: true },
  dart: { frames: ['dart', 'swim0', 'swim1', 'swim2', 'swim3'], fps: 16, loop: true },
  flop: { frames: ['flopUp', 'flopDown'], fps: 5, loop: true },
};

/** The drawing fish `i` shows at `t` of a clip `ms` long: its frames at their rate, offset by the fish's phase. */
function drawingAt(clip: FrameClip, frames: readonly string[], ms: number, t: number, i: number): string {
  const rate = clip.fps ?? 10;
  const k = Math.floor(((t * ms) / 1000) * rate + SEED[i].ph * frames.length * 3);
  return frames[((k % frames.length) + frames.length) % frames.length];
}

/** Faces a drawn fish left or right; the far ones a little smaller (deeper in the school) and behind. */
function faceDrawn(p: Pose, id: string, left: boolean, near: boolean): void {
  const k = near ? 1 : 0.86;
  p.size(id, left ? -k : k, k).front(id, near ? 20 : 10);
}

/** The school drawn: seven of the owner's gnashers, in the painted school's shapes. */
function drawnGnashers(img: HTMLImageElement): RigDef {
  const fish = cutoutPart(GNASHER_FRAMES, img, 'fish', frameNames(GNASHER_FRAMES), 'body');
  const C = GNASHER_FRAME_CLIPS;
  const clip = (ms: number, loop: boolean, pose: ClipDef['pose']): ClipDef => ({ ms, loop, pose });
  return {
    id: 'gnasher',
    parts: [fish],
    bones: IDS.map((id) => ({ id, x: 0, y: 0, part: 'fish', z: 10, dir: 1 as const })),
    fallback: 'swim',
    alias: { idle: 'swim' },
    bounds: { left: -24, right: 24, top: -16, bottom: 16 },
    clips: {
      swim: clip(2000, true, (t, p) => {
        // Circling in a loose ellipse, each at its own radius and depth, tails beating at their own phase.
        IDS.forEach((id, i) => {
          const s = SEED[i];
          const a = TAU * (t + s.ph);
          p.move(id, Math.cos(a) * 15 * s.r, Math.sin(a) * 6 * s.r + s.y * 0.6 + wave(t * 4, s.ph) * 0.4);
          p.set(id, wave(t * 3, s.ph) * 4);
          faceDrawn(p, id, Math.sin(a) > 0, Math.sin(a) > 0);
          p.show(id, drawingAt(C.swim, C.swim.frames, 2000, t, i));
        });
      }),
      bunch: clip(600, true, (t, p) => {
        // A tight ball, every head turned the same way, jaws chattering.
        IDS.forEach((id, i) => {
          const s = SEED[i];
          const a = TAU * s.ph;
          p.move(id, Math.cos(a) * 4 + wave(t * 3, s.ph) * 0.5, Math.sin(a) * 3.4 + s.y * 0.3);
          p.set(id, wave(t * 3, s.ph) * 3);
          faceDrawn(p, id, false, i % 2 === 0);
          p.show(id, drawingAt(C.bunch, C.bunch.frames, 600, t, i));
        });
      }),
      dart: clip(500, true, (t, p) => {
        // A line, jaws first: the two leaders' jaws wide, the rest beating their tails hard.
        IDS.forEach((id, i) => {
          const s = SEED[i];
          p.move(id, 14 - i * 5, s.y * 0.8 + wave(t * 2, s.ph) * 1.2);
          p.set(id, wave(t * 2, s.ph) * 4);
          faceDrawn(p, id, false, i % 2 === 0);
          p.show(id, i < 2 ? 'dart' : drawingAt(C.dart, C.swim.frames, 500, t, i));
        });
      }),
      flop: clip(800, true, (t, p) => {
        // A heap of flapping fish on the floor.
        IDS.forEach((id, i) => {
          const s = SEED[i];
          p.move(id, (i - 3) * 4.6, 7.4 - Math.abs(wave(t * 2, s.ph)) * 1.6);
          p.set(id, 0);
          faceDrawn(p, id, i % 2 === 1, true);
          p.show(id, drawingAt(C.flop, C.flop.frames, 800, t, i));
        });
      }),
    },
  };
}

/** The gnasher swarm's HD rig (Chapter 7): the owner's gnashers once loaded. */
export function gnasherRig(): RigDef {
  const img = cutoutImage(GNASHER_FRAMES.id);
  return img ? drawnGnashers(img) : paintedGnashers();
}

/** The painted school (before the drawings load, and in the rig tests): seven fish, posed as a school. */
function paintedGnashers(): RigDef {
  return {
    id: 'gnasher',
    parts: parts(),
    bones: IDS.map((id) => ({ id, x: 0, y: 0, part: 'fish', z: 10, dir: 1 as const })),
    fallback: 'swim',
    alias: { idle: 'swim' },
    bounds: { left: -24, right: 24, top: -16, bottom: 16 },
    clips: {
      swim: {
        ms: 2000,
        loop: true,
        pose: (t, p) => {
          // Circling in a loose ellipse, each at its own radius and depth.
          IDS.forEach((id, i) => {
            const s = SEED[i];
            const a = TAU * (t + s.ph);
            p.move(id, Math.cos(a) * 15 * s.r, Math.sin(a) * 6 * s.r + s.y * 0.6 + wave(t * 4, s.ph) * 0.4);
            p.set(id, wave(t * 3, s.ph) * 6);
            face(p, id, Math.sin(a) > 0, Math.sin(a) > 0);
          });
        },
      },
      bunch: {
        ms: 200,
        loop: true,
        pose: (t, p) => {
          // A tight ball, every head turned the same way, quivering.
          IDS.forEach((id, i) => {
            const s = SEED[i];
            const a = TAU * s.ph;
            p.move(id, Math.cos(a) * 4 + wave(t, s.ph) * 0.5, Math.sin(a) * 3.4 + s.y * 0.3);
            p.set(id, wave(t, s.ph) * 4);
            face(p, id, false, i % 2 === 0);
            p.show(id, 'bite');
          });
        },
      },
      dart: {
        ms: 220,
        loop: true,
        pose: (t, p) => {
          // A line, jaws first.
          IDS.forEach((id, i) => {
            const s = SEED[i];
            p.move(id, 14 - i * 5, s.y * 0.8 + wave(t, s.ph) * 1.2);
            p.set(id, wave(t, s.ph) * 6);
            face(p, id, false, i % 2 === 0);
            if (i < 2) p.show(id, 'bite');
          });
        },
      },
      flop: {
        ms: 420,
        loop: true,
        pose: (t, p) => {
          // A heap of flapping fish on the floor.
          IDS.forEach((id, i) => {
            const s = SEED[i];
            p.move(id, (i - 3) * 4.6, 6 + Math.abs(wave(t, s.ph)) * -2);
            p.set(id, 70 * wave(t, s.ph));
            face(p, id, i % 2 === 1, true);
          });
        },
      },
    },
  };
}
