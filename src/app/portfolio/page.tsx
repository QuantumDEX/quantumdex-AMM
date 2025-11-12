"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";

import { shortenAddress } from "@/lib/utils";
import { networks } from "@/config/wagmi";

const positions = [
  {
    id: "eth-usdc-0.01",
    pair: "ETH / USDC",
    network: 1,
    feeTier: "0.01%",
    value: "$214,560",
    share: "3.2%",
    fees24h: "$1,420",
    apr: "17.4%",
    status: "Active",
    range: "1,820 - 2,260",
  },
  {
    id: "arb-usdc-0.01",
    pair: "ARB / USDC",
    network: 42161,
    feeTier: "0.01%",
    value: "$68,120",
    share: "7.9%",
    fees24h: "$540",
    apr: "23.8%",
    status: "Active",
    range: "1.06 - 1.44",
  },
  {
    id: "wbtc-eth-0.05",
    pair: "WBTC / ETH",
    network: 1,
    feeTier: "0.05%",
    value: "$112,830",
    share: "1.1%",
    fees24h: "$610",
    apr: "12.1%",
    status: "Rebalancing",
    range: "15.5 - 18.2",
  },
];

const rewards = [
  { title: "Protocol incentives", amount: "$3,420", description: "Accrued over the last distribution epoch." },
  { title: "Pending LP fees", amount: "$2,570", description: "Collect to compound or withdraw to base currency." },
  { title: "Aggregator rebates", amount: "$860", description: "Captured from flow routed through Quantum Router." },
];

export default function PortfolioPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();

  const activeNetwork = useMemo(
    () => (chainId ? networks.find((item) => item.id === chainId) : undefined),
    [chainId],
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-14">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Portfolio</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Monitor liquidity positions, fees, and rewards across all supported networks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">
            Wallet: {isConnected && address ? shortenAddress(address, 5) : "—"}
          </span>
          <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">
            Active Network: {activeNetwork?.name ?? "—"}
          </span>
          <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">
            Strategy: Market Making
          </span>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">Net Liquidity</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{isConnected ? "$395,510" : "—"}</p>
          <p className="mt-1 text-xs text-emerald-500">{isConnected ? "+4.6% last 7d" : "Connect to view"}</p>
        </div>
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">Unclaimed Fees</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{isConnected ? "$2,570" : "—"}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {isConnected ? "Collect to claim and restake" : "Connect wallet to fetch"}
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">APR (Weighted)</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{isConnected ? "18.3%" : "—"}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Across 6 positions</p>
        </div>
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">Risk Controls</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Healthy</p>
          <p className="mt-1 text-xs text-emerald-500">No deviation alerts</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Positions</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Concentrated liquidity ranges, fee accruals, and health indicators.
              </p>
            </div>
            <Link
              href="/pools"
              className="rounded-full border border-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
            >
              Add liquidity
            </Link>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70">
            <table className="min-w-full divide-y divide-zinc-200/70 text-sm dark:divide-zinc-800/70">
              <thead className="bg-zinc-50/80 dark:bg-zinc-900/70">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="px-4 py-3">Pool</th>
                  <th className="px-4 py-3">Fee Tier</th>
                  <th className="px-4 py-3">Range</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">24h Fees</th>
                  <th className="px-4 py-3">APR</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 bg-white/60 dark:divide-zinc-800/70 dark:bg-zinc-950/40">
                {(isConnected ? positions : []).map((position) => {
                  const networkName =
                    networks.find((network) => network.id === position.network)?.name ?? "Unknown";
                  return (
                    <tr key={position.id} className="transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{position.pair}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{networkName}</p>
                      </td>
                      <td className="px-4 py-4">{position.feeTier}</td>
                      <td className="px-4 py-4">{position.range}</td>
                      <td className="px-4 py-4 font-semibold text-zinc-900 dark:text-zinc-50">{position.value}</td>
                      <td className="px-4 py-4">{position.fees24h}</td>
                      <td className="px-4 py-4 font-semibold text-emerald-600 dark:text-emerald-400">{position.apr}</td>
                      <td className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-emerald-500">
                        {position.status}
                      </td>
                    </tr>
                  );
                })}
                {!isConnected ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      Connect a wallet to view positions across QuantumDEX.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200/60 bg-white/80 p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Rewards</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Incentives earned via liquidity mining, routing rebates, and protocol distributions.
          </p>
          <div className="space-y-3">
            {rewards.map((reward) => (
              <div key={reward.title} className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {reward.title}
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{isConnected ? reward.amount : "—"}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{reward.description}</p>
              </div>
            ))}
          </div>
          <button className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 disabled:bg-zinc-300 disabled:text-zinc-500" disabled={!isConnected}>
            {isConnected ? "Claim rewards" : "Connect wallet to claim"}
          </button>
        </div>
      </section>
    </main>
  );
}

