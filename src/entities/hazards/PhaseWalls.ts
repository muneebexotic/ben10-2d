import Phaser from 'phaser';
import { PHASE_WALL } from '../../config/bounty';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import { CH5_TEX } from '../../scenes/preload/bounty';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import { chance } from '../../systems/Pacing';
import type { Player } from '../Player';
import type { Rect } from '../types';

export type PhaseWallLook = 'bars' | 'stone' | 'boards' | 'hidden';

const FRAME: Record<PhaseWallLook, number> = { bars: 0, stone: 1, boards: 2, hidden: 1 };

export interface PhaseWallSpec {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  look: PhaseWallLook;
}

interface Wall {
  spec: PhaseWallSpec;
  rect: Rect;
  image: Phaser.GameObjects.TileSprite;
  body: Phaser.Physics.Arcade.Image;
  /** Ben is inside it right now (phased). */
  inside: boolean;
}

/**
 * Walls only Ghostfreak walks through: solid for everyone and everything
 * (enemies and shots included) except Ghostfreak while he's phased. If his
 * phase ends inside one, he's pushed out to the nearer side.
 */
export class PhaseWalls {
  private readonly walls: Wall[] = [];
  private readonly box: Rect = { x: 0, y: 0, w: 0, h: 0 };

  constructor(
    scene: Phaser.Scene,
    specs: readonly PhaseWallSpec[],
    private readonly player: Player,
    private readonly fx: Fx,
    private readonly lighting: Lighting,
    addSolid: (r: Rect) => void,
  ) {
    for (const spec of specs) {
      const rect = { x: spec.x * TILE, y: spec.y * TILE, w: spec.w * TILE, h: spec.h * TILE };
      const image = scene.add.tileSprite(rect.x, rect.y, rect.w, rect.h, CH5_TEX.phaseWall, FRAME[spec.look]).setOrigin(0, 0).setDepth(DEPTH.terrain + 2);
      // A hidden wall is the level's own art (a sealed door, a wall); it only shows as a ripple while he's in it.
      const restAlpha = spec.look === 'hidden' ? 0 : 1;
      image.setAlpha(restAlpha);
      const body = scene.physics.add.staticImage(rect.x + rect.w / 2, rect.y + rect.h / 2, TEX.whitePx).setVisible(false);
      body.setDisplaySize(rect.w, rect.h).refreshBody();
      const wall: Wall = { spec, rect, image, body, inside: false };
      // Inside it when the phase ends: no physics push (it can shove him out the top); `eject` moves him out sideways.
      scene.physics.add.collider(player.zone, body, undefined, () => !player.phased && !wall.inside);
      addSolid(rect);
      this.walls.push(wall);
    }
  }

  /** The wall Ben's standing in or against (for prompts). */
  near(x: number, y: number, range: number): PhaseWallSpec | null {
    for (const w of this.walls) {
      const r = w.rect;
      if (x > r.x - range && x < r.x + r.w + range && y > r.y && y - 20 < r.y + r.h) return w.spec;
    }
    return null;
  }

  update(now: number): void {
    const p = this.player;
    const box = p.hurtbox(this.box);
    for (const w of this.walls) {
      const r = w.rect;
      const inside = !p.dead && box.x < r.x + r.w && box.x + box.w > r.x && box.y < r.y + r.h && box.y + box.h > r.y;
      if (inside && p.phased) {
        // Passing through: the wall ripples and goes see-through around him.
        w.image.setAlpha((w.spec.look === 'hidden' ? 0.3 : 0.55) + Math.sin(now * 0.02) * 0.1);
        if (chance(0.25)) this.fx.trail('ghost', p.x + (Math.random() - 0.5) * 14, p.centerY + (Math.random() - 0.5) * 20);
        this.lighting.add(p.x, p.centerY, 40, PALETTE.ghostfreak, 0.5);
      } else {
        w.image.setAlpha(w.spec.look === 'hidden' ? 0 : 1);
      }
      if (inside && !p.phased) this.eject(w, box);
      w.inside = inside;
    }
  }

  /** Solid again around him: out to the nearer side, never deeper in. */
  private eject(w: Wall, box: Rect): void {
    const p = this.player;
    const r = w.rect;
    const toLeft = box.x + box.w - r.x;
    const toRight = r.x + r.w - box.x;
    const half = box.w / 2;
    const x = toLeft < toRight ? r.x - half - 1 : r.x + r.w + half + 1;
    p.teleport(x, p.y);
    p.setVelocityX(Math.sign(x - p.x || 1) * PHASE_WALL.ejectSpeed * 0.2);
    this.fx.burst('ghost', p.x, p.centerY, 8);
  }

  destroy(): void {
    for (const w of this.walls) {
      w.image.destroy();
      w.body.destroy();
    }
    this.walls.length = 0;
  }
}
