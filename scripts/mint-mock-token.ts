import { network } from "hardhat";
import type { Address } from "viem";

async function main() {
  const { viem } = await network.connect({ network: "hardhatMainnet", chainType: "l1" });

  const publicClient = await viem.getPublicClient();
  const [walletClient] = await viem.getWalletClients();

  console.log("Deploying MockToken with viem...");

  // Deploy contract
  const deployment = await viem.deployContract("MockToken", ["Mock Token", "MCK", 18]);
  const tokenAddress = deployment.address;
  console.log("MockToken deployed to:", tokenAddress);

  // Instantiate contract instance bound to clients
  const token = await viem.getContractAt("MockToken", tokenAddress, {
    client: { public: publicClient, wallet: walletClient },
  });

  // 10,000 tokens with 18 decimals as bigint
  const mintAmount = 10_000n * 10n ** 18n;

  // Mint to deployer (walletClient account)
  const deployer = walletClient.account.address;
  console.log("Minting tokens to deployer...", deployer);
  let hash = await token.write.mint([deployer, mintAmount]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Minted 10000 MCK to ${deployer}`);

  // Additional test addresses
  const testAddresses: Address[] = [
    "0x1234567890123456789012345678901234567890" as Address,
    "0x0987654321098765432109876543210987654321" as Address,
  ];

  for (const address of testAddresses) {
    hash = await token.write.mint([address, mintAmount]);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Minted 10000 MCK to ${address}`);
  }

  console.log("\nMint script completed!");
  console.log("MockToken address:", tokenAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});