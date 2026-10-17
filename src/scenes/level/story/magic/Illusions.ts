import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../../config/constants';
import { PALETTE } from '../../../../config/palette';
import { FRAME } from '../../../../levels/tiles';
import type { Controls } from '../../../../systems/InputMap';
import type { SetPiece, StoryKit } from '../StoryKit';

interface FakeCell {
  img: Phaser.GameObjects.Image;
  cx: number;
  cy: number;
}

interface HiddenCell {
  tile: Phaser.Tilemaps.Tile;
  cx: number;
  cy: number;
}

/**
 * Hex's illusions laid over the level. A fake wall (or floor) is only a
 * picture: it looks like the stone around it, and Ben falls (or walks)
 * straight through it. A hidden floor is a real ledge nobody can see. Near
 * anything that senses (Gwen's REVEAL circle, Wildmutt's nose), the truth
 * shows: fakes turn to a shimmer, hidden ledges glow into view.
 */
export class Illusions implements SetPiece {
  private readonly fakes: FakeCell[] = [];
  private readonly hidden: HiddenCell[] = [];
  private t = 0;

  constructor(private readonly kit: StoryKit) {
    const world = kit.world;
    for (const e of kit.level.entities) {
      if (e.type !== 'illusion') continue;
      for (let y = e.y; y < e.y + e.h; y++) {
        for (let x = e.x; x < e.x + e.w; x++) {
          const cx = x * TILE + TILE / 2;
          const cy = y * TILE + TILE / 2;
          if (e.look === 'floor') {
            const tile = world.layer.getTileAt(x, y);
            if (tile) {
              tile.setAlpha(0);
              this.hidden.push({ tile, cx, cy });
            }
          } else {
            const frame = y === e.y ? FRAME.ROCK_TOP : FRAME.ROCK;
            // Over everything in the level (a card glowing behind a fake wall would give it away).
            const img = kit.scene.add.image(x * TILE, y * TILE, world.tilesKey, frame).setOrigin(0, 0).setDepth(DEPTH.emissive + 1);
            this.fakes.push({ img, cx, cy });
          }
        }
      }
    }
  }

  get cinematic(): boolean {
    return false;
  }

  get storyLock(): boolean {
    return false;
  }

  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    this.t += realDtMs;
    const p = this.kit.player;
    const r = p.senseRadius;
    const shimmer = 0.5 + Math.sin(this.t * 0.012) * 0.2;
    for (const f of this.fakes) {
      // Seen through, or Ben is inside it (he fell through: the trick's over).
      const inside = Math.abs(f.cx - p.x) < TILE && Math.abs(f.cy - p.centerY) < TILE * 1.5;
      const seen = inside || (r > 0 && Math.hypot(f.cx - p.x, f.cy - p.centerY) < r);
      f.img.setAlpha(seen ? 0.2 + (shimmer - 0.5) * 0.3 : 1);
      if (seen) f.img.setTint(PALETTE.manaGlow);
      else f.img.clearTint();
    }
    for (const h of this.hidden) {
      const seen = r > 0 && Math.hypot(h.cx - p.x, h.cy - p.centerY) < r;
      const want = seen ? shimmer + 0.3 : 0;
      h.tile.setAlpha(h.tile.alpha + (want - h.tile.alpha) * Math.min(1, realDtMs / 150));
      if (seen) this.kit.lighting.add(h.cx, h.cy, 18, PALETTE.manaGlow, 0.35);
    }
  }

  destroy(): void {
    for (const f of this.fakes) f.img.destroy();
  }
}
