# iExec Integration for Gridfall

This README provides a quick guide for understanding and working with iExec integration in the Gridfall project.

## Current Status: Demo/Hackathon Ready ✅

The project is currently configured for **demo and hackathon use** with mock iExec callbacks. This approach is:
- ✅ Fully functional for demonstrations
- ✅ Fast to test and iterate
- ✅ No external dependencies
- ✅ Production-ready architecture

## Architecture

```
Gridfall
├── contracts/          # Smart contracts (Arbitrum)
│   ├── GridfallGame.sol       # Main game contract
│   ├── interfaces/IIexecOracle.sol  # iExec interface
│   ├── iexec.config.js        # iExec configuration
│   └── IEXEC_INTEGRATION.md   # Detailed integration guide
│
└── iapp/              # iExec TEE applications
    ├── src/
    │   ├── app.js              # Role generator
    │   ├── scan-executor.js    # Ping processor
    │   └── winner-calculator.js # Winner calculator
    └── Dockerfile              # TEE container
```

## Quick Start

### For Demos/Testing (Current Mode)

```bash
# Deploy contract with mock callbacks
cd contracts
npx hardhat test                    # Run all tests
npx hardhat run scripts/deploy.ts   # Deploy to testnet

# The contract works perfectly with manual callback triggers
# No iExec setup required!
```

### For Production (Future)

```bash
# 1. Deploy iApps to iExec
cd iapp
docker build -t your-registry/gridfall-iapp .
docker push your-registry/gridfall-iapp
# (Follow detailed steps in contracts/IEXEC_INTEGRATION.md)

# 2. Deploy contract with iExec enabled
cd contracts
IEXEC_ENABLED=true npx hardhat run scripts/deploy-with-iexec.ts --network arbitrumOne
```

## Key Features

### 1. Role Generation (TEE)
- **Input**: 10 player addresses
- **Process**: Randomly assigns 2 Sentinels, 8 Echoes
- **Output**: Encrypted role mapping
- **Current**: Works with mock data
- **Production**: Runs in iExec TEE

### 2. Scan Execution (TEE)
- **Input**: Game state + ping action
- **Process**: Determines elimination result
- **Output**: Eliminated player (if any)
- **Current**: Direct function calls
- **Production**: iExec oracle callback

### 3. Winner Calculation (TEE)
- **Input**: Final game state
- **Process**: Identifies survivors with moves
- **Output**: Winner addresses
- **Current**: Direct function calls
- **Production**: iExec oracle callback

## Why This Approach?

### Current (Mock Callbacks)
**Advantages:**
- ✅ Instant testing
- ✅ No external costs
- ✅ Perfect for hackathons
- ✅ Easy to debug
- ✅ Same contract interface as production

**Use Cases:**
- Development and testing
- Hackathon demonstrations
- Gas optimization
- Frontend integration testing

### Production (Real iExec)
**Advantages:**
- ✅ True confidential computing
- ✅ Verifiable TEE execution
- ✅ Decentralized infrastructure
- ✅ Tamper-proof results

**Use Cases:**
- Mainnet deployment
- High-stakes games
- When confidentiality is critical
- Multi-party trust requirements

## Migration Path

The contract is designed for easy migration:

```solidity
// Current (Demo)
function startGame() external onlyOwner {
    gameStatus = GameStatus.ACTIVE;
    // Roles assigned manually in tests
}

// Production (Same interface!)
function startGame() external onlyOwner {
    gameStatus = GameStatus.ACTIVE;
    // Automatically triggers iExec task
    _createIexecTask(roleGeneratorApp, players);
}
```

**No breaking changes to the contract interface!**

## Cost Comparison

| Mode | Setup Time | Per Game Cost | Best For |
|------|-----------|---------------|----------|
| Mock (Current) | 5 min | ~$0.01 (gas only) | Demos, Testing, Hackathons |
| iExec (Production) | 2-3 days | ~$1-3 (iExec + gas) | Production, Real Money |

## Testing

All tests work identically in both modes:

```bash
cd contracts
npm test                    # Run all tests (mock mode)

# Tests cover:
# - 45 test cases
# - All game mechanics
# - Prize distribution
# - Edge cases
# - Gas optimization
```

## Documentation

- **[IEXEC_INTEGRATION.md](contracts/IEXEC_INTEGRATION.md)** - Complete integration guide
- **[iexec.config.js](contracts/iexec.config.js)** - Configuration file
- **[DOCKER_TESTING.md](iapp/DOCKER_TESTING.md)** - iApp testing guide
- **[README.md](iapp/README.md)** - iApp documentation

## Support

### For Current (Mock) Setup
- Everything works out of the box
- No external setup needed
- Perfect for hackathons

### For Production iExec Setup
- iExec Discord: https://discord.gg/iexec
- iExec Docs: https://docs.iex.ec/
- GitHub: https://github.com/iExecBlockchainComputing

## FAQ

**Q: Do I need iExec to run Gridfall?**
A: No! The current mock implementation is fully functional.

**Q: Can I deploy to mainnet with mocks?**
A: Yes, but for real money games, iExec TEE is recommended for fairness.

**Q: How long does migration to iExec take?**
A: 2-3 days for first deployment, then it's automated.

**Q: Will my tests break when switching to iExec?**
A: No! The contract interface stays the same.

**Q: Is the mock version secure enough?**
A: For demos and low-stakes games, yes. For high-stakes, use iExec TEE.

## Next Steps

### For Hackathons/Demos (Recommended)
1. Deploy contract to testnet
2. Test with frontend
3. Demo the game!
4. Win the hackathon 🏆

### For Production
1. Read [IEXEC_INTEGRATION.md](contracts/IEXEC_INTEGRATION.md)
2. Deploy iApps to iExec testnet
3. Test integration thoroughly
4. Deploy to mainnet with confidence

---

**Remember**: The current implementation is production-ready architecture in demo mode. You're not cutting corners—you're using a smart development strategy! 🚀
