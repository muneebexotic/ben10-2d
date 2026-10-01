import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { LevelScene } from './scenes/LevelScene';
import { UIScene } from './scenes/UIScene';
import { TouchScene } from './scenes/TouchScene';
import { PauseScene } from './scenes/PauseScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ChapterCompleteScene } from './scenes/ChapterCompleteScene';
import { GalleryScene } from './scenes/GalleryScene';
import { SettingsScene } from './scenes/SettingsScene';
import { FileSelectScene } from './scenes/FileSelectScene';
import { DifficultyScene } from './scenes/DifficultyScene';
import { ChapterSelectScene } from './scenes/ChapterSelectScene';
import { applySavedSettings } from './systems/Settings';
import { installDeviceGuards } from './systems/Device';

applySavedSettings();

const game = new Phaser.Game(
  createGameConfig([
    BootScene,
    PreloadScene,
    MenuScene,
    FileSelectScene,
    DifficultyScene,
    ChapterSelectScene,
    LevelScene,
    UIScene,
    TouchScene,
    PauseScene,
    GameOverScene,
    ChapterCompleteScene,
    GalleryScene,
    SettingsScene,
  ]),
);

installDeviceGuards(game);

if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
