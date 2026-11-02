import { DEPTH } from '../../../../config/constants';
import { TEX } from '../../../preload/assetKeys';
import { MAX_FRAME, MAX_FRAMES } from '../../../preload/family';
import { KEVIN_ACTOR_FRAME, KEVIN_ACTOR_FRAMES } from '../../../preload/kevin';
import { FamilyActor } from '../../family/FamilyActor';
import type { StoryKit } from '../../story/StoryKit';
import { talker } from './talkers';

/** Grandpa Max in Chapter 7's story (drawn by his rig in the HD look). */
export function plumberMax(kit: StoryKit): FamilyActor {
  const look = { texture: TEX.max, prefix: 'max', frameWidth: MAX_FRAME.w, frameHeight: MAX_FRAME.h, feetY: MAX_FRAME.feetY, frames: MAX_FRAMES, handHeight: 18 };
  return talker(kit.scene, 'max', new FamilyActor(kit.scene, look, DEPTH.player - 2));
}

/** Kevin in Chapter 7's story: glimpsed, then at the reactor. */
export function plumberKevin(kit: StoryKit): FamilyActor {
  const look = { texture: TEX.kevinActor, prefix: 'kevin', frameWidth: KEVIN_ACTOR_FRAME.w, frameHeight: KEVIN_ACTOR_FRAME.h, feetY: KEVIN_ACTOR_FRAME.feetY, frames: KEVIN_ACTOR_FRAMES, handHeight: 18 };
  return new FamilyActor(kit.scene, look, DEPTH.player - 2);
}
