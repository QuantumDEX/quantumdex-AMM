"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";

import { networks } from "@/config/wagmi";
import { shortenAddress } from "@/lib/utils";
import { BrowserProvider, parseUnits, formatUnits } from "ethers";
import amm from "@/lib/amm";

// Add real addresses when available. These are placeholders used for example.
const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_ROUTER_ADDRESS ?? "0x0000000000000000000000000000000000000000";
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "0x0000000000000000000000000000000000000000";

const tokens = [
  { symbol: "ETH", name: "Ethereum", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", balance: "12.46", price: 2980.2, decimals: 18 },
  { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", balance: "42300.12", price: 1.0, decimals: 6 },
  { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", balance: "2.14", price: 58420.15, decimals: 8 },
  { symbol: "ARB", name: "Arbitrum", address: "0x0000000000000000000000000000000000000001", balance: "18920.00", price: 1.23, decimals: 18 },
];

const slippageOptions = ["0.3%", "0.5%", "1.0%"];
const routeLegs = [
  {
    step: "①",
    description: "ETH → WETH",
    detail: "Wrapped on-chain (0% fee)",
    weight: "100%",
  },
  {
    step: "②",
    description: "WETH → USDC",
    detail: "QuantumDEX v3 (0.01% fee tier)",
    weight: "85%",
  },
  {
    step: "③",
    description: "WETH → USDC",
    detail: "Aggregator partner (0.03% fee tier)",
    weight: "15%",
  },
];

export default function SwapPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [sellToken, setSellToken] = useState(tokens[0]);
  const [buyToken, setBuyToken] = useState(tokens[1]);
  const [slippage, setSlippage] = useState("0.5%");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [sellAmount, setSellAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [sellTokenBalance, setSellTokenBalance] = useState<string>("0");
  const [buyTokenBalance, setBuyTokenBalance] = useState<string>("0");
  const [tokenAllowance, setTokenAllowance] = useState<string>("0");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [approving, setApproving] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeNetwork = useMemo(
    () => (chainId ? networks.find((item) => item.id === chainId) : undefined),
    [chainId],
  );

  const [quote, setQuote] = useState<null | {
    sellAmount: string;
    buyAmount: string;
    minReceived: string;
    executionPrice: string;
    impact: string;
    routeCount: number;
  }>(null);

  // Fetch token balances when wallet connects or tokens change
  useEffect(() => {
    if (!isConnected || !address || !publicClient) return;
    const provider = publicClientToProvider(publicClient);
    if (!provider) return;

    let mounted = true;
    (async () => {
      try {
        const [sellBal, buyBal] = await Promise.all([
          amm.getTokenBalance(provider, sellToken.address, address, sellToken.decimals ?? 18),
          amm.getTokenBalance(provider, buyToken.address, address, buyToken.decimals ?? 18),
        ]);
        if (mounted) {
          setSellTokenBalance(sellBal);
          setBuyTokenBalance(buyBal);
        }
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isConnected, address, publicClient, sellToken, buyToken]);

  // Check token allowance for ERC20 tokens
  useEffect(() => {
    if (!isConnected || !address || !publicClient) return;
    // Skip for native ETH
    if (sellToken.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      setTokenAllowance("0");
      setNeedsApproval(false);
      return;
    }

    const provider = publicClientToProvider(publicClient);
    if (!provider) return;

    let mounted = true;
    (async () => {
      try {
        const allowance = await amm.getTokenAllowance(provider, sellToken.address, address, AMM_ADDRESS);
        if (mounted) {
          setTokenAllowance(allowance);
          // Check if approval is needed
          if (sellAmount) {
            const amountInWei = parseUnits(sellAmount, sellToken.decimals ?? 18);
            setNeedsApproval(BigInt(allowance) < amountInWei);
          } else {
            setNeedsApproval(false);
          }
        }
      } catch (error) {
        console.error("Error checking allowance:", error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isConnected, address, publicClient, sellToken, sellAmount]);

  // Fetch on-chain quote when sellAmount or tokens change.
  useEffect(() => {
    let mounted = true;
    setQuote(null);
    setLoadingQuote(true);
    setErrorMessage(null);

    if (!isConnected || !sellAmount || !sellToken || !buyToken || !publicClient) {
      setLoadingQuote(false);
      return;
    }

    const provider = publicClientToProvider(publicClient);
    if (!provider) {
      setLoadingQuote(false);
      return;
    }

    (async () => {
      try {
        const out = await amm.getQuote(
          provider as any,
          ROUTER_ADDRESS || AMM_ADDRESS,
          sellToken.address,
          buyToken.address,
          sellAmount,
          sellToken.decimals ?? 18,
          buyToken.decimals ?? 18,
          undefined,
          FACTORY_ADDRESS,
        );
        if (!mounted) return;
        if (!out) {
          setQuote(null);
          setErrorMessage("Unable to fetch quote. Pool may not exist.");
          return;
        }
        const buyHuman = formatUnits(out, buyToken.decimals ?? 18);
        const slippagePercent = parseFloat(slippage.replace("%", ""));
        const minReceived = (Number(buyHuman) * (1 - slippagePercent / 100)).toFixed(6);
        const priceRatio = Number(buyHuman) / Number(sellAmount);
        setQuote({
          sellAmount: sellAmount,
          buyAmount: buyHuman,
          minReceived,
          executionPrice: `1 ${sellToken.symbol} ≈ ${priceRatio.toFixed(6)} ${buyToken.symbol}`,
          impact: "~0.04%", // TODO: Calculate actual price impact
          routeCount: 1,
        });
        setErrorMessage(null);
      } catch (e: any) {
        console.error("quote error", e);
        if (mounted) {
          setQuote(null);
          setErrorMessage(e?.message || "Failed to fetch quote");
        }
      } finally {
        if (mounted) setLoadingQuote(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isConnected, sellAmount, sellToken, buyToken, publicClient, slippage]);

  const handleFlip = () => {
    const tempToken = sellToken;
    const tempBalance = sellTokenBalance;
    setSellToken(buyToken);
    setBuyToken(tempToken);
    setSellTokenBalance(buyTokenBalance);
    setBuyTokenBalance(tempBalance);
    setSellAmount("");
    setQuote(null);
  };

  const handleApprove = useCallback(async () => {
    if (!isConnected || !address || !walletClient || !sellToken) return;

    try {
      setApproving(true);
      setErrorMessage(null);
      const signer = await walletClientToSigner(walletClient);
      if (!signer) throw new Error("Failed to get signer");

      await amm.approveToken(signer, sellToken.address, AMM_ADDRESS);
      
      // Refresh allowance
      if (publicClient) {
        const provider = publicClientToProvider(publicClient);
        if (provider) {
          const newAllowance = await amm.getTokenAllowance(provider, sellToken.address, address, AMM_ADDRESS);
          setTokenAllowance(newAllowance);
          setNeedsApproval(false);
        }
      }
    } catch (error: unknown) {
      console.error("Approval error:", error);
      const errorMessage = error instanceof Error ? error.message : "Approval failed";
      setErrorMessage(errorMessage);
    } finally {
      setApproving(false);
    }
  }, [isConnected, address, walletClient, sellToken, publicClient]);

  const handleSwap = useCallback(async () => {
    if (!isConnected || !address || !walletClient || !sellAmount || !quote) return;

    try {
      setSubmitting(true);
      setTxStatus("pending");
      setErrorMessage(null);
      const signer = await walletClientToSigner(walletClient);
      if (!signer) throw new Error("Failed to get signer");

      const amountIn = parseUnits(sellAmount, sellToken.decimals ?? 18);
      const minAmountOut = parseUnits(quote.minReceived, buyToken.decimals ?? 18);

      const result = await amm.swap(
        signer,
        AMM_ADDRESS,
        sellToken.address,
        buyToken.address,
        amountIn.toString(),
        minAmountOut.toString(),
        address, // recipient
        30, // feeBps - default 0.3%
      );

      if (result?.receipt) {
        setTxHash(result.receipt.transactionHash);
        setTxStatus("success");
        
        // Refresh balances after successful swap
        if (publicClient) {
          const provider = publicClientToProvider(publicClient);
          if (provider) {
            const [newSellBal, newBuyBal] = await Promise.all([
              amm.getTokenBalance(provider, sellToken.address, address, sellToken.decimals ?? 18),
              amm.getTokenBalance(provider, buyToken.address, address, buyToken.decimals ?? 18),
            ]);
            setSellTokenBalance(newSellBal);
            setBuyTokenBalance(newBuyBal);
          }
        }
        
        // Reset form after successful swap
        setTimeout(() => {
          setSellAmount("");
          setQuote(null);
          setTxStatus("idle");
        }, 3000);
      }
    } catch (error: unknown) {
      console.error("Swap error:", error);
      setTxStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Swap failed";
      setErrorMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [isConnected, address, walletClient, sellAmount, quote, sellToken, buyToken, publicClient]);

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
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex flex-1 items-center gap-2">
                  <select
                    className="w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    value={sellToken.symbol}
                    onChange={(event) =>
                      setSellToken(tokens.find((token) => token.symbol === event.target.value) ?? tokens[0])
                    }
                  >
                    {tokens.map((token) => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol} · {token.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400">▾</span>
                </div>
                <input
                  type="number"
                  placeholder={isConnected ? "0.0" : "Connect wallet"}
                  disabled={!isConnected}
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  className="w-full max-w-[160px] rounded-2xl border border-transparent bg-transparent text-right text-3xl font-semibold tracking-tight text-zinc-900 outline-none placeholder:text-zinc-300 dark:text-zinc-100"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Balance: {isConnected ? sellTokenBalance : sellToken.balance} {sellToken.symbol}</span>
                <button
                  onClick={() => {
                    if (isConnected && sellTokenBalance) {
                      setSellAmount(sellTokenBalance);
                    }
                  }}
                  className="text-emerald-500 hover:text-emerald-600"
                >
                  Max
                </button>
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
                  <select
                    className="w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    value={buyToken.symbol}
                    onChange={(event) =>
                      setBuyToken(tokens.find((token) => token.symbol === event.target.value) ?? tokens[1])
                    }
                  >
                    {tokens.map((token) => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol} · {token.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400">▾</span>
                </div>
                <input
                  type="text"
                  placeholder={loadingQuote ? "Loading..." : isConnected ? "~ 0.00" : "—"}
                  disabled
                  value={loadingQuote ? "" : quote?.buyAmount ?? ""}
                  className="w-full max-w-[160px] rounded-2xl border border-transparent bg-transparent text-right text-3xl font-semibold tracking-tight text-emerald-500 outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Balance: {isConnected ? buyTokenBalance : buyToken.balance} {buyToken.symbol}</span>
                <span>Price: {buyToken.price}</span>
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

            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50/70 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {errorMessage}
              </div>
            )}

            {txStatus === "success" && txHash && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                Swap successful! Transaction: {shortenAddress(txHash, 8)}
              </div>
            )}

            {needsApproval && sellToken.address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? (
              <button
                className="w-full rounded-2xl bg-blue-500 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-600 disabled:bg-zinc-300 disabled:text-zinc-500"
                disabled={!isConnected || approving}
                onClick={handleApprove}
              >
                {approving ? "Approving…" : `Approve ${sellToken.symbol}`}
              </button>
            ) : (
              <button
                className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:bg-zinc-300 disabled:text-zinc-500"
                disabled={!isConnected || !sellAmount || submitting || loadingQuote || !quote}
                onClick={handleSwap}
              >
                {submitting
                  ? "Submitting…"
                  : txStatus === "pending"
                    ? "Transaction Pending…"
                    : !quote
                      ? "Enter amount"
                      : "Review & Execute"}
              </button>
            )}
            {isConnected ? (
              <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                QuantumRouter will batch quotes across {quote?.routeCount ?? 0} pools and settle atomically.
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

          <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
            {routeLegs.map((leg) => (
              <div key={leg.step} className="flex items-start gap-3">
                <span className="mt-1 text-lg text-emerald-500">{leg.step}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    <span>{leg.description}</span>
                    <span className="text-xs font-semibold text-emerald-500">{leg.weight}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{leg.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {loadingQuote ? (
            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-4 text-sm text-zinc-500 dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:text-zinc-300">
              <div className="flex items-center justify-center gap-2">
                <span>Fetching quote...</span>
              </div>
            </div>
          ) : quote ? (
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              <div className="flex items-center justify-between">
                <span>Execution price</span>
                <span className="font-semibold text-emerald-500">{quote.executionPrice}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Slippage ({slippage})</span>
                <span className="font-semibold text-emerald-500">
                  {quote.minReceived} {buyToken.symbol} min received
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Price impact</span>
                <span className="font-semibold text-emerald-500">{quote.impact}</span>
              </div>
              {txHash && (
                <div className="mt-3 rounded-lg border border-emerald-300/50 bg-emerald-100/50 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span>Transaction:</span>
                    <a
                      href={`${activeNetwork?.blockExplorers?.default?.url}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-emerald-600 underline hover:text-emerald-700 dark:text-emerald-300"
                    >
                      {shortenAddress(txHash, 8)}
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
              {errorMessage}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-4 text-sm text-zinc-500 dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:text-zinc-300">
              {isConnected
                ? "Enter an amount to see quote details, route breakdown, and settlement guarantees."
                : "Connect a wallet to fetch live quotes, route breakdowns, and settlement guarantees."}
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

