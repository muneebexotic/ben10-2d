import { DIFFICULTY_IDS } from '../config/difficulty';
import type { ChapterRecord } from './SaveSystem';

/** OMNITRIX MASTER: an S rank on every difficulty. The chapter's card turns gold. */
export function isOmnitrixMaster(record: ChapterRecord | undefined): boolean {
  if (!record) return false;
  return DIFFICULTY_IDS.every((d) => record.bests[d]?.bestRank === 'S');
}
