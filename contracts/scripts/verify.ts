import { run } from "hardhat";

async function main() {
  const contractAddress = "0x0cce65424abCCC4A7486B06C5b0A004b0cb3A3e5";

  console.log("Verifying contract on Arbiscan...");

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
