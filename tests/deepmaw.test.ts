import { describe, expect, it } from 'vitest';
import { DEEPMAW as D } from '../src/config/deepmaw';
import { bodyMultiplier, dryAttack, maelstromLevel, stageFor, stageStartHp, wetAttack, type DeepStage } from '../src/entities/bosses/deepmaw/rules';
import { CHAPTER_7 } from '../src/levels/chapter7';

const boss = CHAPTER_7.entities.find((e) => e.type === 'boss');
const tank = CHAPTER_7.entities.find((e) => e.type === 'tank' && e.id === 't-moonpool');
const plan = CHAPTER_7.story?.plumber?.moonPool;

describe('DEEPMAW', () => {
  it('splits the bar into three stages', () => {
    expect(stageFor(1)).toBe(0);
    expect(stageFor(D.stage2At + 0.01)).toBe(0);
    expect(stageFor(D.stage2At)).toBe(1);
    expect(stageFor(D.stage3At + 0.01)).toBe(1);
    expect(stageFor(D.stage3At)).toBe(2);
    expect(stageFor(0)).toBe(2);
  });

  it('a retry from a stage checkpoint starts inside that stage', () => {
    for (const s of [0, 1, 2] as DeepStage[]) expect(stageFor(stageStartHp(s) / D.maxHp)).toBe(s);
    expect(stageStartHp(0)).toBe(D.maxHp);
  });

  it('hits on his body count double while he is stunned, full while he is open, half otherwise', () => {
    expect(bodyMultiplier(true, false)).toBeGreaterThan(bodyMultiplier(false, true));
    expect(bodyMultiplier(false, true)).toBeGreaterThan(bodyMultiplier(false, false));
    expect(bodyMultiplier(true, true)).toBe(D.stunnedMultiplier);
  });

  it('in the dark he baits twice for every flash; in the maelstrom he swallows every few attacks', () => {
    const dark = Array.from({ length: 9 }, (_, n) => wetAttack(0, n));
    expect(dark.filter((a) => a === 'flash')).toHaveLength(3);
    expect(dark.filter((a) => a === 'bait')).toHaveLength(6);
    const storm = Array.from({ length: 10 }, (_, n) => wetAttack(2, n));
    expect(storm.filter((a) => a === 'swallow').length).toBeGreaterThanOrEqual(3);
    expect(storm).toContain('bait');
    expect(storm).toContain('flash');
  });

  it('on dry land every third attack is the flood, and the rest mix all three attacks', () => {
    const seq = Array.from({ length: 12 }, (_, n) => dryAttack(n));
    seq.forEach((a, n) => expect(a === 'flood').toBe((n + 1) % D.highAndDry.floodEvery === 0));
    for (const a of ['slam', 'roll', 'leap'] as const) expect(seq).toContain(a);
  });

  it('the maelstrom water swings round its level but never climbs into the booth', () => {
    for (let ms = 0; ms < D.maelstrom.swingMs; ms += 100) {
      const level = maelstromLevel(ms);
      expect(level).toBeGreaterThanOrEqual(D.maelstrom.level - D.maelstrom.swing - 1e-9);
      expect(level).toBeLessThanOrEqual(D.maelstrom.level + D.maelstrom.swing + 1e-9);
    }
  });
});

describe('the moon pool', () => {
  it('is one screen wide, its tank covering the whole arena', () => {
    expect(boss && boss.type === 'boss').toBe(true);
    if (!boss || boss.type !== 'boss' || !tank || tank.type !== 'tank') return;
    expect(boss.arenaTo - boss.arenaFrom).toBe(40);
    expect(tank.x).toBeLessThanOrEqual(boss.arenaFrom);
    expect(tank.x + tank.w).toBeGreaterThanOrEqual(boss.arenaTo);
    expect(boss.triggerX).toBeGreaterThan(boss.arenaFrom);
  });

  it('each stage has its hidden checkpoint, and the stage levels match the tuning', () => {
    if (!boss || boss.type !== 'boss') return;
    for (const id of boss.stages ?? []) {
      const cp = CHAPTER_7.entities.find((e) => e.type === 'checkpoint' && e.id === id);
      expect(cp && cp.type === 'checkpoint' && cp.hidden).toBe(true);
    }
    expect(boss.stages).toHaveLength(2);
    expect(plan?.levels).toEqual([D.lightsOut.level, D.highAndDry.level, D.maelstrom.level]);
  });

  it('the water stays below the booth in every stage', () => {
    expect(D.lightsOut.level).toBeGreaterThanOrEqual(D.boothRow);
    expect(D.maelstrom.level - D.maelstrom.swing).toBeGreaterThanOrEqual(D.boothRow);
    expect(D.highAndDry.floodLevel).toBeGreaterThan(D.boothRow);
  });
});
