import type { OmnitrixState, RevertReason } from './Omnitrix';
import type { TouchMode } from './SaveSystem';
import type { RunStats } from './RunStats';

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
  'player:formHealth': { hp: number; max: number; visible: boolean; delta: number };
  'player:died': undefined;
  'omnitrix:acquired': undefined;
  'omnitrix:tick': OmnitrixTick;
  'omnitrix:dial': { selectedId: string; index: number; count: number; direction: 1 | -1 };
  'omnitrix:warning': { secondsLeft: number };
  'omnitrix:ready': undefined;
  'omnitrix:denied': { reason: 'cooldown' | 'jammed' | 'busy' };
  'alien:transformed': { alienId: string; name: string; wrong: boolean; first: boolean };
  'alien:reverted': { alienId: string; reason: RevertReason };
  'omnitrix:perfect': { bonusMs: number; count: number };
  'combo:update': { count: number; best: number };
  'combo:drop': { count: number };
  'stats:update': { timeMs: number; enemiesDefeated: number; cards: number; totalCards: number };
  'card:collected': { id: string; found: number; total: number };
  'hud:prompt': { id: string; text: string; priority?: number };
  'hud:promptClear': { id: string };
  'hud:banner': BannerPayload;
  'hud:letterbox': { visible: boolean };
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
  'input:mode': { kind: 'keyboard' | 'touch' };
  'settings:changed': { reduceFlashing: boolean; shake: number; touchControls: TouchMode };
}

export type GameEventName = keyof GameEvents;
