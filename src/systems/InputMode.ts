import { EventBus } from './EventBus';
import { formatControls, type InputKind } from './controlLabels';

export { formatControls, type InputKind };

/** What the player last used. Touch devices start in touch mode; a key press switches back. */
class InputModeTracker {
  private kind: InputKind = 'keyboard';

  get current(): InputKind {
    return this.kind;
  }

  set(kind: InputKind): void {
    if (kind === this.kind) return;
    this.kind = kind;
    EventBus.emit('input:mode', { kind });
  }

  format(text: string): string {
    return formatControls(text, this.kind);
  }
}

export const inputMode = new InputModeTracker();
