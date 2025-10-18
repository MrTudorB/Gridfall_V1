# Gridfall Role Generator iApp

This is an iExec TEE (Trusted Execution Environment) application that generates confidential player roles for the Gridfall game.

## Overview

The role generator randomly assigns roles to 10 players:
- **2 Sentinels** (Hunters) - Try to eliminate Echoes
- **8 Echoes** (Hunted) - Try to survive

All role assignments are kept confidential using iExec's TEE technology, ensuring that player roles remain secret throughout the game.

## Project Structure

```
iapp/
├── src/
│   └── app.js          # Main application logic
├── test/
│   └── test-local.js   # Local testing script
├── Dockerfile          # Docker configuration for iExec
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Local Testing

Test the role generation logic locally:

```bash
npm install
npm test
```

This will:
1. Create test directories simulating the iExec environment
2. Generate mock player addresses
3. Run the role generation algorithm
4. Output results to `test/test_data/iexec_out/result.json`

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
