import type { OmnitrixState, RevertReason } from './Omnitrix';
import type { TouchMode } from './SaveSystem';
import type { SplitResult } from './Splits';
import type { RunStats } from './RunStats';
import type { TrainingOptions } from './TrainingState';
import type { DroneKind } from '../levels/types';
import type { DifficultyId } from '../config/difficulty';

export interface OmnitrixTick {
  state: OmnitrixState;
  acquired: boolean;
  selectedId: string | null;
  activeId: string | null;
  timeRatio: number;
  timeRemainingMs: number;
  cooldownProgress: number;
  warning: boolean;
  jammed: boolean;
  /** Aliens on the dial, in order. */
  unlocked: readonly string[];
  /** Pressing transform now would swap to the selected alien. */
  canSwap: boolean;
  /** The alien timer is frozen (Training). */
  frozen: boolean;
  /** After a misfire: the next swap is the half-price fix. */
  fixOwed: boolean;
}

export interface BannerPayload {
  title: string;
  subtitle?: string;
  color?: number;
  durationMs?: number;
  style?: 'slam' | 'soft' | 'boss';
}

/** Every cross-scene message. Payload types are enforced by EventBus. */
export interface GameEvents {
  'player:health': { hp: number; max: number; delta: number };
  'player:formHealth': { hp: number; max: number; visible: boolean; delta: number; formId: string };
  'player:died': undefined;
  'omnitrix:acquired': undefined;
  'omnitrix:tick': OmnitrixTick;
  'omnitrix:dial': { selectedId: string; index: number; count: number; direction: 1 | -1 };
  'omnitrix:warning': { secondsLeft: number };
  'omnitrix:ready': undefined;
  'omnitrix:denied': { reason: 'cooldown' | 'jammed' | 'busy' | 'lowTime' };
  /** `swap`: changed alien mid-transformation instead of transforming from human. `fix`: the half-price swap owed after a misfire. */
  'alien:transformed': { alienId: string; name: string; wrong: boolean; first: boolean; swap: boolean; fix?: boolean };
  /** The record-scratch moment of a misfire: Ben wanted one alien and got another. */
  'alien:misfire': { wantedId: string; gotId: string; swap: boolean };
  /** A KO as the misfired alien: rolling with it paid out. */
  'omnitrix:improvised': { bonusMs: number; alienId: string };
  /** A swap entrance move hit something. */
  'alien:swapStrike': { alienId: string; hits: number };
  'alien:reverted': { alienId: string; reason: RevertReason };
  'omnitrix:perfect': { bonusMs: number; count: number };
  'combo:update': { count: number; best: number; forms: readonly string[] };
  /** A new form joined a live combo (2 or more forms in it). */
  'combo:tag': { forms: readonly string[]; refundMs: number };
  'combo:drop': { count: number };
  /** `reachableCards`: cards that exist this run; the rest of `totalCards` wait behind a later alien. */
  'stats:update': { timeMs: number; enemiesDefeated: number; cards: number; totalCards: number; reachableCards: number };
  'card:collected': { id: string; found: number; total: number };
  'hud:split': SplitResult;
  'hud:prompt': { id: string; text: string; priority?: number };
  'hud:promptClear': { id: string };
  'hud:banner': BannerPayload;
  'hud:letterbox': { visible: boolean };
  'hud:dialog': { speaker: string; text: string; color: number; voicePitch?: number; skip?: boolean };
  'hud:dialogClear': undefined;
  'hud:visible': { visible: boolean; omnitrix?: boolean };
  'hud:omnitrixSymbol': { color: number; big: boolean };
  'boss:show': { name: string; subtitle: string };
  'boss:health': { ratio: number; phase: number };
  'boss:hide': undefined;
  'level:complete': { stats: RunStats };
  'hud:reset': undefined;
  /** The HUD scene finished creating and wants the current state. */
  'hud:ready': undefined;
  'audio:muted': { muted: boolean };
  /** The page was hidden or the phone turned to portrait: open the pause menu if a level is playing. */
  'system:pause': undefined;
  'input:mode': { kind: 'keyboard' | 'touch' };
  'settings:changed': { reduceFlashing: boolean; shake: number; touchControls: TouchMode };
  /** The active file's difficulty changed (Settings). Gameplay applies it live. */
  'difficulty:changed': { id: DifficultyId };
  /** Training menu: spawn one enemy, clear them all, or change the sandbox switches. */
  'training:spawn': { kind: DroneKind };
  'training:clear': undefined;
  'training:options': TrainingOptions;
}

export type GameEventName = keyof GameEvents;
