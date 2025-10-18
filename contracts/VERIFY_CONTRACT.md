# How to Verify Contract on Arbiscan

## Contract Information
- **Contract Address:** `0x0cce65424abCCC4A7486B06C5b0A004b0cb3A3e5`
- **Network:** Arbitrum Sepolia
- **Explorer:** https://sepolia.arbiscan.io/

## Step 1: Get Arbiscan API Key

1. Go to https://arbiscan.io/
2. Sign up or log in to your account
3. Navigate to API Keys section (https://arbiscan.io/myapikey)
4. Create a new API key
5. Copy the API key

## Step 2: Add API Key to .env

Open `contracts/.env` and add your API key:

```bash
ARBISCAN_API_KEY=YOUR_API_KEY_HERE
```

## Step 3: Verify the Contract

Run the verification script:

```bash
cd contracts
npx hardhat run scripts/verify.ts --network arbitrumSepolia
```

## Alternative: Manual Verification

If you prefer to verify manually on Arbiscan:

1. Go to: https://sepolia.arbiscan.io/address/0x0cce65424abCCC4A7486B06C5b0A004b0cb3A3e5#code
2. Click "Verify and Publish"
3. Select:
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.20+commit.a1b79de6
   - License Type: MIT
4. Paste the flattened contract code
5. Submit for verification

## View Contract on Explorer

- **Contract:** https://sepolia.arbiscan.io/address/0x0cce65424abCCC4A7486B06C5b0A004b0cb3A3e5
- **Transactions:** https://sepolia.arbiscan.io/address/0x0cce65424abCCC4A7486B06C5b0A004b0cb3A3e5#internaltx

## Note

Contract verification is optional but recommended as it:
- Makes the contract source code publicly viewable
- Allows users to interact with the contract through the block explorer
- Increases transparency and trust
