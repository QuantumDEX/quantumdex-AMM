import { Contract, JsonRpcProvider, JsonRpcSigner, Provider } from "ethers";
import AMM_ABI from "./abi/AMM.json";
import MOCK_TOKEN_ABI from "./abi/MockToken.json";
import { publicClientToProvider, walletClientToSigner } from "@/config/adapter";

// Contract addresses - these should be set after deployment
// For now, we'll use environment variables or constants
export const AMM_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AMM_CONTRACT_ADDRESS || "";

export type PoolInfo = {
  token0: string;
  token1: string;
  reserve0: bigint;
  reserve1: bigint;
  feeBps: number;
  totalSupply: bigint;
};

export type PoolCreatedEvent = {
  poolId: string;
  token0: string;
  token1: string;
  feeBps: number;
  initialLiquidity: bigint;
  amount0: bigint;
  amount1: bigint;
  provider: string;
};

/**
 * Get an ethers Contract instance for the AMM
 */
export const getAMMContract = (
  address: string,
  signerOrProvider: JsonRpcSigner | Provider
): Contract => {
  return new Contract(address, AMM_ABI, signerOrProvider);
};

/**
 * Get an ethers Contract instance for an ERC20 token
 */
export const getTokenContract = (
  address: string,
  signerOrProvider: JsonRpcSigner | Provider
): Contract => {
  return new Contract(address, MOCK_TOKEN_ABI, signerOrProvider);
};

/**
 * Get pool information by poolId
 */
export const getPool = async (
  poolId: string,
  contractAddress: string,
  provider: Provider
): Promise<PoolInfo | null> => {
  try {
    const contract = getAMMContract(contractAddress, provider);
    const result = await contract.getPool(poolId);
    
    return {
      token0: result[0],
      token1: result[1],
      reserve0: BigInt(result[2].toString()),
      reserve1: BigInt(result[3].toString()),
      feeBps: Number(result[4]),
      totalSupply: BigInt(result[5].toString()),
    };
  } catch (error) {
    console.error("Error getting pool:", error);
    return null;
  }
};

/**
 * Get user's LP balance for a specific pool
 */
export const getUserLiquidity = async (
  poolId: string,
  userAddress: string,
  contractAddress: string,
  provider: Provider
): Promise<bigint> => {
  try {
    const contract = getAMMContract(contractAddress, provider);
    const balance = await contract.getLpBalance(poolId, userAddress);
    return BigInt(balance.toString());
  } catch (error) {
    console.error("Error getting user liquidity:", error);
    return 0n;
  }
};

/**
 * Calculate pool ID from token addresses and fee
 */
export const getPoolId = async (
  tokenA: string,
  tokenB: string,
  feeBps: number,
  contractAddress: string,
  provider: Provider
): Promise<string> => {
  try {
    const contract = getAMMContract(contractAddress, provider);
    const poolId = await contract.getPoolId(tokenA, tokenB, feeBps);
    return poolId;
  } catch (error) {
    console.error("Error calculating pool ID:", error);
    throw error;
  }
};

/**
 * Get all pools by listening to PoolCreated events
 */
export const getAllPools = async (
  contractAddress: string,
  provider: Provider,
  fromBlock?: number
): Promise<PoolCreatedEvent[]> => {
  try {
    const contract = getAMMContract(contractAddress, provider);
    const filter = contract.filters.PoolCreated();
    const events = await contract.queryFilter(filter, fromBlock || 0);
    
    return events.map((event) => {
      const args = event.args as any;
      return {
        poolId: args.poolId,
        token0: args.token0,
        token1: args.token1,
        feeBps: Number(args.feeBps),
        initialLiquidity: BigInt(args.initialLiquidity.toString()),
        amount0: BigInt(args.amount0.toString()),
        amount1: BigInt(args.amount1.toString()),
        provider: args.provider,
      };
    });
  } catch (error) {
    console.error("Error getting all pools:", error);
    return [];
  }
};

/**
 * Create a new pool
 */
export const createPool = async (
  tokenA: string,
  tokenB: string,
  amountA: bigint,
  amountB: bigint,
  contractAddress: string,
  signer: JsonRpcSigner
): Promise<{ poolId: string; liquidity: bigint; txHash: string }> => {
  try {
    const contract = getAMMContract(contractAddress, signer);
    
    // Approve tokens first
    const tokenAContract = getTokenContract(tokenA, signer);
    const tokenBContract = getTokenContract(tokenB, signer);
    
    await tokenAContract.approve(contractAddress, amountA);
    await tokenBContract.approve(contractAddress, amountB);
    
    // Create pool
    const tx = await contract.createPool(tokenA, tokenB, amountA, amountB);
    const receipt = await tx.wait();
    
    // Get pool ID from event
    const poolCreatedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "PoolCreated";
      } catch {
        return false;
      }
    });
    
    let poolId = "";
    let liquidity = 0n;
    
    if (poolCreatedEvent) {
      const parsed = contract.interface.parseLog(poolCreatedEvent);
      if (parsed?.args) {
        poolId = parsed.args.poolId;
        liquidity = BigInt(parsed.args.initialLiquidity.toString());
      }
    }
    
    return {
      poolId,
      liquidity,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error("Error creating pool:", error);
    throw error;
  }
};

/**
 * Add liquidity to an existing pool
 */
export const addLiquidity = async (
  poolId: string,
  amount0Desired: bigint,
  amount1Desired: bigint,
  contractAddress: string,
  signer: JsonRpcSigner
): Promise<{ liquidity: bigint; amount0: bigint; amount1: bigint; txHash: string }> => {
  try {
    const contract = getAMMContract(contractAddress, signer);
    
    // Get pool info to know which tokens to approve
    const poolInfo = await contract.getPool(poolId);
    const token0 = poolInfo[0];
    const token1 = poolInfo[1];
    
    // Approve tokens
    const token0Contract = getTokenContract(token0, signer);
    const token1Contract = getTokenContract(token1, signer);
    
    await token0Contract.approve(contractAddress, amount0Desired);
    await token1Contract.approve(contractAddress, amount1Desired);
    
    // Add liquidity
    const tx = await contract.addLiquidity(poolId, amount0Desired, amount1Desired);
    const receipt = await tx.wait();
    
    // Get amounts from event
    const liquidityAddedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "LiquidityAdded";
      } catch {
        return false;
      }
    });
    
    let liquidity = 0n;
    let amount0 = 0n;
    let amount1 = 0n;
    
    if (liquidityAddedEvent) {
      const parsed = contract.interface.parseLog(liquidityAddedEvent);
      if (parsed?.args) {
        liquidity = BigInt(parsed.args.liquidityMinted.toString());
        amount0 = BigInt(parsed.args.amount0.toString());
        amount1 = BigInt(parsed.args.amount1.toString());
      }
    }
    
    return {
      liquidity,
      amount0,
      amount1,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error("Error adding liquidity:", error);
    throw error;
  }
};

/**
 * Remove liquidity from a pool
 */
export const removeLiquidity = async (
  poolId: string,
  liquidity: bigint,
  contractAddress: string,
  signer: JsonRpcSigner
): Promise<{ amount0: bigint; amount1: bigint; txHash: string }> => {
  try {
    const contract = getAMMContract(contractAddress, signer);
    
    const tx = await contract.removeLiquidity(poolId, liquidity);
    const receipt = await tx.wait();
    
    // Get amounts from event
    const liquidityRemovedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "LiquidityRemoved";
      } catch {
        return false;
      }
    });
    
    let amount0 = 0n;
    let amount1 = 0n;
    
    if (liquidityRemovedEvent) {
      const parsed = contract.interface.parseLog(liquidityRemovedEvent);
      if (parsed?.args) {
        amount0 = BigInt(parsed.args.amount0.toString());
        amount1 = BigInt(parsed.args.amount1.toString());
      }
    }
    
    return {
      amount0,
      amount1,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error("Error removing liquidity:", error);
    throw error;
  }
};

/**
 * Execute a swap
 */
export const swap = async (
  poolId: string,
  tokenIn: string,
  amountIn: bigint,
  minAmountOut: bigint,
  recipient: string,
  contractAddress: string,
  signer: JsonRpcSigner
): Promise<{ amountOut: bigint; txHash: string }> => {
  try {
    const contract = getAMMContract(contractAddress, signer);
    
    // Approve token
    const tokenInContract = getTokenContract(tokenIn, signer);
    await tokenInContract.approve(contractAddress, amountIn);
    
    // Execute swap
    const tx = await contract.swap(poolId, tokenIn, amountIn, minAmountOut, recipient);
    const receipt = await tx.wait();
    
    // Get amount out from event
    const swapEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "Swap";
      } catch {
        return false;
      }
    });
    
    let amountOut = 0n;
    
    if (swapEvent) {
      const parsed = contract.interface.parseLog(swapEvent);
      if (parsed?.args) {
        amountOut = BigInt(parsed.args.amountOut.toString());
      }
    }
    
    return {
      amountOut,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error("Error executing swap:", error);
    throw error;
  }
};


