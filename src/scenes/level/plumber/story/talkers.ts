import type Phaser from 'phaser';
import type { Controls } from '../../../../systems/InputMap';
import type { FamilyActor } from '../../family/FamilyActor';
import type { SetPiece, StoryKit } from '../../story/StoryKit';

interface Talker {
  id: string;
  actor: FamilyActor;
  talking: boolean;
}

/** Chapter 7's people on screen, by scene (the scene object outlives a run: `Talkers` resets its list). */
const REGISTRY = new WeakMap<Phaser.Scene, Talker[]>();

/** Puts `actor` on the list of people who strike their talk drawing while their line plays (`id` as the dialogue names them). */
export function talker(scene: Phaser.Scene, id: string, actor: FamilyActor): FamilyActor {
  REGISTRY.get(scene)?.push({ id, actor, talking: false });
  return actor;
}

/**
 * Whoever speaks the line on screen (Gwen, Max) turns to their talk drawing
 * while it plays, when they're standing idle; then back to idle. An HD clip
 * over the idle pose, so it needs no pose of its own on the pixel sheet. Built
 * first in the chapter's story, so actors made after it are on its list.
 */
export class Talkers implements SetPiece {
  readonly cinematic = false;
  readonly storyLock = false;

  constructor(private readonly kit: StoryKit) {
    REGISTRY.set(kit.scene, []);
  }

  update(_dtMs: number, _realDtMs: number, _controls: Controls): void {
    const list = REGISTRY.get(this.kit.scene);
    if (!list) return;
    const who = this.kit.dialogue.speaker;
    for (let i = list.length - 1; i >= 0; i--) {
      const t = list[i];
      const a = t.actor;
      // Destroyed with its set piece.
      if (!a.sprite.scene) {
        list.splice(i, 1);
        continue;
      }
      // Over the idle pose (Gwen at Ben's side re-poses herself every frame; a new pose such as a run clears it).
      // ('' is an actor placed but never posed: its first idle frame.)
      const want = who === t.id && a.visible && !a.moving && (a.posing === 'idle' || a.posing === '');
      if (want === t.talking) continue;
      t.talking = want;
      if (want) a.sprite.setData('hdClip', 'talk');
      else if (a.sprite.getData('hdClip') === 'talk') a.sprite.setData('hdClip', null);
    }
  }

  destroy(): void {
    REGISTRY.delete(this.kit.scene);
  }
}
