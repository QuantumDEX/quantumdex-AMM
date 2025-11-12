"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";

import { networks } from "@/config/wagmi";
import { shortenAddress } from "@/lib/utils";

const tokens = [
  { symbol: "ETH", name: "Ethereum", balance: "12.46", price: "$2,980.20" },
  { symbol: "USDC", name: "USD Coin", balance: "42,300.12", price: "$1.00" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", balance: "2.14", price: "$58,420.15" },
  { symbol: "ARB", name: "Arbitrum", balance: "18,920.00", price: "$1.23" },
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

  const [sellToken, setSellToken] = useState(tokens[0]);
  const [buyToken, setBuyToken] = useState(tokens[1]);
  const [slippage, setSlippage] = useState("0.5%");
  const [advancedMode, setAdvancedMode] = useState(false);

  const activeNetwork = useMemo(
    () => (chainId ? networks.find((item) => item.id === chainId) : undefined),
    [chainId],
  );

  const quote = useMemo(() => {
    if (!isConnected) return null;
    return {
      sellAmount: "6.50",
      buyAmount: "19,388.45",
      minReceived: "19,291.50",
      executionPrice: "1 ETH = 2,982.07 USDC",
      impact: "0.04%",
      routeCount: 5,
    };
  }, [isConnected]);

  const handleFlip = () => {
    setSellToken(buyToken);
    setBuyToken(sellToken);
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
                  className="w-full max-w-[160px] rounded-2xl border border-transparent bg-transparent text-right text-3xl font-semibold tracking-tight text-zinc-900 outline-none placeholder:text-zinc-300 dark:text-zinc-100"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Balance: {sellToken.balance} {sellToken.symbol}</span>
                <span>Price: {sellToken.price}</span>
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
                  placeholder={isConnected ? "~ 0.00" : "—"}
                  disabled
                  className="w-full max-w-[160px] rounded-2xl border border-transparent bg-transparent text-right text-3xl font-semibold tracking-tight text-emerald-500 outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Balance: {buyToken.balance} {buyToken.symbol}</span>
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

            <button
              className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:bg-zinc-300 disabled:text-zinc-500"
              disabled={!isConnected}
            >
              {isConnected ? "Review & Execute" : "Connect Wallet to Swap"}
            </button>
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

          {quote ? (
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              <div className="flex items-center justify-between">
                <span>Execution price</span>
                <span className="font-semibold text-emerald-500">{quote.executionPrice}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Slippage ({slippage})</span>
                <span className="font-semibold text-emerald-500">{quote.minReceived} USDC min received</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Price impact</span>
                <span className="font-semibold text-emerald-500">{quote.impact}</span>
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

