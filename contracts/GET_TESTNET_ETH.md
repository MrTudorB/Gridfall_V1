# Getting Testnet ETH for Arbitrum Sepolia

## Deployer Wallet Information

**Address:** `0x8F00788eBe39c43B26a029A9efCe6C2166f810E0`

**Required:** ~0.002 ETH for deployment (actual requirement is ~0.0002 ETH, but get more for testing)

## Faucets

### Option 1: QuickNode Faucet (Recommended)
**URL:** https://faucet.quicknode.com/arbitrum/sepolia

**Steps:**
1. Go to https://faucet.quicknode.com/arbitrum/sepolia
2. Enter wallet address: `0x8F00788eBe39c43B26a029A9efCe6C2166f810E0`
3. Complete CAPTCHA
4. Click "Continue"
5. Receive 0.01 ETH (enough for deployment + testing)

**Pros:**
- Fast (usually instant)
- No account required
- Generous amount (0.01 ETH)

### Option 2: Alchemy Faucet
**URL:** https://www.alchemy.com/faucets/arbitrum-sepolia

**Steps:**
1. Go to https://www.alchemy.com/faucets/arbitrum-sepolia
2. Sign in with Alchemy account (free)
3. Enter wallet address: `0x8F00788eBe39c43B26a029A9efCe6C2166f810E0`
4. Click "Send Me ETH"
5. Receive 0.1 ETH

**Pros:**
- Large amount (0.1 ETH)
- Reliable
- Good for extensive testing

**Cons:**
- Requires Alchemy account

### Option 3: Chainlink Faucet
**URL:** https://faucets.chain.link/arbitrum-sepolia

**Steps:**
1. Go to https://faucets.chain.link/arbitrum-sepolia
2. Connect your wallet OR enter address manually
3. Complete CAPTCHA
4. Receive testnet ETH

**Pros:**
- Well-maintained
- Reliable

### Option 4: Bridge from Ethereum Sepolia
If you have Sepolia ETH, you can bridge it to Arbitrum Sepolia:

1. Go to https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia&sourceChain=sepolia
2. Connect wallet
3. Bridge ETH from Ethereum Sepolia to Arbitrum Sepolia
4. Wait ~10 minutes for bridging

## Checking Balance

After getting testnet ETH, verify your balance:

```bash
cd contracts
npx hardhat run scripts/check-balance.ts --network arbitrumSepolia
```

Expected output:
```
=== Wallet Information ===
Address: 0x8F00788eBe39c43B26a029A9efCe6C2166f810E0
Balance: 0.01 ETH
Network: arbitrum-sepolia
Chain ID: 421614

✅ Wallet has sufficient balance for deployment
```

## Deployment Cost Estimate

- **Contract Deployment:** ~0.00015-0.0002 ETH
- **Contract Interaction (join game):** ~0.00008 ETH per transaction
- **Recommended Balance:** 0.01 ETH (enough for deployment + ~100 test transactions)

## Network Information

- **Network Name:** Arbitrum Sepolia
- **Chain ID:** 421614
- **RPC URL:** https://sepolia-rollup.arbitrum.io/rpc
- **Block Explorer:** https://sepolia.arbiscan.io/

## Troubleshooting

### Faucet not working?
- Try a different faucet from the list above
- Check if you've used the faucet recently (some have cooldown periods)
- Try using a VPN if geo-restricted

### Bridge taking too long?
- Arbitrum Sepolia bridge typically takes 10-15 minutes
- Check status at: https://bridge.arbitrum.io/

### Still need help?
- Join Arbitrum Discord: https://discord.gg/arbitrum
- Ask in #faucet channel

## Ready to Deploy?

Once you have testnet ETH, run:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
```

The deployment will:
1. Deploy GridfallGame contract
2. Show contract address
3. Display deployment summary
4. Save deployment info to `deployments/` folder
