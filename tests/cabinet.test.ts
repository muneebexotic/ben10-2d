import { describe, expect, it, vi } from 'vitest';

// Phaser needs a browser; the cabinet only uses a blend-mode constant from it.
vi.mock('phaser', () => ({ default: { BlendModes: { ADD: 1 } } }));
vi.mock('../src/systems/audio/Sfx', () => ({ playSfx: () => undefined }));

import { Cabinet } from '../src/entities/tech/Cabinet';
import type { TechDeps } from '../src/entities/tech/Machine';
import { TECH } from '../src/config/tech';
import { TimeController } from '../src/systems/TimeController';

/** A stand-in for a Phaser sprite or image: every method chains, and frames are numbers like a real sheet's. */
function fakeSprite(): unknown {
  const state = { frame: { name: 0 } };
  const self: unknown = new Proxy(state, {
    get(t, k) {
      if (k === 'frame') return t.frame;
      if (k === 'setFrame') return (f: number) => ((t.frame = { name: f }), self);
      return () => self;
    },
  });
  return self;
}

/**
 * Upgrade merges into an arcade cabinet: it boots, fires GAME OVER once and
 * dies. The blast's hit-stop freezes gameplay time, and the cabinet still
 * updates while frozen (with dt 0), so its trigger has to latch. It used to
 * fire again on every frozen frame, refreshing the hit-stop forever: the
 * world stood still for good.
 */
describe('arcade cabinet', () => {
  it('fires GAME OVER once and the world carries on', () => {
    const time = new TimeController();
    let blasts = 0;
    let pixelBursts = 0;
    const deps = {
      scene: {
        add: {
          sprite: fakeSprite,
          image: fakeSprite,
        },
      },
      lighting: { add: () => undefined },
      fx: {
        burst: (kind: string) => {
          if (kind === 'pixel') pixelBursts++;
        },
        flash: () => undefined,
        ring: () => undefined,
        popText: () => undefined,
        shake: () => undefined,
        hitStop: (ms: number) => time.hitStop(ms),
      },
      blast: () => {
        blasts++;
        return 1;
      },
    } as unknown as TechDeps;

    const cab = new Cabinet(deps, 'cab-1', 10, 20, 0, false);
    cab.enter(1);
    let gameMs = 0;
    for (let frame = 0; frame < 180; frame++) {
      const dt = time.step(1000 / 60);
      gameMs += dt;
      cab.update(dt);
    }
    expect(blasts).toBe(1);
    expect(pixelBursts).toBe(1);
    expect(time.frozen).toBe(false);
    expect(cab.holding).toBe(false);
    // Three seconds of real time: everything but the one hit-stop is game time.
    expect(gameMs).toBeGreaterThan(2500);
    expect(gameMs).toBeGreaterThan(TECH.cabinet.releaseMs);
  });
});
