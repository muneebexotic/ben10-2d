import { TILE } from '../../config/constants';
import type { AbilityAction } from '../../aliens/types';
import type { LevelData, PromptZone } from '../../levels/types';
import { EventBus } from '../../systems/EventBus';

interface Timed {
  id: string;
  left: number;
}

/** Teach-through-play prompts: zone prompts from level data plus one-off contextual tips. */
export class Tutorial {
  private readonly done = new Set<string>();
  private readonly shown = new Set<string>();
  private zone: PromptZone | null = null;
  private zoneText = '';
  private readonly timed: Timed[] = [];
  private fireballs = 0;

  constructor(private readonly level: LevelData) {}

  complete(id: string): void {
    if (this.done.has(id)) return;
    this.done.add(id);
    EventBus.emit('hud:promptClear', { id });
    if (this.zone?.id === id) this.zone = null;
  }

  isDone(id: string): boolean {
    return this.done.has(id);
  }

  /** A one-off tip that clears itself after `ms` (or when completed). */
  tip(id: string, text: string, ms: number, priority = 5): void {
    if (this.shown.has(id) || this.done.has(id)) return;
    this.shown.add(id);
    EventBus.emit('hud:prompt', { id, text, priority });
    this.timed.push({ id, left: ms });
  }

  onAction(action: AbilityAction): void {
    if (action === 'fireball' && ++this.fireballs >= 4) this.complete('fireball');
    if (action === 'burst') this.complete('burst');
    if (action === 'roll' || action === 'punch') this.complete('human');
    if (action === 'parry') this.complete('parry');
  }

  update(dtMs: number, playerX: number, isAlien: boolean, omnitrixReady: boolean): void {
    for (let i = this.timed.length - 1; i >= 0; i--) {
      const t = this.timed[i];
      t.left -= dtMs;
      if (t.left <= 0 || this.done.has(t.id)) {
        EventBus.emit('hud:promptClear', { id: t.id });
        this.timed.splice(i, 1);
      }
    }

    const tx = playerX / TILE;
    const zone = this.level.prompts.find((z) => !this.done.has(z.id) && tx >= z.x && tx < z.x + z.w) ?? null;
    if (zone !== this.zone && this.zone) EventBus.emit('hud:promptClear', { id: this.zone.id });
    this.zone = zone;
    if (!zone) {
      this.zoneText = '';
      return;
    }
    const human = omnitrixReady ? (zone.readyText ?? zone.humanText) : zone.humanText;
    const text = (isAlien ? zone.alienText : human) ?? zone.text;
    if (text !== this.zoneText) {
      this.zoneText = text;
      EventBus.emit('hud:prompt', { id: zone.id, text, priority: 3 });
    }
  }
}
