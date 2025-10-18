import hre from "hardhat";

const { ethers } = hre;

async function main() {
  console.log("Deploying GridfallGame contract...");

  const GridfallGame = await ethers.getContractFactory("GridfallGame");
  const gridfallGame = await GridfallGame.deploy();

  await gridfallGame.waitForDeployment();

  const address = await gridfallGame.getAddress();
  console.log(`GridfallGame deployed to: ${address}`);

  // Log deployment info
  console.log("\n📋 Deployment Summary:");
  console.log("========================");
  console.log(`Contract Address: ${address}`);
  console.log(`Deployer: ${(await ethers.getSigners())[0].address}`);
  console.log(`Total Players: ${await gridfallGame.TOTAL_PLAYERS()}`);
  console.log(`Deposit Amount: ${ethers.formatEther(await gridfallGame.DEPOSIT_AMOUNT())} ETH`);
  console.log(`Protocol Fee: ${await gridfallGame.PROTOCOL_FEE_PERCENT()}%`);
  console.log("========================\n");

  return address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
