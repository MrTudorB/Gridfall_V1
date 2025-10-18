# Gridfall iApps

This directory contains three iExec TEE (Trusted Execution Environment) applications for the Gridfall game.

## Overview

The Gridfall game uses three confidential iApps:

1. **Role Generator** (`src/app.js`) - Randomly assigns roles to 10 players:
   - 2 Sentinels (Hunters) - Try to eliminate Echoes
   - 8 Echoes (Hunted) - Try to survive

2. **Scan Executor** (`src/scan-executor.js`) - Processes ping/scan actions:
   - Sentinel → Echo = Echo eliminated
   - Sentinel → Sentinel = Friendly fire, scanner eliminated
   - Echo → Anyone = No effect
   - Enforces ping limits (2 per Sentinel)
   - Tracks move counts and action history

3. **Winner Calculator** (`src/winner-calculator.js`) - Determines game winners:
   - Identifies survivors (non-eliminated players)
   - Enforces minimum move requirement
   - Generates detailed game statistics

All operations are kept confidential using iExec's TEE technology.

## Project Structure

```
iapp/
├── src/
│   ├── app.js                   # Role generator
│   ├── scan-executor.js         # Ping/scan processor
│   └── winner-calculator.js     # Winner calculator
├── test/
│   ├── test-local.js           # Role generator tests
│   ├── test-scan-executor.js   # Scan executor tests (10 tests)
│   ├── test-winner-calculator.js # Winner calculator tests (10 tests)
│   ├── test-integration.js     # Integration test (full game flow)
│   └── test-docker.sh          # Docker testing script
├── Dockerfile                   # Docker configuration for iExec
├── DOCKER_TESTING.md           # Docker testing guide
├── package.json                 # Node.js dependencies
└── README.md                   # This file
```

## Local Testing

Run all tests:

```bash
npm install
npm test
```

This runs:
1. Role generator test (with mock data)
2. Scan executor test suite (10 tests)
3. Winner calculator test suite (10 tests)

Run individual test suites:

```bash
npm run test:roles        # Role generator only
npm run test:scan         # Scan executor tests
npm run test:winners      # Winner calculator tests
npm run test:integration  # Full game flow integration test
```

### Integration Test

The integration test simulates a complete game:

```bash
node test/test-integration.js
```

This test:
1. Generates roles for 10 players
2. Processes 7 different game actions (pings, safe exits, friendly fire)
3. Calculates winners
4. Validates all game mechanics
5. Saves detailed results to `test/test_integration/results/`

## Building

Build the Docker image:

```bash
npm run build
```

Or manually:

```bash
docker build -t gridfall-role-generator .
```

## Input Format

The application expects an `input.json` file in the iExec input directory with this structure:

```json
{
  "players": [
    "0x1111...",
    "0x2222...",
    ...
    "0xAAAA..."
  ],
  "gameAddress": "0xGameContractAddress",
  "timestamp": 1234567890
}
```

## Output Format

The application produces a `result.json` file with:

```json
{
  "gameId": "unique-game-id",
  "roleAssignments": {
    "0x1111...": "SENTINEL",
    "0x2222...": "ECHO",
    ...
  },
  "sentinels": ["0x1111...", "0x2222..."],
  "echoes": ["0x3333...", ...],
  "timestamp": 1234567890,
  "totalPlayers": 10,
  "sentinelCount": 2,
  "echoCount": 8
}
```

## Security Features

- **Cryptographically Secure Randomness**: Uses `crypto.randomBytes()` for shuffling roles
- **TEE Execution**: Runs in Intel SGX or Gramine environment
- **Confidential Output**: Results are encrypted by iExec before returning to the blockchain
- **Deterministic Proof**: iExec provides cryptographic proof of execution

## Deployment

To deploy this iApp to iExec:

1. Push Docker image to a registry
2. Use iExec SDK to register the application
3. Configure task parameters and pricing
4. Link to your Gridfall smart contract

See the main project README for full deployment instructions.
