import { DEFAULT_DIFFICULTY, type DifficultyId } from '../config/difficulty';
import { saveSystem, type SlotData } from './SaveSystem';
import { activeDifficultyId, setActiveDifficulty } from './Difficulty';
import { EventBus } from './EventBus';

/**
 * Which save file this session plays. Null before a file is picked (and for
 * URL playtest runs without one): nothing is saved then, and the game runs
 * on the default difficulty.
 */
class Session {
  private current: number | null = null;

  get slot(): number | null {
    return this.current;
  }

  get file(): SlotData | null {
    return this.current === null ? null : saveSystem.getSlot(this.current);
  }

  /** Plays this file from now on (Continue will load it too). */
  useSlot(slot: number | null): void {
    const file = slot === null ? null : saveSystem.getSlot(slot);
    this.current = file ? slot : null;
    if (this.current !== null) saveSystem.touchSlot(this.current);
    this.applyDifficulty(file?.difficulty ?? DEFAULT_DIFFICULTY);
  }

  /** Changes the file's difficulty (Settings, or a new file) and applies it live. */
  setDifficulty(id: DifficultyId): void {
    if (this.current !== null) saveSystem.setDifficulty(this.current, id);
    this.applyDifficulty(id);
  }

  private applyDifficulty(id: DifficultyId): void {
    if (setActiveDifficulty(id)) EventBus.emit('difficulty:changed', { id });
  }

  get difficulty(): DifficultyId {
    return activeDifficultyId();
  }
}

export const session = new Session();
