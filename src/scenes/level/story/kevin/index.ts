import { TILE } from '../../../../config/constants';
import type { Controls } from '../../../../systems/InputMap';
import type { SetPiece, StoryKit } from '../StoryKit';
import type { UnlockBeat } from '../UnlockBeat';
import { CityIntro } from './CityIntro';
import { Drain } from './Drain';
import { Hunt } from './Hunt';
import { KevinActor } from './KevinActor';
import { KevinBuddy } from './KevinBuddy';
import { KevinMeet } from './KevinMeet';
import { LairLockdown } from './LairLockdown';
import { TheTurn } from './TheTurn';

/** Keeps the shared Kevin actor drawn every frame, whoever is moving him. */
class ActorRunner implements SetPiece {
  readonly cinematic = false;
  readonly storyLock = false;
  constructor(private readonly actor: KevinActor) {}
  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    this.actor.update(realDtMs);
  }
  destroy(): void {
    this.actor.destroy();
  }
}

/**
 * Chapter 4's story, built from its level data: the cold open, then Kevin,
 * from new friend to rival, through every set piece that shares him.
 */
export function buildKevinStory(kit: StoryKit, resumeX: number, unlockBeats: ReadonlyMap<string, UnlockBeat>): { intro: CityIntro | null; pieces: SetPiece[] } {
  const plan = kit.level.story;
  const pieces: SetPiece[] = [];
  const intro = plan?.cityIntro ? new CityIntro(kit, plan.cityIntro) : null;
  if (intro) pieces.push(intro);
  if (!plan?.kevin) return { intro, pieces };
  const actor = new KevinActor(kit);
  const buddy = new KevinBuddy(kit, actor);
  pieces.push(new ActorRunner(actor), buddy);
  pieces.push(new KevinMeet(kit, plan.kevin, actor, buddy, resumeX));
  const lair = plan.lair;
  if (lair) pieces.push(new LairLockdown(kit, lair, unlockBeats.get(lair.alien) ?? null, actor, buddy, resumeX));
  if (plan.drain) pieces.push(new Drain(kit, plan.drain, actor, resumeX));
  if (plan.absorb) pieces.push(new TheTurn(kit, plan.absorb, actor, resumeX));
  if (plan.hunt) pieces.push(new Hunt(kit, plan.hunt, actor, resumeX));
  // A restart part-way through: Kevin's already tagging along (or already gone).
  const px = resumeX;
  const met = px > plan.kevin.meetX * TILE;
  const inLair = lair && px > lair.triggerX * TILE - TILE && px <= lair.toX * TILE;
  const beforeDrain = !plan.drain || px < plan.drain.triggerX * TILE;
  if (met && beforeDrain) {
    if (inLair && lair) kit.scene.time.delayedCall(0, () => actor.appear(lair.kevinX * TILE + 8, lair.floor * TILE, 'watch'));
    else kit.scene.time.delayedCall(0, () => buddy.join(false));
  }
  return { intro, pieces };
}
