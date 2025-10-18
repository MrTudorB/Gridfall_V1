# Gridfall

A high-stakes, zero-knowledge game of digital survival on Arbitrum, where players' secret roles are kept confidential by iExec's TEE technology.

## Overview

Gridfall is a Web3 game where 10 players compete with hidden roles:
- **2 Sentinels** (Hunters) - Eliminate Echoes but risk friendly fire
- **8 Echoes** (Hunted) - Survive and discover their role through gameplay

All role information is encrypted via iExec Data Protector and never revealed on-chain.

## Tech Stack

- **Blockchain:** Arbitrum Sepolia
- **Confidential Computing:** iExec SDK (Data Protector, iApp Generator)
- **Smart Contracts:** Hardhat, Solidity, OpenZeppelin
- **Frontend:** Next.js 14, Tailwind CSS v4, RainbowKit + wagmi

## Project Structure

```
gridfall/
├── contracts/      # Smart contracts (Hardhat)
├── iapp/          # iExec TEE application
├── frontend/      # Next.js dApp
├── scripts/       # Deployment and demo scripts
└── shared/        # Shared types and constants
```

## Getting Started

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for detailed build instructions.

## Current Status

Check [PROGRESS.md](./PROGRESS.md) for development progress.

## License

MIT
