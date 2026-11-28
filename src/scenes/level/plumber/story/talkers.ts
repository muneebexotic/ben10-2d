import type Phaser from 'phaser';
import type { Controls } from '../../../../systems/InputMap';
import type { FamilyActor } from '../../family/FamilyActor';
import type { SetPiece, StoryKit } from '../../story/StoryKit';

interface Talker {
  id: string;
  actor: FamilyActor;
  /** The drawing put over the actor's idle pose for the line on screen, or null. */
  clip: string | null;
}

/** Chapter 7's and 8's people on screen, by scene (the scene object outlives a run: `Talkers` resets its list). */
const REGISTRY = new WeakMap<Phaser.Scene, Talker[]>();

/** Puts `actor` on the list of people who strike a drawing while their line plays (`id` as the dialogue names them). */
export function talker(scene: Phaser.Scene, id: string, actor: FamilyActor): FamilyActor {
  REGISTRY.get(scene)?.push({ id, actor, clip: null });
  return actor;
}

/**
 * Whoever speaks the line on screen (Gwen, Max) turns to the drawing the line
 * names (`Line.pose`: a point, a shrug, arms folded), else their talk drawing,
 * while it plays, when they're standing idle; then back to idle. An HD clip
 * over the idle pose, so it needs no pose of its own on the pixel sheet. Built
 * first in the chapter's story, so actors made after it are on its list.
 * Ben strikes a line's pose too (`Player.storyPose`), only where the line
 * names one and only while a cutscene holds him.
 */
export class Talkers implements SetPiece {
  readonly cinematic = false;
  readonly storyLock = false;
  /** The pose this put on Ben, so a pose someone else set is never cleared. */
  private benPose: string | null = null;

  constructor(private readonly kit: StoryKit) {
    REGISTRY.set(kit.scene, []);
  }

  update(_dtMs: number, _realDtMs: number, _controls: Controls): void {
    const list = REGISTRY.get(this.kit.scene);
    if (!list) return;
    const dialogue = this.kit.dialogue;
    const who = dialogue.speaker;
    const pose = dialogue.speakerPose;
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
      const speaking = who === t.id && a.visible && !a.moving && (a.posing === 'idle' || a.posing === '');
      const want = speaking ? (pose ?? 'talk') : null;
      if (want === t.clip) continue;
      // A drawing this put up and someone else since replaced (a run) is theirs now.
      const mine = t.clip !== null && a.sprite.getData('hdClip') === t.clip;
      t.clip = want;
      if (want) a.sprite.setData('hdClip', want);
      else if (mine) a.sprite.setData('hdClip', null);
    }
    this.poseBen(who === 'ben' ? pose : null);
  }

  private poseBen(pose: string | null): void {
    const p = this.kit.player;
    const want = pose !== null && !p.controlsEnabled ? pose : null;
    if (want === this.benPose) return;
    if (p.storyPose === this.benPose) p.storyPose = want;
    this.benPose = want;
  }

  destroy(): void {
    REGISTRY.delete(this.kit.scene);
    if (this.kit.player.storyPose === this.benPose) this.kit.player.storyPose = null;
  }
}
