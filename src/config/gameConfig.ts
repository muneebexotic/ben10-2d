import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PHYSICS } from './constants';
import { snapGameWidth } from '../systems/PixelScale';

export function createGameConfig(scenes: Phaser.Types.Scenes.SceneType[]): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.WEBGL,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#04060f',
    render: {
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      powerPreference: 'high-performance',
    },
    // EXPAND: the height stays 360 and wide screens get a wider view instead of side bars.
    // index.html keeps #game between 16:9 and 2.4:1 (GAME_MAX_WIDTH), so tablets letterbox
    // and ultra-wide windows pillarbox. (Phaser's min/max would clamp the CSS size instead.)
    scale: {
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // Whole-pixel game width on every screen (see PixelScale.ts).
    callbacks: { preBoot: snapGameWidth },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: PHYSICS.gravity },
        // The Level scene steps physics itself so hit-stop and slow motion stay smooth.
        fixedStep: false,
        customUpdate: true,
        debug: false,
      },
    },
    fps: { target: 60 },
    // Stick, jump and attack at the same time, plus a spare finger.
    input: { activePointers: 4 },
    disableContextMenu: true,
    scene: scenes,
  };
}
