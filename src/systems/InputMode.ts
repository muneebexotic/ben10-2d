import { EventBus } from './EventBus';

export type InputKind = 'keyboard' | 'touch';

/**
 * Prompts are written with control tokens ({T}, {J}, {JUMP}...) and rendered
 * for whatever the player is actually holding.
 */
const LABELS: Record<string, Record<InputKind, string>> = {
  T: { keyboard: '[T]', touch: '[OMNITRIX]' },
  J: { keyboard: '[J]', touch: '[ATTACK]' },
  K: { keyboard: '[K]', touch: '[SPECIAL]' },
  JUMP: { keyboard: '[SPACE]', touch: '[JUMP]' },
  UP: { keyboard: '[UP]', touch: 'STICK UP' },
  DOWN: { keyboard: '[DOWN]', touch: 'STICK DOWN' },
  MOVE: { keyboard: 'A/D', touch: 'STICK' },
  DIAL: { keyboard: '[Q]/[E]', touch: 'SWIPE THE OMNITRIX' },
  PAUSE: { keyboard: '[ESC]', touch: '[II]' },
  CONFIRM: { keyboard: '[ENTER]', touch: 'TAP' },
};

export function formatControls(text: string, kind: InputKind): string {
  return text.replace(/\{([A-Z]+)\}/g, (match, token: string) => LABELS[token]?.[kind] ?? match);
}

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
