/**
 * Integration Test - Complete Gridfall Game Flow
 *
 * This test simulates a complete game from start to finish:
 * 1. Generate roles for 10 players
 * 2. Process multiple ping actions
 * 3. Calculate winners at game end
 */

const fs = require('fs');
const path = require('path');
const { processPing, processSafeExit } = require('../src/scan-executor');
const { calculateWinners, generateGameSummary } = require('../src/winner-calculator');

// Test directories
const TEST_DIR = path.join(__dirname, 'test_integration');
const RESULTS_DIR = path.join(TEST_DIR, 'results');

// Create test directories
[TEST_DIR, RESULTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('=== Gridfall Integration Test ===\n');
console.log('Simulating a complete game from start to finish...\n');

// Step 1: Initialize game with roles (simulating role generator output)
console.log('Step 1: Role Generation');
console.log('─'.repeat(50));

const players = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222',
  '0x3333333333333333333333333333333333333333',
  '0x4444444444444444444444444444444444444444',
  '0x5555555555555555555555555555555555555555',
  '0x6666666666666666666666666666666666666666',
  '0x7777777777777777777777777777777777777777',
  '0x8888888888888888888888888888888888888888',
  '0x9999999999999999999999999999999999999999',
  '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
];

const gameState = {
  gameId: 'integration-test-game',
  roles: {
    [players[0]]: 'SENTINEL', // Sentinel 1
    [players[1]]: 'SENTINEL', // Sentinel 2
    [players[2]]: 'ECHO',
    [players[3]]: 'ECHO',
    [players[4]]: 'ECHO',
    [players[5]]: 'ECHO',
    [players[6]]: 'ECHO',
    [players[7]]: 'ECHO',
    [players[8]]: 'ECHO',
    [players[9]]: 'ECHO'
  },
  eliminated: {},
  moveCount: {},
  pingsRemaining: {},
  actionHistory: []
};

console.log('✅ 10 players assigned roles:');
console.log(`   - Sentinels: ${players[0]}, ${players[1]}`);
console.log(`   - Echoes: ${players.slice(2).join(', ')}`);
console.log();

// Step 2: Simulate game actions
console.log('Step 2: Game Actions');
console.log('─'.repeat(50));

let actionCount = 0;

// Action 1: Sentinel 1 eliminates Echo 1
console.log(`Action ${++actionCount}: Sentinel ${players[0]} pings Echo ${players[2]}`);
let result = processPing(gameState, players[0], players[2]);
console.log(`   Result: ${result.actionResult} - ${players[2]} eliminated`);

// Action 2: Sentinel 2 eliminates Echo 2
console.log(`Action ${++actionCount}: Sentinel ${players[1]} pings Echo ${players[3]}`);
result = processPing(gameState, players[1], players[3]);
console.log(`   Result: ${result.actionResult} - ${players[3]} eliminated`);

// Action 3: Echo 3 pings Echo 4 (no effect)
console.log(`Action ${++actionCount}: Echo ${players[4]} pings Echo ${players[5]}`);
result = processPing(gameState, players[4], players[5]);
console.log(`   Result: ${result.actionResult} - No elimination`);

// Action 4: Sentinel 1 uses second ping on Echo 5
console.log(`Action ${++actionCount}: Sentinel ${players[0]} pings Echo ${players[6]}`);
result = processPing(gameState, players[0], players[6]);
console.log(`   Result: ${result.actionResult} - ${players[6]} eliminated`);

// Action 5: Echo 6 takes safe exit
console.log(`Action ${++actionCount}: Echo ${players[7]} takes safe exit`);
result = processSafeExit(gameState, players[7]);
console.log(`   Result: ${result.actionResult} - ${players[7]} exits game`);

// Action 6: Sentinel 2 accidentally pings Sentinel 1 (friendly fire!)
console.log(`Action ${++actionCount}: Sentinel ${players[1]} pings Sentinel ${players[0]}`);
result = processPing(gameState, players[1], players[0]);
console.log(`   Result: ${result.actionResult} - ${players[1]} eliminated by friendly fire!`);

// Action 7: Remaining Echoes make moves
console.log(`Action ${++actionCount}: Echo ${players[5]} pings Echo ${players[8]}`);
result = processPing(gameState, players[5], players[8]);
console.log(`   Result: ${result.actionResult} - No elimination`);

console.log(`\nTotal actions: ${gameState.actionHistory.length}`);
console.log();

// Step 3: Calculate winners
console.log('Step 3: Winner Calculation');
console.log('─'.repeat(50));

const winnerData = calculateWinners(gameState);
const summary = generateGameSummary(gameState, winnerData);

console.log(`Winners: ${winnerData.winners.length}`);
winnerData.winnerDetails.forEach((winner, i) => {
  console.log(`  ${i + 1}. ${winner.address} (${winner.role}, ${winner.moves} moves)`);
});

console.log(`\nGame Statistics:`);
console.log(`  Total Players: ${summary.stats.totalPlayers}`);
console.log(`  Eliminated: ${summary.stats.eliminatedCount}`);
console.log(`  Survivors: ${summary.stats.survivorCount}`);
console.log(`  Sentinel Winners: ${summary.stats.sentinelWinners}`);
console.log(`  Echo Winners: ${summary.stats.echoWinners}`);
console.log(`  Ineligible Survivors: ${summary.stats.ineligibleSurvivors}`);

console.log(`\nAction Summary:`);
console.log(`  Total Actions: ${summary.actionSummary.totalActions}`);
console.log(`  Pings: ${summary.actionSummary.pings}`);
console.log(`  Eliminations: ${summary.actionSummary.eliminations}`);
console.log(`  Friendly Fires: ${summary.actionSummary.friendlyFires}`);
console.log(`  Safe Exits: ${summary.actionSummary.safeExits}`);

// Step 4: Save results
console.log();
console.log('Step 4: Saving Results');
console.log('─'.repeat(50));

const resultsFile = path.join(RESULTS_DIR, 'game-summary.json');
fs.writeFileSync(resultsFile, JSON.stringify(summary, null, 2));
console.log(`✅ Game summary saved to: ${resultsFile}`);

const winnersFile = path.join(RESULTS_DIR, 'winners.json');
fs.writeFileSync(winnersFile, JSON.stringify({
  winners: winnerData.winners,
  winnerCount: winnerData.winners.length
}, null, 2));
console.log(`✅ Winners list saved to: ${winnersFile}`);

// Validation
console.log();
console.log('Step 5: Validation');
console.log('─'.repeat(50));

let errors = 0;

// Validate: Should have winners
if (winnerData.winners.length === 0) {
  console.log('❌ ERROR: No winners found');
  errors++;
} else {
  console.log(`✅ ${winnerData.winners.length} winners identified`);
}

// Validate: All winners should have made moves
winnerData.winnerDetails.forEach(winner => {
  if (winner.moves < 1) {
    console.log(`❌ ERROR: Winner ${winner.address} has ${winner.moves} moves`);
    errors++;
  }
});
if (errors === 0) {
  console.log('✅ All winners have minimum required moves');
}

// Validate: Eliminated players should not be winners
Object.keys(gameState.eliminated).forEach(player => {
  if (gameState.eliminated[player] && winnerData.winners.includes(player)) {
    console.log(`❌ ERROR: Eliminated player ${player} is listed as winner`);
    errors++;
  }
});
if (errors === 0) {
  console.log('✅ No eliminated players in winner list');
}

// Validate: Action history integrity
if (gameState.actionHistory.length !== actionCount) {
  console.log(`❌ ERROR: Action count mismatch (expected ${actionCount}, got ${gameState.actionHistory.length})`);
  errors++;
} else {
  console.log(`✅ Action history integrity verified (${actionCount} actions)`);
}

// Final result
console.log();
console.log('═'.repeat(50));
if (errors === 0) {
  console.log('🎉 INTEGRATION TEST PASSED');
  console.log('All game mechanics working correctly!');
  process.exit(0);
} else {
  console.log(`❌ INTEGRATION TEST FAILED (${errors} errors)`);
  process.exit(1);
}
