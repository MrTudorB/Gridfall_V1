import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("=== Wallet Information ===");
  console.log(`Address: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);

  if (balance === 0n) {
    console.log("\n⚠️  Wallet has no ETH!");
    console.log("Please fund this address with Arbitrum Sepolia testnet ETH.");
    console.log("\nFaucets:");
    console.log("- https://faucet.quicknode.com/arbitrum/sepolia");
    console.log("- https://www.alchemy.com/faucets/arbitrum-sepolia");
  } else {
    console.log("\n✅ Wallet has sufficient balance for deployment");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
