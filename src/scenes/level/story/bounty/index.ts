import type { SetPiece, StoryKit } from '../StoryKit';
import type { UnlockBeat } from '../UnlockBeat';
import { ColdOpen } from './ColdOpen';
import { CrystalCave } from './CrystalCave';
import { KraabHunt } from './KraabHunt';
import { LiftAmbush } from './LiftAmbush';
import { MineDive } from './MineDive';
import { NetTrap } from './NetTrap';
import { SixsixDuels } from './SixsixDuels';

/**
 * Chapter 5's story, built from its level data: the cold open on Vilgax's
 * ship, Sixsix's duels on Main Street, the jail (Ghostfreak), Kraab's hunt in
 * the rail tunnels, THE DEEP DIVE, the crystal cavern (Diamondhead) and the
 * lift (the forced misfire). THE HUNTERS themselves are the level's boss.
 */
export function buildBountyStory(kit: StoryKit, resumeX: number, unlockBeats: ReadonlyMap<string, UnlockBeat>): { intro: ColdOpen; pieces: SetPiece[] } {
  const plan = kit.level.story!.bounty!;
  const intro = new ColdOpen(kit, plan.coldOpen);
  const dive = new MineDive(kit, plan.dive, resumeX);
  const pieces: SetPiece[] = [
    intro,
    new SixsixDuels(kit, plan.duels, resumeX),
    new NetTrap(kit, plan.netTrap, unlockBeats.get(plan.netTrap.alien) ?? null, resumeX),
    new KraabHunt(kit, plan.kraabHunt, resumeX),
    dive,
    new CrystalCave(kit, plan.crystal, plan.dive.landX, unlockBeats.get(plan.crystal.alien) ?? null, resumeX, () => dive.done),
    new LiftAmbush(kit, plan.lift, plan.hunters.wall, resumeX),
  ];
  return { intro, pieces };
}
