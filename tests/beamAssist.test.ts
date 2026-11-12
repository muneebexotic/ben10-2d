import { describe, expect, it } from 'vitest';
import { aimBeam, type BeamDir } from '../src/entities/hazards/beamAssist';
import { SECURITY_LASER } from '../src/config/bounty';

const COS = Math.cos((SECURITY_LASER.reflectAssistDeg * Math.PI) / 180);
const RANGE = SECURITY_LASER.reflectAssistRange;
/** Up and to the right at the shield's 40-degree tilt. */
const tilted = (): BeamDir => ({ dx: Math.cos((-40 * Math.PI) / 180), dy: Math.sin((-40 * Math.PI) / 180) });

// Chapter 4's vault: the receiver over the emitter (tile 355, 27), the beam bounced at row 30's height.
const VAULT = { x: 5681, y: 433, w: 14, h: 14 };
const BEAM_Y = 488;
/** The rock the receiver is set into (tiles 356-357, rows 26-28): the beam stops on it. */
const ROCK = { x: 5696, y: 416, w: 32, h: 48 };

const inside = (x: number, y: number, r: typeof VAULT) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

/** Walks the bounced beam like LaserGrid does (3 px steps): whether it reaches the receiver before the rock. */
function reaches(x: number, y: number, dir: BeamDir, r: typeof VAULT, wall = ROCK): boolean {
  for (let len = 0; len < 400; len += 3) {
    x += dir.dx * 3;
    y += dir.dy * 3;
    if (inside(x, y, r)) return true;
    if (inside(x, y, wall)) return false;
  }
  return false;
}

describe('a beam bounced off the shield turns to a receiver it nearly meets', () => {
  it('without help, only a strip under two tiles wide in front of the vault lights it', () => {
    const lit = [];
    for (let bx = 5590; bx <= 5680; bx += 2) if (reaches(bx, BEAM_Y, tilted(), VAULT)) lit.push(bx);
    expect(lit.length).toBeGreaterThan(0);
    expect(lit[lit.length - 1] - lit[0]).toBeLessThan(32);
  });

  it('with it, anywhere between the crystal seal and the emitter lights it', () => {
    // Diamondhead stands between the seal (x 5584) and the emitter; the beam meets his shield about 23 px ahead of him.
    for (let px = 5592; px <= 5632; px += 2) {
      const dir = tilted();
      aimBeam(px + 23, BEAM_Y, dir, [VAULT], COS, RANGE);
      expect(reaches(px + 23, BEAM_Y, dir, VAULT), `Diamondhead at ${px}`).toBe(true);
    }
  });

  it('leaves a beam already on target as it is', () => {
    const dir = tilted();
    const before = { ...dir };
    // From here the 40-degree beam goes straight through the receiver.
    expect(reaches(5636, BEAM_Y, tilted(), VAULT)).toBe(true);
    aimBeam(5636, BEAM_Y, dir, [VAULT], COS, RANGE);
    expect(dir.dx).toBeCloseTo(before.dx, 1);
    expect(dir.dy).toBeCloseTo(before.dy, 1);
  });

  it("doesn't help a shield facing the wrong way, held level, or too far off", () => {
    const level: BeamDir = { dx: 1, dy: 0 };
    expect(aimBeam(5620, BEAM_Y, level, [VAULT], COS, RANGE)).toBe(false);
    const away: BeamDir = { dx: -Math.cos(0.7), dy: -Math.sin(0.7) };
    expect(aimBeam(5620, BEAM_Y, away, [VAULT], COS, RANGE)).toBe(false);
    expect(aimBeam(5681 - RANGE, BEAM_Y, tilted(), [VAULT], COS, RANGE)).toBe(false);
  });

  it('meets a wide crystal seam where the beam passes closest', () => {
    const seam = { x: 100, y: 100, w: 80, h: 14 };
    const none = { x: 0, y: 0, w: 0, h: 0 };
    // Heading to land just past the seam's right end: it bends onto that end, not to the seam's middle.
    const len = Math.hypot(60, 87);
    const dir: BeamDir = { dx: 60 / len, dy: 87 / len };
    expect(reaches(130, 20, { ...dir }, seam, none)).toBe(false);
    expect(aimBeam(130, 20, dir, [seam], COS, RANGE)).toBe(true);
    expect(reaches(130, 20, dir, seam, none)).toBe(true);
    expect(dir.dx).toBeGreaterThan(0.4);
  });
});
