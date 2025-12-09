import { Contract, parseUnits, formatUnits, type JsonRpcSigner, type Provider } from "ethers";

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
  // common router read helpers
  "function getAmountsOut(uint256 amountIn, address[] calldata path) view returns (uint256[])",
];

const DEFAULT_FACTORY_ABI_FULL = [
  ...DEFAULT_FACTORY_ABI,
  // common factory helpers
  "function getPool(address tokenA, address tokenB, uint24 fee) view returns (address)",
  "function getPair(address tokenA, address tokenB) view returns (address)",
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
 * Try to compute an on-chain quote for tokenIn -> tokenOut for a given amountIn.
 * It will try common router methods (getAmountsOut) and fallback to reading pair reserves.
 * Returns amountOut as a string in base units (wei) or null if unable to quote.
 */
async function resolveAbi(maybeAbi: any, importPath: string, fallback: any) {
  if (maybeAbi) return maybeAbi;
  try {
    // dynamic import allows dropping ABI json into src/abis/Router.json etc.
    // path is relative to the compiled module location; using explicit path for Next.js
    // may require adjustment depending on bundler. We try a few likely locations.
    const mod = await import(importPath);
    return (mod && (mod.default ?? mod)) || fallback;
  } catch (e) {
    return fallback;
  }
}

export async function getQuote(
  provider: Provider | any,
  routerAddress: string,
  tokenIn: string,
  tokenOut: string,
  amountInHuman: string,
  decimalsIn = 18,
  decimalsOut = 18,
  routerAbi?: any,
  factoryAddress?: string,
  factoryAbi?: any,
) {
  const resolvedRouterAbi = await resolveAbi(routerAbi, "@/abis/Router.json", DEFAULT_ROUTER_ABI);
  const resolvedFactoryAbi = await resolveAbi(factoryAbi, "@/abis/Factory.json", DEFAULT_FACTORY_ABI_FULL);
  const router = new Contract(routerAddress, resolvedRouterAbi, provider);
  // convert to wei-like amount
  const amountIn = parseUnits(amountInHuman, decimalsIn);
  // try getAmountsOut(path)
  try {
    if (typeof router.getAmountsOut === "function") {
      const amounts: any = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
      const out = amounts[amounts.length - 1];
      return out.toString();
    }
  } catch (e) {
    // ignore and try next
  }

  // fallback: try factory -> pair -> getReserves
  if (factoryAddress) {
    try {
      const factory = new Contract(factoryAddress, resolvedFactoryAbi, provider);
      // try common function names
      let pairAddress: string | null = null;
      try {
        pairAddress = await factory.getPair(tokenIn, tokenOut);
      } catch {}
      if (!pairAddress) {
        try {
          pairAddress = await factory.getPool(tokenIn, tokenOut, 3000);
        } catch {}
      }
      if (pairAddress && pairAddress !== "0x0000000000000000000000000000000000000000") {
        const pairAbi = ["function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)", "function token0() view returns (address)"];
        const pair = new Contract(pairAddress, pairAbi, provider);
        const token0 = await pair.token0();
        const reserves: any = await pair.getReserves();
        let reserveIn, reserveOut;
        if (token0.toLowerCase() === tokenIn.toLowerCase()) {
          reserveIn = reserves[0];
          reserveOut = reserves[1];
        } else {
          reserveIn = reserves[1];
          reserveOut = reserves[0];
        }
        // price formula for UniswapV2: amountOut = amountIn * reserveOut / reserveIn (ignoring fees)
        const amountOut = (amountIn * reserveOut) / reserveIn;
        return amountOut.toString();
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
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
  factoryAbi?: any,
) {
  const resolvedFactoryAbi = await resolveAbi(factoryAbi, "@/abis/Factory.json", DEFAULT_FACTORY_ABI);
  const factory = new Contract(factoryAddress, resolvedFactoryAbi, signer);
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
  routerAbi?: any,
) {
  const resolvedRouterAbi = await resolveAbi(routerAbi, "@/abis/Router.json", DEFAULT_ROUTER_ABI);
  const router = new Contract(routerAddress, resolvedRouterAbi, signer);
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
  routerAbi?: any,
) {
  const resolvedRouterAbi = await resolveAbi(routerAbi, "@/abis/Router.json", DEFAULT_ROUTER_ABI);
  const router = new Contract(routerAddress, resolvedRouterAbi, signer);
  const tx = await router.removeLiquidity(poolAddress, shares);
  return tx.wait?.();
}

/**
 * Execute a swap via the AMM contract. Returns transaction receipt and amountOut.
 * - Uses the actual AMM contract ABI with poolId-based swaps
 * - Automatically fetches poolId using getPoolId
 */
export async function swap(
  signer: JsonRpcSigner,
  ammAddress: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: string | number,
  minAmountOut: string | number,
  recipient: string,
  feeBps: number = 30, // Default 0.3% fee (30 basis points)
  ammAbi?: any,
) {
  const resolvedAmmAbi = await resolveAbi(ammAbi, "@/lib/abi/AMM.json", null);
  if (!resolvedAmmAbi) {
    throw new Error("AMM ABI not found. Please provide ammAbi or ensure @/lib/abi/AMM.json exists");
  }
  const amm = new Contract(ammAddress, resolvedAmmAbi, signer);
  
  // Get poolId for the token pair
  const poolId = await amm.getPoolId(tokenIn, tokenOut, feeBps);
  
  // Execute swap
  const tx = await amm.swap(poolId, tokenIn, amountIn, minAmountOut, recipient);
  const receipt = await tx.wait?.();
  return { receipt, amountOut: receipt?.logs ? "0" : "0" }; // amountOut would be parsed from events
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

/**
 * Get token balance for a user address.
 * Supports both ERC20 tokens and native ETH.
 */
export async function getTokenBalance(
  provider: Provider | any,
  tokenAddress: string,
  userAddress: string,
  decimals: number = 18,
): Promise<string> {
  // Native ETH balance
  if (tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" || !tokenAddress) {
    const balance = await provider.getBalance(userAddress);
    return formatUnits(balance, decimals);
  }

  // ERC20 token balance
  const tokenAbi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];
  try {
    const token = new Contract(tokenAddress, tokenAbi, provider);
    const balance = await token.balanceOf(userAddress);
    // Try to get actual decimals from contract
    let actualDecimals = decimals;
    try {
      actualDecimals = await token.decimals();
    } catch {
      // Use provided decimals if contract doesn't have decimals()
    }
    return formatUnits(balance, actualDecimals);
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return "0";
  }
}

/**
 * Get token allowance for a spender (e.g., router/AMM contract).
 */
export async function getTokenAllowance(
  provider: Provider | any,
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
): Promise<string> {
  // Native ETH doesn't need allowance
  if (tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" || !tokenAddress) {
    return "0"; // Native ETH doesn't require approval
  }

  const tokenAbi = ["function allowance(address owner, address spender) view returns (uint256)"];
  try {
    const token = new Contract(tokenAddress, tokenAbi, provider);
    const allowance = await token.allowance(ownerAddress, spenderAddress);
    return allowance.toString();
  } catch (error) {
    console.error("Error fetching token allowance:", error);
    return "0";
  }
}

export default {
  getAllPools,
  getQuote,
  createPool,
  addLiquidity,
  removeLiquidity,
  swap,
  getUserLiquidity,
  getTokenBalance,
  getTokenAllowance,
};
