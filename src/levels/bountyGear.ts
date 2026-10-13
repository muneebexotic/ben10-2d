import type { LevelData } from './types';

/** Entities drawn with Chapter 5's art (the mine's lasers, crystal gates, phase walls, dynamite, rockfalls). */
const BOUNTY_GEAR = new Set(['laser', 'receiver', 'crystalGate', 'phaseWall', 'dynamite', 'rockfall']);

/** Does this level use any of Chapter 5's gear (older chapters do, for the new aliens' secrets)? */
export function usesBountyGear(level: LevelData): boolean {
  return level.entities.some((e) => BOUNTY_GEAR.has(e.type));
}
