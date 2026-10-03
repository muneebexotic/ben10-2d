import { describe, expect, it, vi } from 'vitest';
import EventEmitter from 'eventemitter3';

// Phaser needs a browser; these modules only use its event emitter (eventemitter3) and a constant.
vi.mock('phaser', () => ({ default: { Events: { EventEmitter }, Scale: { EXPAND: 4 } } }));

import { EventBus } from '../src/systems/EventBus';
import { StaticCuller } from '../src/scenes/level/StaticCuller';
import { wholeWidth } from '../src/systems/PixelScale';

describe('scene listeners', () => {
  it('a scene that subscribes in create and clears its context on shutdown leaves nothing behind', () => {
    const before = EventBus.listenerTotal();
    // Every scene in the game registers with itself as the context and calls offContext on SHUTDOWN.
    for (let restart = 0; restart < 50; restart++) {
      const scene = {};
      EventBus.on('hud:ready', () => undefined, scene);
      EventBus.on('level:quit', () => undefined, scene);
      EventBus.once('system:pause', () => undefined, scene);
      expect(EventBus.listenerTotal()).toBe(before + 3);
      EventBus.offContext(scene);
      expect(EventBus.listenerTotal()).toBe(before);
    }
  });

  it("clearing one scene's listeners keeps another scene's", () => {
    const level = {};
    const hud = {};
    const before = EventBus.listenerTotal();
    EventBus.on('hud:ready', () => undefined, level);
    EventBus.on('hud:ready', () => undefined, hud);
    EventBus.offContext(level);
    expect(EventBus.listenerTotal()).toBe(before + 1);
    EventBus.offContext(hud);
    expect(EventBus.listenerTotal()).toBe(before);
  });
});

/** A stand-in for a Phaser image: bounds and a visible flag that counts its changes. */
function fakeObject(x: number, y: number, w: number, h: number) {
  const obj = {
    visible: true,
    changes: 0,
    getBounds: () => ({ x, y, right: x + w, bottom: y + h }),
    setVisible(v: boolean) {
      if (v !== obj.visible) obj.changes++;
      obj.visible = v;
      return obj;
    },
  };
  return obj;
}

describe('static scenery culling', () => {
  const view = (x: number, y = 0) => ({ x, y, right: x + 800, bottom: y + 360 }) as Phaser.Geom.Rectangle;

  it('draws only what is near the camera, and touches an object only when it crosses the edge', () => {
    const culler = new StaticCuller();
    const near = fakeObject(100, 300, 20, 20);
    const far = fakeObject(3000, 300, 20, 20);
    const above = fakeObject(400, -900, 20, 20);
    for (const o of [near, far, above]) culler.add(o as never);
    culler.update(view(0));
    expect([near.visible, far.visible, above.visible]).toEqual([true, false, false]);
    for (let i = 0; i < 10; i++) culler.update(view(i));
    expect(near.changes + far.changes + above.changes).toBe(2);
    culler.update(view(2500));
    expect([near.visible, far.visible]).toEqual([false, true]);
  });

  it('keeps a margin so scenery is already there when it scrolls in', () => {
    const culler = new StaticCuller();
    const edge = fakeObject(820, 300, 10, 10);
    culler.add(edge as never);
    culler.update(view(0));
    expect(edge.visible).toBe(true);
  });
});

describe('whole-pixel game width', () => {
  it('drops the fraction EXPAND gives a wide screen, but not float noise under a whole number', () => {
    expect(wholeWidth(799.5145631067961)).toBe(799);
    expect(wholeWidth(639.9999999)).toBe(640);
    expect(wholeWidth(864)).toBe(864);
  });
});
