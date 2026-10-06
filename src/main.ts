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
import { ActEndScene } from './scenes/ActEndScene';
import { ExtrasScene } from './scenes/ExtrasScene';
import { GalleryScene } from './scenes/GalleryScene';
import { SettingsScene } from './scenes/SettingsScene';
import { FileSelectScene } from './scenes/FileSelectScene';
import { DifficultyScene } from './scenes/DifficultyScene';
import { ChapterSelectScene } from './scenes/ChapterSelectScene';
import { ArcadeScene } from './scenes/ArcadeScene';
import { AutobenchScene } from './scenes/AutobenchScene';
import { applySavedSettings, installPageAudio } from './systems/Settings';
import { installDeviceGuards } from './systems/Device';
import { DEV_TOOLS } from './systems/LaunchParams';
import { trainingOptions } from './systems/TrainingState';
import { EventBus } from './systems/EventBus';
import { inputMode } from './systems/InputMode';
import { audio } from './systems/audio/AudioEngine';
import { contextVariant } from './systems/PerfSwitches';
import { installRenderSwitches } from './systems/RenderSwitches';

applySavedSettings();
installPageAudio();

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
    ActEndScene,
    ExtrasScene,
    GalleryScene,
    SettingsScene,
    ArcadeScene,
    AutobenchScene,
  ], contextVariant),
);

// Bisect switches that act on the renderer (see PerfSwitches.ts); installed once the renderer exists.
game.events.once(Phaser.Core.Events.READY, () => installRenderSwitches(game));

installDeviceGuards(game);

if (DEV_TOOLS) {
  Object.assign(window, { __game: game, __trainingOptions: trainingOptions, __bus: EventBus, __inputMode: inputMode, __audio: audio });
}
