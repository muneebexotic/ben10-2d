import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PHYSICS } from './constants';

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
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
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
