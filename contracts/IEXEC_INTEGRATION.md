# iExec Integration Guide for Gridfall

This document explains how to integrate the Gridfall smart contract with iExec's TEE (Trusted Execution Environment) for confidential role generation, scan execution, and winner calculation.

## Overview

Gridfall uses three iExec TEE applications (iApps):
1. **Role Generator** - Assigns secret roles to 10 players
2. **Scan Executor** - Processes ping/scan actions confidentially
3. **Winner Calculator** - Determines winners based on game state

## Current Implementation Status

### Demo/Testing Mode (Current)
The smart contract currently uses **mock callbacks** for testing purposes:
- `_roleGenerationCallback()` - Manually called in tests
- `_pingCallback()` - Manually called in tests
- `_endGameCallback()` - Manually called in tests

This allows for:
- ✅ Local testing without iExec infrastructure
- ✅ Fast iteration during development
- ✅ Gas estimation and optimization
- ✅ Complete game flow testing

### Production Mode (Integration Required)

For production deployment, the contract needs to integrate with iExec's oracle/callback system.

## Integration Architecture

```
┌─────────────────┐
│  Smart Contract │
│   (GridfallGame)│
└────────┬────────┘
         │
         │ 1. Request Task
         ▼
┌─────────────────┐
│  iExec Protocol │
│  (PoCo)         │
└────────┬────────┘
         │
         │ 2. Execute in TEE
         ▼
┌─────────────────┐
│   iApp (Docker) │
│ - Role Generator│
│ - Scan Executor │
│ - Winner Calc   │
└────────┬────────┘
         │
         │ 3. Return Results
         ▼
┌─────────────────┐
│  Smart Contract │
│  (Callback)     │
└─────────────────┘
```

## Production Integration Steps

### Step 1: Deploy iApps to iExec

1. **Build and push Docker images:**
```bash
cd iapp
docker build -t your-registry/gridfall-iapp .
docker push your-registry/gridfall-iapp
```

2. **Initialize iExec SDK:**
```bash
npm install -g iexec
iexec init --skip-wallet
```

3. **Configure app.json:**
```json
{
  "owner": "0xYourAddress",
  "name": "gridfall-role-generator",
  "type": "DOCKER",
  "multiaddr": "your-registry/gridfall-iapp:latest",
  "checksum": "0x...",
  "mrenclave": {
    "framework": "SCONE",
    "version": "v5",
    "entrypoint": "node src/app.js",
    "heapSize": 1073741824
  }
}
```

4. **Deploy apps:**
```bash
# Deploy role generator
iexec app deploy --args "src/app.js"

# Deploy scan executor
iexec app deploy --args "src/scan-executor.js"

# Deploy winner calculator
iexec app deploy --args "src/winner-calculator.js"
```

### Step 2: Configure Data Protector

For encrypted role storage:

```bash
# Install Data Protector
npm install @iexec/dataprotector

# In your deployment script:
const { IExecDataProtector } = require('@iexec/dataprotector');
const dataProtector = new IExecDataProtector(web3Provider);

// Protect role data
const protectedData = await dataProtector.protectData({
  data: roleAssignments,
  name: 'Gridfall Game Roles'
});
```

### Step 3: Update Smart Contract

The contract needs to store iExec app addresses:

```solidity
// Add to GridfallGame.sol
address public roleGeneratorApp;
address public scanExecutorApp;
address public winnerCalculatorApp;

function setIexecApps(
    address _roleGen,
    address _scanExec,
    address _winnerCalc
) external onlyOwner {
    roleGeneratorApp = _roleGen;
    scanExecutorApp = _scanExec;
    winnerCalculatorApp = _winnerCalc;
}
```

### Step 4: Implement Task Creation

Replace mock functions with real iExec task requests:

```solidity
// Instead of mock callback:
function startGame() external onlyOwner {
    require(gameStatus == GameStatus.PENDING, "Game already started");
    require(players.length == TOTAL_PLAYERS, "Need 10 players");

    gameStatus = GameStatus.ACTIVE;

    // Create iExec task for role generation
    bytes32 taskId = _createIexecTask(
        roleGeneratorApp,
        abi.encode(players)
    );

    emit GameStarted(block.timestamp);
    emit IexecTaskCreated(taskId, "roleGeneration");
}

function _createIexecTask(
    address app,
    bytes memory params
) internal returns (bytes32) {
    // Call iExec protocol to create task
    // This is a simplified example
    return keccak256(abi.encodePacked(app, params, block.timestamp));
}
```

### Step 5: Implement Callbacks

Update callback functions to receive iExec results:

```solidity
// Implement IIexecCallback interface
function receiveResult(
    bytes32 _taskId,
    bytes calldata _results
) external override {
    require(msg.sender == iexecOracleAddress, "Only iExec oracle");

    // Decode and process results based on task type
    (string memory taskType, bytes memory data) = abi.decode(
        _results,
        (string, bytes)
    );

    if (keccak256(bytes(taskType)) == keccak256("roleGeneration")) {
        _handleRoleGenerationResult(data);
    } else if (keccak256(bytes(taskType)) == keccak256("scan")) {
        _handleScanResult(data);
    } else if (keccak256(bytes(taskType)) == keccak256("winners")) {
        _handleWinnersResult(data);
    }
}
```

## Testing Strategy

### Local Testing (Current)
Use mock callbacks for fast iteration:
```bash
cd contracts
npx hardhat test
```

### iExec Testnet Testing
Deploy to iExec Viviani (testnet):
```bash
# Deploy contract to Arbitrum Sepolia
npx hardhat run scripts/deploy.ts --network arbitrumSepolia

# Deploy iApps to iExec testnet
iexec app deploy --chain viviani

# Run integration test
npx hardhat run scripts/test-iexec-integration.ts
```

### Production Deployment
1. Deploy iApps to iExec mainnet
2. Deploy smart contract to Arbitrum mainnet
3. Configure Data Protector for production
4. Whitelist contract address with iExec
5. Test with small amounts first

## Security Considerations

1. **TEE Verification**: Verify MRENCLAVE values match your Docker image
2. **Callback Authentication**: Only accept callbacks from verified iExec oracle
3. **Data Encryption**: Use Data Protector for all sensitive data
4. **Access Control**: Restrict who can trigger iExec tasks
5. **Gas Limits**: Set appropriate gas limits for callbacks
6. **Reentrancy**: Use ReentrancyGuard on callback functions

## Cost Estimation

Typical costs for iExec tasks:
- Role Generation: ~$0.10-0.50 per game
- Scan Execution: ~$0.05-0.10 per ping
- Winner Calculation: ~$0.10-0.20 per game

Total per game: ~$1-3 USD in RLC tokens

## Useful Resources

- iExec Documentation: https://docs.iex.ec/
- Data Protector Docs: https://tools.docs.iex.ec/tools/dataprotector
- iExec Oracle Factory: https://docs.iex.ec/for-developers/oracles
- iExec SDK: https://github.com/iExecBlockchainComputing/iexec-sdk

## Development Roadmap

### Phase 1: Local Testing (Current) ✅
- Mock callbacks
- Full game flow testing
- Gas optimization

### Phase 2: iExec Integration (This Step)
- Deploy iApps to testnet
- Implement real callbacks
- Test on iExec Viviani

### Phase 3: Production Deployment
- Deploy to mainnet
- Configure Data Protector
- Production monitoring

## Support

For iExec integration support:
- Discord: https://discord.gg/iexec
- GitHub Issues: https://github.com/iExecBlockchainComputing/iexec-sdk/issues
- Documentation: https://docs.iex.ec/

## Notes

The current implementation with mock callbacks is **completely valid for hackathons and demos**. The smart contract is designed to be production-ready with minimal changes needed to integrate real iExec callbacks.

Key advantages of current approach:
- Fast testing and iteration
- No dependency on external services
- Easy to demonstrate game mechanics
- Lower gas costs during development
- Can deploy and test without RLC tokens

The mock implementation follows the exact same callback pattern that production iExec would use, making the transition straightforward when ready.
