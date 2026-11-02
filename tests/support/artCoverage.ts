import { BEN_CARTOON } from '../../src/config/cartoon/ben';
import { GWEN_CARTOON } from '../../src/config/cartoon/gwen';
import { MAX_CARTOON } from '../../src/config/cartoon/max';
import { KEVIN_CARTOON } from '../../src/config/cartoon/kevin';
import { HEATBLAST_CARTOON } from '../../src/config/cartoon/heatblast';
import { FOURARMS_CARTOON } from '../../src/config/cartoon/fourarms';
import { XLR8_CARTOON } from '../../src/config/cartoon/xlr8';
import { WILDMUTT_CARTOON } from '../../src/config/cartoon/wildmutt';
import { STINKFLY_CARTOON } from '../../src/config/cartoon/stinkfly';
import { UPGRADE_CARTOON } from '../../src/config/cartoon/upgrade';
import { DIAMONDHEAD_CARTOON } from '../../src/config/cartoon/diamondhead';
import { GHOSTFREAK_CARTOON } from '../../src/config/cartoon/ghostfreak';
import { GREYMATTER_CARTOON } from '../../src/config/cartoon/greymatter';
import { RIPJAWS_CARTOON } from '../../src/config/cartoon/ripjaws';
import { WARDEN_CARTOON } from '../../src/config/cartoon/warden';
import { GRUNT_CARTOON } from '../../src/config/cartoon/grunt';
import { EEL_CARTOON } from '../../src/config/cartoon/eel';
import { JELLY_CARTOON } from '../../src/config/cartoon/jelly';
import { GNASHER_CARTOON } from '../../src/config/cartoon/gnasher';
import { DEEPMAW_CARTOON } from '../../src/config/cartoon/deepmaw';
import { BEN_FRAME_CLIPS } from '../../src/scenes/preload/cartoon/characters/ben';
import { GWEN_FRAME_CLIPS } from '../../src/scenes/preload/cartoon/characters/gwen';
import { KEVIN_FRAME_CLIPS } from '../../src/scenes/preload/cartoon/characters/kevin';
import { MAX_FRAME_CLIPS } from '../../src/scenes/preload/cartoon/characters/max';
import { RIPJAWS_FRAME_CLIPS } from '../../src/scenes/preload/cartoon/characters/ripjaws';
import { DEEPMAW_FRAME_CLIPS } from '../../src/scenes/preload/cartoon/characters/deepmaw';
import { WARDEN_FRAME_CLIPS } from '../../src/scenes/preload/cartoon/characters/deep/wardenClips';
import { GRUNT_FRAME_CLIPS } from '../../src/scenes/preload/cartoon/characters/deep/grunt';
import { EEL_FRAME_CLIPS } from '../../src/scenes/preload/cartoon/characters/deep/eel';
import type { FrameClip } from '../../src/scenes/preload/cartoon/cutout/frameRig';

/** Every rigged character, in the cast's order (`scenes/preload/cartoon/cast.ts`, which needs Phaser to load). */
const CAST = [BEN_CARTOON, GWEN_CARTOON, MAX_CARTOON, KEVIN_CARTOON, HEATBLAST_CARTOON, FOURARMS_CARTOON, XLR8_CARTOON, WILDMUTT_CARTOON, STINKFLY_CARTOON, UPGRADE_CARTOON, DIAMONDHEAD_CARTOON, GHOSTFREAK_CARTOON, GREYMATTER_CARTOON, RIPJAWS_CARTOON, WARDEN_CARTOON, GRUNT_CARTOON, EEL_CARTOON, JELLY_CARTOON, GNASHER_CARTOON, DEEPMAW_CARTOON];

export const COVERAGE_IDS = CAST.map((m) => m.id);

/** The characters drawn frame by frame from the owner's sheets (DECISIONS.md, "Characters drawn frame by frame"). */
const FRAMED: Readonly<Record<string, Readonly<Record<string, FrameClip>>>> = {
  ben: BEN_FRAME_CLIPS,
  gwen: GWEN_FRAME_CLIPS,
  max: MAX_FRAME_CLIPS,
  kevin: KEVIN_FRAME_CLIPS,
  ripjaws: RIPJAWS_FRAME_CLIPS,
  deepmaw: DEEPMAW_FRAME_CLIPS,
  warden: WARDEN_FRAME_CLIPS,
  grunt: GRUNT_FRAME_CLIPS,
  eel: EEL_FRAME_CLIPS,
};

/** Drawings named for something other than their clip. */
const ALIAS: Readonly<Record<string, readonly string[]>> = { lookHands: ['hands'], sad: ['worried'], angry: ['stern'], run: ['hop'], defeat: ['flop', 'beaten'], lure: ['bait'], spit: ['flash'], hurt: ['flinch'], talk: ['grin'], idle: ['swim', 'guard'], idleBare: ['guardBare'], flop: ['flopUp', 'flopDown'] };

export type Coverage = 'drawn' | 'stand-in' | 'waiting' | 'painted';

/** How one clip is drawn: its own drawing, another pose's drawing, none yet (the standing drawing), or the painted rig. */
export function clipCoverage(clip: string, frames: Readonly<Record<string, FrameClip>> | undefined): { status: Coverage; drawings: string } {
  if (!frames) return { status: 'painted', drawings: '' };
  const fc = frames[clip];
  if (!fc) return { status: 'waiting', drawings: '' };
  const names = [...new Set(fc.frames)];
  const own = [clip, ...(ALIAS[clip] ?? [])];
  const drawn = names.some((n) => own.includes(n.replace(/\d+$/, ''))) || (clip === 'idle' && names.includes('stand'));
  return { status: drawn ? 'drawn' : 'stand-in', drawings: names.join(', ') };
}

/** docs/ART_COVERAGE.md: every character's animations and how each is drawn right now. */
export function artCoverage(): string {
  const rows: string[] = [];
  const sections: string[] = [];
  for (const m of CAST) {
    const frames = FRAMED[m.id];
    const clips = [...Object.keys(m.clips), ...Object.keys(frames ?? {}).filter((c) => !(c in m.clips))];
    const count: Record<Coverage, number> = { drawn: 0, 'stand-in': 0, waiting: 0, painted: 0 };
    const lines = [`## ${m.name} (\`${m.id}\`)`, '', '| Animation | What it is | Now | Drawings |', '|---|---|---|---|'];
    for (const clip of clips) {
      const c = clipCoverage(clip, frames);
      count[c.status]++;
      lines.push(`| ${clip} | ${m.clips[clip] ?? '(story pose)'} | ${c.status} | ${c.drawings} |`);
    }
    if (m.gaps?.length) lines.push('', `Known gaps: ${m.gaps.join('; ')}.`);
    sections.push(lines.join('\n'));
    rows.push(`| ${m.name} | ${clips.length} | ${count.drawn} | ${count['stand-in']} | ${count.waiting} | ${count.painted} |`);
  }
  return [
    '# Art coverage (Act 3)',
    '',
    'Generated from the cartoon manifests (`src/config/cartoon/`) and the frame clips (`<ID>_FRAME_CLIPS` in `scenes/preload/cartoon/characters/`). Regenerate with `UPDATE_ART_COVERAGE=1 npx vitest run tests/artCoverage.test.ts`; `npm test` fails while this file is out of date.',
    '',
    '- **drawn**: plays the owner\'s drawing made for it.',
    '- **stand-in**: plays another pose\'s drawing (the standing drawing, a run frame) until its sheet arrives.',
    '- **waiting**: the character is drawn frame by frame but this animation has no drawing yet: it shows the standing drawing.',
    '- **painted**: the character has no animation sheets yet; its rig is painted in code (complete, every animation moves).',
    '',
    'The prompts for every sheet still needed are in the Animation Sheet Prompts page (PROGRESS.md).',
    '',
    '| Character | Animations | Drawn | Stand-in | Waiting | Painted |',
    '|---|---|---|---|---|---|',
    ...rows,
    '',
    ...sections.flatMap((s) => [s, '']),
  ].join('\n');
}
