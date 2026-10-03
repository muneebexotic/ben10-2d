import type Phaser from 'phaser';

/** One page of the EXTRAS screen. Arrow keys browse; taps go straight to an item. */
export interface ExtrasPage {
  readonly root: Phaser.GameObjects.Container;
  /** Arrow keys / stick: move the selection. */
  move(dx: number, dy: number): void;
}
