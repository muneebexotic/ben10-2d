import { afterEach, describe, expect, it } from 'vitest';
import { approach, chance, damp, frameScale, perFrame, REFERENCE_FRAME_MS, setFrameLength } from '../src/systems/Pacing';
import { referenceOffset } from '../src/systems/ReferenceIntegration';
import { createMotorState, gravityScale, stepMotor, type MotorStats } from '../src/systems/PlatformerMotor';
import { HUMAN_MOTOR, PLAYER } from '../src/config/player';
import { PHYSICS } from '../src/config/constants';
import { HEATBLAST_MOTOR } from '../src/config/aliens/heatblast';

const RATES = [30, 60, 90, 120, 144];
const frameMs = (hz: number) => Math.min(1000 / hz, PHYSICS.maxFrameMs);

afterEach(() => setFrameLength(REFERENCE_FRAME_MS));

describe('per-frame effects follow real time', () => {
  it('is exactly the old per-frame behaviour at 60 Hz', () => {
    setFrameLength(REFERENCE_FRAME_MS);
    expect(damp(100, 0.85)).toBeCloseTo(85, 10);
    expect(approach(0, 100, 0.06)).toBeCloseTo(6, 10);
    expect(perFrame(0.5)).toBeCloseTo(0.5, 10);
    expect(chance(0.3, () => 0.29)).toBe(true);
    expect(chance(0.3, () => 0.31)).toBe(false);
  });

  it('decays and closes gaps by the same amount per second at any refresh rate', () => {
    const second = (hz: number) => {
      setFrameLength(frameMs(hz));
      let v = 100;
      let x = 0;
      const frames = Math.round(1000 / frameMs(hz));
      for (let i = 0; i < frames; i++) {
        v = damp(v, 0.9);
        x = approach(x, 100, 0.06);
      }
      return { v, x };
    };
    const ref = second(60);
    for (const hz of RATES) {
      const r = second(hz);
      expect(r.v).toBeCloseTo(ref.v, 6);
      expect(r.x).toBeCloseTo(ref.x, 6);
    }
  });

  it('spawns the same number of particles per second at any refresh rate', () => {
    for (const p of [0.02, 0.3, 0.5]) {
      for (const hz of RATES) {
        setFrameLength(frameMs(hz));
        // This frame's chance is the 60 Hz chance scaled by the frame's length...
        const threshold = p * frameScale();
        expect(chance(p, () => threshold - 1e-9)).toBe(true);
        expect(chance(p, () => threshold + 1e-9)).toBe(false);
        // ...so the expected count per second is the same at every refresh rate.
        expect(threshold * (1000 / frameMs(hz))).toBeCloseTo(p * 60, 6);
      }
    }
  });
});

/**
 * A jump the way the game runs it: the Player's motor and gravity tuning set
 * the velocity, then Arcade updates velocity and moves the body (plus the
 * 60 Hz-matching offset when `matched`).
 */
function jump(stats: MotorStats, hz: number, holdMs: number, matched: boolean) {
  const dtMs = frameMs(hz);
  const dt = dtMs / 1000;
  const tuning = { fallMultiplier: PLAYER.fallGravityMultiplier, apexMultiplier: PLAYER.apexGravityMultiplier, apexThreshold: PLAYER.apexThreshold };
  const motor = createMotorState();
  let vx = stats.runSpeed;
  let vy = 0;
  let x = 0;
  let y = 0;
  let t = 0;
  let apex = 0;
  let grounded = true;
  for (let frame = 0; frame < 5000; frame++) {
    const held = t < holdMs;
    const r = stepMotor(motor, { moveX: 1, jumpPressed: frame === 0, jumpHeld: held }, stats, { vx, vy, grounded }, dtMs);
    vx = r.vx;
    vy = Math.min(r.vy, PLAYER.maxFallSpeed);
    const g = PHYSICS.gravity * gravityScale(vy, held, tuning);
    const before = vy;
    vy = Math.min(vy + g * dt, PLAYER.maxFallSpeed + 200);
    y += vy * dt + (matched ? referenceOffset(before, vy, dt) : 0);
    x += vx * dt;
    t += dtMs;
    apex = Math.min(apex, y);
    grounded = false;
    if (frame > 0 && y >= 0) break;
  }
  return { apex: -apex, distance: x };
}

describe('jump arcs match the 60 Hz feel at any refresh rate', () => {
  const full: Array<[string, MotorStats]> = [
    ['Ben', HUMAN_MOTOR],
    ['Heatblast', HEATBLAST_MOTOR],
  ];
  for (const [name, stats] of full) {
    it(`${name}: a full jump peaks within half a pixel of 60 Hz and lands within a frame's run`, () => {
      const ref = jump(stats, 60, 2000, false);
      // The offset is zero at 60 Hz: the tuned feel is untouched.
      expect(jump(stats, 60, 2000, true)).toEqual(ref);
      for (const hz of RATES) {
        const r = jump(stats, hz, 2000, true);
        expect(Math.abs(r.apex - ref.apex)).toBeLessThan(0.5);
        // A landing is detected on a frame, so it can land up to one frame's run later.
        expect(Math.abs(r.distance - ref.distance)).toBeLessThan(stats.runSpeed * (frameMs(hz) / 1000) + 0.5);
      }
    });

    it(`${name}: short hops stay within about a pixel of 60 Hz on average`, () => {
      // A release is seen on the next frame, so a hop's height depends on where the release falls;
      // averaged over hold lengths that sampling washes out and the integration shows.
      const average = (hz: number) => {
        let sumApex = 0;
        let n = 0;
        for (let hold = 60; hold <= 200; hold++, n++) sumApex += jump(stats, hz, hold, true).apex;
        return sumApex / n;
      };
      const ref = average(60);
      for (const hz of RATES) expect(Math.abs(average(hz) - ref)).toBeLessThan(1.5);
    });
  }
});
