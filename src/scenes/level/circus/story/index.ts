import { TILE } from '../../../../config/constants';
import type { ChapterStory } from '../../../../chapters/types';
import type { TrackName } from '../../../../systems/audio/Music';
import type { SetPiece, StoryKit } from '../../story/StoryKit';
import type { UnlockBeat } from '../../story/UnlockBeat';
import { plumberMax } from '../../plumber/story/actors';
import { talker, Talkers } from '../../plumber/story/talkers';
import { CircusSystems } from '../CircusSystems';
import { Barrel, GwenTaken } from './Funhouse';
import { Heart } from './Heart';
import { Opening } from './Opening';
import { Show } from './Show';

/** The music turns as Ben goes indoors and out (only on a crossing, so the boss's own music is never touched). */
class MusicZones implements SetPiece {
  readonly cinematic = false;
  readonly storyLock = false;
  private lastX: number;

  constructor(
    private readonly kit: StoryKit,
    private readonly zones: ReadonlyArray<{ x: number; track: TrackName }>,
  ) {
    this.lastX = kit.player.x;
  }

  update(): void {
    const x = this.kit.player.x;
    for (const z of this.zones) {
      const edge = z.x * TILE;
      if (this.lastX < edge && x >= edge) this.kit.playMusic(z.track);
    }
    this.lastX = x;
  }

  destroy(): void {}
}

/** Chapter 8's story: the circus's toys and traps, and its set pieces in play order. */
export function buildCircusStory(kit: StoryKit, resumePx: number, unlockBeats: ReadonlyMap<string, UnlockBeat>): ChapterStory {
  // The level hands over where play resumes in pixels; Chapter 8's pieces work in tiles (0: a fresh start).
  const resumeX = resumePx / TILE;
  const talkers = new Talkers(kit);
  if (kit.gwen) talker(kit.scene, 'gwen', kit.gwen.actor);
  const systems = new CircusSystems(kit);
  const plan = kit.level.story?.circus;
  if (!plan) return { intro: null, pieces: [talkers, systems] };
  const max = plumberMax(kit);
  const fresh = !kit.continuing && kit.startCheckpoint === null;
  const intro = fresh ? new Opening(kit, plan, max) : null;
  // A checkpoint start between the opening and the funhouse: Gwen is already at Ben's side.
  if (!fresh && resumeX < plan.gwenTaken.triggerX) kit.gwen?.join(false, resumeX * TILE - 24);
  const music = new MusicZones(kit, [
    { x: 102, track: 'engine' },
    { x: 290, track: 'fair' },
  ]);
  return {
    intro,
    pieces: [
      talkers,
      systems,
      music,
      ...(intro ? [intro] : []),
      new Show(kit, plan, max, resumeX),
      new GwenTaken(kit, plan, resumeX),
      new Barrel(kit, plan, unlockBeats.get(plan.barrel.alien) ?? null, resumeX),
      new Heart(kit, plan, resumeX),
    ],
  };
}
