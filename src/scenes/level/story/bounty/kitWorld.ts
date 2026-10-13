import type { HunterWorld } from '../../../../entities/hunters/HunterWorld';
import type { StoryKit } from '../StoryKit';

/** The hunters' view of the level, from a set piece's kit. Their banter only plays when nothing else is being said. */
export function kitWorld(kit: StoryKit): HunterWorld {
  const p = kit.player;
  return {
    get now() {
      return kit.now();
    },
    fx: kit.fx,
    lighting: kit.lighting,
    telegraph: kit.telegraph,
    projectiles: kit.projectiles,
    player: {
      get x() {
        return p.x;
      },
      get y() {
        return p.y;
      },
      get centerY() {
        return p.centerY;
      },
      get dead() {
        return p.dead;
      },
      get cloaked() {
        return p.cloaked;
      },
      get formId() {
        return p.form.id;
      },
    },
    isSolid: (x, y) => kit.world.isSolid(x, y),
    groundBelow: (x, y) => kit.world.groundBelow(x, y),
    salvo: (x, floorY, count, spread, warnMs) => kit.hazards?.salvo(x, floorY, count, spread, warnMs),
    blastPlayer: (x, y, radius, damage) => kit.hazards?.blasts.add(x, y, radius, damage),
    rockfall: (x, ceilingY) => kit.hazards?.rockfalls.drop(x, ceilingY),
    threat: (key, at) => kit.threat(key, at),
    cancelThreat: (key) => kit.cancelThreat(key),
    say: (who, text, ms) => {
      if (!kit.dialogue.playing) kit.dialogue.say(who, text, ms);
    },
  };
}
