import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Multi-hop Swaps", function () {
  const FEE_BPS = 30; // 0.30%

  async function deployContractsFixture() {
    const signers = await ethers.getSigners();
    const [deployer, alice] = signers;

    // Deploy AMM
    const AMMFactory = await ethers.getContractFactory("AMM", deployer);
    const amm = await AMMFactory.deploy(FEE_BPS);
    await amm.waitForDeployment();
    const ammAddress = await amm.getAddress();

    // Deploy Mock Tokens
    const MockTokenFactory = await ethers.getContractFactory("MockToken", deployer);
    const tokenA = await MockTokenFactory.deploy("TokenA", "TKA", 18);
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();

    const tokenB = await MockTokenFactory.deploy("TokenB", "TKB", 18);
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();

    const tokenC = await MockTokenFactory.deploy("TokenC", "TKC", 18);
    await tokenC.waitForDeployment();
    const tokenCAddress = await tokenC.getAddress();

    return {
      amm,
      tokenA,
      tokenB,
      tokenC,
      deployer,
      alice,
      ammAddress,
      tokenAAddress,
      tokenBAddress,
      tokenCAddress,
    };
  }

  describe("Path Validation", function () {
    it("Should reject path with less than 3 elements", async function () {
      const { amm } = await loadFixture(deployContractsFixture);
      const path = [ethers.ZeroAddress, ethers.ZeroAddress];
      
      await expect(
        amm.swapMultiHop(path, ethers.parseUnits("100", 18), 0, alice.address)
      ).to.be.revertedWithCustomError(amm, "InvalidPath");
    });

    it("Should reject path with even length", async function () {
      const { amm } = await loadFixture(deployContractsFixture);
      const path = [ethers.ZeroAddress, ethers.ZeroAddress, ethers.ZeroAddress, ethers.ZeroAddress];
      
      await expect(
        amm.swapMultiHop(path, ethers.parseUnits("100", 18), 0, alice.address)
      ).to.be.revertedWithCustomError(amm, "InvalidPath");
    });
  });
});

