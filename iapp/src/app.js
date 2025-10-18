/**
 * Gridfall Role Generator iApp
 *
 * This TEE application generates confidential player roles for the Gridfall game.
 * It assigns 2 Sentinels (Hunters) and 8 Echoes (Hunted) to 10 players randomly.
 *
 * The role assignments are kept confidential using iExec's TEE technology.
 */

const fs = require('fs');
const crypto = require('crypto');

// iExec standard paths
const IEXEC_OUT = process.env.IEXEC_OUT || '/iexec_out';
const IEXEC_IN = process.env.IEXEC_IN || '/iexec_in';

/**
 * Generate random roles for 10 players
 * @param {string[]} playerAddresses - Array of 10 player Ethereum addresses
 * @returns {Object} Role assignments and game data
 */
function generateRoles(playerAddresses) {
  if (playerAddresses.length !== 10) {
    throw new Error('Exactly 10 players required');
  }

  // Create array of roles: 2 Sentinels, 8 Echoes
  const roles = [
    'SENTINEL', 'SENTINEL',  // 2 Sentinels (Hunters)
    'ECHO', 'ECHO', 'ECHO', 'ECHO', 'ECHO', 'ECHO', 'ECHO', 'ECHO'  // 8 Echoes (Hunted)
  ];

  // Shuffle roles using Fisher-Yates algorithm with crypto random
  for (let i = roles.length - 1; i > 0; i--) {
    const randomBytes = crypto.randomBytes(4);
    const j = Math.floor((randomBytes.readUInt32BE(0) / 0xFFFFFFFF) * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  // Create role assignments
  const roleAssignments = {};
  const sentinels = [];
  const echoes = [];

  playerAddresses.forEach((address, index) => {
    const role = roles[index];
    roleAssignments[address] = role;

    if (role === 'SENTINEL') {
      sentinels.push(address);
    } else {
      echoes.push(address);
    }
  });

  // Generate unique game ID
  const gameId = crypto.randomBytes(32).toString('hex');

  return {
    gameId,
    roleAssignments,
    sentinels,
    echoes,
    timestamp: Date.now(),
    totalPlayers: 10,
    sentinelCount: 2,
    echoCount: 8
  };
}

/**
 * Main application entry point
 */
async function main() {
  try {
    console.log('=== Gridfall Role Generator iApp ===');
    console.log('Running in TEE environment...');

    // Read input data (player addresses from smart contract)
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
    if (!inputData.players || !Array.isArray(inputData.players)) {
      throw new Error('Invalid input: players array required');
    }

    const players = inputData.players;
    console.log(`Generating roles for ${players.length} players...`);

    // Generate roles
    const result = generateRoles(players);

    console.log('Role generation successful!');
    console.log(`Game ID: ${result.gameId}`);
    console.log(`Sentinels: ${result.sentinelCount}`);
    console.log(`Echoes: ${result.echoCount}`);

    // Write encrypted output
    const outputPath = `${IEXEC_OUT}/result.json`;
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Results written to: ${outputPath}`);

    // Write computation result (required by iExec)
    const computedPath = `${IEXEC_OUT}/computed.json`;
    const computedResult = {
      'deterministic-output-path': outputPath
    };
    fs.writeFileSync(computedPath, JSON.stringify(computedResult));

    console.log('=== Role generation complete ===');
    process.exit(0);

  } catch (error) {
    console.error('Error in role generation:');
    console.error(error);

    // Write error to output
    const errorOutput = {
      error: error.message,
      stack: error.stack
    };
    fs.writeFileSync(`${IEXEC_OUT}/error.json`, JSON.stringify(errorOutput, null, 2));

    process.exit(1);
  }
}

// Run the application
main();
