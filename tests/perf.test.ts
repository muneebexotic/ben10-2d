import { describe, expect, it, vi } from 'vitest';
import EventEmitter from 'eventemitter3';

// Phaser needs a browser; the EventBus only uses its event emitter (eventemitter3).
vi.mock('phaser', () => ({ default: { Events: { EventEmitter } } }));

import { EventBus } from '../src/systems/EventBus';

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
