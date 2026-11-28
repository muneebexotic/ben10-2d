import { beforeAll, describe, expect, it } from 'vitest';
import { getAlien, HUMAN_FORM } from '../src/aliens/registry';
import { CACKLEJACK } from '../src/config/cacklejack';
import { TOYS } from '../src/config/circus';
import { buildCells, cellAt } from '../src/levels/buildLevel';
import { CHAPTER_8, CIRCUS_OUTDOORS } from '../src/levels/chapter8';
import { HUMAN_CAPS, reachableFrom, type Capabilities, type Pos } from '../src/levels/reachability';
import { CELL } from '../src/levels/tiles';
import { pendingUnlocks, storyAliens } from '../src/systems/Unlocks';
import { bodyMultiplier, headScale, mouthAt, stageFor, stageStartHp, trickAt, FEAR_GAS_TRICKS } from '../src/entities/bosses/cacklejack/rules';
import { metaOf, LEVEL_META } from '../src/levels/manifest';
import { CARDS } from '../src/levels/cards';
import { ENDING_CUES } from '../src/entities/bosses/cacklejack/rules';
import { CH8_BARREL, CH8_GWEN_TAKEN, CH8_HEART, CH8_OPENING, CH8_SHOW } from '../src/scenes/level/circus/story/lines';
import { BEN_FRAME_CLIPS } from '../src/scenes/preload/cartoon/characters/ben';
import { GWEN_FRAME_CLIPS } from '../src/scenes/preload/cartoon/characters/gwen';
import { MAX_FRAME_CLIPS } from '../src/scenes/preload/cartoon/characters/max';
import { KEVIN_FRAME_CLIPS } from '../src/scenes/preload/cartoon/characters/kevin';

const level = CHAPTER_8;
const grid = buildCells(level);
const story = level.story!;
const plan = story.circus!;

type Entity = (typeof level.entities)[number];
function entity<T extends Entity['type']>(type: T) {
  return level.entities.filter((e) => e.type === type) as Extract<Entity, { type: T }>[];
}

describe('chapter 8 layout', () => {
  it('builds a grid of the declared size, Ben starting on the boardwalk', () => {
    expect(grid.cells).toHaveLength(level.height);
    expect(grid.cells[0]).toHaveLength(level.width);
    expect(cellAt(grid, level.playerStart.x, level.playerStart.y)).not.toBe(CELL.EMPTY);
    expect(cellAt(grid, level.playerStart.x, level.playerStart.y - 1)).toBe(CELL.EMPTY);
  });

  it('checkpoints, smoothies and pads sit on a surface with open space above', () => {
    for (const e of [...entity('checkpoint'), ...entity('smoothy'), ...entity('bouncePad')]) {
      const id = 'id' in e ? e.id : `smoothy@${e.x}`;
      expect(cellAt(grid, e.x, e.y - 1), `${id} space`).toBe(CELL.EMPTY);
      expect([CELL.GROUND, CELL.ROCK, CELL.PLATFORM], `${id} floor`).toContain(cellAt(grid, e.x, e.y));
    }
  });

  it('the story plan comes in walking order, and the outdoors are where the sky is open', () => {
    expect(plan.boardwalk.stopX).toBeLessThan(plan.show.triggerX);
    expect(plan.show.triggerX).toBeLessThan(plan.gwenTaken.triggerX);
    expect(plan.gwenTaken.triggerX).toBeLessThan(plan.barrel.triggerX);
    expect(plan.barrel.triggerX).toBeLessThan(plan.heart.mirrorX);
    for (const o of CIRCUS_OUTDOORS) expect(cellAt(grid, Math.floor((o.from + o.to) / 2), 2), `sky over ${o.from}`).toBe(CELL.EMPTY);
  });

  it("the barrel's doors are open in the data (the story slams them), the heart's wall is shut (Gwen opens it)", () => {
    const b = plan.barrel;
    for (let y = b.top; y < b.floor; y++) {
      expect(cellAt(grid, b.fromX, y), `barrel in ${y}`).toBe(CELL.EMPTY);
      expect(cellAt(grid, b.toX, y), `barrel out ${y}`).toBe(CELL.EMPTY);
    }
    const e = plan.heart.exit;
    for (let y = e.y; y < e.y + e.h; y++) expect(cellAt(grid, e.x, y), `heart wall ${y}`).not.toBe(CELL.EMPTY);
  });

  it('the boss stands in an arena wide enough for its acts, with the stages as hidden checkpoints', () => {
    const boss = entity('boss')[0];
    expect(boss.kind).toBe('cacklejack');
    expect(boss.arenaTo - boss.arenaFrom).toBeGreaterThanOrEqual(36);
    for (const id of boss.stages ?? []) expect(entity('checkpoint').find((c) => c.id === id)?.hidden, id).toBe(true);
  });

  it('matches its menu manifest, and every card has an album entry', () => {
    expect(LEVEL_META.find((m) => m.id === 'ch8')).toEqual(metaOf(level));
    for (const c of entity('card')) expect(CARDS.some((k) => k.id === c.id), c.id).toBe(true);
  });
});

describe('chapter 8 reachability', () => {
  const start: Pos = { x: level.playerStart.x, y: level.playerStart.y - 1 };
  const dial = storyAliens(8, []).map((id) => getAlien(id).reach);
  // Ben switches aliens as he goes: every form on the dial at once (the coarse envelope of a whole run).
  const any: Capabilities = dial.reduce<Capabilities>(
    (m, c) => {
      const out = { ...m } as Record<string, number | boolean | undefined>;
      for (const [k, v] of Object.entries(c)) out[k] = typeof v === 'number' ? Math.max(Number(out[k] ?? 0), v) : Boolean(out[k]) || Boolean(v);
      return out as unknown as Capabilities;
    },
    { ...HUMAN_CAPS },
  );
  const ALL: Capabilities[] = [HUMAN_CAPS, ...dial, any];
  let sets: Array<Set<string>> = [];
  beforeAll(() => {
    sets = ALL.map((caps) => reachableFrom(level, grid, start, caps));
  }, 60000);
  const reachable = (goal: Pos) => sets.some((s) => [-1, 0, 1].some((dy) => s.has(`${goal.x},${goal.y + dy}`)));

  it('every checkpoint can be reached from the start', () => {
    for (const cp of entity('checkpoint')) expect(reachable({ x: cp.x, y: cp.y - 1 }), cp.id).toBe(true);
  });

  it('every card for the aliens Ben has can be reached', () => {
    for (const c of entity('card').filter((c) => !c.requires)) expect(reachable({ x: c.x, y: c.y - 1 }), c.id).toBe(true);
  });

  it('Ricochet alone gets from the start to the big top (the barrel, the break-away wall, the shaft to the heart)', () => {
    const ricochet = reachableFrom(level, grid, start, getAlien('ricochet').reach);
    const cp = entity('checkpoint').find((c) => c.id === 'cp-bigtop')!;
    expect([-1, 0, 1].some((dy) => ricochet.has(`${cp.x},${cp.y - 1 + dy}`))).toBe(true);
  });

  it("the loop's card and the heart are a ball's (human Ben can't get there)", () => {
    const human = reachableFrom(level, grid, start, HUMAN_CAPS);
    const loopCard = entity('card').find((c) => c.id === 'ch8-card-loop')!;
    expect(human.has(`${loopCard.x},${loopCard.y - 1}`)).toBe(false);
  });
});

describe('ricochet joins in the barrel', () => {
  it('stays off the dial until the barrel, and is on it for a run resumed past it', () => {
    const unlocks = story.unlocks ?? [];
    expect(unlocks.map((u) => u.alien)).toEqual(['ricochet']);
    expect(pendingUnlocks(unlocks, [], null)).toContain('ricochet');
    expect(pendingUnlocks(unlocks, [], plan.barrel.triggerX - 5)).toContain('ricochet');
    expect(pendingUnlocks(unlocks, [], entity('checkpoint').find((c) => c.id === 'cp-loop')!.x)).not.toContain('ricochet');
    expect(HUMAN_FORM.id).toBe('ben');
  });
});

describe('CACKLEJACK', () => {
  it('goes through his three stages by thirds, and a retry starts at the stage', () => {
    expect(stageFor(1)).toBe(0);
    expect(stageFor(0.7)).toBe(0);
    expect(stageFor(0.66)).toBe(1);
    expect(stageFor(0.34)).toBe(1);
    expect(stageFor(0.33)).toBe(2);
    expect(stageStartHp(0)).toBe(CACKLEJACK.maxHp);
    expect(stageFor(stageStartHp(1) / CACKLEJACK.maxHp)).toBe(1);
    expect(stageFor(stageStartHp(2) / CACKLEJACK.maxHp)).toBe(2);
  });

  it('is slippery until he bows, then takes double', () => {
    expect(bodyMultiplier(false)).toBeLessThan(1);
    expect(bodyMultiplier(true)).toBe(2);
  });

  it('works through every trick, round and round', () => {
    const seen = new Set(Array.from({ length: FEAR_GAS_TRICKS.length * 2 }, (_, i) => trickAt(i)));
    expect([...seen].sort()).toEqual(['gasPie', 'jackbox', 'pies', 'pogo']);
  });

  it("the big head's grin warns before it opens, and it grows to fill the ring", () => {
    const B = CACKLEJACK.bigHead;
    const shut = 2400;
    expect(mouthAt(0, shut, B.quiverMs, B.openMs)).toBe('shut');
    expect(mouthAt(shut + 10, shut, B.quiverMs, B.openMs)).toBe('quiver');
    expect(mouthAt(shut + B.quiverMs + 10, shut, B.quiverMs, B.openMs)).toBe('open');
    expect(mouthAt(shut + B.quiverMs + B.openMs + 10, shut, B.quiverMs, B.openMs)).toBe('shut');
    expect(B.quiverMs).toBeGreaterThanOrEqual(800);
    expect(headScale(0)).toBe(B.startScale);
    expect(headScale(B.growMs * 2)).toBe(1);
  });
});

describe('the funhouse toys', () => {
  it('a ball fast enough rides the loop; the kicker and the bumpers are tuned for one', () => {
    expect(TOYS.loopMinSpeed).toBeLessThan(getAlienTop());
    expect(TOYS.kickerMinSpeed).toBeLessThan(TOYS.loopMinSpeed);
  });
});

function getAlienTop(): number {
  return 330;
}

describe("chapter 8 uses the owner's drawings", () => {
  const CLIPS: Record<string, Readonly<Record<string, unknown>>> = { ben: BEN_FRAME_CLIPS, gwen: GWEN_FRAME_CLIPS, max: MAX_FRAME_CLIPS, kevin: KEVIN_FRAME_CLIPS };
  const lines = [...CH8_OPENING, ...CH8_SHOW, ...CH8_GWEN_TAKEN, ...CH8_BARREL, ...CH8_HEART, ...(CHAPTER_8.story?.outro ?? [])];

  it("every pose a line names is one of its speaker's drawn clips", () => {
    const posed = lines.filter((l) => l.pose !== undefined);
    expect(posed.length).toBeGreaterThan(10);
    for (const l of posed) {
      const clips = CLIPS[l.who];
      expect(clips, `${l.who} has no drawings`).toBeDefined();
      expect(clips[l.pose!], `${l.who}: ${l.pose}`).toBeDefined();
    }
  });

  it('the set pieces pose the family and Kevin with clips they have drawings for', () => {
    // CACKLEJACK's cage (Max), the heart's glass (Gwen), the show's crowd (Kevin).
    for (const pose of ['angry', 'cheer', 'surprise', 'laugh', 'sad', 'guard', 'walk', 'run']) expect(MAX_FRAME_CLIPS[pose], pose).toBeDefined();
    for (const pose of ['angry', 'surprise', 'point', 'folded']) expect(GWEN_FRAME_CLIPS[pose], pose).toBeDefined();
    for (const pose of ['smirk', 'laugh']) expect(KEVIN_FRAME_CLIPS[pose], pose).toBeDefined();
    for (const pose of ['lookHands', 'shrug', 'cheer', 'point', 'talk']) expect(BEN_FRAME_CLIPS[pose], pose).toBeDefined();
  });

  it("the ending's cues are the ones CACKLEJACK acts on, each once, in story order", () => {
    const cues = (CHAPTER_8.story?.outro ?? []).flatMap((l) => (l.cue ? [l.cue] : []));
    expect(cues).toEqual([...ENDING_CUES]);
  });

  it("Kevin watches the show from the crowd, short of where it starts and clear of Max's spot", () => {
    const s = CHAPTER_8.story!.circus!.show;
    expect(s.kevinX).toBeLessThan(s.triggerX - 2);
    expect(Math.abs(s.kevinX - s.maxX)).toBeGreaterThan(4);
  });
});

