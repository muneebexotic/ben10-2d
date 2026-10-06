import Phaser from 'phaser';
import { getAlien, hasAlien } from '../aliens/registry';
import type { AchievementIcon } from '../config/achievements';
import { PALETTE } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import { ACH_ICON_FRAMES } from '../scenes/preload/uiArt';

/** The texture and frame for an achievement's icon. */
export function achievementIcon(icon: AchievementIcon): { key: string; frame: number } {
  if (icon in ACH_ICON_FRAMES) return { key: TEX.achIcons, frame: ACH_ICON_FRAMES[icon as keyof typeof ACH_ICON_FRAMES] };
  if (icon === 'ben') return { key: TEX.iconBen, frame: 0 };
  if (icon === 'smoothy') return { key: TEX.smoothy, frame: 0 };
  if (icon === 'card') return { key: TEX.cardIcon, frame: 1 };
  if (icon === 'boss') return { key: TEX.bossIcon, frame: 0 };
  if (icon === 'heart') return { key: TEX.heart, frame: 0 };
  if (hasAlien(icon)) return { key: getAlien(icon).hudIcon, frame: 0 };
  return { key: TEX.achIcons, frame: 0 };
}

/** A round medal with the icon in it: gold when earned, a dim outline when not. */
export function achievementBadge(scene: Phaser.Scene, x: number, y: number, icon: AchievementIcon, earned: boolean, radius = 11): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.ink, 1).fillCircle(0, 0, radius + 1);
  g.fillStyle(earned ? 0x3a2a10 : PALETTE.uiPanel, 1).fillCircle(0, 0, radius);
  g.lineStyle(2, earned ? PALETTE.gold : PALETTE.uiPanelLight, 1).strokeCircle(0, 0, radius - 1);
  const { key, frame } = achievementIcon(icon);
  const img = scene.add.image(0, 0, key, frame);
  const fit = (radius * 1.3) / Math.max(img.width, img.height);
  img.setScale(Math.max(0.5, Math.floor(fit * 2) / 2 || fit));
  if (!earned) img.setTintMode(Phaser.TintModes.FILL).setTint(0x3a3f5c);
  return scene.add.container(x, y, [g, img]);
}
