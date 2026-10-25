import { CHAPTER_7 } from '../levels/chapter7';
import { enterPlumberBase } from '../scenes/level/plumber/presentation';
import { startRigViewer } from '../scenes/level/plumber/RigViewer';
import { DEV_TOOLS } from '../systems/LaunchParams';
import type { ChapterModule } from './types';

/** Chapter 7, The Plumbers: the descent under Keamari harbour and the Plumber base on the floor of the Arabian Sea (HD). */
export const CHAPTER: ChapterModule = {
  level: CHAPTER_7,
  enter: (scene) => {
    enterPlumberBase(scene);
    const query = new URLSearchParams(window.location.search);
    if (DEV_TOOLS && query.has('rigview')) scene.time.delayedCall(50, () => startRigViewer(scene, query));
  },
};
