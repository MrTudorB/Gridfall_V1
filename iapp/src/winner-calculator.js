/**
 * Gridfall Winner Calculator iApp
 *
 * This TEE application determines the winners of a Gridfall game.
 * Winners are players who:
 * 1. Are not eliminated
 * 2. Have made at least MINIMUM_MOVES_REQUIRED moves
 *
 * The calculation is performed confidentially in the TEE,
 * and only the winner addresses are revealed on-chain.
 */

const fs = require('fs');

// iExec standard paths
const IEXEC_OUT = process.env.IEXEC_OUT || '/iexec_out';
const IEXEC_IN = process.env.IEXEC_IN || '/iexec_in';

// Game constants
const MINIMUM_MOVES_REQUIRED = 1;

/**
 * Calculate winners based on game state
 * @param {Object} gameState - Final game state with roles, eliminated players, and move counts
 * @returns {Object} Winner information
 */
function calculateWinners(gameState) {
  const { roles, eliminated, moveCount, actionHistory } = gameState;

  const players = Object.keys(roles);
  const winners = [];
  const stats = {
    totalPlayers: players.length,
    eliminatedCount: 0,
    survivorCount: 0,
    ineligibleSurvivors: 0,
    sentinelWinners: 0,
    echoWinners: 0
  };

  // Iterate through all players to determine winners
  for (const player of players) {
    const isEliminated = eliminated[player] || false;
    const moves = moveCount[player] || 0;
    const role = roles[player];

    if (isEliminated) {
      stats.eliminatedCount++;
      continue;
    }

    stats.survivorCount++;

    // Check if player meets minimum move requirement
    if (moves >= MINIMUM_MOVES_REQUIRED) {
      winners.push({
        address: player,
        role: role,
        moves: moves
      });

      if (role === 'SENTINEL') {
        stats.sentinelWinners++;
      } else {
        stats.echoWinners++;
      }
    } else {
      stats.ineligibleSurvivors++;
    }
  }

  return {
    winners: winners.map(w => w.address), // Just addresses for smart contract
    winnerDetails: winners, // Full details for analysis
    stats,
    actionHistory,
    gameComplete: true
  };
}

/**
 * Generate game summary statistics
 * @param {Object} gameState - Final game state
 * @param {Object} winnerData - Calculated winner data
 * @returns {Object} Comprehensive game summary
 */
function generateGameSummary(gameState, winnerData) {
  const { roles, eliminated, moveCount, pingsRemaining, actionHistory } = gameState;

  // Count actions by type
  const actionSummary = {
    totalActions: actionHistory.length,
    pings: actionHistory.filter(a => a.actionType === 'ping').length,
    safeExits: actionHistory.filter(a => a.actionType === 'safeExit').length,
    eliminations: actionHistory.filter(a => a.result === 'eliminated').length,
    friendlyFires: actionHistory.filter(a => a.result === 'friendlyFire').length
  };

  // Player statistics
  const playerStats = {};
  Object.keys(roles).forEach(player => {
    playerStats[player] = {
      role: roles[player],
      eliminated: eliminated[player] || false,
      moves: moveCount[player] || 0,
      pingsRemaining: pingsRemaining[player] !== undefined ? pingsRemaining[player] :
                       (roles[player] === 'SENTINEL' ? 2 : 'N/A'),
      isWinner: winnerData.winners.includes(player)
    };
  });

  return {
    gameId: gameState.gameId,
    winners: winnerData.winners,
    winnerCount: winnerData.winners.length,
    stats: winnerData.stats,
    actionSummary,
    playerStats,
    timestamp: Date.now()
  };
}

/**
 * Main application entry point
 */
async function main() {
  try {
    console.log('=== Gridfall Winner Calculator iApp ===');
    console.log('Running in TEE environment...');

    // Read input data (final game state)
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

    const { gameState } = inputData;

    console.log('Calculating winners...');
    console.log(`Total players: ${Object.keys(gameState.roles).length}`);
    console.log(`Total actions: ${gameState.actionHistory.length}`);

    // Calculate winners
    const winnerData = calculateWinners(gameState);

    console.log(`\nWinner calculation complete!`);
    console.log(`Winners: ${winnerData.winners.length}`);
    console.log(`  - Sentinels: ${winnerData.stats.sentinelWinners}`);
    console.log(`  - Echoes: ${winnerData.stats.echoWinners}`);
    console.log(`Eliminated: ${winnerData.stats.eliminatedCount}`);
    console.log(`Ineligible survivors: ${winnerData.stats.ineligibleSurvivors}`);

    // Generate comprehensive summary
    const summary = generateGameSummary(gameState, winnerData);

    // Prepare output for smart contract (just winner addresses)
    const contractOutput = {
      winners: winnerData.winners,
      winnerCount: winnerData.winners.length,
      timestamp: Date.now()
    };

    // Prepare detailed output for analysis
    const detailedOutput = {
      ...contractOutput,
      summary,
      winnerDetails: winnerData.winnerDetails
    };

    // Write contract output (minimal data for blockchain)
    const outputPath = `${IEXEC_OUT}/result.json`;
    fs.writeFileSync(outputPath, JSON.stringify(contractOutput, null, 2));
    console.log(`\nContract output written to: ${outputPath}`);

    // Write detailed summary (for off-chain analysis)
    const summaryPath = `${IEXEC_OUT}/summary.json`;
    fs.writeFileSync(summaryPath, JSON.stringify(detailedOutput, null, 2));
    console.log(`Detailed summary written to: ${summaryPath}`);

    // Write computation result (required by iExec)
    const computedPath = `${IEXEC_OUT}/computed.json`;
    const computedResult = {
      'deterministic-output-path': outputPath
    };
    fs.writeFileSync(computedPath, JSON.stringify(computedResult));

    console.log('=== Winner calculation complete ===');
    process.exit(0);

  } catch (error) {
    console.error('Error in winner calculation:');
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
  module.exports = { calculateWinners, generateGameSummary };
}

// Run if called directly
if (require.main === module) {
  main();
}
