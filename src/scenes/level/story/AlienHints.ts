import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../config/constants';
import { PALETTE } from '../../../config/palette';
import { ROSTER } from '../../../config/roster';
import type { EntitySpawn } from '../../../levels/types';
import { playSfx } from '../../../systems/audio/Sfx';
import { pixelText } from '../../../ui/text';
import { TEX } from '../../preload/assetKeys';
import { SILHOUETTE_KEYS, type SilhouetteId } from '../../preload/silhouettes';
import type { SetPiece, StoryKit } from './StoryKit';
import { chance } from '../../../systems/Pacing';

type HintSpawn = Extract<EntitySpawn, { type: 'alienHint' }>;

interface Hint {
  spawn: HintSpawn;
  root: Phaser.GameObjects.Container;
  ghost: Phaser.GameObjects.Sprite | null;
  ghostX: number;
  ghostY: number;
  shown: boolean;
  said: boolean;
}

/**
 * Secrets for later: a card out of every current alien's reach. Its ghost
 * glints where it waits, and standing below it shows the locked silhouette of
 * the alien who could get there, and the chapter it arrives in.
 */
export class AlienHints implements SetPiece {
  readonly cinematic = false;
  readonly storyLock = false;
  private readonly hints: Hint[] = [];

  constructor(private readonly kit: StoryKit) {
    for (const e of kit.level.entities) {
      if (e.type !== 'alienHint' || kit.hasAlien(e.alien)) continue;
      this.hints.push(this.build(e));
    }
  }

  private build(spawn: HintSpawn): Hint {
    const { scene } = this.kit;
    const roster = ROSTER[spawn.alien];
    const items: Phaser.GameObjects.GameObject[] = [];
    items.push(scene.add.image(0, 0, TEX.light).setTint(PALETTE.omnitrix).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setScale(1.5));
    const key = SILHOUETTE_KEYS[spawn.alien as SilhouetteId];
    if (key) {
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1]]) {
        items.push(scene.add.image(dx, 4 + dy, key).setTintMode(Phaser.TintModes.FILL).setTint(PALETTE.omnitrix).setScale(1.4).setAlpha(0.9));
      }
      items.push(scene.add.image(0, 4, key).setTintMode(Phaser.TintModes.FILL).setTint(0x090b16).setScale(1.4));
      items.push(pixelText(scene, 0, 2, '?', { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix }));
    }
    items.push(pixelText(scene, 0, 34, 'LOCKED ALIEN', { originX: 0.5, originY: 0.5, color: PALETTE.omnitrix }));
    items.push(pixelText(scene, 0, 45, roster ? `UNLOCKS IN CHAPTER ${roster.chapter}` : 'NOT YET...', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim }));
    const cx = (spawn.x + spawn.w / 2) * TILE;
    const root = scene.add.container(cx, spawn.y * TILE - 20, items).setDepth(DEPTH.worldUi).setVisible(false);

    // The prize, glinting just out of reach.
    const card = this.kit.level.entities.find((e) => e.type === 'card' && e.requires === spawn.alien);
    let ghost: Phaser.GameObjects.Sprite | null = null;
    let gx = 0;
    let gy = 0;
    if (card && card.type === 'card') {
      gx = card.x * TILE + TILE / 2;
      gy = card.y * TILE - 14;
      ghost = scene.add.sprite(gx, gy, TEX.card, 0).setDepth(DEPTH.emissive).setAlpha(0.55);
    }
    return { spawn, root, ghost, ghostX: gx, ghostY: gy, shown: false, said: false };
  }

  update(_dtMs: number, realDtMs: number): void {
    const { player, lighting, fx } = this.kit;
    const now = this.kit.now();
    for (const h of this.hints) {
      if (h.ghost) {
        const spin = Math.cos(now * 0.0024);
        h.ghost.setScale(Math.max(0.1, Math.abs(spin)), 1).setFrame(spin >= 0 ? 0 : 1).setY(h.ghostY + Math.sin(now * 0.003) * 2);
        lighting.add(h.ghostX, h.ghostY, 40, PALETTE.gold, 0.5);
        if (chance(0.03)) fx.trail('gold', h.ghostX + (Math.random() - 0.5) * 12, h.ghostY + (Math.random() - 0.5) * 14);
      }
      const s = h.spawn;
      const inside = player.x >= s.x * TILE && player.x < (s.x + s.w) * TILE && player.y >= s.y * TILE && player.y <= (s.y + s.h) * TILE;
      if (inside && !h.shown) {
        h.shown = true;
        h.root.setVisible(true).setAlpha(0).setScale(0.6);
        this.kit.scene.tweens.add({ targets: h.root, alpha: 1, scale: 1, duration: 260, ease: 'Back.easeOut' });
        playSfx('pod', 0.5);
        if (!h.said) {
          h.said = true;
          this.kit.speech.show(s.line, 2400);
        }
      } else if (!inside && h.shown) {
        h.shown = false;
        this.kit.scene.tweens.add({ targets: h.root, alpha: 0, duration: 300, onComplete: () => h.root.setVisible(false) });
      }
      if (h.shown) {
        h.root.setY(s.y * TILE - 20 + Math.sin(now * 0.004) * 2);
        lighting.add(h.root.x, h.root.y, 60, PALETTE.omnitrix, 0.7);
      }
    }
    void realDtMs;
  }

  destroy(): void {
    for (const h of this.hints) h.root.destroy();
  }
}
