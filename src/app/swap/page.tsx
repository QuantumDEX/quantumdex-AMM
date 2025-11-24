"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";

import { networks } from "@/config/wagmi";
import { shortenAddress } from "@/lib/utils";
import { 
  getPoolId, 
  getPool, 
  swap, 
  getAllPools,
  AMM_CONTRACT_ADDRESS,
  type PoolInfo 
} from "@/lib/amm";
import { publicClientToProvider, walletClientToSigner } from "@/config/adapter";

const slippageOptions = ["0.3%", "0.5%", "1.0%"];

export default function SwapPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [tokenInAddress, setTokenInAddress] = useState("");
  const [tokenOutAddress, setTokenOutAddress] = useState("");
  const [amountIn, setAmountIn] = useState("");
  const [slippage, setSlippage] = useState("0.5%");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [poolId, setPoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeNetwork = useMemo(
    () => (chainId ? networks.find((item) => item.id === chainId) : undefined),
    [chainId],
  );

  // Find pool when tokens are set
  useEffect(() => {
    const findPool = async () => {
      if (!tokenInAddress || !tokenOutAddress || !publicClient || !AMM_CONTRACT_ADDRESS) {
        setPoolInfo(null);
        setPoolId(null);
        return;
      }

      try {
        setLoading(true);
        const provider = publicClientToProvider(publicClient);
        if (!provider) return;

        // Get default fee (30 bps = 0.30%)
        const feeBps = 30;
        const poolIdResult = await getPoolId(tokenInAddress, tokenOutAddress, feeBps, AMM_CONTRACT_ADDRESS, provider);
        setPoolId(poolIdResult);

        const pool = await getPool(poolIdResult, AMM_CONTRACT_ADDRESS, provider);
        setPoolInfo(pool);
      } catch (err) {
        console.error("Error finding pool:", err);
        setPoolInfo(null);
        setPoolId(null);
      } finally {
        setLoading(false);
      }
    };

    findPool();
  }, [tokenInAddress, tokenOutAddress, publicClient]);

  // Calculate quote
  const quote = useMemo(() => {
    if (!poolInfo || !amountIn || !poolId) return null;

    try {
      const amountInBigInt = BigInt(Math.floor(parseFloat(amountIn) * 1e18));
      const reserveIn = tokenInAddress.toLowerCase() === poolInfo.token0.toLowerCase() 
        ? poolInfo.reserve0 
        : poolInfo.reserve1;
      const reserveOut = tokenInAddress.toLowerCase() === poolInfo.token0.toLowerCase()
        ? poolInfo.reserve1
        : poolInfo.reserve0;

      // Apply fee (30 bps = 0.30%)
      const amountInWithFee = (amountInBigInt * BigInt(10000 - poolInfo.feeBps)) / BigInt(10000);
      
      // Constant product formula: amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee)
      const amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
      
      // Calculate slippage
      const slippagePercent = parseFloat(slippage.replace("%", ""));
      const minAmountOut = (amountOut * BigInt(Math.floor((100 - slippagePercent) * 100))) / BigInt(10000);

      return {
        amountOut: (Number(amountOut) / 1e18).toFixed(6),
        minAmountOut: (Number(minAmountOut) / 1e18).toFixed(6),
        executionPrice: `1 ${shortenAddress(tokenInAddress, 4)} = ${(Number(amountOut) / Number(amountInBigInt) * 1e18).toFixed(6)} ${shortenAddress(tokenOutAddress, 4)}`,
        impact: "—", // Would need to calculate
      };
    } catch {
      return null;
    }
  }, [poolInfo, amountIn, tokenInAddress, tokenOutAddress, slippage, poolId]);

  const handleFlip = () => {
    const temp = tokenInAddress;
    setTokenInAddress(tokenOutAddress);
    setTokenOutAddress(temp);
    setAmountIn("");
  };

  const handleSwap = async () => {
    if (!isConnected || !walletClient || !address || !poolId || !poolInfo || !AMM_CONTRACT_ADDRESS) {
      setError("Please connect your wallet and ensure pool exists");
      return;
    }

    if (!amountIn || !quote) {
      setError("Please enter amount to swap");
      return;
    }

    try {
      setTxLoading(true);
      setError(null);
      setSuccess(null);

      const signer = await walletClientToSigner(walletClient);
      if (!signer) {
        throw new Error("Failed to get signer");
      }

      const amountInBigInt = BigInt(Math.floor(parseFloat(amountIn) * 1e18));
      const slippagePercent = parseFloat(slippage.replace("%", ""));
      const minAmountOut = BigInt(Math.floor(parseFloat(quote.minAmountOut) * 1e18));

      const result = await swap(
        poolId,
        tokenInAddress,
        amountInBigInt,
        minAmountOut,
        address,
        AMM_CONTRACT_ADDRESS,
        signer
      );

      setSuccess(`Swap successful! Received ${(Number(result.amountOut) / 1e18).toFixed(6)} tokens.`);
      setAmountIn("");

      // Refresh pool info
      const provider = publicClientToProvider(publicClient);
      if (provider) {
        const pool = await getPool(poolId, AMM_CONTRACT_ADDRESS, provider);
        setPoolInfo(pool);
      }
    } catch (err) {
      console.error("Error executing swap:", err);
      setError(err instanceof Error ? err.message : "Failed to execute swap");
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-14">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Spot Swap</h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Route across QuantumDEX liquidity to secure best-in-class execution and minimal slippage.
            </p>
          </div>
          <Link
            href="/pools"
            className="hidden rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500 hover:text-white md:inline-flex"
          >
            View Pools
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">
            {isConnected ? `Wallet: ${shortenAddress(address, 5)}` : "Wallet: —"}
          </span>
          <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">
            Network: {activeNetwork?.name ?? "—"}
          </span>
          <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">Mode: Smart Order Routing</span>
          <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">ETA: &lt; 12s</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <section className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Trade Ticket</h2>
            <button
              onClick={() => setAdvancedMode((prev) => !prev)}
              className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:border-emerald-400 hover:text-emerald-500 dark:border-zinc-700 dark:text-zinc-300"
            >
              {advancedMode ? "Basic mode" : "Advanced mode"}
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                <span>Sell</span>
                <button className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 transition hover:border-emerald-400 hover:text-emerald-500 dark:border-zinc-700">
                  Max
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    placeholder="0x... (token address)"
                    value={tokenInAddress}
                    onChange={(e) => setTokenInAddress(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 focus:border-emerald-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400">▾</span>
                </div>
                <input
                  type="number"
                  placeholder={isConnected ? "0.0" : "Connect wallet"}
                  disabled={!isConnected}
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  step="0.000000000000000001"
                  className="w-full max-w-[160px] rounded-2xl border border-transparent bg-transparent text-right text-3xl font-semibold tracking-tight text-zinc-900 outline-none placeholder:text-zinc-300 dark:text-zinc-100"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Balance: —</span>
                <span>Token: {tokenInAddress ? shortenAddress(tokenInAddress, 6) : "—"}</span>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <button
                onClick={handleFlip}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-500 transition hover:border-emerald-400 hover:text-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
              >
                Flip pair ↕
              </button>
            </div>

            <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">Buy</div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    placeholder="0x... (token address)"
                    value={tokenOutAddress}
                    onChange={(e) => setTokenOutAddress(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 focus:border-emerald-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400">▾</span>
                </div>
                <input
                  type="text"
                  placeholder={isConnected ? "~ 0.00" : "—"}
                  disabled
                  value={quote ? `~ ${quote.amountOut}` : ""}
                  className="w-full max-w-[160px] rounded-2xl border border-transparent bg-transparent text-right text-3xl font-semibold tracking-tight text-emerald-500 outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Balance: —</span>
                <span>Token: {tokenOutAddress ? shortenAddress(tokenOutAddress, 6) : "—"}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">Slippage tolerance</span>
                <div className="flex items-center gap-2">
                  {slippageOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setSlippage(option)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        slippage === option
                          ? "bg-emerald-500 text-white"
                          : "border border-zinc-200 text-zinc-600 hover:border-emerald-400 hover:text-emerald-500 dark:border-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                  {advancedMode ? (
                    <input
                      type="number"
                      placeholder="Custom"
                      className="w-20 rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 focus:border-emerald-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    />
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between text-xs">
                <span>Network fee: ~$4.28</span>
                <span>
                  Protocol fee: <strong className="text-emerald-500">0.01%</strong>
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            )}
            
            {success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                {success}
              </div>
            )}

            {loading && (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
                Finding pool...
              </div>
            )}

            {!poolInfo && tokenInAddress && tokenOutAddress && !loading && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                Pool not found for this token pair. Create a pool first.
              </div>
            )}

            <button
              onClick={handleSwap}
              className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:bg-zinc-300 disabled:text-zinc-500"
              disabled={!isConnected || !poolInfo || !amountIn || !quote || txLoading}
            >
              {txLoading ? "Executing Swap..." : isConnected ? "Execute Swap" : "Connect Wallet to Swap"}
            </button>
            {isConnected && poolInfo ? (
              <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                Swapping through QuantumDEX pool with {(poolInfo.feeBps / 100).toFixed(2)}% fee.
              </p>
            ) : null}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Execution Overview</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Multi-hop path built from pools with the best depth on {activeNetwork?.name ?? "—"}.
            </p>
          </div>

          {poolInfo ? (
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="flex items-start gap-3">
                <span className="mt-1 text-lg text-emerald-500">①</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    <span>{shortenAddress(tokenInAddress, 4)} → {shortenAddress(tokenOutAddress, 4)}</span>
                    <span className="text-xs font-semibold text-emerald-500">100%</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    QuantumDEX AMM ({(poolInfo.feeBps / 100).toFixed(2)}% fee tier)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Enter token addresses to see swap route
              </p>
            </div>
          )}

          {quote ? (
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              <div className="flex items-center justify-between">
                <span>Execution price</span>
                <span className="font-semibold text-emerald-500">{quote.executionPrice}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Slippage ({slippage})</span>
                <span className="font-semibold text-emerald-500">{quote.minAmountOut} min received</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Amount out</span>
                <span className="font-semibold text-emerald-500">{quote.amountOut}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-4 text-sm text-zinc-500 dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:text-zinc-300">
              Connect a wallet to fetch live quotes, route breakdowns, and settlement guarantees.
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-4 dark:border-zinc-800/60 dark:bg-zinc-950/40">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Automation</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Stream quotes programmatically via the QuantumRouter API or set conditional orders from the desk dashboard.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

