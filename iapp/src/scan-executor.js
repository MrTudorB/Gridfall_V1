/**
 * Gridfall Scan Executor iApp
 *
 * This TEE application processes ping/scan actions in the Gridfall game.
 * It determines if an elimination occurs based on scanner and target roles.
 *
 * Rules:
 * - Sentinel pings Echo => Echo eliminated
 * - Sentinel pings Sentinel => Friendly fire, scanner eliminated
 * - Echo pings anyone => No effect (Echoes can't eliminate)
 * - Each Sentinel has max 2 pings
 * - All actions tracked for winner calculation
 */

const fs = require('fs');
const crypto = require('crypto');

// iExec standard paths
const IEXEC_OUT = process.env.IEXEC_OUT || '/iexec_out';
const IEXEC_IN = process.env.IEXEC_IN || '/iexec_in';

// Game constants
const SENTINEL_PING_LIMIT = 2;
const MINIMUM_MOVES_REQUIRED = 1;

/**
 * Process a ping/scan action
 * @param {Object} gameState - Current game state with roles and action history
 * @param {string} scanner - Address of player performing ping
 * @param {string} target - Address of player being pinged
 * @returns {Object} Result with eliminated player (if any) and updated game state
 */
function processPing(gameState, scanner, target) {
  const { roles, pingsRemaining, moveCount, actionHistory, eliminated } = gameState;

  // Validate scanner and target exist and are not eliminated
  if (!roles[scanner]) {
    throw new Error(`Scanner ${scanner} not in game`);
  }
  if (!roles[target]) {
    throw new Error(`Target ${target} not in game`);
  }
  if (eliminated[scanner]) {
    throw new Error(`Scanner ${scanner} is already eliminated`);
  }
  if (eliminated[target]) {
    throw new Error(`Target ${target} is already eliminated`);
  }
  if (scanner === target) {
    throw new Error('Cannot ping yourself');
  }

  const scannerRole = roles[scanner];
  const targetRole = roles[target];

  // Initialize ping tracking for Sentinels
  if (scannerRole === 'SENTINEL' && pingsRemaining[scanner] === undefined) {
    pingsRemaining[scanner] = SENTINEL_PING_LIMIT;
  }

  // Check if Sentinel has pings remaining
  if (scannerRole === 'SENTINEL' && pingsRemaining[scanner] <= 0) {
    throw new Error(`Sentinel ${scanner} has no pings remaining`);
  }

  let eliminatedPlayer = null;
  let actionResult = 'noEffect';

  // Determine scan result based on roles
  if (scannerRole === 'SENTINEL') {
    // Decrement ping count for Sentinel
    pingsRemaining[scanner]--;

    if (targetRole === 'SENTINEL') {
      // Friendly fire: Scanner is eliminated
      eliminatedPlayer = scanner;
      actionResult = 'friendlyFire';
      eliminated[scanner] = true;
    } else if (targetRole === 'ECHO') {
      // Successful elimination: Target is eliminated
      eliminatedPlayer = target;
      actionResult = 'eliminated';
      eliminated[target] = true;
    }
  } else if (scannerRole === 'ECHO') {
    // Echoes can ping but don't eliminate anyone
    actionResult = 'noEffect';
  }

  // Track move count for all players (for winner eligibility)
  moveCount[scanner] = (moveCount[scanner] || 0) + 1;

  // Record action in history
  const action = {
    timestamp: Date.now(),
    scanner,
    target,
    actionType: 'ping',
    result: actionResult,
    scannerRole,
    targetRole
  };
  actionHistory.push(action);

  return {
    eliminatedPlayer: eliminatedPlayer || null,
    actionResult,
    updatedGameState: gameState,
    action
  };
}

/**
 * Process a safe exit action
 * @param {Object} gameState - Current game state
 * @param {string} player - Address of player exiting
 * @returns {Object} Result with updated game state
 */
function processSafeExit(gameState, player) {
  const { roles, moveCount, actionHistory, eliminated } = gameState;

  if (!roles[player]) {
    throw new Error(`Player ${player} not in game`);
  }
  if (eliminated[player]) {
    throw new Error(`Player ${player} is already eliminated`);
  }

  // Mark player as eliminated
  eliminated[player] = true;

  // Track move count (safe exit counts as a move)
  moveCount[player] = (moveCount[player] || 0) + 1;

  // Record action in history
  const action = {
    timestamp: Date.now(),
    scanner: player,
    actionType: 'safeExit',
    result: 'safeExit',
    scannerRole: roles[player]
  };
  actionHistory.push(action);

  return {
    eliminatedPlayer: player,
    actionResult: 'safeExit',
    updatedGameState: gameState,
    action
  };
}

/**
 * Main application entry point
 */
async function main() {
  try {
    console.log('=== Gridfall Scan Executor iApp ===');
    console.log('Running in TEE environment...');

    // Read input data
    const inputPath = `${IEXEC_IN}/input.json`;
    console.log(`Reading input from: ${inputPath}`);

    let inputData;
    try {
      const inputRaw = fs.readFileSync(inputPath, 'utf8');
      inputData = JSON.parse(inputRaw);
    } catch (error) {
      throw new Error(`Failed to read input: ${error.message}`);
    }

    // Validate input
    if (!inputData.gameState) {
      throw new Error('Invalid input: gameState required');
    }
    if (!inputData.action) {
      throw new Error('Invalid input: action required');
    }

    const { gameState, action } = inputData;
    const { type, scanner, target } = action;

    console.log(`Processing action: ${type}`);
    console.log(`Scanner: ${scanner}`);
    if (target) {
      console.log(`Target: ${target}`);
    }

    let result;
    if (type === 'ping') {
      if (!target) {
        throw new Error('Ping action requires target');
      }
      result = processPing(gameState, scanner, target);
    } else if (type === 'safeExit') {
      result = processSafeExit(gameState, scanner);
    } else {
      throw new Error(`Unknown action type: ${type}`);
    }

    console.log(`Action result: ${result.actionResult}`);
    if (result.eliminatedPlayer) {
      console.log(`Eliminated player: ${result.eliminatedPlayer}`);
    }

    // Prepare output
    const output = {
      success: true,
      eliminatedPlayer: result.eliminatedPlayer,
      actionResult: result.actionResult,
      gameState: result.updatedGameState,
      processedAction: result.action,
      timestamp: Date.now()
    };

    // Write output
    const outputPath = `${IEXEC_OUT}/result.json`;
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Results written to: ${outputPath}`);

    // Write computation result (required by iExec)
    const computedPath = `${IEXEC_OUT}/computed.json`;
    const computedResult = {
      'deterministic-output-path': outputPath
    };
    fs.writeFileSync(computedPath, JSON.stringify(computedResult));

    console.log('=== Scan execution complete ===');
    process.exit(0);

  } catch (error) {
    console.error('Error in scan execution:');
    console.error(error);

    // Write error to output
    const errorOutput = {
      success: false,
      error: error.message,
      stack: error.stack
    };
    fs.writeFileSync(`${IEXEC_OUT}/error.json`, JSON.stringify(errorOutput, null, 2));

    process.exit(1);
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { processPing, processSafeExit };
}

// Run if called directly
if (require.main === module) {
  main();
}
