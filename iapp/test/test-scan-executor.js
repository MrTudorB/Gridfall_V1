/**
 * Test suite for scan-executor
 * Tests ping/scan logic and elimination mechanics
 */

const { processPing, processSafeExit } = require('../src/scan-executor');

// Test helper to create a clean game state
function createGameState() {
  return {
    roles: {
      '0x1111111111111111111111111111111111111111': 'SENTINEL', // Sentinel 1
      '0x2222222222222222222222222222222222222222': 'SENTINEL', // Sentinel 2
      '0x3333333333333333333333333333333333333333': 'ECHO',
      '0x4444444444444444444444444444444444444444': 'ECHO',
      '0x5555555555555555555555555555555555555555': 'ECHO',
      '0x6666666666666666666666666666666666666666': 'ECHO',
      '0x7777777777777777777777777777777777777777': 'ECHO',
      '0x8888888888888888888888888888888888888888': 'ECHO',
      '0x9999999999999999999999999999999999999999': 'ECHO',
      '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA': 'ECHO'
    },
    pingsRemaining: {},
    moveCount: {},
    actionHistory: [],
    eliminated: {}
  };
}

// Run tests
console.log('=== Scan Executor Test Suite ===\n');

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

// Test 1: Sentinel eliminates Echo
test('Sentinel successfully eliminates Echo', () => {
  const gameState = createGameState();
  const sentinel = '0x1111111111111111111111111111111111111111';
  const echo = '0x3333333333333333333333333333333333333333';

  const result = processPing(gameState, sentinel, echo);

  if (result.eliminatedPlayer !== echo) throw new Error('Echo should be eliminated');
  if (result.actionResult !== 'eliminated') throw new Error('Result should be eliminated');
  if (!gameState.eliminated[echo]) throw new Error('Echo should be marked as eliminated');
  if (gameState.pingsRemaining[sentinel] !== 1) throw new Error('Sentinel should have 1 ping remaining');
  if (gameState.moveCount[sentinel] !== 1) throw new Error('Sentinel move count should be 1');
});

// Test 2: Friendly fire (Sentinel pings Sentinel)
test('Friendly fire: Sentinel pings another Sentinel', () => {
  const gameState = createGameState();
  const sentinel1 = '0x1111111111111111111111111111111111111111';
  const sentinel2 = '0x2222222222222222222222222222222222222222';

  const result = processPing(gameState, sentinel1, sentinel2);

  if (result.eliminatedPlayer !== sentinel1) throw new Error('Scanner should be eliminated');
  if (result.actionResult !== 'friendlyFire') throw new Error('Result should be friendlyFire');
  if (!gameState.eliminated[sentinel1]) throw new Error('Scanner should be marked as eliminated');
  if (gameState.eliminated[sentinel2]) throw new Error('Target should not be eliminated');
});

// Test 3: Echo pings have no effect
test('Echo ping has no effect', () => {
  const gameState = createGameState();
  const echo1 = '0x3333333333333333333333333333333333333333';
  const echo2 = '0x4444444444444444444444444444444444444444';

  const result = processPing(gameState, echo1, echo2);

  if (result.eliminatedPlayer !== null) throw new Error('No one should be eliminated');
  if (result.actionResult !== 'noEffect') throw new Error('Result should be noEffect');
  if (gameState.moveCount[echo1] !== 1) throw new Error('Echo move count should be 1');
});

// Test 4: Sentinel ping limit
test('Sentinel cannot ping more than 2 times', () => {
  const gameState = createGameState();
  const sentinel = '0x1111111111111111111111111111111111111111';
  const echo1 = '0x3333333333333333333333333333333333333333';
  const echo2 = '0x4444444444444444444444444444444444444444';
  const echo3 = '0x5555555555555555555555555555555555555555';

  // First ping - should work
  processPing(gameState, sentinel, echo1);
  if (gameState.pingsRemaining[sentinel] !== 1) throw new Error('Should have 1 ping remaining');

  // Second ping - should work
  processPing(gameState, sentinel, echo2);
  if (gameState.pingsRemaining[sentinel] !== 0) throw new Error('Should have 0 pings remaining');

  // Third ping - should fail
  try {
    processPing(gameState, sentinel, echo3);
    throw new Error('Should have thrown error for no pings remaining');
  } catch (error) {
    if (!error.message.includes('no pings remaining')) {
      throw new Error('Wrong error message');
    }
  }
});

// Test 5: Cannot ping eliminated player
test('Cannot ping already eliminated player', () => {
  const gameState = createGameState();
  const sentinel = '0x1111111111111111111111111111111111111111';
  const echo = '0x3333333333333333333333333333333333333333';

  // Eliminate echo first
  gameState.eliminated[echo] = true;

  // Try to ping eliminated player
  try {
    processPing(gameState, sentinel, echo);
    throw new Error('Should have thrown error for eliminated target');
  } catch (error) {
    if (!error.message.includes('already eliminated')) {
      throw new Error('Wrong error message');
    }
  }
});

// Test 6: Eliminated player cannot ping
test('Eliminated player cannot perform ping', () => {
  const gameState = createGameState();
  const sentinel = '0x1111111111111111111111111111111111111111';
  const echo = '0x3333333333333333333333333333333333333333';

  // Eliminate sentinel first
  gameState.eliminated[sentinel] = true;

  // Try to ping as eliminated player
  try {
    processPing(gameState, sentinel, echo);
    throw new Error('Should have thrown error for eliminated scanner');
  } catch (error) {
    if (!error.message.includes('already eliminated')) {
      throw new Error('Wrong error message');
    }
  }
});

// Test 7: Safe exit
test('Safe exit marks player as eliminated and records move', () => {
  const gameState = createGameState();
  const player = '0x3333333333333333333333333333333333333333';

  const result = processSafeExit(gameState, player);

  if (result.eliminatedPlayer !== player) throw new Error('Player should be eliminated');
  if (result.actionResult !== 'safeExit') throw new Error('Result should be safeExit');
  if (!gameState.eliminated[player]) throw new Error('Player should be marked as eliminated');
  if (gameState.moveCount[player] !== 1) throw new Error('Move count should be 1');
  if (gameState.actionHistory.length !== 1) throw new Error('Should have 1 action in history');
});

// Test 8: Action history tracking
test('Action history is properly recorded', () => {
  const gameState = createGameState();
  const sentinel = '0x1111111111111111111111111111111111111111';
  const echo = '0x3333333333333333333333333333333333333333';

  processPing(gameState, sentinel, echo);

  if (gameState.actionHistory.length !== 1) throw new Error('Should have 1 action');
  const action = gameState.actionHistory[0];
  if (action.scanner !== sentinel) throw new Error('Wrong scanner in history');
  if (action.target !== echo) throw new Error('Wrong target in history');
  if (action.actionType !== 'ping') throw new Error('Wrong action type');
  if (action.result !== 'eliminated') throw new Error('Wrong result');
  if (action.scannerRole !== 'SENTINEL') throw new Error('Wrong scanner role');
  if (action.targetRole !== 'ECHO') throw new Error('Wrong target role');
});

// Test 9: Move count increments correctly
test('Move count increments for each action', () => {
  const gameState = createGameState();
  const sentinel = '0x1111111111111111111111111111111111111111';
  const echo1 = '0x3333333333333333333333333333333333333333';
  const echo2 = '0x4444444444444444444444444444444444444444';

  processPing(gameState, sentinel, echo1);
  if (gameState.moveCount[sentinel] !== 1) throw new Error('Move count should be 1');

  processPing(gameState, sentinel, echo2);
  if (gameState.moveCount[sentinel] !== 2) throw new Error('Move count should be 2');
});

// Test 10: Cannot ping yourself
test('Cannot ping yourself', () => {
  const gameState = createGameState();
  const player = '0x1111111111111111111111111111111111111111';

  try {
    processPing(gameState, player, player);
    throw new Error('Should have thrown error for self-ping');
  } catch (error) {
    if (!error.message.includes('Cannot ping yourself')) {
      throw new Error('Wrong error message');
    }
  }
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
