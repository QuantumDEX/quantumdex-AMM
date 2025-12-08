import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AMM Tests (Part 2)", function () {
  // Test constants
  const FEE_BPS = 30; // 0.30%
  const MINIMUM_LIQUIDITY = ethers.parseUnits("1000", 0);

  async function deployContractsFixture() {
    const signers = await ethers.getSigners();
    const [deployer, alice, bob] = signers;

    // Deploy AMM
    const AMMFactory = await ethers.getContractFactory("AMM", deployer);
    const amm = await AMMFactory.deploy(FEE_BPS) as any;
    await amm.waitForDeployment();
    const ammAddress = await amm.getAddress();

    // Deploy Mock Tokens
    const MockTokenFactory = await ethers.getContractFactory("MockToken", deployer);
    const tokenA = await MockTokenFactory.deploy("TokenA", "TKA", 18) as any;
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();

    const tokenB = await MockTokenFactory.deploy("TokenB", "TKB", 18) as any;
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();

    return {
      amm,
      tokenA,
      tokenB,
      deployer,
      alice,
      bob,
      ammAddress,
      tokenAAddress,
      tokenBAddress,
    };
  }

  describe("Issue #9: Native ETH Support", function () {
    const ETH_ADDRESS = ethers.ZeroAddress;

    it("Should create pool with ETH and ERC20 token", async function () {
      const { amm, tokenA, deployer } = await loadFixture(deployContractsFixture);

      const ethAmount = ethers.parseEther("1.0"); // 1 ETH
      const tokenAmount = ethers.parseUnits("2000", 18);

      // Mint tokens
      await tokenA.mint(deployer.address, tokenAmount);
      await tokenA.approve(await amm.getAddress(), tokenAmount);

      // Create pool with ETH and token
      const poolId = await amm.getPoolId(ETH_ADDRESS, await tokenA.getAddress(), FEE_BPS);
      const tx = await amm.createPool(
        ETH_ADDRESS,
        await tokenA.getAddress(),
        ethAmount,
        tokenAmount,
        0,
        { value: ethAmount }
      );
      await tx.wait();

      // Verify pool exists
      const pool = await amm.getPool(poolId);
      expect(pool.token0).to.equal(ETH_ADDRESS); // ETH should be token0 (address(0) < tokenA)
      expect(pool.reserve0).to.equal(ethAmount);
      expect(pool.reserve1).to.equal(tokenAmount);
    });

    it("Should add liquidity to ETH/ERC20 pool", async function () {
      const { amm, tokenA, deployer } = await loadFixture(deployContractsFixture);

      const ethAmount = ethers.parseEther("1.0");
      const tokenAmount = ethers.parseUnits("2000", 18);

      // Setup and create pool
      await tokenA.mint(deployer.address, tokenAmount * 2n);
      await tokenA.approve(await amm.getAddress(), tokenAmount * 2n);

      const poolId = await amm.getPoolId(ETH_ADDRESS, await tokenA.getAddress(), FEE_BPS);
      const tx1 = await amm.createPool(
        ETH_ADDRESS,
        await tokenA.getAddress(),
        ethAmount,
        tokenAmount,
        0,
        { value: ethAmount }
      );
      await tx1.wait();

      // Add more liquidity
      const tx2 = await amm.addLiquidity(
        poolId,
        ethAmount,
        tokenAmount,
        { value: ethAmount }
      );
      await tx2.wait();

      // Verify reserves increased
      const pool = await amm.getPool(poolId);
      expect(pool.reserve0).to.equal(ethAmount * 2n);
      expect(pool.reserve1).to.equal(tokenAmount * 2n);
    });

    it("Should remove liquidity from ETH/ERC20 pool", async function () {
      const { amm, tokenA, deployer } = await loadFixture(deployContractsFixture);

      const ethAmount = ethers.parseEther("1.0");
      const tokenAmount = ethers.parseUnits("2000", 18);

      // Setup and create pool
      await tokenA.mint(deployer.address, tokenAmount);
      await tokenA.approve(await amm.getAddress(), tokenAmount);

      const poolId = await amm.getPoolId(ETH_ADDRESS, await tokenA.getAddress(), FEE_BPS);
      const tx1 = await amm.createPool(
        ETH_ADDRESS,
        await tokenA.getAddress(),
        ethAmount,
        tokenAmount,
        0,
        { value: ethAmount }
      );
      await tx1.wait();

      // Get LP balance
      const lpBalance = await amm.getLpBalance(poolId, deployer.address);
      expect(lpBalance).to.be.greaterThan(0);

      // Get initial balances
      const initialEthBalance = await ethers.provider.getBalance(deployer.address);
      const initialTokenBalance = await tokenA.balanceOf(deployer.address);

      // Remove liquidity
      const removeAmount = lpBalance / 2n;
      const tx2 = await amm.removeLiquidity(poolId, removeAmount);
      const receipt = await tx2.wait();
      const gasPrice = receipt!.gasPrice ?? tx2.gasPrice ?? 0n;
      const gasUsed = receipt!.gasUsed * gasPrice;

      // Verify balances changed
      const finalEthBalance = await ethers.provider.getBalance(deployer.address);
      const finalTokenBalance = await tokenA.balanceOf(deployer.address);

      // ETH balance should increase (accounting for gas)
      expect(finalEthBalance + BigInt(gasUsed)).to.be.greaterThan(initialEthBalance);
      expect(finalTokenBalance).to.be.greaterThan(initialTokenBalance);
    });

    it("Should swap ETH for ERC20 token", async function () {
      const { amm, tokenA, deployer } = await loadFixture(deployContractsFixture);

      const ethAmount = ethers.parseEther("10.0");
      const tokenAmount = ethers.parseUnits("20000", 18);
      const swapEthAmount = ethers.parseEther("1.0");

      // Setup and create pool
      await tokenA.mint(deployer.address, tokenAmount);
      await tokenA.approve(await amm.getAddress(), tokenAmount);

      const poolId = await amm.getPoolId(ETH_ADDRESS, await tokenA.getAddress(), FEE_BPS);
      const tx1 = await amm.createPool(
        ETH_ADDRESS,
        await tokenA.getAddress(),
        ethAmount,
        tokenAmount,
        0,
        { value: ethAmount }
      );
      await tx1.wait();

      // Get initial balances
      const initialEthBalance = await ethers.provider.getBalance(deployer.address);
      const initialTokenBalance = await tokenA.balanceOf(deployer.address);

      // Execute swap: ETH -> Token
      const tx2 = await amm.swap(
        poolId,
        ETH_ADDRESS,
        swapEthAmount,
        0,
        deployer.address,
        { value: swapEthAmount }
      );
      const receipt = await tx2.wait();
      const gasPrice = receipt!.gasPrice ?? tx2.gasPrice ?? 0n;
      const gasUsed = receipt!.gasUsed * gasPrice;

      // Verify balances changed
      const finalEthBalance = await ethers.provider.getBalance(deployer.address);
      const finalTokenBalance = await tokenA.balanceOf(deployer.address);

      // ETH should decrease (accounting for gas and swap amount)
      expect(finalEthBalance + BigInt(gasUsed) + swapEthAmount).to.be.closeTo(initialEthBalance, ethers.parseEther("0.01"));
      // Token balance should increase
      expect(finalTokenBalance).to.be.greaterThan(initialTokenBalance);
    });

    it("Should swap ERC20 token for ETH", async function () {
      const { amm, tokenA, deployer } = await loadFixture(deployContractsFixture);

      const ethAmount = ethers.parseEther("10.0");
      const tokenAmount = ethers.parseUnits("20000", 18);
      const swapTokenAmount = ethers.parseUnits("1000", 18);

      // Setup and create pool
      await tokenA.mint(deployer.address, tokenAmount + swapTokenAmount);
      await tokenA.approve(await amm.getAddress(), tokenAmount + swapTokenAmount);

      const poolId = await amm.getPoolId(ETH_ADDRESS, await tokenA.getAddress(), FEE_BPS);
      const tx1 = await amm.createPool(
        ETH_ADDRESS,
        await tokenA.getAddress(),
        ethAmount,
        tokenAmount,
        0,
        { value: ethAmount }
      );
      await tx1.wait();

      // Get initial balances
      const initialEthBalance = await ethers.provider.getBalance(deployer.address);
      const initialTokenBalance = await tokenA.balanceOf(deployer.address);

      // Execute swap: Token -> ETH
      const tx2 = await amm.swap(
        poolId,
        await tokenA.getAddress(),
        swapTokenAmount,
        0,
        deployer.address
      );
      const receipt = await tx2.wait();
      const gasPrice = receipt!.gasPrice ?? tx2.gasPrice ?? 0n;
      const gasUsed = receipt!.gasUsed * gasPrice;

      // Verify balances changed
      const finalEthBalance = await ethers.provider.getBalance(deployer.address);
      const finalTokenBalance = await tokenA.balanceOf(deployer.address);

      // ETH should increase (accounting for gas)
      expect(finalEthBalance + BigInt(gasUsed)).to.be.greaterThan(initialEthBalance);
      // Token balance should decrease
      expect(finalTokenBalance).to.equal(initialTokenBalance - swapTokenAmount);
    });

    it("Should reject creating pool with both tokens as ETH", async function () {
      const { amm, deployer } = await loadFixture(deployContractsFixture);

      const ethAmount = ethers.parseEther("1.0");

      await expect(
        amm.createPool(
          ETH_ADDRESS,
          ETH_ADDRESS,
          ethAmount,
          ethAmount,
          0,
          { value: ethAmount * 2n }
        )
      ).to.be.revertedWithCustomError(amm, "BothETH");
    });

    it("Should reject createPool with incorrect ETH amount", async function () {
      const { amm, tokenA, deployer } = await loadFixture(deployContractsFixture);

      const ethAmount = ethers.parseEther("1.0");
      const tokenAmount = ethers.parseUnits("2000", 18);

      await tokenA.mint(deployer.address, tokenAmount);
      await tokenA.approve(await amm.getAddress(), tokenAmount);

      // Try to create pool with wrong ETH amount
      await expect(
        amm.createPool(
          ETH_ADDRESS,
          await tokenA.getAddress(),
          ethAmount,
          tokenAmount,
          0,
          { value: ethAmount / 2n } // Wrong amount
        )
      ).to.be.revertedWithCustomError(amm, "ETHAmountMismatch");
    });

    it("Should reject addLiquidity with incorrect ETH amount", async function () {
      const { amm, tokenA, deployer } = await loadFixture(deployContractsFixture);

      const ethAmount = ethers.parseEther("1.0");
      const tokenAmount = ethers.parseUnits("2000", 18);

      await tokenA.mint(deployer.address, tokenAmount * 2n);
      await tokenA.approve(await amm.getAddress(), tokenAmount * 2n);

      const poolId = await amm.getPoolId(ETH_ADDRESS, await tokenA.getAddress(), FEE_BPS);
      const tx1 = await amm.createPool(
        ETH_ADDRESS,
        await tokenA.getAddress(),
        ethAmount,
        tokenAmount,
        0,
        { value: ethAmount }
      );
      await tx1.wait();

      // Try to add liquidity with wrong ETH amount
      await expect(
        amm.addLiquidity(
          poolId,
          ethAmount,
          tokenAmount,
          { value: ethAmount / 2n } // Wrong amount
        )
      ).to.be.revertedWithCustomError(amm, "ETHAmountMismatch");
    });

    it("Should reject swap with incorrect ETH amount", async function () {
      const { amm, tokenA, deployer } = await loadFixture(deployContractsFixture);

      const ethAmount = ethers.parseEther("10.0");
      const tokenAmount = ethers.parseUnits("20000", 18);
      const swapEthAmount = ethers.parseEther("1.0");

      await tokenA.mint(deployer.address, tokenAmount);
      await tokenA.approve(await amm.getAddress(), tokenAmount);

      const poolId = await amm.getPoolId(ETH_ADDRESS, await tokenA.getAddress(), FEE_BPS);
      const tx1 = await amm.createPool(
        ETH_ADDRESS,
        await tokenA.getAddress(),
        ethAmount,
        tokenAmount,
        0,
        { value: ethAmount }
      );
      await tx1.wait();

      // Try to swap with wrong ETH amount
      await expect(
        amm.swap(
          poolId,
          ETH_ADDRESS,
          swapEthAmount,
          0,
          deployer.address,
          { value: swapEthAmount / 2n } // Wrong amount
        )
      ).to.be.revertedWithCustomError(amm, "ETHAmountMismatch");
    });

    it("Should reject swap ERC20 with unexpected ETH", async function () {
      const { amm, tokenA, deployer } = await loadFixture(deployContractsFixture);

      const ethAmount = ethers.parseEther("10.0");
      const tokenAmount = ethers.parseUnits("20000", 18);
      const swapTokenAmount = ethers.parseUnits("1000", 18);

      await tokenA.mint(deployer.address, tokenAmount + swapTokenAmount);
      await tokenA.approve(await amm.getAddress(), tokenAmount + swapTokenAmount);

      const poolId = await amm.getPoolId(ETH_ADDRESS, await tokenA.getAddress(), FEE_BPS);
      const tx1 = await amm.createPool(
        ETH_ADDRESS,
        await tokenA.getAddress(),
        ethAmount,
        tokenAmount,
        0,
        { value: ethAmount }
      );
      await tx1.wait();

      // Try to swap token but send ETH
      await expect(
        amm.swap(
          poolId,
          await tokenA.getAddress(),
          swapTokenAmount,
          0,
          deployer.address,
          { value: ethers.parseEther("0.1") } // Unexpected ETH
        )
      ).to.be.revertedWithCustomError(amm, "UnexpectedETH");
    });
  });

  describe("Issue #10: Multi-hop Swaps", function () {
    it("Should execute 2-hop swap (TokenA -> TokenB -> TokenC)", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);

      // Deploy third token
      const MockTokenFactory = await ethers.getContractFactory("MockToken", deployer);
      const tokenC = await MockTokenFactory.deploy("TokenC", "TKC", 18);
      await tokenC.waitForDeployment();

      const amountA = ethers.parseUnits("1000", 18);
      const amountB = ethers.parseUnits("2000", 18);
      const amountC = ethers.parseUnits("3000", 18);
      const swapAmount = ethers.parseUnits("100", 18);

      // Setup tokens
      await tokenA.mint(deployer.address, amountA + swapAmount);
      await tokenB.mint(deployer.address, amountB * 2n);
      await tokenC.mint(deployer.address, amountC);

      await tokenA.approve(await amm.getAddress(), amountA + swapAmount);
      await tokenB.approve(await amm.getAddress(), amountB * 2n);
      await tokenC.approve(await amm.getAddress(), amountC);

      // Create pool A-B
      const poolIdAB = await amm.getPoolId(await tokenA.getAddress(), await tokenB.getAddress(), FEE_BPS);
      const tx1 = await amm.createPool(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA,
        amountB,
        0
      );
      await tx1.wait();

      // Create pool B-C
      const poolIdBC = await amm.getPoolId(await tokenB.getAddress(), await tokenC.getAddress(), FEE_BPS);
      const tx2 = await amm.createPool(
        await tokenB.getAddress(),
        await tokenC.getAddress(),
        amountB,
        amountC,
        0
      );
      await tx2.wait();

      // Get initial balances
      const initialBalanceA = await tokenA.balanceOf(deployer.address);
      const initialBalanceC = await tokenC.balanceOf(deployer.address);

      // Execute multi-hop swap: A -> B -> C
      const path = [await tokenA.getAddress(), await tokenB.getAddress(), await tokenC.getAddress()];
      const poolIds = [poolIdAB, poolIdBC];

      const tx3 = await amm.swapMultiHop(path, poolIds, swapAmount, 0, deployer.address);
      const receipt = await tx3.wait();

      // Verify balances changed
      const finalBalanceA = await tokenA.balanceOf(deployer.address);
      const finalBalanceC = await tokenC.balanceOf(deployer.address);

      expect(finalBalanceA).to.equal(initialBalanceA - swapAmount);
      expect(finalBalanceC).to.be.greaterThan(initialBalanceC);

      // Verify MultiHopSwap event was emitted
      // Note: swapMultiHop only emits MultiHopSwap event, not individual Swap events per hop
      const multiHopEvents = receipt!.logs.filter((log: any) => {
        try {
          return amm.interface.parseLog(log)?.name === "MultiHopSwap";
        } catch {
          return false;
        }
      });
      expect(multiHopEvents.length).to.equal(1);
    });

    it("Should execute 3-hop swap (TokenA -> TokenB -> TokenC -> TokenD)", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);

      // Deploy third and fourth tokens
      const MockTokenFactory = await ethers.getContractFactory("MockToken", deployer);
      const tokenC = await MockTokenFactory.deploy("TokenC", "TKC", 18);
      await tokenC.waitForDeployment();
      const tokenD = await MockTokenFactory.deploy("TokenD", "TKD", 18);
      await tokenD.waitForDeployment();

      const amount = ethers.parseUnits("1000", 18);
      const swapAmount = ethers.parseUnits("50", 18);

      // Setup tokens
      await tokenA.mint(deployer.address, amount + swapAmount);
      await tokenB.mint(deployer.address, amount * 2n);
      await tokenC.mint(deployer.address, amount * 2n);
      await tokenD.mint(deployer.address, amount);

      await tokenA.approve(await amm.getAddress(), amount + swapAmount);
      await tokenB.approve(await amm.getAddress(), amount * 2n);
      await tokenC.approve(await amm.getAddress(), amount * 2n);
      await tokenD.approve(await amm.getAddress(), amount);

      // Create pools
      const poolIdAB = await amm.getPoolId(await tokenA.getAddress(), await tokenB.getAddress(), FEE_BPS);
      await amm.createPool(await tokenA.getAddress(), await tokenB.getAddress(), amount, amount, 0);

      const poolIdBC = await amm.getPoolId(await tokenB.getAddress(), await tokenC.getAddress(), FEE_BPS);
      await amm.createPool(await tokenB.getAddress(), await tokenC.getAddress(), amount, amount, 0);

      const poolIdCD = await amm.getPoolId(await tokenC.getAddress(), await tokenD.getAddress(), FEE_BPS);
      await amm.createPool(await tokenC.getAddress(), await tokenD.getAddress(), amount, amount, 0);

      // Get initial balances
      const initialBalanceA = await tokenA.balanceOf(deployer.address);
      const initialBalanceD = await tokenD.balanceOf(deployer.address);

      // Execute 3-hop swap: A -> B -> C -> D
      const path = [
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        await tokenC.getAddress(),
        await tokenD.getAddress()
      ];
      const poolIds = [poolIdAB, poolIdBC, poolIdCD];

      const tx = await amm.swapMultiHop(path, poolIds, swapAmount, 0, deployer.address);
      const receipt = await tx.wait();

      // Verify balances
      const finalBalanceA = await tokenA.balanceOf(deployer.address);
      const finalBalanceD = await tokenD.balanceOf(deployer.address);

      expect(finalBalanceA).to.equal(initialBalanceA - swapAmount);
      expect(finalBalanceD).to.be.greaterThan(initialBalanceD);

      // Verify MultiHopSwap event was emitted
      // Note: swapMultiHop only emits MultiHopSwap event, not individual Swap events per hop
      const multiHopEvents = receipt!.logs.filter((log: any) => {
        try {
          return amm.interface.parseLog(log)?.name === "MultiHopSwap";
        } catch {
          return false;
        }
      });
      expect(multiHopEvents.length).to.equal(1);
    });

    it("Should enforce slippage protection on final output", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);

      const MockTokenFactory = await ethers.getContractFactory("MockToken", deployer);
      const tokenC = await MockTokenFactory.deploy("TokenC", "TKC", 18);
      await tokenC.waitForDeployment();

      const amount = ethers.parseUnits("1000", 18);
      const swapAmount = ethers.parseUnits("100", 18);

      // Setup and create pools
      await tokenA.mint(deployer.address, amount + swapAmount);
      await tokenB.mint(deployer.address, amount * 2n);
      await tokenC.mint(deployer.address, amount);

      await tokenA.approve(await amm.getAddress(), amount + swapAmount);
      await tokenB.approve(await amm.getAddress(), amount * 2n);
      await tokenC.approve(await amm.getAddress(), amount);

      const poolIdAB = await amm.getPoolId(await tokenA.getAddress(), await tokenB.getAddress(), FEE_BPS);
      await amm.createPool(await tokenA.getAddress(), await tokenB.getAddress(), amount, amount, 0);

      const poolIdBC = await amm.getPoolId(await tokenB.getAddress(), await tokenC.getAddress(), FEE_BPS);
      await amm.createPool(await tokenB.getAddress(), await tokenC.getAddress(), amount, amount, 0);

      const path = [await tokenA.getAddress(), await tokenB.getAddress(), await tokenC.getAddress()];
      const poolIds = [poolIdAB, poolIdBC];

      // Try with unrealistic minAmountOut (should fail)
      const unrealisticMin = ethers.parseUnits("10000", 18);
      await expect(
        amm.swapMultiHop(path, poolIds, swapAmount, unrealisticMin, deployer.address)
      ).to.be.revertedWithCustomError(amm, "SlippageExceeded");
    });

    it("Should reject invalid path length", async function () {
      const { amm, tokenA, deployer } = await loadFixture(deployContractsFixture);

      await expect(
        amm.swapMultiHop([await tokenA.getAddress()], [], 1000, 0, deployer.address)
      ).to.be.revertedWithCustomError(amm, "InvalidPath");
    });

    it("Should reject mismatched poolIds length", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);

      const path = [await tokenA.getAddress(), await tokenB.getAddress()];
      const poolIds: any[] = []; // Empty array, should have 1 poolId

      await expect(
        amm.swapMultiHop(path, poolIds, 1000, 0, deployer.address)
      ).to.be.revertedWithCustomError(amm, "InvalidPathLength");
    });

    it("Should reject invalid pool in path", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);

      const MockTokenFactory = await ethers.getContractFactory("MockToken", deployer);
      const tokenC = await MockTokenFactory.deploy("TokenC", "TKC", 18);
      await tokenC.waitForDeployment();

      const amount = ethers.parseUnits("1000", 18);
      const swapAmount = ethers.parseUnits("100", 18);

      await tokenA.mint(deployer.address, amount + swapAmount);
      await tokenB.mint(deployer.address, amount);
      await tokenC.mint(deployer.address, amount);

      await tokenA.approve(await amm.getAddress(), amount + swapAmount);
      await tokenB.approve(await amm.getAddress(), amount);
      await tokenC.approve(await amm.getAddress(), amount);

      // Create only pool A-B, but try to swap A -> B -> C
      const poolIdAB = await amm.getPoolId(await tokenA.getAddress(), await tokenB.getAddress(), FEE_BPS);
      await amm.createPool(await tokenA.getAddress(), await tokenB.getAddress(), amount, amount, 0);

      const fakePoolId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const path = [await tokenA.getAddress(), await tokenB.getAddress(), await tokenC.getAddress()];
      const poolIds = [poolIdAB, fakePoolId];

      await expect(
        amm.swapMultiHop(path, poolIds, swapAmount, 0, deployer.address)
      ).to.be.revertedWithCustomError(amm, "InvalidPool");
    });

    it("Should reject invalid token path in pool", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);

      const MockTokenFactory = await ethers.getContractFactory("MockToken", deployer);
      const tokenC = await MockTokenFactory.deploy("TokenC", "TKC", 18);
      await tokenC.waitForDeployment();

      const amount = ethers.parseUnits("1000", 18);
      const swapAmount = ethers.parseUnits("100", 18);

      await tokenA.mint(deployer.address, amount + swapAmount);
      await tokenB.mint(deployer.address, amount);
      await tokenC.mint(deployer.address, amount);

      await tokenA.approve(await amm.getAddress(), amount + swapAmount);
      await tokenB.approve(await amm.getAddress(), amount);
      await tokenC.approve(await amm.getAddress(), amount);

      // Create pool A-B
      const poolIdAB = await amm.getPoolId(await tokenA.getAddress(), await tokenB.getAddress(), FEE_BPS);
      await amm.createPool(await tokenA.getAddress(), await tokenB.getAddress(), amount, amount, 0);

      // Create pool B-C
      const poolIdBC = await amm.getPoolId(await tokenB.getAddress(), await tokenC.getAddress(), FEE_BPS);
      await amm.createPool(await tokenB.getAddress(), await tokenC.getAddress(), amount, amount, 0);

      // Try invalid path: A -> C -> B (pool A-B doesn't connect to C)
      const path = [await tokenA.getAddress(), await tokenC.getAddress(), await tokenB.getAddress()];
      const poolIds = [poolIdAB, poolIdBC];

      await expect(
        amm.swapMultiHop(path, poolIds, swapAmount, 0, deployer.address)
      ).to.be.revertedWithCustomError(amm, "InvalidPath");
    });
  });

  describe("Issue #11: Flash Loans", function () {
    const FLASH_LOAN_FEE_BPS = 9; // 0.09%

    async function setupFlashLoanFixture() {
      const base = await deployContractsFixture();
      const { amm, tokenA, tokenB, deployer, alice } = base;

      // Create a pool with liquidity
      const amountA = ethers.parseUnits("10000", 18);
      const amountB = ethers.parseUnits("20000", 18);

      await tokenA.mint(deployer.address, amountA);
      await tokenB.mint(deployer.address, amountB);
      await tokenA.approve(await amm.getAddress(), amountA);
      await tokenB.approve(await amm.getAddress(), amountB);

      const poolId = await amm.getPoolId(await tokenA.getAddress(), await tokenB.getAddress(), FEE_BPS);
      await amm.createPool(await tokenA.getAddress(), await tokenB.getAddress(), amountA, amountB, 0);

      // Deploy FlashLoanReceiver
      const FlashLoanReceiverFactory = await ethers.getContractFactory("FlashLoanReceiver", deployer);
      const receiver = await FlashLoanReceiverFactory.deploy(await amm.getAddress());
      await receiver.waitForDeployment();

      return {
        ...base,
        poolId,
        receiver,
        amountA,
        amountB,
      };
    }

    it("Should execute successful flash loan with repayment", async function () {
      const { amm, tokenA, poolId, receiver, deployer } = await loadFixture(setupFlashLoanFixture);

      const flashLoanAmount = ethers.parseUnits("1000", 18);
      const fee = (flashLoanAmount * BigInt(FLASH_LOAN_FEE_BPS)) / BigInt(10000);
      const repayAmount = flashLoanAmount + fee;

      // Fund receiver to repay (contract will transfer back, no approval needed)
      await tokenA.mint(await receiver.getAddress(), repayAmount);

      // Get initial balances
      const poolBefore = await amm.getPool(poolId);
      const receiverBalanceBefore = await tokenA.balanceOf(await receiver.getAddress());

      // Execute flash loan
      await receiver.executeFlashLoan(poolId, await tokenA.getAddress(), flashLoanAmount, "0x");

      // Verify callback was called
      expect(await receiver.lastToken()).to.equal(await tokenA.getAddress());
      expect(await receiver.lastAmount()).to.equal(flashLoanAmount);
      expect(await receiver.lastFee()).to.equal(fee);

      // Verify pool reserves increased by repayAmount
      const poolAfter = await amm.getPool(poolId);
      // Check which reserve corresponds to tokenA
      const tokenAAddress = await tokenA.getAddress();
      if (poolAfter.token0.toLowerCase() === tokenAAddress.toLowerCase()) {
        expect(poolAfter.reserve0).to.equal(poolBefore.reserve0 + repayAmount);
      } else {
        expect(poolAfter.reserve1).to.equal(poolBefore.reserve1 + repayAmount);
      }

      // Verify receiver balance: should have flash loan amount left after repaying
      // Receiver started with repayAmount, received flashLoanAmount, then repaid repayAmount
      // Final balance = repayAmount + flashLoanAmount - repayAmount = flashLoanAmount
      const receiverBalanceAfter = await tokenA.balanceOf(await receiver.getAddress());
      expect(receiverBalanceAfter).to.equal(flashLoanAmount);
    });

    it("Should calculate flash loan fee correctly (9 bps)", async function () {
      const { amm, tokenA, poolId, receiver, deployer } = await loadFixture(setupFlashLoanFixture);

      const flashLoanAmount = ethers.parseUnits("10000", 18);
      const expectedFee = (flashLoanAmount * BigInt(FLASH_LOAN_FEE_BPS)) / BigInt(10000);
      const repayAmount = flashLoanAmount + expectedFee;

      // Fund receiver
      await tokenA.mint(await receiver.getAddress(), repayAmount);

      await receiver.executeFlashLoan(poolId, await tokenA.getAddress(), flashLoanAmount, "0x");

      // Verify fee is exactly 9 bps
      const actualFee = await receiver.lastFee();
      expect(actualFee).to.equal(expectedFee);
      expect(actualFee).to.equal((flashLoanAmount * BigInt(9)) / BigInt(10000));
    });

    it("Should revert if flash loan is not repaid", async function () {
      const { amm, tokenA, poolId, receiver } = await loadFixture(setupFlashLoanFixture);

      const flashLoanAmount = ethers.parseUnits("1000", 18);

      // Configure receiver to not repay
      await receiver.setShouldRepay(false);

      await expect(
        receiver.executeFlashLoan(poolId, await tokenA.getAddress(), flashLoanAmount, "0x")
      ).to.be.revertedWithCustomError(amm, "FlashLoanNotRepaid");
    });

    it("Should revert if flash loan is underpaid", async function () {
      const { amm, tokenA, poolId, receiver, deployer } = await loadFixture(setupFlashLoanFixture);

      const flashLoanAmount = ethers.parseUnits("1000", 18);
      const fee = (flashLoanAmount * BigInt(FLASH_LOAN_FEE_BPS)) / BigInt(10000);
      const repayAmount = flashLoanAmount + fee;

      // Fund receiver with less than required
      const underPayment = repayAmount - BigInt(1);
      await tokenA.mint(await receiver.getAddress(), underPayment);

      // Set custom repay amount to underpay
      await receiver.setRepayAmountOverride(underPayment);

      await expect(
        receiver.executeFlashLoan(poolId, await tokenA.getAddress(), flashLoanAmount, "0x")
      ).to.be.revertedWithCustomError(amm, "FlashLoanNotRepaid");
    });

    it("Should revert if pool does not exist", async function () {
      const { amm, tokenA, receiver } = await loadFixture(setupFlashLoanFixture);

      const fakePoolId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const flashLoanAmount = ethers.parseUnits("1000", 18);

      await expect(
        receiver.executeFlashLoan(fakePoolId, await tokenA.getAddress(), flashLoanAmount, "0x")
      ).to.be.revertedWithCustomError(amm, "PoolNotFound");
    });

    it("Should revert if token is not part of pool", async function () {
      const { amm, tokenA, tokenB, poolId, receiver, deployer } = await loadFixture(setupFlashLoanFixture);

      // Create another token
      const MockTokenFactory = await ethers.getContractFactory("MockToken", deployer);
      const tokenC = await MockTokenFactory.deploy("TokenC", "TKC", 18);
      await tokenC.waitForDeployment();

      const flashLoanAmount = ethers.parseUnits("1000", 18);

      await expect(
        receiver.executeFlashLoan(poolId, await tokenC.getAddress(), flashLoanAmount, "0x")
      ).to.be.revertedWithCustomError(amm, "InvalidToken");
    });

    it("Should revert if amount is zero", async function () {
      const { amm, tokenA, poolId, receiver } = await loadFixture(setupFlashLoanFixture);

      await expect(
        receiver.executeFlashLoan(poolId, await tokenA.getAddress(), 0, "0x")
      ).to.be.revertedWithCustomError(amm, "ZeroAmount");
    });

    it("Should revert if pool has insufficient liquidity", async function () {
      const { amm, tokenA, poolId, receiver } = await loadFixture(setupFlashLoanFixture);

      // Try to borrow more than pool has
      const pool = await amm.getPool(poolId);
      const excessiveAmount = pool.reserve0 + BigInt(1);

      await expect(
        receiver.executeFlashLoan(poolId, await tokenA.getAddress(), excessiveAmount, "0x")
      ).to.be.revertedWithCustomError(amm, "InsufficientLiquidityForFlashLoan");
    });

    it("Should support flash loan for token1", async function () {
      const { amm, tokenB, poolId, receiver, deployer } = await loadFixture(setupFlashLoanFixture);

      const flashLoanAmount = ethers.parseUnits("2000", 18);
      const fee = (flashLoanAmount * BigInt(FLASH_LOAN_FEE_BPS)) / BigInt(10000);
      const repayAmount = flashLoanAmount + fee;

      // Fund receiver
      await tokenB.mint(await receiver.getAddress(), repayAmount);

      const poolBefore = await amm.getPool(poolId);

      await receiver.executeFlashLoan(poolId, await tokenB.getAddress(), flashLoanAmount, "0x");

      // Verify pool reserves increased by repayAmount
      const poolAfter = await amm.getPool(poolId);
      // Check which reserve corresponds to tokenB
      const tokenBAddress = await tokenB.getAddress();
      if (poolAfter.token0.toLowerCase() === tokenBAddress.toLowerCase()) {
        expect(poolAfter.reserve0).to.equal(poolBefore.reserve0 + repayAmount);
      } else {
        expect(poolAfter.reserve1).to.equal(poolBefore.reserve1 + repayAmount);
      }
    });

    it("Should pass data to callback", async function () {
      const { amm, tokenA, poolId, receiver, deployer } = await loadFixture(setupFlashLoanFixture);

      const flashLoanAmount = ethers.parseUnits("1000", 18);
      const fee = (flashLoanAmount * BigInt(FLASH_LOAN_FEE_BPS)) / BigInt(10000);
      const repayAmount = flashLoanAmount + fee;
      const testData = ethers.toUtf8Bytes("test data");

      // Fund receiver
      await tokenA.mint(await receiver.getAddress(), repayAmount);

      await receiver.executeFlashLoan(poolId, await tokenA.getAddress(), flashLoanAmount, testData);

      // Verify data was passed
      const receivedData = await receiver.lastData();
      expect(ethers.toUtf8String(receivedData)).to.equal("test data");
    });

    it("Should emit FlashLoan event", async function () {
      const { amm, tokenA, poolId, receiver, deployer } = await loadFixture(setupFlashLoanFixture);

      const flashLoanAmount = ethers.parseUnits("1000", 18);
      const fee = (flashLoanAmount * BigInt(FLASH_LOAN_FEE_BPS)) / BigInt(10000);
      const repayAmount = flashLoanAmount + fee;

      // Fund receiver
      await tokenA.mint(await receiver.getAddress(), repayAmount);

      await expect(
        receiver.executeFlashLoan(poolId, await tokenA.getAddress(), flashLoanAmount, "0x")
      )
        .to.emit(amm, "FlashLoan")
        .withArgs(poolId, await tokenA.getAddress(), await receiver.getAddress(), flashLoanAmount, fee);
    });
  });
});
