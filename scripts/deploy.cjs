const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting VoteChainX Deployment...");

  // Contract Factory load karna
  const VoteChain = await hre.ethers.getContractFactory("VoteChainX");
  
  console.log("📡 Deploying to Polygon Amoy Testnet...");
  
  // Deployment start
  const voteChain = await VoteChain.deploy();

  // Deployment confirm hone tak wait karna (Ethers v6 syntax)
  await voteChain.waitForDeployment();

  // Address nikalna
  const contractAddress = await voteChain.getAddress();

  console.log("-----------------------------------------");
  console.log("✅ VOTECHAIN-X Deployed Successfully!");
  console.log("📍 Contract Address: " + contractAddress);
  console.log("-----------------------------------------");
}

// Error handling logic
main().catch((error) => {
  console.error("❌ Deployment Failed:", error);
  process.exitCode = 1;
});