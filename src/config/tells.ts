import { PALETTE } from './palette';

/**
 * How a villain's telegraphs look. Red always means danger, so every tell is
 * danger red at the core; a villain's tells carry that villain's colour as a
 * thin edge so who is attacking still reads at a glance (BUGS.md D1). Every
 * villain gets an entry here; telegraph calls pass the entry, never a raw
 * villain colour (tests/tells.test.ts).
 */
export interface Tell {
  /** Always danger red (`PALETTE.enemy`). */
  readonly core: number;
  /** The villain's colour, drawn beside the core, never over it. */
  readonly edge: number;
}

export const TELL = {
  kevin: { core: PALETTE.enemy, edge: PALETTE.kevin },
  animo: { core: PALETTE.enemy, edge: PALETTE.animo },
  /** Chapter 5's bounty hunters. */
  sixsix: { core: PALETTE.enemy, edge: PALETTE.sixsix },
  kraab: { core: PALETTE.enemy, edge: PALETTE.kraab },
  tetrax: { core: PALETTE.enemy, edge: PALETTE.tetrax },
} as const satisfies Record<string, Tell>;

/** A villain's tell for an effect colour (Kevin's purple, Animo's violet...), or plain danger red. */
export function tellFor(color: number): Tell | number {
  for (const t of Object.values(TELL)) if (t.edge === color) return t;
  return PALETTE.enemy;
}
