import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../../config/constants';
import type { LocalId } from '../../../../levels/types';
import type { Controls } from '../../../../systems/InputMap';
import { CH6_TEX } from '../../../preload/karachi/keys';
import type { SetPiece, StoryKit } from '../StoryKit';
import { LOCAL_LINES } from './lines';

interface Local {
  who: LocalId;
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  talks: number;
  /** Ben must walk this far away before a second line. */
  armed: boolean;
}

const TALK_RANGE = 3 * TILE;
const REARM_RANGE = 9 * TILE;
const TEXTURE: Record<LocalId, string> = { rauf: CH6_TEX.rauf, rafiq: CH6_TEX.rafiq, zain: CH6_TEX.zain };

/**
 * Karachi's locals at the fair: Rauf at his chai dhaba, Zain (Ben's biggest
 * fan) and Rafiq by his rickshaw. Walk up to one and they say their line in
 * the dialogue box (a different one for some aliens, a second one when Ben
 * comes back). Karachi has seen worse: they stay put through the fighting.
 */
export class Locals implements SetPiece {
  private readonly locals: Local[] = [];

  constructor(private readonly kit: StoryKit) {
    for (const e of kit.level.entities) {
      if (e.type !== 'local') continue;
      const x = e.x * TILE + TILE / 2;
      const sprite = kit.scene.add.sprite(x, e.y * TILE, TEXTURE[e.who], 0).setOrigin(0.5, 1).setDepth(DEPTH.decor + 1).setFlipX(e.flip === true);
      sprite.play(`${e.who}-idle`);
      this.locals.push({ who: e.who, sprite, x, talks: 0, armed: true });
    }
  }

  get cinematic(): boolean {
    return false;
  }

  get storyLock(): boolean {
    return false;
  }

  update(_dtMs: number, _realDtMs: number, _controls: Controls): void {
    const p = this.kit.player;
    for (const l of this.locals) {
      const near = Math.abs(p.x - l.x) < TALK_RANGE && Math.abs(p.y - l.sprite.y) < 2 * TILE;
      l.sprite.setFlipX(p.x < l.x);
      if (!l.armed) {
        if (Math.abs(p.x - l.x) > REARM_RANGE) l.armed = true;
        continue;
      }
      if (!near || p.dead || this.kit.dialogue.playing) continue;
      l.armed = false;
      const lines = LOCAL_LINES[l.who];
      const text = lines.form?.[p.form.id] ?? (l.talks === 0 ? lines.first : lines.again);
      l.talks++;
      this.kit.dialogue.say(l.who, text, 2800);
    }
  }

  destroy(): void {
    for (const l of this.locals) l.sprite.destroy();
  }
}
