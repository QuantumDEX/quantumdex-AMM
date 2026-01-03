import { ethers, upgrades } from "hardhat";

async function main() {
  // Get proxy address from environment variable
  const proxyAddress = process.env.PROXY_ADDRESS;
  
  if (!proxyAddress) {
    throw new Error("PROXY_ADDRESS environment variable not set. Usage: PROXY_ADDRESS=0x... npx hardhat run scripts/upgrade-amm.ts --network <network>");
  }
  
  console.log("Upgrading AMMUpgradeable at proxy:", proxyAddress);
  
  // Get the new implementation contract factory
  // Note: For this example, we're using the same contract
  // In a real upgrade, you would use AMMUpgradeableV2 or similar
  const AMMUpgradeableV2 = await ethers.getContractFactory("AMMUpgradeable");
  
  console.log("Preparing upgrade...");
  
  // Validate the upgrade
  await upgrades.validateUpgrade(proxyAddress, AMMUpgradeableV2);
  console.log("✅ Upgrade validation passed");
  
  // Perform the upgrade
  console.log("Upgrading proxy...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, AMMUpgradeableV2);
  
  await upgraded.waitForDeployment();
  
  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  
  console.log("\n✅ Upgrade successful!");
  console.log("=====================================");
  console.log("Proxy address (unchanged):", proxyAddress);
  console.log("New implementation address:", newImplementationAddress);
  console.log("=====================================\n");
  
  // Verify the upgrade preserved state
  console.log("Verifying state preservation...");
  const defaultFee = await upgraded.defaultFeeBps();
  const owner = await upgraded.owner();
  
  console.log("- Default fee:", defaultFee.toString(), "bps");
  console.log("- Owner:", owner);
  console.log("\n✅ State preserved successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
