import type { SetPiece, StoryKit } from '../StoryKit';
import type { UnlockBeat } from '../UnlockBeat';
import { createMax } from './actors';
import { CharmCage } from './CharmCage';
import { ColdOpen } from './ColdOpen';
import { EngineVent } from './EngineVent';
import { GateRam } from './GateRam';
import { Illusions } from './Illusions';
import { Locals } from './Locals';
import { MaxTunnel } from './MaxTunnel';
import { SpellLessons } from './SpellLessons';
import { TowerClimb } from './TowerClimb';

/**
 * Chapter 6's story, built from its level data: the cold open (the port, the
 * fair, Hex's show), the locals, Hex's illusions, the gate the Rustbucket
 * rams, Gwen's three lessons, Charmcaster's cage (Grey Matter), Max in the
 * tunnel, the Spell Engine and THE TOWER WRAP. HEX AND CHARMCASTER are the
 * level's boss.
 */
export function buildMagicStory(kit: StoryKit, resumeX: number, unlockBeats: ReadonlyMap<string, UnlockBeat>): { intro: ColdOpen; pieces: SetPiece[] } {
  const plan = kit.level.story!.magic!;
  const max = createMax(kit);
  const intro = new ColdOpen(kit, plan.coldOpen, max);
  const engine = new EngineVent(kit, plan.engine, resumeX);
  const pieces: SetPiece[] = [
    intro,
    new Locals(kit),
    new Illusions(kit),
    new GateRam(kit, plan.gate, max, resumeX),
    new SpellLessons(kit, plan.lessons, resumeX),
    new CharmCage(kit, plan.cage, unlockBeats.get(plan.cage.alien) ?? null, resumeX),
    new MaxTunnel(kit, plan.max, max, resumeX),
    engine,
    new TowerClimb(kit, plan.tower, () => engine.done, resumeX),
    { update: () => undefined, cinematic: false, storyLock: false, destroy: () => max.destroy() },
  ];
  return { intro, pieces };
}
