import { ethers, upgrades } from "hardhat";

async function main() {
  const defaultFeeBps = 30; // 0.30% default fee
  
  console.log("Deploying AMMUpgradeable with UUPS proxy...");
  console.log("Default fee:", defaultFeeBps, "bps (0.30%)");
  
  // Get the contract factory
  const AMMUpgradeable = await ethers.getContractFactory("AMMUpgradeable");
  
  // Deploy the proxy
  console.log("Deploying proxy...");
  const proxy = await upgrades.deployProxy(
    AMMUpgradeable,
    [defaultFeeBps],
    { 
      initializer: "initialize",
      kind: "uups"
    }
  );
  
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  
  console.log("\n✅ Deployment successful!");
  console.log("=====================================");
  console.log("Proxy address:", proxyAddress);
  console.log("Implementation address:", await upgrades.erc1967.getImplementationAddress(proxyAddress));
  console.log("Admin address:", await upgrades.erc1967.getAdminAddress(proxyAddress));
  console.log("=====================================\n");
  
  console.log("⚠️  IMPORTANT: Use the PROXY address for all interactions!");
  console.log("Save these addresses for future upgrades.\n");
  
  // Verify the deployment
  const deployedDefaultFee = await proxy.defaultFeeBps();
  console.log("Verification:");
  console.log("- Default fee set correctly:", deployedDefaultFee.toString(), "bps");
  
  const owner = await proxy.owner();
  console.log("- Owner:", owner);
  console.log("- Deployer:", (await ethers.getSigners())[0].address);
  console.log("- Owner matches deployer:", owner === (await ethers.getSigners())[0].address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
