import { DEEPMAW as D } from '../../../config/deepmaw';

/** 0 LIGHTS OUT, 1 HIGH AND DRY, 2 THE MAELSTROM. */
export type DeepStage = 0 | 1 | 2;

export type WetAttack = 'bait' | 'flash' | 'swallow';
export type DryAttack = 'slam' | 'roll' | 'leap';

/** The stage a health ratio belongs to. */
export function stageFor(ratio: number): DeepStage {
  return ratio <= D.stage3At ? 2 : ratio <= D.stage2At ? 1 : 0;
}

/** Health a fight resumed at `stage` starts with (the top of that stage's share of the bar). */
export function stageStartHp(stage: DeepStage, maxHp: number = D.maxHp): number {
  return stage === 2 ? Math.floor(maxHp * D.stage3At) : stage === 1 ? Math.floor(maxHp * D.stage2At) : maxHp;
}

/** Body hits: doubled while he's stunned, full while he's open (on dry land, after a lunge), halved otherwise. */
export function bodyMultiplier(stunned: boolean, open: boolean): number {
  if (stunned) return D.stunnedMultiplier;
  return open ? D.openMultiplier : D.guardMultiplier;
}

const WET_ORDER: Readonly<Record<0 | 2, readonly WetAttack[]>> = {
  0: ['bait', 'bait', 'flash'],
  2: ['swallow', 'bait', 'flash', 'swallow', 'bait'],
};

/** The `n`th attack (from 0) of a stage in the water. */
export function wetAttack(stage: 0 | 2, n: number): WetAttack {
  const order = WET_ORDER[stage];
  return order[n % order.length];
}

const DRY_ORDER: readonly DryAttack[] = ['slam', 'roll', 'leap', 'leap', 'slam', 'roll'];

/** The `n`th attack (from 0) on dry land: every `floodEvery`th he dives for the drain instead. */
export function dryAttack(n: number): DryAttack | 'flood' {
  if ((n + 1) % D.highAndDry.floodEvery === 0) return 'flood';
  const real = n - Math.floor((n + 1) / D.highAndDry.floodEvery);
  return DRY_ORDER[real % DRY_ORDER.length];
}

/** The moon pool's water in the maelstrom (tile row) at `ms` into it: a slow swing round its level. */
export function maelstromLevel(ms: number): number {
  const M = D.maelstrom;
  return M.level + Math.sin((ms / M.swingMs) * Math.PI * 2) * M.swing;
}

/** BAIT AND SWITCH: the lure stunned by this many different forms in one fight. */
export const BAIT_FORMS = 3;
