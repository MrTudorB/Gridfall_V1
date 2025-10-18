/**
 * Test suite for winner-calculator
 * Tests winner determination logic
 */

const { calculateWinners, generateGameSummary } = require('../src/winner-calculator');

// Test helper to create a game state
function createGameState(config) {
  const gameState = {
    gameId: config.gameId || 'test-game-123',
    roles: config.roles || {},
    eliminated: config.eliminated || {},
    moveCount: config.moveCount || {},
    pingsRemaining: config.pingsRemaining || {},
    actionHistory: config.actionHistory || []
  };
  return gameState;
}

// Run tests
console.log('=== Winner Calculator Test Suite ===\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// Test 1: All Echoes survive (Sentinels eliminated)
test('All Echoes survive and win', () => {
  const gameState = createGameState({
    roles: {
      '0x1111': 'SENTINEL',
      '0x2222': 'SENTINEL',
      '0x3333': 'ECHO',
      '0x4444': 'ECHO',
      '0x5555': 'ECHO',
      '0x6666': 'ECHO',
      '0x7777': 'ECHO',
      '0x8888': 'ECHO',
      '0x9999': 'ECHO',
      '0xAAAA': 'ECHO'
    },
    eliminated: {
      '0x1111': true, // Sentinel 1 eliminated
      '0x2222': true  // Sentinel 2 eliminated
    },
    moveCount: {
      '0x3333': 1,
      '0x4444': 1,
      '0x5555': 1,
      '0x6666': 1,
      '0x7777': 1,
      '0x8888': 1,
      '0x9999': 1,
      '0xAAAA': 1
    }
  });

  const result = calculateWinners(gameState);

  if (result.winners.length !== 8) throw new Error('Should have 8 winners');
  if (result.stats.echoWinners !== 8) throw new Error('All winners should be Echoes');
  if (result.stats.sentinelWinners !== 0) throw new Error('No Sentinel winners');
  if (result.stats.eliminatedCount !== 2) throw new Error('Should have 2 eliminated');
});

// Test 2: Sentinels win (all Echoes eliminated)
test('Sentinels eliminate all Echoes and win', () => {
  const gameState = createGameState({
    roles: {
      '0x1111': 'SENTINEL',
      '0x2222': 'SENTINEL',
      '0x3333': 'ECHO',
      '0x4444': 'ECHO',
      '0x5555': 'ECHO',
      '0x6666': 'ECHO',
      '0x7777': 'ECHO',
      '0x8888': 'ECHO',
      '0x9999': 'ECHO',
      '0xAAAA': 'ECHO'
    },
    eliminated: {
      '0x3333': true,
      '0x4444': true,
      '0x5555': true,
      '0x6666': true,
      '0x7777': true,
      '0x8888': true,
      '0x9999': true,
      '0xAAAA': true
    },
    moveCount: {
      '0x1111': 2, // Made 2 pings
      '0x2222': 2  // Made 2 pings
    }
  });

  const result = calculateWinners(gameState);

  if (result.winners.length !== 2) throw new Error('Should have 2 winners');
  if (result.stats.sentinelWinners !== 2) throw new Error('Both winners should be Sentinels');
  if (result.stats.echoWinners !== 0) throw new Error('No Echo winners');
  if (result.stats.eliminatedCount !== 8) throw new Error('Should have 8 eliminated');
});

// Test 3: Mixed winners (some Sentinels and some Echoes)
test('Mixed winners: Sentinels and Echoes both survive', () => {
  const gameState = createGameState({
    roles: {
      '0x1111': 'SENTINEL',
      '0x2222': 'SENTINEL',
      '0x3333': 'ECHO',
      '0x4444': 'ECHO',
      '0x5555': 'ECHO',
      '0x6666': 'ECHO',
      '0x7777': 'ECHO',
      '0x8888': 'ECHO',
      '0x9999': 'ECHO',
      '0xAAAA': 'ECHO'
    },
    eliminated: {
      '0x3333': true, // 3 Echoes eliminated
      '0x4444': true,
      '0x5555': true
    },
    moveCount: {
      '0x1111': 2,
      '0x2222': 1,
      '0x6666': 1,
      '0x7777': 1,
      '0x8888': 1,
      '0x9999': 1,
      '0xAAAA': 1
    }
  });

  const result = calculateWinners(gameState);

  if (result.winners.length !== 7) throw new Error('Should have 7 winners');
  if (result.stats.sentinelWinners !== 2) throw new Error('Should have 2 Sentinel winners');
  if (result.stats.echoWinners !== 5) throw new Error('Should have 5 Echo winners');
  if (result.stats.eliminatedCount !== 3) throw new Error('Should have 3 eliminated');
});

// Test 4: Survivor without minimum moves is not a winner
test('Survivor without minimum moves does not win', () => {
  const gameState = createGameState({
    roles: {
      '0x1111': 'SENTINEL',
      '0x2222': 'SENTINEL',
      '0x3333': 'ECHO',
      '0x4444': 'ECHO',
      '0x5555': 'ECHO'
    },
    eliminated: {
      '0x1111': true,
      '0x2222': true
    },
    moveCount: {
      '0x3333': 1,  // Has moves - winner
      '0x4444': 1,  // Has moves - winner
      '0x5555': 0   // No moves - not a winner
    }
  });

  const result = calculateWinners(gameState);

  if (result.winners.length !== 2) throw new Error('Should have 2 winners (only those with moves)');
  if (result.stats.ineligibleSurvivors !== 1) throw new Error('Should have 1 ineligible survivor');
  if (result.winners.includes('0x5555')) throw new Error('0x5555 should not be a winner');
});

// Test 5: No winners (all eliminated)
test('No winners when all players eliminated', () => {
  const gameState = createGameState({
    roles: {
      '0x1111': 'SENTINEL',
      '0x2222': 'SENTINEL',
      '0x3333': 'ECHO',
      '0x4444': 'ECHO'
    },
    eliminated: {
      '0x1111': true,
      '0x2222': true,
      '0x3333': true,
      '0x4444': true
    },
    moveCount: {
      '0x1111': 1,
      '0x2222': 1,
      '0x3333': 1,
      '0x4444': 1
    }
  });

  const result = calculateWinners(gameState);

  if (result.winners.length !== 0) throw new Error('Should have 0 winners');
  if (result.stats.eliminatedCount !== 4) throw new Error('All 4 should be eliminated');
  if (result.stats.survivorCount !== 0) throw new Error('Should have 0 survivors');
});

// Test 6: Stats calculation is correct
test('Statistics are calculated correctly', () => {
  const gameState = createGameState({
    roles: {
      '0x1111': 'SENTINEL',
      '0x2222': 'SENTINEL',
      '0x3333': 'ECHO',
      '0x4444': 'ECHO',
      '0x5555': 'ECHO',
      '0x6666': 'ECHO',
      '0x7777': 'ECHO',
      '0x8888': 'ECHO',
      '0x9999': 'ECHO',
      '0xAAAA': 'ECHO'
    },
    eliminated: {
      '0x1111': true,
      '0x3333': true,
      '0x4444': true
    },
    moveCount: {
      '0x2222': 2,  // Sentinel winner
      '0x5555': 1,  // Echo winner
      '0x6666': 1,  // Echo winner
      '0x7777': 1,  // Echo winner
      '0x8888': 1,  // Echo winner
      '0x9999': 0,  // Survivor but no moves
      '0xAAAA': 1   // Echo winner
    }
  });

  const result = calculateWinners(gameState);

  if (result.stats.totalPlayers !== 10) throw new Error('Should have 10 total players');
  if (result.stats.eliminatedCount !== 3) throw new Error('Should have 3 eliminated');
  if (result.stats.survivorCount !== 7) throw new Error('Should have 7 survivors');
  if (result.stats.ineligibleSurvivors !== 1) throw new Error('Should have 1 ineligible survivor');
  if (result.stats.sentinelWinners !== 1) throw new Error('Should have 1 Sentinel winner');
  if (result.stats.echoWinners !== 5) throw new Error('Should have 5 Echo winners');
});

// Test 7: Game summary generation
test('Game summary includes all required information', () => {
  const gameState = createGameState({
    gameId: 'test-game-456',
    roles: {
      '0x1111': 'SENTINEL',
      '0x2222': 'ECHO'
    },
    eliminated: {
      '0x1111': true
    },
    moveCount: {
      '0x1111': 1,
      '0x2222': 1
    },
    pingsRemaining: {
      '0x1111': 0
    },
    actionHistory: [
      { actionType: 'ping', result: 'eliminated' },
      { actionType: 'ping', result: 'noEffect' }
    ]
  });

  const winnerData = calculateWinners(gameState);
  const summary = generateGameSummary(gameState, winnerData);

  if (summary.gameId !== 'test-game-456') throw new Error('Wrong game ID');
  if (summary.winnerCount !== 1) throw new Error('Should have 1 winner');
  if (!summary.actionSummary) throw new Error('Should have action summary');
  if (summary.actionSummary.totalActions !== 2) throw new Error('Should have 2 total actions');
  if (!summary.playerStats) throw new Error('Should have player stats');
  if (!summary.playerStats['0x1111']) throw new Error('Should have stats for 0x1111');
  if (!summary.playerStats['0x2222']) throw new Error('Should have stats for 0x2222');
});

// Test 8: Winner details include role and moves
test('Winner details include role and move count', () => {
  const gameState = createGameState({
    roles: {
      '0x1111': 'SENTINEL',
      '0x2222': 'ECHO'
    },
    eliminated: {},
    moveCount: {
      '0x1111': 2,
      '0x2222': 3
    }
  });

  const result = calculateWinners(gameState);

  if (result.winnerDetails.length !== 2) throw new Error('Should have 2 winner details');

  const sentinel = result.winnerDetails.find(w => w.address === '0x1111');
  const echo = result.winnerDetails.find(w => w.address === '0x2222');

  if (!sentinel) throw new Error('Should have Sentinel in winner details');
  if (!echo) throw new Error('Should have Echo in winner details');
  if (sentinel.role !== 'SENTINEL') throw new Error('Wrong role for Sentinel');
  if (echo.role !== 'ECHO') throw new Error('Wrong role for Echo');
  if (sentinel.moves !== 2) throw new Error('Wrong move count for Sentinel');
  if (echo.moves !== 3) throw new Error('Wrong move count for Echo');
});

// Test 9: Empty game state
test('Handles empty game state gracefully', () => {
  const gameState = createGameState({
    roles: {},
    eliminated: {},
    moveCount: {},
    actionHistory: []
  });

  const result = calculateWinners(gameState);

  if (result.winners.length !== 0) throw new Error('Should have no winners');
  if (result.stats.totalPlayers !== 0) throw new Error('Should have 0 total players');
});

// Test 10: Action history is preserved
test('Action history is preserved in results', () => {
  const gameState = createGameState({
    roles: {
      '0x1111': 'SENTINEL',
      '0x2222': 'ECHO'
    },
    eliminated: {},
    moveCount: {
      '0x1111': 1,
      '0x2222': 1
    },
    actionHistory: [
      { actionType: 'ping', scanner: '0x1111', target: '0x2222', result: 'noEffect' }
    ]
  });

  const result = calculateWinners(gameState);

  if (!result.actionHistory) throw new Error('Action history should be included');
  if (result.actionHistory.length !== 1) throw new Error('Should have 1 action in history');
  if (result.actionHistory[0].scanner !== '0x1111') throw new Error('Wrong scanner in action history');
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
}
