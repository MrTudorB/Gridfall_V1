/**
 * End-to-End Test Script for Gridfall Game
 *
 * This script tests a complete game flow on Arbitrum Sepolia:
 * 1. Creates 10 test wallets
 * 2. Funds them with ETH from the deployer
 * 3. All 10 players join the game
 * 4. Owner starts the game
 * 5. Players make ping moves (5-7 pings)
 * 6. Owner ends the game
 * 7. Winners claim their prizes
 * 8. Verifies all blockchain state changes
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Contract address on Arbitrum Sepolia
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0cce65424abCCC4A7486B06C5b0A004b0cb3A3e5";

// Test configuration
const DEPOSIT_AMOUNT = ethers.parseEther("0.001"); // 0.001 ETH per player
const FUNDING_AMOUNT = ethers.parseEther("0.002"); // Extra for gas
const TOTAL_PLAYERS = 10;

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log();
  log("═".repeat(60), colors.bright);
  log(title, colors.cyan + colors.bright);
  log("═".repeat(60), colors.bright);
}

function logStep(step: number, message: string) {
  log(`\nStep ${step}: ${message}`, colors.blue + colors.bright);
  log("─".repeat(60), colors.gray);
}

async function main() {
  logSection("GRIDFALL E2E TEST - ARBITRUM SEPOLIA");

  // Get deployer (owner) wallet
  const [deployer] = await ethers.getSigners();
  log(`Deployer Address: ${deployer.address}`, colors.yellow);

  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  log(`Deployer Balance: ${ethers.formatEther(deployerBalance)} ETH`, colors.yellow);

  if (deployerBalance < ethers.parseEther("0.05")) {
    log("❌ ERROR: Deployer needs at least 0.05 ETH for testing", colors.red);
    log("Please fund the deployer wallet and try again", colors.red);
    process.exit(1);
  }

  // Connect to the contract
  const GridfallGame = await ethers.getContractFactory("GridfallGame");
  const game = GridfallGame.attach(CONTRACT_ADDRESS);

  log(`Contract Address: ${CONTRACT_ADDRESS}`, colors.yellow);

  // Verify contract ownership
  const owner = await game.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    log(`❌ ERROR: Deployer ${deployer.address} is not the contract owner (${owner})`, colors.red);
    log("Please use the contract owner wallet", colors.red);
    process.exit(1);
  }
  log(`✅ Contract owner verified`, colors.green);

  // ============================================
  // STEP 1: Create Test Wallets
  // ============================================
  logStep(1, "Creating 10 Test Wallets");

  const testWallets: ethers.Wallet[] = [];
  for (let i = 0; i < TOTAL_PLAYERS; i++) {
    const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
    testWallets.push(wallet);
    log(`  Player ${i + 1}: ${wallet.address}`, colors.gray);
  }
  log(`✅ Created ${TOTAL_PLAYERS} test wallets`, colors.green);

  // ============================================
  // STEP 2: Fund Test Wallets
  // ============================================
  logStep(2, "Funding Test Wallets with ETH");

  for (let i = 0; i < testWallets.length; i++) {
    const wallet = testWallets[i];
    log(`  Funding Player ${i + 1}...`, colors.gray);

    const tx = await deployer.sendTransaction({
      to: wallet.address,
      value: FUNDING_AMOUNT,
    });
    await tx.wait();

    const balance = await ethers.provider.getBalance(wallet.address);
    log(`    ✅ Balance: ${ethers.formatEther(balance)} ETH`, colors.gray);
  }
  log(`✅ All wallets funded`, colors.green);

  // ============================================
  // STEP 3: Check Initial Game State
  // ============================================
  logStep(3, "Checking Initial Game State");

  let gameStatus = await game.gameStatus();
  log(`  Game Status: ${gameStatus === 0n ? "LOBBY" : gameStatus === 1n ? "ACTIVE" : "FINISHED"}`, colors.gray);

  if (gameStatus !== 0n) {
    log("❌ ERROR: Game must be in LOBBY state (0) to start test", colors.red);
    log("Please deploy a new contract or reset the game", colors.red);
    process.exit(1);
  }

  const currentPlayers = await game.getPlayers();
  log(`  Current Players: ${currentPlayers.length}`, colors.gray);

  if (currentPlayers.length > 0) {
    log("⚠️  WARNING: Game already has players. This test expects an empty lobby.", colors.yellow);
    log("Results may be inaccurate. Consider deploying a fresh contract.", colors.yellow);
  }

  // ============================================
  // STEP 4: Players Join the Game
  // ============================================
  logStep(4, "Players Joining the Game");

  for (let i = 0; i < testWallets.length; i++) {
    const wallet = testWallets[i];
    const playerGame = game.connect(wallet);

    log(`  Player ${i + 1} joining...`, colors.gray);
    const tx = await playerGame.joinGame({ value: DEPOSIT_AMOUNT });
    const receipt = await tx.wait();

    // Get the PlayerJoined event
    const joinEvent = receipt?.logs.find(
      (log: any) => log.fragment?.name === "PlayerJoined"
    );

    if (joinEvent) {
      log(`    ✅ Joined! Gas used: ${receipt?.gasUsed.toString()}`, colors.gray);
    }
  }

  const playersInGame = await game.getPlayers();
  log(`✅ ${playersInGame.length}/${TOTAL_PLAYERS} players joined`, colors.green);

  const prizePoolAfterJoin = await game.prizePool();
  log(`  Prize Pool: ${ethers.formatEther(prizePoolAfterJoin)} ETH`, colors.yellow);

  // ============================================
  // STEP 5: Start the Game
  // ============================================
  logStep(5, "Starting the Game");

  log(`  Owner starting game...`, colors.gray);
  const startTx = await game.startGame();
  const startReceipt = await startTx.wait();

  gameStatus = await game.gameStatus();
  log(`  Game Status: ${gameStatus === 1n ? "ACTIVE" : "ERROR"}`, colors.gray);
  log(`  Gas used: ${startReceipt?.gasUsed.toString()}`, colors.gray);

  if (gameStatus !== 1n) {
    log("❌ ERROR: Game failed to start", colors.red);
    process.exit(1);
  }
  log(`✅ Game started successfully`, colors.green);

  // ============================================
  // STEP 6: Players Make Ping Moves
  // ============================================
  logStep(6, "Players Making Ping Moves");

  log(`  Simulating 5-7 random ping actions...`, colors.gray);

  const numPings = 5 + Math.floor(Math.random() * 3); // 5-7 pings
  let eliminationCount = 0;

  for (let i = 0; i < numPings; i++) {
    // Random attacker
    const attackerIndex = Math.floor(Math.random() * testWallets.length);
    const attacker = testWallets[attackerIndex];

    // Random target (different from attacker)
    let targetIndex;
    do {
      targetIndex = Math.floor(Math.random() * testWallets.length);
    } while (targetIndex === attackerIndex);
    const target = testWallets[targetIndex];

    log(`\n  Ping ${i + 1}/${numPings}:`, colors.gray);
    log(`    Attacker: Player ${attackerIndex + 1} (${attacker.address.slice(0, 10)}...)`, colors.gray);
    log(`    Target: Player ${targetIndex + 1} (${target.address.slice(0, 10)}...)`, colors.gray);

    const playerGame = game.connect(attacker);

    try {
      const pingTx = await playerGame.ping(target.address);
      const pingReceipt = await pingTx.wait();

      // Check if target was eliminated
      const eliminatedEvent = pingReceipt?.logs.find(
        (log: any) => log.fragment?.name === "PlayerEliminated"
      );

      if (eliminatedEvent) {
        eliminationCount++;
        log(`    ❌ Target ELIMINATED! Total eliminations: ${eliminationCount}`, colors.red);
      } else {
        log(`    ✅ Ping successful (no elimination)`, colors.gray);
      }

      log(`    Gas used: ${pingReceipt?.gasUsed.toString()}`, colors.gray);

      // Small delay between pings
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error: any) {
      log(`    ⚠️  Ping failed: ${error.message}`, colors.yellow);
    }
  }

  const eliminatedPlayers = await game.getEliminatedPlayers();
  log(`\n✅ Ping phase complete`, colors.green);
  log(`  Total eliminations: ${eliminatedPlayers.length}`, colors.yellow);
  log(`  Players remaining: ${TOTAL_PLAYERS - eliminatedPlayers.length}`, colors.yellow);

  // ============================================
  // STEP 7: End the Game
  // ============================================
  logStep(7, "Ending the Game");

  log(`  Owner ending game...`, colors.gray);
  const endTx = await game.endGame();
  const endReceipt = await endTx.wait();

  gameStatus = await game.gameStatus();
  log(`  Game Status: ${gameStatus === 2n ? "FINISHED" : "ERROR"}`, colors.gray);
  log(`  Gas used: ${endReceipt?.gasUsed.toString()}`, colors.gray);

  if (gameStatus !== 2n) {
    log("❌ ERROR: Game failed to end properly", colors.red);
    process.exit(1);
  }
  log(`✅ Game ended successfully`, colors.green);

  // ============================================
  // STEP 8: Identify Winners
  // ============================================
  logStep(8, "Identifying Winners");

  const winners = await game.getWinners();
  log(`  Winners: ${winners.length}`, colors.green);

  if (winners.length === 0) {
    log("  ⚠️  No winners (all players eliminated or didn't make moves)", colors.yellow);
  } else {
    winners.forEach((winner, i) => {
      const playerIndex = testWallets.findIndex(w => w.address.toLowerCase() === winner.toLowerCase());
      log(`    ${i + 1}. Player ${playerIndex + 1}: ${winner}`, colors.gray);
    });
  }

  // ============================================
  // STEP 9: Winners Claim Prizes
  // ============================================
  logStep(9, "Winners Claiming Prizes");

  if (winners.length === 0) {
    log("  ⏭️  Skipping prize claiming (no winners)", colors.yellow);
  } else {
    for (let i = 0; i < winners.length; i++) {
      const winnerAddress = winners[i];
      const winnerWallet = testWallets.find(w => w.address.toLowerCase() === winnerAddress.toLowerCase());

      if (!winnerWallet) {
        log(`  ⚠️  Winner ${winnerAddress} not in test wallets`, colors.yellow);
        continue;
      }

      const playerIndex = testWallets.indexOf(winnerWallet);
      log(`\n  Winner ${i + 1}/${winners.length}: Player ${playerIndex + 1}`, colors.gray);

      const claimableAmount = await game.claimableAmount(winnerAddress);
      log(`    Claimable: ${ethers.formatEther(claimableAmount)} ETH`, colors.gray);

      const balanceBefore = await ethers.provider.getBalance(winnerAddress);

      const winnerGame = game.connect(winnerWallet);
      const claimTx = await winnerGame.claimPrize();
      const claimReceipt = await claimTx.wait();

      const balanceAfter = await ethers.provider.getBalance(winnerAddress);
      const netGain = balanceAfter - balanceBefore;

      log(`    ✅ Claimed! Net gain: ${ethers.formatEther(netGain)} ETH`, colors.green);
      log(`    Gas used: ${claimReceipt?.gasUsed.toString()}`, colors.gray);
    }

    log(`\n✅ All prizes claimed`, colors.green);
  }

  // ============================================
  // STEP 10: Blockchain Verification
  // ============================================
  logStep(10, "Blockchain State Verification");

  let errors = 0;

  // Verify 1: Game status is FINISHED
  const finalGameStatus = await game.gameStatus();
  if (finalGameStatus === 2n) {
    log(`  ✅ Game status is FINISHED`, colors.green);
  } else {
    log(`  ❌ ERROR: Game status is not FINISHED (${finalGameStatus})`, colors.red);
    errors++;
  }

  // Verify 2: Total players is 10
  const finalPlayers = await game.getPlayers();
  if (finalPlayers.length === TOTAL_PLAYERS) {
    log(`  ✅ Total players: ${finalPlayers.length}`, colors.green);
  } else {
    log(`  ❌ ERROR: Expected ${TOTAL_PLAYERS} players, got ${finalPlayers.length}`, colors.red);
    errors++;
  }

  // Verify 3: Prize pool should be distributed or have minimal balance
  const finalPrizePool = await game.prizePool();
  log(`  Prize pool remaining: ${ethers.formatEther(finalPrizePool)} ETH`, colors.gray);

  // Verify 4: Contract balance check
  const contractBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
  log(`  Contract balance: ${ethers.formatEther(contractBalance)} ETH`, colors.gray);

  // Verify 5: All winners have claimed
  if (winners.length > 0) {
    let allClaimed = true;
    for (const winner of winners) {
      const hasClaimed = await game.hasClaimed(winner);
      if (!hasClaimed) {
        log(`  ❌ ERROR: Winner ${winner} has not claimed prize`, colors.red);
        allClaimed = false;
        errors++;
      }
    }
    if (allClaimed) {
      log(`  ✅ All winners have claimed their prizes`, colors.green);
    }
  }

  // Verify 6: Eliminated count matches
  const finalEliminatedPlayers = await game.getEliminatedPlayers();
  const eliminatedCountFromContract = await game.eliminatedCount();
  if (BigInt(finalEliminatedPlayers.length) === eliminatedCountFromContract) {
    log(`  ✅ Eliminated count verified: ${finalEliminatedPlayers.length}`, colors.green);
  } else {
    log(`  ❌ ERROR: Eliminated count mismatch`, colors.red);
    errors++;
  }

  // Verify 7: Players remaining
  const playersRemaining = await game.getPlayersRemaining();
  const expectedRemaining = TOTAL_PLAYERS - finalEliminatedPlayers.length;
  if (Number(playersRemaining) === expectedRemaining) {
    log(`  ✅ Players remaining verified: ${playersRemaining}`, colors.green);
  } else {
    log(`  ❌ ERROR: Players remaining mismatch (expected ${expectedRemaining}, got ${playersRemaining})`, colors.red);
    errors++;
  }

  // ============================================
  // FINAL SUMMARY
  // ============================================
  logSection("TEST SUMMARY");

  log(`Total Players: ${TOTAL_PLAYERS}`, colors.yellow);
  log(`Eliminated: ${finalEliminatedPlayers.length}`, colors.yellow);
  log(`Winners: ${winners.length}`, colors.yellow);
  log(`Ping Actions: ${numPings}`, colors.yellow);
  log(`Prize Pool Distributed: ${ethers.formatEther(prizePoolAfterJoin - finalPrizePool)} ETH`, colors.yellow);

  console.log();
  if (errors === 0) {
    log("🎉 E2E TEST PASSED - ALL VERIFICATIONS SUCCESSFUL! 🎉", colors.green + colors.bright);
    process.exit(0);
  } else {
    log(`❌ E2E TEST FAILED - ${errors} ERRORS FOUND`, colors.red + colors.bright);
    process.exit(1);
  }
}

// Execute the test
main()
  .then(() => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
