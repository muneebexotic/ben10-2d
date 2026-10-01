import { describe, expect, it } from 'vitest';
import { knownAliens, storyAliens, trainingAliens } from '../src/systems/Unlocks';
import { completedChapters } from '../src/levels/registry';
import { CHAPTER_1 } from '../src/levels/chapter1';
import { availableCards, countedCards } from '../src/levels/secrets';

describe('story dial', () => {
  it('Chapter 1 on a fresh save: Heatblast only', () => {
    expect(storyAliens(1, [])).toEqual(['heatblast']);
  });

  it('Chapter 2 unlocks Four Arms and XLR8', () => {
    expect(storyAliens(2, [1])).toEqual(['heatblast', 'fourarms', 'xlr8']);
  });

  it('replaying Chapter 1 after finishing Chapter 2 brings the new aliens along', () => {
    expect(storyAliens(1, [1, 2])).toEqual(['heatblast', 'fourarms', 'xlr8']);
  });

  it('playtest extras join the dial in dial order', () => {
    expect(storyAliens(1, [], ['xlr8'])).toEqual(['heatblast', 'xlr8']);
  });

  it('unknown ids are ignored', () => {
    expect(knownAliens(['xlr8', 'ghostfreak', 'fourarms'])).toEqual(['xlr8', 'fourarms']);
  });
});

describe('training dial', () => {
  it('lends out Four Arms and XLR8 before the story unlocks them', () => {
    expect(trainingAliens([])).toEqual(['heatblast', 'fourarms', 'xlr8']);
  });

  it('without lent aliens it shows exactly what the story has unlocked', () => {
    expect(trainingAliens([], [])).toEqual(['heatblast']);
    expect(trainingAliens([1, 2], [])).toEqual(['heatblast', 'fourarms', 'xlr8']);
  });

  it('maps completed level ids to chapter numbers', () => {
    expect(completedChapters(['ch1', 'training', 'nope'])).toEqual([1]);
  });
});

describe('Chapter 1 cards', () => {
  it('the vault card counts toward the total now that Four Arms exists', () => {
    expect(countedCards(CHAPTER_1).map((c) => c.id)).toContain('ch1-card-vault');
    expect(countedCards(CHAPTER_1)).toHaveLength(4);
  });

  it('but it only appears in the level once Four Arms is on the dial', () => {
    expect(availableCards(CHAPTER_1, storyAliens(1, [])).map((c) => c.id)).not.toContain('ch1-card-vault');
    expect(availableCards(CHAPTER_1, storyAliens(1, [], ['fourarms'])).map((c) => c.id)).toContain('ch1-card-vault');
  });
});
