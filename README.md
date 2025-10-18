# GRIDFALL

![nano-banana-2025-10-18T19-12-27 (1)](https://github.com/user-attachments/assets/ec27d186-cc53-4e99-91b1-27471e43545e)

## The Challenge

In DeFi, all information is public. This makes it impossible to build protocols based on asymmetric information—the core mechanic of high-stakes, "winner-take-all" games. How can you build an on-chain battle-royale if everyone's position and status are public from the start?

Gridfall solves this. It's a gamified capital pool that is only possible with confidential computing.

## How Gridfall Works

‣ Join the Vault: 10 players connect their wallets and call joinGame(), depositing 0.001 ETH each into the GridfallVault smart contract. This creates the 0.01 ETH prize pool.

‣ Trigger the Game Master: Once the vault is full, the contract calls the iExec iApp (the "Game Master") to confidentially start the game.

‣ Confidential Assignment: The iApp runs inside a Trusted Execution Environment (TEE). It secretly assigns roles (2 Sentinels, 8 Echoes) and encrypts this role-map using iExec Data Protector. This secret is now stored, and no human, not even the admin, can see it.

‣ The Hunt (Scan & Eliminate): The game is now ACTIVE. Any player can call the ping() function on another player. The contract forwards this request to the iApp.

‣ Execute the Logic: The iApp confidentially decrypts the secret role-map, executes the game's logic (Sentinel vs. Echo, friendly fire), and calls back to the contract to mark the correct player as "eliminated."

‣ The Payout (Survive): After the game ends, the iApp confidentially compares the secret role-map against the list of eliminated players to determine the survivors.

‣ Claim Your Winnings: All surviving players—whose roles were never publicly revealed—can now call claimPrize() to receive their share of the prize pool.

## Tech Stack

- **Blockchain:** Arbitrum Sepolia
- **Confidential Computing:** iExec SDK (Data Protector, iApp Generator)
- **Smart Contracts:** Hardhat, Solidity, OpenZeppelin
- **Frontend:** Next.js 14, Tailwind CSS v4, RainbowKit + wagmi
- **Deployment:** Vercel
- **Gridfall Vault:** [0xYourContractAddress...]

## Project Structure

```
gridfall/
├── contracts/      # Smart contracts (Hardhat)
├── iapp/          # iExec TEE application
├── frontend/      # Next.js dApp
├── scripts/       # Deployment and demo scripts
└── shared/        # Shared types and constants
```

## Future Scope
V2 Game Modes: Introduce new roles like "Phantoms" (who can dodge one ping) or "Traitors" (Echoes who know who one Sentinel is).

Sybil Resistance: Integrate Gitcoin Passport or Worldcoin into the joinGame() function to prevent Sybil attacks and ensure 1 human = 1 player.

Fully Autonomous: Remove the admin startGame() and endGame() functions and replace them with automated triggers (e.g., players.length == 10 and block.timestamp > gameStartTime + 1 day).

NFT Trophies: Mint a non-transferable "Survivor" or "Apex Sentinel" NFT to winning wallets as a badge of honor.

## Getting Started

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for detailed build instructions.

## Current Status

Check [PROGRESS.md](./PROGRESS.md) for development progress.
