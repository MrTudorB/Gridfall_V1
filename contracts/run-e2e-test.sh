#!/bin/bash

# Gridfall E2E Test Runner
# This script runs the end-to-end test on Arbitrum Sepolia

echo "🎮 Gridfall E2E Test Runner"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found"
    echo "Please create a .env file with your PRIVATE_KEY and ARBITRUM_SEPOLIA_RPC"
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Running E2E test on Arbitrum Sepolia..."
echo ""

npx hardhat run scripts/e2e-test.ts --network arbitrumSepolia
