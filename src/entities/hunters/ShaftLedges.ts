import Phaser from 'phaser';
import { DEPTH } from '../../config/constants';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Player } from '../Player';

interface Ledge {
  id: number;
  deck: Phaser.GameObjects.TileSprite;
  body: Phaser.Physics.Arcade.Image;
}

/**
 * Ledges a fight puts up at runtime (the mine lift shaft's maintenance ledges
 * in THE HUNTERS): one-way decks Ben jumps up through and stands on, or a
 * solid lid. They swing out with a clank and can be taken away again.
 */
export class ShaftLedges {
  private readonly list: Ledge[] = [];
  private nextId = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
  ) {}

  add(x: number, topY: number, w: number, solid: boolean): number {
    const scene = this.scene;
    const deck = scene.add.tileSprite(x, topY, w, 10, TEX.liftDeck).setOrigin(0, 0).setDepth(DEPTH.terrain + 1);
    const body = scene.physics.add.staticImage(x + w / 2, topY + 5, TEX.whitePx).setVisible(false);
    body.setDisplaySize(w, 10).refreshBody();
    const sb = body.body as Phaser.Physics.Arcade.StaticBody;
    if (!solid) {
      sb.checkCollision.down = false;
      sb.checkCollision.left = false;
      sb.checkCollision.right = false;
    }
    const p = this.player;
    scene.physics.add.collider(p.zone, body, undefined, () => solid || (p.now >= p.dropThroughUntil && p.vy >= 0 && p.y <= topY + 6));
    deck.setScale(0.1, 1);
    scene.tweens.add({ targets: deck, scaleX: 1, duration: 240, ease: 'Back.easeOut' });
    const ledge = { id: this.nextId++, deck, body };
    this.list.push(ledge);
    return ledge.id;
  }

  remove(id: number): void {
    const i = this.list.findIndex((l) => l.id === id);
    if (i < 0) return;
    const l = this.list[i];
    this.list.splice(i, 1);
    l.body.disableBody(true, true);
    this.scene.tweens.add({ targets: l.deck, alpha: 0, duration: 250, onComplete: () => l.deck.destroy() });
  }

  clear(): void {
    for (const l of this.list) {
      l.body.destroy();
      l.deck.destroy();
    }
    this.list.length = 0;
  }
}
