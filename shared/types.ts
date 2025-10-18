/**
 * Gridfall Shared TypeScript Types
 */

import { PlayerRole, ActionType, ActionResult } from './constants';

// Game State (stored in iExec TEE)
export interface GameState {
  roles: Record<string, PlayerRole>; // address => role
  moveCount: Record<string, number>; // address => count
  pingsRemaining: Record<string, number>; // address => remaining (Sentinels only)
  actionHistory: Action[];
}

// Action History Entry
export interface Action {
  timestamp: number;
  scanner: string; // address
  target?: string; // address
  actionType: ActionType;
  result: ActionResult;
}

// Smart Contract Types
export interface Player {
  address: string;
  isEliminated: boolean;
  hasJoined: boolean;
}

export interface Winner {
  address: string;
  claimableAmount: string; // in ETH
  hasClaimed: boolean;
}

// Frontend Types
export interface GameInfo {
  status: number; // GameStatus enum value
  totalPlayers: number;
  playersRemaining: number;
  protectedDataAddress: string;
}
