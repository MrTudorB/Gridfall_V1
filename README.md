# Gridfall

The decentralized battle-royale on Arbitrum.

Scan - Eliminate - Survive

## The Challenge

In DeFi, all information is public. This makes it impossible to build protocols based on asymmetric information—the core mechanic of high-stakes, "winner-take-all" games. How can you build an on-chain battle-royale if everyone's position and status are public from the start?

Gridfall solves this. It's a gamified capital pool that is only possible with confidential computing.

## How Gridfall Works

Gridfall is a high-stakes survival game where 10 players enter a "vault" and only the survivors split the prize pool.

Join the Purge: 10 players deposit 0.001 ETH each into the GridfallVault smart contract, creating a 0.01 ETH prize pool.

The Confidential Assignment: The contract calls the iExec iApp (the "Game Master"). The iApp runs inside a Trusted Execution Environment (TEE). It confidentially assigns roles: 2 players become Sentinels (Hunters) and 8 players become Echoes (Hunted).

The Secret is Stored: The iApp itself encrypts this secret role-map and stores it using iExec Data Protector. The protectedDataAddress is saved to the contract. No one, not even the admin, has seen the roles.

The Hunt (Scan & Eliminate): The game is now ACTIVE.

Sentinels can "ping" (scan) other players on the grid.

They call the ping() function on the contract, which triggers the iApp.

The iApp confidentially decrypts the role-map from Data Protector, executes the logic, and calls back with the result.

Sentinel pings Echo = Echo is eliminated.

Sentinel pings Sentinel = The pinging Sentinel is eliminated (friendly fire).

Echo pings = The Echo is eliminated (for making noise).

The Payout (Survive): After a set time, the iApp confidentially checks the role-map against the list of eliminated players. All surviving players (both Echoes and Sentinels) are added to the winners list and can claim their share of the 0.01 ETH prize pool.

All role information is encrypted via iExec Data Protector and never revealed on-chain.

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
