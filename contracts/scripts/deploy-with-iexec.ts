/**
 * Deployment Script with iExec Integration
 *
 * This script deploys the GridfallGame contract and optionally
 * configures it with iExec app addresses for production use.
 *
 * Usage:
 * - For local/testnet with mocks:
 *   npx hardhat run scripts/deploy-with-iexec.ts --network arbitrumSepolia
 *
 * - For production with real iExec:
 *   IEXEC_ENABLED=true npx hardhat run scripts/deploy-with-iexec.ts --network arbitrumOne
 */

import { ethers } from "hardhat";

const iexecConfig = require('../iexec.config.js');

async function main() {
  console.log("=== Gridfall Deployment with iExec Integration ===\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Deploy GridfallGame contract
  console.log("Deploying GridfallGame contract...");
  const GridfallGame = await ethers.getContractFactory("GridfallGame");
  const gridfallGame = await GridfallGame.deploy();
  await gridfallGame.waitForDeployment();

  const contractAddress = await gridfallGame.getAddress();
  console.log(`✅ GridfallGame deployed to: ${contractAddress}\n`);

  // Check if iExec integration is enabled
  const iexecEnabled = process.env.IEXEC_ENABLED === 'true';

  if (iexecEnabled) {
    console.log("=== iExec Integration Enabled ===\n");

    // Get iExec app addresses from environment or config
    const roleGeneratorApp = process.env.ROLE_GENERATOR_APP || iexecConfig.apps.roleGenerator.address;
    const scanExecutorApp = process.env.SCAN_EXECUTOR_APP || iexecConfig.apps.scanExecutor.address;
    const winnerCalculatorApp = process.env.WINNER_CALCULATOR_APP || iexecConfig.apps.winnerCalculator.address;

    if (!roleGeneratorApp || !scanExecutorApp || !winnerCalculatorApp) {
      console.log("⚠️  iExec app addresses not configured.");
      console.log("Please deploy iApps first using: cd ../iapp && npm run deploy:iexec\n");
      console.log("For now, you can set the iExec app address manually:");
      console.log(`gridfallGame.setIexecAppAddress(IEXEC_ORACLE_ADDRESS)\n`);
    } else {
      console.log("Configuring iExec app addresses...");

      // For production, we'd set up individual app addresses
      // For now, we use a single oracle/callback address
      const oracleAddress = process.env.IEXEC_ORACLE_ADDRESS || roleGeneratorApp;

      console.log(`Setting iExec oracle address: ${oracleAddress}`);
      const tx = await gridfallGame.setIexecAppAddress(oracleAddress);
      await tx.wait();

      console.log(`✅ iExec oracle configured\n`);
    }

    // Display iExec configuration
    console.log("iExec Configuration:");
    console.log(`  Chain: ${iexecConfig.IEXEC_CHAIN}`);
    console.log(`  Docker Registry: ${iexecConfig.DOCKER_REGISTRY}`);
    console.log(`  Data Protector: ${iexecConfig.dataProtector.enabled ? 'Enabled' : 'Disabled'}\n`);

  } else {
    console.log("=== Mock Mode (iExec Disabled) ===\n");
    console.log("The contract is deployed in testing/demo mode.");
    console.log("iExec callbacks will be called manually for testing.\n");
    console.log("To enable iExec integration:");
    console.log("  1. Deploy iApps to iExec network");
    console.log("  2. Run with IEXEC_ENABLED=true");
    console.log("  3. Configure app addresses\n");
  }

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    iexecEnabled,
    iexecConfig: iexecEnabled ? {
      chain: iexecConfig.IEXEC_CHAIN,
      dataProtector: iexecConfig.dataProtector.enabled
    } : null
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require('fs');
  const deploymentPath = `deployments/${deploymentInfo.network}-${Date.now()}.json`;

  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n✅ Deployment info saved to: ${deploymentPath}`);

  console.log("\n=== Next Steps ===");
  console.log("1. Verify contract on block explorer");
  console.log("2. Test contract functionality");

  if (!iexecEnabled) {
    console.log("3. For production: Deploy iApps and enable iExec integration");
  } else {
    console.log("3. Monitor iExec tasks and callbacks");
  }

  console.log("\nDeployment complete! 🎉\n");

  return {
    contract: gridfallGame,
    address: contractAddress,
    deploymentInfo
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
