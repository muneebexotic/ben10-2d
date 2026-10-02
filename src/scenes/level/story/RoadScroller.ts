import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../config/constants';
import { ROAD } from '../../../config/chapter2';
import { PALETTE } from '../../../config/palette';
import type { Fx } from '../../../systems/Fx';
import { TEX } from '../../preload/assetKeys';
import type { HighwayBackdrop } from '../HighwayBackdrop';

interface Prop {
  img: Phaser.GameObjects.Image;
  /** Fraction of the road speed (far props crawl, near ones whip past). */
  depth: number;
}

const PROPS: Array<{ key: string; frame?: number; depth: number; layer: number; chance: number }> = [
  { key: TEX.cactus, depth: 0.85, layer: DEPTH.decorBack - 2, chance: 0.3 },
  { key: TEX.roadSign, depth: 1, layer: DEPTH.decorBack - 1, chance: 0.12 },
  { key: TEX.mileMarker, depth: 1, layer: DEPTH.decorBack - 1, chance: 0.18 },
  { key: TEX.cactusSmall, depth: 1, layer: DEPTH.decorBack - 1, chance: 0.2 },
  { key: TEX.billboard, frame: 0, depth: 0.7, layer: DEPTH.decorBack - 3, chance: 0.06 },
  { key: TEX.billboard, frame: 1, depth: 0.7, layer: DEPTH.decorBack - 3, chance: 0.06 },
  { key: TEX.skull, depth: 1, layer: DEPTH.decorBack - 1, chance: 0.08 },
];

/**
 * The highway as a treadmill: the vehicles stay put while the asphalt,
 * roadside props, speed lines and the whole backdrop rush past. Covers the
 * level ground in its stretch so nothing static shows through.
 */
export class RoadScroller {
  speed = 0;
  private readonly road: Phaser.GameObjects.TileSprite;
  private readonly rail: Phaser.GameObjects.TileSprite;
  private readonly props: Prop[] = [];
  private untilProp = 0;
  private untilLine = 0;
  private readonly left: number;
  private readonly right: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly fx: Fx,
    private readonly backdrop: HighwayBackdrop | null,
    centerX: number,
    private readonly roadY: number,
    halfWidth = 30 * TILE,
  ) {
    this.left = centerX - halfWidth;
    this.right = centerX + halfWidth;
    // Vehicles roll along the lane line, a few pixels into the asphalt.
    this.road = scene.add.tileSprite(this.left, roadY - 9, this.right - this.left, 176, TEX.road).setOrigin(0, 0).setDepth(DEPTH.terrain + 2);
    this.rail = scene.add.tileSprite(this.left, roadY - 20, this.right - this.left, 12, TEX.guardrail).setOrigin(0, 0).setDepth(DEPTH.decorBack - 1).setAlpha(0.85);
  }

  setVisible(on: boolean): void {
    this.road.setVisible(on);
    this.rail.setVisible(on);
    for (const p of this.props) p.img.setVisible(on);
  }

  update(dtMs: number, view: Phaser.Geom.Rectangle): void {
    const dist = (this.speed * dtMs) / 1000;
    this.road.tilePositionX += dist;
    this.rail.tilePositionX += dist * 0.95;
    if (this.backdrop) this.backdrop.travel += dist;
    if (this.speed <= 1) return;

    this.untilProp -= dist;
    if (this.untilProp <= 0) {
      this.untilProp = ROAD.propEvery * (0.5 + Math.random());
      this.spawnProp(view);
    }
    for (let i = this.props.length - 1; i >= 0; i--) {
      const p = this.props[i];
      p.img.x -= dist * p.depth;
      if (p.img.x < view.x - 120) {
        p.img.destroy();
        this.props.splice(i, 1);
      }
    }
    // Speed lines whipping past at road level and above.
    this.untilLine -= dtMs;
    if (this.untilLine <= 0) {
      this.untilLine = ROAD.speedLineEveryMs * (900 / Math.max(200, this.speed));
      const y = this.roadY - 10 - Math.random() * 150;
      this.fx.speedLine(view.right + 10, y, -1, Math.random() < 0.3 ? PALETTE.sunsetGlow : PALETTE.white);
    }
  }

  private spawnProp(view: Phaser.Geom.Rectangle): void {
    let roll = Math.random() * PROPS.reduce((a, p) => a + p.chance, 0);
    const spec = PROPS.find((p) => (roll -= p.chance) <= 0) ?? PROPS[0];
    const img = this.scene.add.image(view.right + 80, this.roadY - 18, spec.key, spec.frame ?? 0).setOrigin(0.5, 1).setDepth(spec.layer);
    if (spec.depth < 1) img.setTint(0xb8a8c0);
    this.props.push({ img, depth: spec.depth });
  }

  destroy(): void {
    this.road.destroy();
    this.rail.destroy();
    for (const p of this.props) p.img.destroy();
    this.props.length = 0;
  }
}
