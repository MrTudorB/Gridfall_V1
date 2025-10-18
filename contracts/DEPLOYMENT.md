# Gridfall Game - Deployment Information

## Arbitrum Sepolia Deployment

### Contract Details
- **Contract Address:** `0x0cce65424abCCC4A7486B06C5b0A004b0cb3A3e5`
- **Network:** Arbitrum Sepolia (Chain ID: 421614)
- **Deployer:** `0x8F00788eBe39c43B26a029A9efCe6C2166f810E0`
- **Deployment Date:** October 18, 2025

### Contract Configuration
- **Total Players:** 10
- **Deposit Amount:** 0.001 ETH per player
- **Protocol Fee:** 5%
- **Safe Exit Refund:** 50%

### Explorer Links
- **Contract:** https://sepolia.arbiscan.io/address/0x0cce65424abCCC4A7486B06C5b0A004b0cb3A3e5
- **Deployer Wallet:** https://sepolia.arbiscan.io/address/0x8F00788eBe39c43B26a029A9efCe6C2166f810E0

### Network Information
- **RPC URL:** https://sepolia-rollup.arbitrum.io/rpc
- **Chain ID:** 421614
- **Block Explorer:** https://sepolia.arbiscan.io/

### Next Steps
1. Verify contract on Arbiscan (see [VERIFY_CONTRACT.md](VERIFY_CONTRACT.md))
2. Update frontend configuration with contract address
3. Test contract interaction on testnet
4. Configure iExec application address

### Contract Verification
To verify the contract on Arbiscan, follow the instructions in [VERIFY_CONTRACT.md](VERIFY_CONTRACT.md).

### Important Notes
- This is a testnet deployment for testing and development purposes
- The deposit amount (0.001 ETH) is testnet-friendly for extensive testing
- Total prize pool per game: 0.01 ETH (10 players × 0.001 ETH)
- Keep the deployer private key secure (stored in wallet.json and .env)
