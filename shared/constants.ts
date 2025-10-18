/**
 * Gridfall Game Constants
 * Shared across smart contracts, iApp, and frontend
 */

// Game Configuration
export const TOTAL_PLAYERS = 10;
export const NUM_SENTINELS = 2;
export const NUM_ECHOES = 8;

export const DEPOSIT_AMOUNT_ETH = '0.1'; // ETH
export const PROTOCOL_FEE_PERCENT = 5; // 5%
export const SAFE_EXIT_REFUND_PERCENT = 50; // 50%

export const SENTINEL_PING_LIMIT = 2; // Max pings per Sentinel
export const MINIMUM_MOVES_REQUIRED = 1; // For prize eligibility

// Game Status Enum
export enum GameStatus {
  PENDING = 0,
  ACTIVE = 1,
  FINISHED = 2,
}

// Player Roles
export type PlayerRole = 'Sentinel' | 'Echo';

// Network Configuration
export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
export const ARBITRUM_SEPOLIA_RPC = 'https://sepolia-rollup.arbitrum.io/rpc';

// Contract Addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  GRIDFALL_GAME: process.env.NEXT_PUBLIC_GRIDFALL_ADDRESS || '',
  IEXEC_APP: process.env.NEXT_PUBLIC_IEXEC_APP_ADDRESS || '',
};

// Event Names
export const EVENTS = {
  PLAYER_JOINED: 'PlayerJoined',
  GAME_STARTED: 'GameStarted',
  PLAYER_ELIMINATED: 'PlayerEliminated',
  PLAYER_SAFE_EXIT: 'PlayerSafeExit',
  GAME_ENDED: 'GameEnded',
  PRIZE_CLAIMED: 'PrizeClaimed',
  PROTOCOL_FEE_COLLECTED: 'ProtocolFeeCollected',
};

// Action Types (for iApp tracking)
export type ActionType = 'ping' | 'safeExit';

export type ActionResult = 'noEffect' | 'eliminated' | 'friendlyFire' | 'safeExit';
