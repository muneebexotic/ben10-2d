/**
 * The whole alien roster from GAME_DESIGN.md: name and the chapter whose story
 * unlocks it. Aliens that aren't built yet still appear here, so secrets they
 * guard can say when to come back ("UNLOCKS IN CHAPTER 3").
 */
export const ROSTER: Readonly<Record<string, { name: string; chapter: number }>> = {
  heatblast: { name: 'HEATBLAST', chapter: 1 },
  fourarms: { name: 'FOUR ARMS', chapter: 2 },
  xlr8: { name: 'XLR8', chapter: 2 },
  wildmutt: { name: 'WILDMUTT', chapter: 3 },
  stinkfly: { name: 'STINKFLY', chapter: 3 },
  upgrade: { name: 'UPGRADE', chapter: 4 },
  diamondhead: { name: 'DIAMONDHEAD', chapter: 5 },
  ghostfreak: { name: 'GHOSTFREAK', chapter: 5 },
  greymatter: { name: 'GREY MATTER', chapter: 6 },
  ripjaws: { name: 'RIPJAWS', chapter: 7 },
  cannonbolt: { name: 'CANNONBOLT', chapter: 8 },
  wildvine: { name: 'WILDVINE', chapter: 10 },
  waybig: { name: 'WAY BIG', chapter: 12 },
};

export function inRoster(id: string): boolean {
  return id in ROSTER;
}
