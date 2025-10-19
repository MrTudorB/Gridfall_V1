# Gridfall End-to-End Test Documentation

## Overview

The E2E test script (`scripts/e2e-test.ts`) performs a complete end-to-end test of the Gridfall game on Arbitrum Sepolia testnet. It simulates a full game from start to finish, including player joins, gameplay, and prize claiming.

## What the Test Does

### Step-by-Step Process

1. **Creates 10 Test Wallets**
   - Generates 10 random wallets using ethers.js
   - Each wallet will represent a player in the game

2. **Funds Test Wallets**
   - Transfers 0.002 ETH to each test wallet from the deployer
   - This covers the 0.001 ETH deposit + gas fees

3. **Checks Initial Game State**
   - Verifies the game is in LOBBY state (0)
   - Confirms deployer is the contract owner
   - Checks current player count

4. **Players Join the Game**
   - All 10 test wallets join the game
   - Each deposits 0.001 ETH
   - Verifies join events and gas usage

5. **Starts the Game**
   - Contract owner calls `startGame()`
   - Verifies game status changes to ACTIVE (1)

6. **Players Make Ping Moves**
   - Simulates 5-7 random ping actions
   - Random attackers ping random targets
   - Tracks eliminations via events
   - Waits 1 second between pings

7. **Ends the Game**
   - Contract owner calls `endGame()`
   - Verifies game status changes to FINISHED (2)

8. **Identifies Winners**
   - Calls `getWinners()` to retrieve winner list
   - Lists all winners with their addresses

9. **Winners Claim Prizes**
   - Each winner calls `claimPrize()`
   - Verifies prize amounts and balance changes
   - Tracks gas usage for claims

10. **Blockchain State Verification**
    - Verifies game status is FINISHED
    - Confirms 10 players joined
    - Checks prize pool distribution
    - Verifies all winners claimed prizes
    - Validates eliminated count
    - Confirms players remaining count

## Prerequisites

1. **Environment Setup**
   - Node.js installed
   - Hardhat installed (`npm install` in contracts directory)
   - `.env` file configured with:
     - `PRIVATE_KEY` - Deployer wallet private key (contract owner)
     - `ARBITRUM_SEPOLIA_RPC` - Arbitrum Sepolia RPC URL
     - `NEXT_PUBLIC_CONTRACT_ADDRESS` - Deployed contract address

2. **Wallet Requirements**
   - Deployer wallet must have at least **0.05 ETH** on Arbitrum Sepolia
   - Deployer must be the contract owner
   - Contract must be in LOBBY state (freshly deployed or reset)

3. **Contract Deployment**
   - GridfallGame contract must be deployed on Arbitrum Sepolia
   - Contract address must match the one in `.env`

## How to Run

### Option 1: Using the Runner Scripts (Recommended)

**On Windows:**
```bash
cd contracts
.\run-e2e-test.bat
```

**On Linux/Mac:**
```bash
cd contracts
chmod +x run-e2e-test.sh
./run-e2e-test.sh
```

### Option 2: Using Hardhat Directly

```bash
cd contracts
npx hardhat run scripts/e2e-test.ts --network arbitrumSepolia
```

## Expected Output

The script provides detailed, color-coded output showing:

```
═══════════════════════════════════════════════════════════
GRIDFALL E2E TEST - ARBITRUM SEPOLIA
═══════════════════════════════════════════════════════════
Deployer Address: 0x...
Deployer Balance: 0.15 ETH
Contract Address: 0x0cce65424abCCC4A7486B06C5b0A004b0cb3A3e5
✅ Contract owner verified

Step 1: Creating 10 Test Wallets
────────────────────────────────────────────────────────────
  Player 1: 0x...
  Player 2: 0x...
  ...
✅ Created 10 test wallets

Step 2: Funding Test Wallets with ETH
────────────────────────────────────────────────────────────
  Funding Player 1...
    ✅ Balance: 0.002 ETH
  ...
✅ All wallets funded

[... continues through all 10 steps ...]

═══════════════════════════════════════════════════════════
TEST SUMMARY
═══════════════════════════════════════════════════════════
Total Players: 10
Eliminated: 3
Winners: 7
Ping Actions: 6
Prize Pool Distributed: 0.0095 ETH

🎉 E2E TEST PASSED - ALL VERIFICATIONS SUCCESSFUL! 🎉
```

## What Gets Verified

### Blockchain State Checks

1. ✅ **Game Status**: Confirms game reaches FINISHED state
2. ✅ **Player Count**: Verifies all 10 players joined
3. ✅ **Prize Distribution**: Confirms prize pool was distributed
4. ✅ **Winners Claimed**: All winners successfully claimed prizes
5. ✅ **Elimination Count**: Matches eliminated players count
6. ✅ **Players Remaining**: Correct count of survivors
7. ✅ **Contract Balance**: Verified after all claims

### Transaction Verification

- All transactions include gas usage tracking
- Events are captured and verified
- Balance changes are tracked and validated

## Interpreting Results

### Success Criteria

The test passes if:
- All 10 players join successfully
- Game starts and ends without errors
- Winners are correctly identified
- All prizes are claimed successfully
- All blockchain verification checks pass
- Exit code: 0

### Failure Cases

The test fails if:
- Deployer has insufficient funds (< 0.05 ETH)
- Deployer is not the contract owner
- Game is not in LOBBY state at start
- Any transaction reverts
- Verification checks fail
- Exit code: 1

## Gas Usage Estimates

Based on typical runs:

- **Join Game**: ~50,000 - 80,000 gas per player
- **Start Game**: ~100,000 - 150,000 gas
- **Ping**: ~50,000 - 100,000 gas per ping
- **End Game**: ~200,000 - 300,000 gas
- **Claim Prize**: ~40,000 - 60,000 gas per winner

**Total estimated gas for full E2E test**: ~1,500,000 - 2,500,000 gas

## Troubleshooting

### Error: "Deployer needs at least 0.05 ETH"
- Fund your deployer wallet with Arbitrum Sepolia ETH
- See `GET_TESTNET_ETH.md` for faucet links

### Error: "Deployer is not the contract owner"
- Ensure you're using the wallet that deployed the contract
- Check `PRIVATE_KEY` in `.env` matches deployer

### Error: "Game must be in LOBBY state"
- Deploy a new contract instance, or
- Wait for current game to finish and reset

### RPC Errors / Timeouts
- Check `ARBITRUM_SEPOLIA_RPC` is correct
- Try a different RPC endpoint
- Increase timeout in hardhat.config.ts

### Transaction Reverted
- Check contract state on Arbiscan
- Verify no other test is running simultaneously
- Ensure contract has correct roles/permissions

## Cost Estimation

For one complete E2E test on Arbitrum Sepolia:

- **ETH Required**: ~0.05 ETH (includes buffer)
- **Actual Usage**: ~0.02-0.03 ETH (gas fees + deposits)
- **Deposits Returned**: ~0.0095 ETH to winners (95% of 0.01 ETH pool)

## Next Steps After Running E2E Test

1. **Review Results**: Check all verifications passed
2. **Inspect Transactions**: View on Arbiscan using transaction hashes
3. **Verify Events**: Confirm all events emitted correctly
4. **Test Edge Cases**: Run with different scenarios (more eliminations, etc.)
5. **Production Readiness**: If all tests pass, contract is ready for mainnet consideration

## Continuous Integration

To run this test in CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Test
  run: |
    cd contracts
    npm install
    npx hardhat run scripts/e2e-test.ts --network arbitrumSepolia
  env:
    PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
    ARBITRUM_SEPOLIA_RPC: ${{ secrets.ARBITRUM_SEPOLIA_RPC }}
```

## Limitations

- **Network Dependent**: Requires Arbitrum Sepolia testnet
- **Real ETH Required**: Cannot run without funded deployer
- **Single Game**: Tests one complete game cycle
- **No iExec Integration**: Role assignment is handled by smart contract randomness, not iExec TEE (for real games, iExec would assign roles)
- **Linear Execution**: No parallel transaction testing

## Advanced Usage

### Run with Custom Contract

```bash
export NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress
npx hardhat run scripts/e2e-test.ts --network arbitrumSepolia
```

### Run Multiple Times

```bash
for i in {1..5}; do
  echo "Running test iteration $i"
  npx hardhat run scripts/e2e-test.ts --network arbitrumSepolia
done
```

### Save Test Results

```bash
npx hardhat run scripts/e2e-test.ts --network arbitrumSepolia > test-results.log 2>&1
```

## Support

For issues or questions:
1. Check transaction hashes on [Arbiscan Sepolia](https://sepolia.arbiscan.io)
2. Review contract events and state
3. Verify `.env` configuration
4. Check deployer balance and permissions
