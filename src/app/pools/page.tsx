"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";

import { networks } from "@/config/wagmi";

type Pool = {
  id: string;
  pair: string;
  network: number;
  tvl: string;
  apr: string;
  volume24h: string;
  feeTier: string;
  utilization: string;
};

const pools: Pool[] = [
  {
    id: "eth-usdc-10",
    pair: "ETH / USDC",
    network: 1,
    tvl: "$46.1M",
    apr: "17.4%",
    volume24h: "$8.3M",
    feeTier: "0.01%",
    utilization: "63%",
  },
  {
    id: "eth-usdc-30",
    pair: "ETH / USDC",
    network: 1,
    tvl: "$82.4M",
    apr: "12.2%",
    volume24h: "$12.5M",
    feeTier: "0.03%",
    utilization: "55%",
  },
  {
    id: "wbtc-eth-05",
    pair: "WBTC / ETH",
    network: 1,
    tvl: "$28.8M",
    apr: "12.1%",
    volume24h: "$4.5M",
    feeTier: "0.05%",
    utilization: "41%",
  },
  {
    id: "arb-usdc-10",
    pair: "ARB / USDC",
    network: 42161,
    tvl: "$12.6M",
    apr: "23.8%",
    volume24h: "$2.1M",
    feeTier: "0.01%",
    utilization: "68%",
  },
  {
    id: "op-usdc-30",
    pair: "OP / USDC",
    network: 10,
    tvl: "$9.2M",
    apr: "19.3%",
    volume24h: "$1.8M",
    feeTier: "0.03%",
    utilization: "57%",
  },
  {
    id: "matic-usdc-10",
    pair: "MATIC / USDC",
    network: 137,
    tvl: "$7.4M",
    apr: "15.7%",
    volume24h: "$1.3M",
    feeTier: "0.01%",
    utilization: "52%",
  },
];

export default function PoolsPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [networkFilter, setNetworkFilter] = useState<number | "all">(
    () => chainId ?? "all",
  );
  const [feeFilter, setFeeFilter] = useState<Pool["feeTier"] | "all">("all");

  const filteredPools = useMemo(() => {
    return pools.filter((pool) => {
      const networkMatches =
        networkFilter === "all" ||
        pool.network === networkFilter;
      const feeMatches = feeFilter === "all" || pool.feeTier === feeFilter;
      return networkMatches && feeMatches;
    });
  }, [feeFilter, networkFilter]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-14">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Liquidity Pools</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Track depth, volume, and fee tiers across networks. Provision concentrated liquidity to earn swap fees.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/portfolio"
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-200"
          >
            Manage Positions
          </Link>
          <Link
            href="/pools/new"
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600"
          >
            Create Pool
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">Total TVL</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">$212.5M</p>
          <p className="mt-1 text-xs text-emerald-500">+3.2% this week</p>
        </div>
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">24h Volume</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">$38.6M</p>
          <p className="mt-1 text-xs text-emerald-500">+5.1% vs previous</p>
        </div>
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">Networks</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">5</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Mainnet, Arbitrum, Optimism, Base, Polygon</p>
        </div>
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">Your Positions</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{isConnected ? "6 Pools" : "—"}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {isConnected ? "Track performance in Portfolio" : "Connect wallet to view"}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200/60 bg-white/80 p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Marketplace</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Filter by network and fee tier to discover high-yield pools.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              value={networkFilter}
              onChange={(event) =>
                setNetworkFilter(
                  event.target.value === "all" ? "all" : Number(event.target.value),
                )
              }
            >
              <option value="all">All networks</option>
              {networks.map((network) => (
                <option key={network.id} value={network.id}>
                  {network.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              value={feeFilter}
              onChange={(event) =>
                setFeeFilter(event.target.value as Pool["feeTier"] | "all")
              }
            >
              <option value="all">All fee tiers</option>
              <option value="0.01%">0.01%</option>
              <option value="0.03%">0.03%</option>
              <option value="0.05%">0.05%</option>
            </select>
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70">
          <table className="min-w-full divide-y divide-zinc-200/70 text-sm dark:divide-zinc-800/70">
            <thead className="bg-zinc-50/80 dark:bg-zinc-900/60">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="px-4 py-3">Pool</th>
                <th className="px-4 py-3">Network</th>
                <th className="px-4 py-3">TVL</th>
                <th className="px-4 py-3">Volume (24h)</th>
                <th className="px-4 py-3">Fee Tier</th>
                <th className="px-4 py-3">Utilization</th>
                <th className="px-4 py-3">Est. APR</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 bg-white/60 dark:divide-zinc-800/70 dark:bg-zinc-950/40">
              {filteredPools.map((pool) => {
                const networkName = networks.find((network) => network.id === pool.network)?.name ?? "Unknown";
                return (
                  <tr key={pool.id} className="transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                    <td className="px-4 py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {pool.pair}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {networkName}
                    </td>
                    <td className="px-4 py-4">{pool.tvl}</td>
                    <td className="px-4 py-4">{pool.volume24h}</td>
                    <td className="px-4 py-4">{pool.feeTier}</td>
                    <td className="px-4 py-4">{pool.utilization}</td>
                    <td className="px-4 py-4 font-semibold text-emerald-600 dark:text-emerald-400">{pool.apr}</td>
                    <td className="px-4 py-4 text-right">
                      <button className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:border-emerald-400 hover:text-emerald-500 dark:border-zinc-700 dark:text-zinc-300">
                        Provide
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

