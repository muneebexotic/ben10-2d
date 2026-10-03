import Phaser from 'phaser';
import type { GameEventName, GameEvents } from './events';

type Handler<K extends GameEventName> = (payload: GameEvents[K]) => void;

/** Typed wrapper around a single global emitter so scenes never hold references to each other. */
class TypedEventBus {
  private readonly emitter = new Phaser.Events.EventEmitter();

  emit<K extends GameEventName>(
    event: K,
    ...payload: GameEvents[K] extends undefined ? [] : [GameEvents[K]]
  ): void {
    this.emitter.emit(event, payload[0]);
  }

  on<K extends GameEventName>(event: K, handler: Handler<K>, context?: unknown): this {
    this.emitter.on(event, handler, context);
    return this;
  }

  once<K extends GameEventName>(event: K, handler: Handler<K>, context?: unknown): this {
    this.emitter.once(event, handler, context);
    return this;
  }

  off<K extends GameEventName>(event: K, handler?: Handler<K>, context?: unknown): this {
    this.emitter.off(event, handler, context);
    return this;
  }

  /** Every live listener across all events (leak checks: it must not grow as scenes come and go). */
  listenerTotal(): number {
    let n = 0;
    for (const name of this.emitter.eventNames()) n += this.emitter.listenerCount(name);
    return n;
  }

  /** Removes every listener registered with the given context (call from a scene's shutdown). */
  offContext(context: unknown): void {
    for (const name of this.emitter.eventNames()) {
      for (const listener of this.emitter.listeners(name)) {
        this.emitter.off(name, listener as (...args: unknown[]) => void, context);
      }
    }
  }
}

export const EventBus = new TypedEventBus();
