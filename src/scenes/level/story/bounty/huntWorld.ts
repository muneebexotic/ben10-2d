import Phaser from 'phaser';
import { ShaftLedges } from '../../../../entities/hunters/ShaftLedges';
import type { ArenaDeps } from '../../BossArena';
import type { StoryKit } from '../StoryKit';

/** What THE HUNTERS can reach in the level (Chapter 5's boss moves through it). */
export function huntWorld(kit: StoryKit): NonNullable<ArenaDeps['hunt']> {
  const ledges = new ShaftLedges(kit.scene, kit.player);
  kit.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => ledges.clear());
  const { player, world, dialogue } = kit;
  return {
    level: kit.level,
    player: {
      get cloaked() {
        return player.cloaked;
      },
      get formId() {
        return player.form.id;
      },
    },
    isSolid: (x, y) => world.isSolid(x, y),
    groundBelow: (x, y) => world.groundBelow(x, y),
    salvo: (x, floorY, count, spread, warnMs) => kit.hazards?.salvo(x, floorY, count, spread, warnMs),
    blastPlayer: (x, y, r, d) => kit.hazards?.blasts.add(x, y, r, d),
    rockfall: (x, cy) => kit.hazards?.rockfalls.drop(x, cy),
    collapse: (rect) => kit.collapse(rect),
    say: (who, text, ms) => {
      if (!dialogue.playing) dialogue.say(who, text, ms);
    },
    addLedge: (x, topY, w, solid) => ledges.add(x, topY, w, solid),
    removeLedge: (id) => ledges.remove(id),
  };
}
