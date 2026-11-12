import { TILE } from '../../../../config/constants';
import { music } from '../../../../systems/audio/Music';
import type { SetPiece, StoryKit } from '../../story/StoryKit';
import { inOpenSea, plumberTrack } from './seaMusicRules';

/**
 * Chapter 7's music follows Ben out of the hull and back: the open sea's
 * recording outside, the base's inside. It only acts when he crosses, so the
 * boss's music in the moon pool (far from the sea) is never touched.
 */
export class SeaMusic implements SetPiece {
  readonly cinematic = false;
  readonly storyLock = false;
  private inSea: boolean;

  constructor(private readonly kit: StoryKit) {
    this.inSea = plumberTrack(kit.player.x / TILE) === 'opensea';
    // Decoded now, so the turn at the hull is instant.
    music.preload(this.inSea ? 'deep' : 'opensea');
  }

  update(): void {
    const sea = inOpenSea(this.kit.player.x / TILE, this.inSea);
    if (sea === this.inSea) return;
    this.inSea = sea;
    this.kit.playMusic(sea ? 'opensea' : 'deep');
  }

  destroy(): void {}
}
