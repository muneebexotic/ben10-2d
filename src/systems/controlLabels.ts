export type InputKind = 'keyboard' | 'touch';

/**
 * Prompts are written with control tokens ({T}, {J}, {JUMP}...) and rendered
 * for whatever the player is actually holding.
 */
const LABELS: Record<string, Record<InputKind, string>> = {
  T: { keyboard: '[T]', touch: '[OMNITRIX]' },
  J: { keyboard: '[J]', touch: '[ATTACK]' },
  K: { keyboard: '[K]', touch: '[SPECIAL]' },
  G: { keyboard: '[G]', touch: '[GWEN]' },
  JUMP: { keyboard: '[SPACE]', touch: '[JUMP]' },
  UP: { keyboard: '[UP]', touch: 'STICK UP' },
  DOWN: { keyboard: '[DOWN]', touch: 'STICK DOWN' },
  MOVE: { keyboard: 'A/D', touch: 'STICK' },
  ARROWS: { keyboard: 'ARROWS/WASD', touch: 'TAP' },
  DIAL: { keyboard: '[Q]/[E]/[1-9]', touch: 'SWIPE/HOLD THE OMNITRIX' },
  PAUSE: { keyboard: '[ESC]', touch: '[II]' },
  CONFIRM: { keyboard: '[ENTER]', touch: 'TAP' },
  /** Cinematic dialogue. On touch the whole-scene skip is a SKIP >> button in the letterbox's corner (DialogBox). */
  SKIP: { keyboard: 'ANY KEY: NEXT   [ENTER] SKIP', touch: 'TAP: NEXT' },
};

export function formatControls(text: string, kind: InputKind): string {
  return text.replace(/\{([A-Z]+)\}/g, (match, token: string) => LABELS[token]?.[kind] ?? match);
}
