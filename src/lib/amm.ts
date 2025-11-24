import { Contract, type JsonRpcSigner, type Provider } from "ethers";

export type Pool = {
  token0: string;
  token1: string;
  fee: number;
  pool: string;
  blockNumber?: number;
  txHash?: string;
};

// Minimal factory ABI: PoolCreated event + createPool function
const DEFAULT_FACTORY_ABI = [
  "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, address pool)",
  "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address)",
];

// Minimal router ABI placeholders — callers may pass a custom ABI for their router
const DEFAULT_ROUTER_ABI = [
  "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external returns (uint256)",
  "function addLiquidity(address pool, address tokenA, address tokenB, uint256 amountA, uint256 amountB) external returns (uint256 shares)",
  "function removeLiquidity(address pool, uint256 shares) external returns (uint256 amountA, uint256 amountB)",
];

/**
 * Read all PoolCreated events from a factory contract and return typed pools.
 * - `provider` may be an ethers Provider (read-only) or BrowserProvider from ethers.
 * - `factoryAbi` is optional — a minimal ABI is provided.
 */
export async function getAllPools(
  provider: Provider | any,
  factoryAddress: string,
  factoryAbi: any = DEFAULT_FACTORY_ABI,
): Promise<Pool[]> {
  const factory = new Contract(factoryAddress, factoryAbi, provider);
  const filter = factory.filters?.PoolCreated?.();
  const events = filter ? await factory.queryFilter(filter) : [];
  return events.map((ev: any) => ({
    token0: ev.args?.token0 ?? ev.args?.[0],
    token1: ev.args?.token1 ?? ev.args?.[1],
    fee: Number(ev.args?.fee ?? ev.args?.[2] ?? 0),
    pool: ev.args?.pool ?? ev.args?.[3],
    blockNumber: ev.blockNumber,
    txHash: ev.transactionHash,
  }));
}

/**
 * Create a pool using a factory contract. Returns the transaction receipt (wait result).
 * - `signer` must be an ethers Signer (JsonRpcSigner) connected to a wallet.
 * - `factoryAbi` can be supplied if the factory uses different function signatures.
 */
export async function createPool(
  signer: JsonRpcSigner,
  factoryAddress: string,
  tokenA: string,
  tokenB: string,
  fee: number,
  factoryAbi: any = DEFAULT_FACTORY_ABI,
) {
  const factory = new Contract(factoryAddress, factoryAbi, signer);
  const tx = await factory.createPool(tokenA, tokenB, fee);
  return tx.wait?.();
}

/**
 * Add liquidity via a router/manager contract. Returns transaction receipt.
 * - `routerAbi` defaults to a minimal shape; pass a real ABI for your router.
 */
export async function addLiquidity(
  signer: JsonRpcSigner,
  routerAddress: string,
  poolAddress: string,
  tokenA: string,
  tokenB: string,
  amountA: string | number,
  amountB: string | number,
  routerAbi: any = DEFAULT_ROUTER_ABI,
) {
  const router = new Contract(routerAddress, routerAbi, signer);
  const tx = await router.addLiquidity(poolAddress, tokenA, tokenB, amountA, amountB);
  return tx.wait?.();
}

/**
 * Remove liquidity from a pool (by shares). Returns transaction receipt and amounts.
 */
export async function removeLiquidity(
  signer: JsonRpcSigner,
  routerAddress: string,
  poolAddress: string,
  shares: string | number,
  routerAbi: any = DEFAULT_ROUTER_ABI,
) {
  const router = new Contract(routerAddress, routerAbi, signer);
  const tx = await router.removeLiquidity(poolAddress, shares);
  return tx.wait?.();
}

/**
 * Execute a swap via a router contract. Returns transaction receipt and any returned value.
 */
export async function swap(
  signer: JsonRpcSigner,
  routerAddress: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: string | number,
  minAmountOut: string | number,
  routerAbi: any = DEFAULT_ROUTER_ABI,
) {
  const router = new Contract(routerAddress, routerAbi, signer);
  const tx = await router.swap(tokenIn, tokenOut, amountIn, minAmountOut);
  return tx.wait?.();
}

/**
 * Query a pool or position manager for a user's liquidity. This is intentionally
 * permissive: it will try a few common methods (`balanceOf`, `liquidityOf`, `positions`).
 */
export async function getUserLiquidity(
  provider: Provider | any,
  userAddress: string,
  poolAddress: string,
  poolAbi: any = [
    "function balanceOf(address owner) view returns (uint256)",
    "function liquidityOf(address owner) view returns (uint256)",
  ],
) {
  const pool = new Contract(poolAddress, poolAbi, provider);
  // try balanceOf
  try {
    const bal = await pool.balanceOf(userAddress);
    return { type: "balanceOf", amount: bal.toString() } as const;
  } catch (e) {
    // ignore and try next
  }
  try {
    const liq = await pool.liquidityOf(userAddress);
    return { type: "liquidityOf", amount: liq.toString() } as const;
  } catch (e) {
    // ignore
  }
  return { type: "unknown", amount: "0" } as const;
}

export default {
  getAllPools,
  createPool,
  addLiquidity,
  removeLiquidity,
  swap,
  getUserLiquidity,
};
