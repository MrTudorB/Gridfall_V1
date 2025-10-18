/**
 * Local test for role generation
 * This simulates the iExec environment for testing purposes
 */

const fs = require('fs');
const path = require('path');

// Create test directories
const TEST_DIR = path.join(__dirname, 'test_data');
const IEXEC_IN = path.join(TEST_DIR, 'iexec_in');
const IEXEC_OUT = path.join(TEST_DIR, 'iexec_out');

// Create directories if they don't exist
[TEST_DIR, IEXEC_IN, IEXEC_OUT].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Set environment variables
process.env.IEXEC_IN = IEXEC_IN;
process.env.IEXEC_OUT = IEXEC_OUT;

// Create test input data (10 mock player addresses)
const testPlayers = [
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

const inputData = {
  players: testPlayers,
  gameAddress: '0xGameContractAddress',
  timestamp: Date.now()
};

// Write input file
fs.writeFileSync(
  path.join(IEXEC_IN, 'input.json'),
  JSON.stringify(inputData, null, 2)
);

console.log('=== Running Local Test ===');
console.log('Input data created in:', IEXEC_IN);
console.log('Output will be written to:', IEXEC_OUT);
console.log('\nTest Players:');
testPlayers.forEach((player, i) => console.log(`  ${i + 1}. ${player}`));
console.log('\n--- Starting Role Generation ---\n');

// Run the application
require('../src/app.js');

// Note: The app.js will exit the process, so code after this won't run
// To see results, check the test_data/iexec_out directory
