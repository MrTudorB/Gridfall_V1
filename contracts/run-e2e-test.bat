@echo off
REM Gridfall E2E Test Runner (Windows)
REM This script runs the end-to-end test on Arbitrum Sepolia

echo.
echo 🎮 Gridfall E2E Test Runner
echo ==============================
echo.

REM Check if .env file exists
if not exist .env (
    echo ❌ ERROR: .env file not found
    echo Please create a .env file with your PRIVATE_KEY and ARBITRUM_SEPOLIA_RPC
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
)

echo 🚀 Running E2E test on Arbitrum Sepolia...
echo.

call npx hardhat run scripts/e2e-test.ts --network arbitrumSepolia
