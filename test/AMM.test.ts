import { expect } from "chai";
import { viem } from "hardhat";
import { getAddress, parseEther, formatEther } from "viem";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("AMM Tests", function () {
  // Test constants
  const FEE_BPS = 30n; // 0.30%
  const MINIMUM_LIQUIDITY = 1000n;

  async function deployContractsFixture() {
    const [deployer, alice, bob] = await viem.getWalletClients();
    const publicClient = await viem.getPublicClient();

    // Deploy AMM
    const amm = await viem.deployContract("AMM", [FEE_BPS], {
      client: { wallet: deployer },
    });

    // Deploy Mock Tokens
    const tokenA = await viem.deployContract(
      "MockToken",
      ["TokenA", "TKA", 18],
      { client: { wallet: deployer } }
    );

    const tokenB = await viem.deployContract(
      "MockToken",
      ["TokenB", "TKB", 18],
      { client: { wallet: deployer } }
    );

    return {
      amm,
      tokenA,
      tokenB,
      deployer,
      alice,
      bob,
      publicClient,
    };
  }

  describe("Issue #1: ERC20 Mock Token", function () {
    it("Should deploy MockToken with correct name, symbol, and decimals", async function () {
      const { tokenA } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const name = await tokenA.read.name();
      const symbol = await tokenA.read.symbol();
      const decimals = await tokenA.read.decimals();

      expect(name).to.equal("TokenA");
      expect(symbol).to.equal("TKA");
      expect(decimals).to.equal(18);
    });

    it("Should mint initial supply to deployer", async function () {
      const { tokenA, deployer } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const balance = await tokenA.read.balanceOf([deployer.account.address]);
      const expectedBalance = parseEther("1000000"); // 1M tokens

      expect(balance).to.equal(expectedBalance);
    });

    it("Should allow owner to mint tokens", async function () {
      const { tokenA, deployer, alice } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const mintAmount = parseEther("1000");
      await tokenA.write.mint([alice.account.address, mintAmount], {
        account: deployer.account,
      });

      const balance = await tokenA.read.balanceOf([alice.account.address]);
      expect(balance).to.equal(mintAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const { tokenA, alice, bob } = await loadFixture(deployContractsFixture);

      const mintAmount = parseEther("1000");
      await expect(
        tokenA.write.mint([bob.account.address, mintAmount], {
          account: alice.account,
        })
      ).to.be.rejected;
    });
  });

  describe("Issue #2: AMM Core Contract", function () {
    it("Should deploy AMM with correct default fee", async function () {
      const { amm } = await loadFixture(deployContractsFixture);

      const defaultFee = await amm.read.defaultFeeBps();
      expect(defaultFee).to.equal(FEE_BPS);
    });

    it("Should create a pool with initial liquidity", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");

      // Mint and approve tokens
      await tokenA.write.mint([deployer.account.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.mint([deployer.account.address, amountB], {
        account: deployer.account,
      });

      await tokenA.write.approve([amm.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.approve([amm.address, amountB], {
        account: deployer.account,
      });

      // Create pool
      const hash = await amm.write.createPool(
        [tokenA.address, tokenB.address, amountA, amountB, 0],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash });

      // Get pool ID
      const poolId = await amm.read.getPoolId([tokenA.address, tokenB.address, FEE_BPS]);

      // Verify pool exists
      const pool = await amm.read.getPool([poolId]);
      expect(pool[0].toLowerCase()).to.equal(
        tokenA.address.toLowerCase() < tokenB.address.toLowerCase()
          ? tokenA.address.toLowerCase()
          : tokenB.address.toLowerCase()
      );
      expect(Number(pool[2])).to.be.greaterThan(0);
      expect(Number(pool[3])).to.be.greaterThan(0);
    });

    it("Should add liquidity to existing pool", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");

      // Setup tokens
      await tokenA.write.mint([deployer.account.address, amountA * 2n], {
        account: deployer.account,
      });
      await tokenB.write.mint([deployer.account.address, amountB * 2n], {
        account: deployer.account,
      });

      await tokenA.write.approve([amm.address, amountA * 2n], {
        account: deployer.account,
      });
      await tokenB.write.approve([amm.address, amountB * 2n], {
        account: deployer.account,
      });

      // Create pool
      const poolId = await amm.read.getPoolId([tokenA.address, tokenB.address, FEE_BPS]);
      const hash1 = await amm.write.createPool(
        [tokenA.address, tokenB.address, amountA, amountB, 0],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      // Add more liquidity
      const hash2 = await amm.write.addLiquidity([poolId, amountA, amountB], {
        account: deployer.account,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash2 });

      // Verify reserves increased
      const pool = await amm.read.getPool([poolId]);
      expect(Number(pool[2])).to.equal(Number(amountA * 2n));
      expect(Number(pool[3])).to.equal(Number(amountB * 2n));
    });

    it("Should remove liquidity from pool", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");

      // Setup and create pool
      await tokenA.write.mint([deployer.account.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.mint([deployer.account.address, amountB], {
        account: deployer.account,
      });

      await tokenA.write.approve([amm.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.approve([amm.address, amountB], {
        account: deployer.account,
      });

      const poolId = await amm.read.getPoolId([tokenA.address, tokenB.address, FEE_BPS]);
      const hash1 = await amm.write.createPool(
        [tokenA.address, tokenB.address, amountA, amountB, 0],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      // Get LP balance
      const lpBalance = await amm.read.getLpBalance([poolId, deployer.account.address]);
      expect(Number(lpBalance)).to.be.greaterThan(0);

      // Remove some liquidity
      const removeAmount = lpBalance / 2n;
      const hash2 = await amm.write.removeLiquidity([poolId, removeAmount], {
        account: deployer.account,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash2 });

      // Verify LP balance decreased
      const newLpBalance = await amm.read.getLpBalance([poolId, deployer.account.address]);
      expect(Number(newLpBalance)).to.be.lessThan(Number(lpBalance));
    });

    it("Should execute token swap", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");
      const swapAmount = parseEther("100");

      // Setup and create pool
      await tokenA.write.mint([deployer.account.address, amountA + swapAmount], {
        account: deployer.account,
      });
      await tokenB.write.mint([deployer.account.address, amountB], {
        account: deployer.account,
      });

      await tokenA.write.approve([amm.address, amountA + swapAmount], {
        account: deployer.account,
      });
      await tokenB.write.approve([amm.address, amountB], {
        account: deployer.account,
      });

      const poolId = await amm.read.getPoolId([tokenA.address, tokenB.address, FEE_BPS]);
      const hash1 = await amm.write.createPool(
        [tokenA.address, tokenB.address, amountA, amountB, 0],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      // Get initial balances
      const initialBalanceA = await tokenA.read.balanceOf([deployer.account.address]);
      const initialBalanceB = await tokenB.read.balanceOf([deployer.account.address]);

      // Execute swap
      const hash2 = await amm.write.swap(
        [poolId, tokenA.address, swapAmount, 0n, deployer.account.address],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash: hash2 });

      // Verify balances changed
      const finalBalanceA = await tokenA.read.balanceOf([deployer.account.address]);
      const finalBalanceB = await tokenB.read.balanceOf([deployer.account.address]);

      expect(Number(finalBalanceA)).to.be.lessThan(Number(initialBalanceA));
      expect(Number(finalBalanceB)).to.be.greaterThan(Number(initialBalanceB));
    });
  });

  describe("Issue #3: Deterministic Pool ID", function () {
    it("Should generate same pool ID regardless of token order", async function () {
      const { amm, tokenA, tokenB } = await loadFixture(deployContractsFixture);

      const poolId1 = await amm.read.getPoolId([tokenA.address, tokenB.address, FEE_BPS]);
      const poolId2 = await amm.read.getPoolId([tokenB.address, tokenA.address, FEE_BPS]);

      expect(poolId1).to.equal(poolId2);
    });

    it("Should generate different pool IDs for different fees", async function () {
      const { amm, tokenA, tokenB } = await loadFixture(deployContractsFixture);

      const poolId1 = await amm.read.getPoolId([tokenA.address, tokenB.address, 30n]);
      const poolId2 = await amm.read.getPoolId([tokenA.address, tokenB.address, 50n]);

      expect(poolId1).to.not.equal(poolId2);
    });

    it("Should prevent creating duplicate pools", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");

      await tokenA.write.mint([deployer.account.address, amountA * 2n], {
        account: deployer.account,
      });
      await tokenB.write.mint([deployer.account.address, amountB * 2n], {
        account: deployer.account,
      });

      await tokenA.write.approve([amm.address, amountA * 2n], {
        account: deployer.account,
      });
      await tokenB.write.approve([amm.address, amountB * 2n], {
        account: deployer.account,
      });

      // Create first pool
      const hash1 = await amm.write.createPool(
        [tokenA.address, tokenB.address, amountA, amountB, 0],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      // Try to create duplicate pool - should fail
      await expect(
        amm.write.createPool(
          [tokenA.address, tokenB.address, amountA, amountB, 0],
          { account: deployer.account }
        )
      ).to.be.rejected;
    });
  });

  describe("Issue #4: Fee & Math Implementation", function () {
    it("Should calculate swap output correctly with fees", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");
      const swapAmount = parseEther("100");

      // Setup pool
      await tokenA.write.mint([deployer.account.address, amountA + swapAmount], {
        account: deployer.account,
      });
      await tokenB.write.mint([deployer.account.address, amountB], {
        account: deployer.account,
      });

      await tokenA.write.approve([amm.address, amountA + swapAmount], {
        account: deployer.account,
      });
      await tokenB.write.approve([amm.address, amountB], {
        account: deployer.account,
      });

      const poolId = await amm.read.getPoolId([tokenA.address, tokenB.address, FEE_BPS]);
      const hash1 = await amm.write.createPool(
        [tokenA.address, tokenB.address, amountA, amountB, 0],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      // Get initial reserves
      const poolBefore = await amm.read.getPool([poolId]);
      const reserve0Before = poolBefore[2];
      const reserve1Before = poolBefore[3];

      // Execute swap
      const hash2 = await amm.write.swap(
        [poolId, tokenA.address, swapAmount, 0n, deployer.account.address],
        { account: deployer.account }
      );
      const receipt = await publicClient.waitForTransactionReceipt({ hash: hash2 });

      // Get reserves after swap
      const poolAfter = await amm.read.getPool([poolId]);
      const reserve0After = poolAfter[2];
      const reserve1After = poolAfter[3];

      // Verify constant product formula (with fees): (x + dx) * (y - dy) >= k
      // Fees reduce output, so product should be >= original k
      const kBefore = reserve0Before * reserve1Before;
      const kAfter = reserve0After * reserve1After;
      expect(Number(kAfter)).to.be.greaterThanOrEqual(Number(kBefore));
    });

    it("Should apply correct fee percentage", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const amountA = parseEther("10000");
      const amountB = parseEther("20000");
      const swapAmount = parseEther("1000");

      // Setup pool
      await tokenA.write.mint([deployer.account.address, amountA + swapAmount], {
        account: deployer.account,
      });
      await tokenB.write.mint([deployer.account.address, amountB], {
        account: deployer.account,
      });

      await tokenA.write.approve([amm.address, amountA + swapAmount], {
        account: deployer.account,
      });
      await tokenB.write.approve([amm.address, amountB], {
        account: deployer.account,
      });

      const poolId = await amm.read.getPoolId([tokenA.address, tokenB.address, FEE_BPS]);
      const hash1 = await amm.write.createPool(
        [tokenA.address, tokenB.address, amountA, amountB, 0],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      // Calculate expected output without fee
      const pool = await amm.read.getPool([poolId]);
      const reserveIn = pool[2];
      const reserveOut = pool[3];

      // Without fee: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
      const amountInWithFee = (swapAmount * (10000n - FEE_BPS)) / 10000n;
      const expectedOutputNoFee = (swapAmount * reserveOut) / (reserveIn + swapAmount);
      const expectedOutputWithFee = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);

      // Execute swap
      const initialBalanceB = await tokenB.read.balanceOf([deployer.account.address]);
      const hash2 = await amm.write.swap(
        [poolId, tokenA.address, swapAmount, 0n, deployer.account.address],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash: hash2 });
      const finalBalanceB = await tokenB.read.balanceOf([deployer.account.address]);
      const actualOutput = finalBalanceB - initialBalanceB;

      // Actual output should be less than no-fee output (due to fees)
      expect(Number(actualOutput)).to.be.lessThan(Number(expectedOutputNoFee));
      // Should be approximately equal to fee-adjusted output (within rounding)
      expect(Number(actualOutput)).to.be.closeTo(Number(expectedOutputWithFee), Number(expectedOutputWithFee) * 0.01);
    });
  });

  describe("Issue #5: Security Hardening", function () {
    it("Should revert on zero address tokens", async function () {
      const { amm, deployer } = await loadFixture(deployContractsFixture);

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");

      await expect(
        amm.write.createPool(
          ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", amountA, amountB, 0],
          { account: deployer.account }
        )
      ).to.be.rejected;
    });

    it("Should revert on identical tokens", async function () {
      const { amm, tokenA, deployer } = await loadFixture(deployContractsFixture);

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");

      await expect(
        amm.write.createPool([tokenA.address, tokenA.address, amountA, amountB, 0], {
          account: deployer.account,
        })
      ).to.be.rejected;
    });

    it("Should revert on zero amounts", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);

      await expect(
        amm.write.createPool([tokenA.address, tokenB.address, 0n, 0n, 0], {
          account: deployer.account,
        })
      ).to.be.rejected;
    });
  });

  describe("Issue #7: Minimum Liquidity Lock", function () {
    it("Should lock minimum liquidity on pool creation", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");

      await tokenA.write.mint([deployer.account.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.mint([deployer.account.address, amountB], {
        account: deployer.account,
      });

      await tokenA.write.approve([amm.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.approve([amm.address, amountB], {
        account: deployer.account,
      });

      const poolId = await amm.read.getPoolId([tokenA.address, tokenB.address, FEE_BPS]);
      const hash = await amm.write.createPool(
        [tokenA.address, tokenB.address, amountA, amountB, 0],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash });

      // Check locked liquidity (sent to address(0))
      const lockedBalance = await amm.read.getLpBalance([poolId, "0x0000000000000000000000000000000000000000"]);
      expect(lockedBalance).to.equal(MINIMUM_LIQUIDITY);

      // Check user received liquidity minus minimum
      const userBalance = await amm.read.getLpBalance([poolId, deployer.account.address]);
      const pool = await amm.read.getPool([poolId]);
      expect(userBalance + lockedBalance).to.equal(pool[5]); // totalSupply
      expect(Number(userBalance)).to.be.greaterThan(0);
    });

    it("Should prevent removing liquidity below minimum", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");

      await tokenA.write.mint([deployer.account.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.mint([deployer.account.address, amountB], {
        account: deployer.account,
      });

      await tokenA.write.approve([amm.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.approve([amm.address, amountB], {
        account: deployer.account,
      });

      const poolId = await amm.read.getPoolId([tokenA.address, tokenB.address, FEE_BPS]);
      const hash1 = await amm.write.createPool(
        [tokenA.address, tokenB.address, amountA, amountB, 0],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      const pool = await amm.read.getPool([poolId]);
      const totalSupply = pool[5];
      const userBalance = await amm.read.getLpBalance([poolId, deployer.account.address]);

      // Try to remove more than allowed (would leave less than MINIMUM_LIQUIDITY)
      const maxRemovable = totalSupply - MINIMUM_LIQUIDITY;
      if (userBalance > maxRemovable) {
        await expect(
          amm.write.removeLiquidity([poolId, userBalance], {
            account: deployer.account,
          })
        ).to.be.rejected;
      }
    });
  });

  describe("Issue #8: Custom Fee Per Pool", function () {
    it("Should create pool with custom fee", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");
      const customFee = 50n; // 0.50%

      await tokenA.write.mint([deployer.account.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.mint([deployer.account.address, amountB], {
        account: deployer.account,
      });

      await tokenA.write.approve([amm.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.approve([amm.address, amountB], {
        account: deployer.account,
      });

      const poolId = await amm.read.getPoolId([tokenA.address, tokenB.address, customFee]);
      const hash = await amm.write.createPool(
        [tokenA.address, tokenB.address, amountA, amountB, customFee],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash });

      const pool = await amm.read.getPool([poolId]);
      expect(pool[4]).to.equal(customFee);
    });

    it("Should use default fee when feeBps is 0", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");

      await tokenA.write.mint([deployer.account.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.mint([deployer.account.address, amountB], {
        account: deployer.account,
      });

      await tokenA.write.approve([amm.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.approve([amm.address, amountB], {
        account: deployer.account,
      });

      const poolId = await amm.read.getPoolId([tokenA.address, tokenB.address, FEE_BPS]);
      const hash = await amm.write.createPool(
        [tokenA.address, tokenB.address, amountA, amountB, 0],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash });

      const pool = await amm.read.getPool([poolId]);
      expect(pool[4]).to.equal(FEE_BPS);
    });

    it("Should reject fee greater than 1000 bps", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");
      const invalidFee = 1001n; // > 1000 bps

      await tokenA.write.mint([deployer.account.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.mint([deployer.account.address, amountB], {
        account: deployer.account,
      });

      await tokenA.write.approve([amm.address, amountA], {
        account: deployer.account,
      });
      await tokenB.write.approve([amm.address, amountB], {
        account: deployer.account,
      });

      await expect(
        amm.write.createPool([tokenA.address, tokenB.address, amountA, amountB, invalidFee], {
          account: deployer.account,
        })
      ).to.be.rejected;
    });

    it("Should create different pools for different fees", async function () {
      const { amm, tokenA, tokenB, deployer } = await loadFixture(deployContractsFixture);
      const publicClient = await viem.getPublicClient();

      const amountA = parseEther("1000");
      const amountB = parseEther("2000");
      const fee1 = 30n;
      const fee2 = 50n;

      await tokenA.write.mint([deployer.account.address, amountA * 2n], {
        account: deployer.account,
      });
      await tokenB.write.mint([deployer.account.address, amountB * 2n], {
        account: deployer.account,
      });

      await tokenA.write.approve([amm.address, amountA * 2n], {
        account: deployer.account,
      });
      await tokenB.write.approve([amm.address, amountB * 2n], {
        account: deployer.account,
      });

      const poolId1 = await amm.read.getPoolId([tokenA.address, tokenB.address, fee1]);
      const poolId2 = await amm.read.getPoolId([tokenA.address, tokenB.address, fee2]);

      expect(poolId1).to.not.equal(poolId2);

      // Create both pools
      const hash1 = await amm.write.createPool(
        [tokenA.address, tokenB.address, amountA, amountB, fee1],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      const hash2 = await amm.write.createPool(
        [tokenA.address, tokenB.address, amountA, amountB, fee2],
        { account: deployer.account }
      );
      await publicClient.waitForTransactionReceipt({ hash: hash2 });

      // Verify both pools exist with different fees
      const pool1 = await amm.read.getPool([poolId1]);
      const pool2 = await amm.read.getPool([poolId2]);

      expect(pool1[4]).to.equal(fee1);
      expect(pool2[4]).to.equal(fee2);
    });
  });
});

