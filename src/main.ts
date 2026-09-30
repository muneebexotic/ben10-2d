import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { LevelScene } from './scenes/LevelScene';
import { UIScene } from './scenes/UIScene';
import { PauseScene } from './scenes/PauseScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ChapterCompleteScene } from './scenes/ChapterCompleteScene';
import { GalleryScene } from './scenes/GalleryScene';
import { applySavedSettings } from './systems/Settings';

applySavedSettings();

const game = new Phaser.Game(
  createGameConfig([BootScene, PreloadScene, MenuScene, LevelScene, UIScene, PauseScene, GameOverScene, ChapterCompleteScene, GalleryScene]),
);

if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
