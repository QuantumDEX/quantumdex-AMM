"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { AppKitConnectButton } from "@reown/appkit/react";
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";

import { publicClientToProvider, walletClientToSigner } from "@/config/adapter";
import { shortenAddress } from "@/lib/utils";
import { networks } from "@/config/wagmi";

const headlineStats = [
  { label: "Total Value Locked", value: "$186.4M", delta: "+2.4%", positive: true },
  { label: "24h Volume", value: "$32.9M", delta: "+6.8%", positive: true },
  { label: "Active LPs", value: "8,421", delta: "-1.2%", positive: false },
];

const featuredPools = [
  { pair: "ETH / USDC", tvl: "$46.1M", apr: "17.4%", volume: "$8.3M" },
  { pair: "WBTC / ETH", tvl: "$28.8M", apr: "12.1%", volume: "$4.5M" },
  { pair: "ARB / USDC", tvl: "$12.6M", apr: "23.8%", volume: "$2.1M" },
];

const quickActions = [
  { href: "/swap", label: "Launch Swap", description: "Trade spot instantly across supported pools." },
  { href: "/pools/new", label: "Create Pool", description: "Spin up a new pair and seed bootstrapped liquidity." },
  { href: "/portfolio", label: "Manage Liquidity", description: "Track yields, rebalance, and compound rewards at once." },
];

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const activeNetwork = useMemo(
    () => (chainId ? networks.find((item) => item.id === chainId) : undefined),
    [chainId],
  );

  useEffect(() => {
    if (!walletClient) return;
    const logSigner = async () => {
      const signer = await walletClientToSigner(walletClient);
      if (process.env.NODE_ENV === "development") {
        console.log("🔑 Ethers signer ready:", signer);
      }
    };
    logSigner();
  }, [walletClient]);

  useEffect(() => {
    if (!publicClient || process.env.NODE_ENV !== "development") return;
    const provider = publicClientToProvider(publicClient);
    console.log("📡 Read provider ready:", provider);
  }, [publicClient]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-14">
      <section className="relative overflow-hidden rounded-[40px] border border-zinc-200/60 bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-900/80 px-10 py-14 text-white shadow-[0_20px_60px_-30px_rgba(22,101,52,0.75)] dark:border-zinc-800">
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -right-20 top-12 h-80 w-80 rounded-full bg-emerald-400/30 blur-3xl" />
        </div>
        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
          <div className="max-w-xl space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-1 text-sm font-semibold uppercase tracking-[0.4em] text-emerald-100">
              QuantumDEX
            </span>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              Execute multi-chain swaps with institutional-grade liquidity.
            </h1>
            <p className="text-lg text-emerald-100/80">
              Connect via WalletConnect or MetaMask, route across deep liquidity sources, and settle trades in seconds. Built with Reown AppKit, Wagmi, and ethers for production-grade experiences.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              {!isConnected ? (
                <>
                  <AppKitConnectButton label="Connect Wallet" size="lg" />
                  <span className="text-sm text-emerald-100/75">
                    Project ready? Replace this hero with pool stats and swap UI.
                  </span>
                </>
              ) : (
                <>
                  <Link
                    href="/swap"
                    className="rounded-full bg-white/15 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-white/25"
                  >
                    Launch Swap Terminal
                  </Link>
                  <Link
                    href="/portfolio"
                    className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-emerald-100 transition hover:border-white hover:text-white"
                  >
                    View Portfolio
                  </Link>
                </>
              )}
            </div>
            {isConnected ? (
              <span className="text-sm text-emerald-100/75">
                Connected as {address ? shortenAddress(address, 5) : "wallet"} — dive into liquidity flows or launch a trade.
              </span>
            ) : null}
          </div>
          <div className="grid w-full max-w-sm grid-cols-1 gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md lg:max-w-md">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100/80">
              Session Snapshot
            </h2>
            <div className="space-y-3 text-sm text-emerald-50/80">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Status</span>
                <span className="flex items-center gap-2 font-medium text-emerald-200">
                  <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-zinc-500"}`} />
                  {isConnected ? "Connected" : "Not Connected"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Network</span>
                <span className="font-medium text-white">
                  {activeNetwork?.name ?? "—"}
                </span>
              </div>
              <div className="flex items-start justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Wallet</span>
                <span className="max-w-[12rem] text-right font-medium text-white">
                  {isConnected && address ? shortenAddress(address, 5) : "—"}
                </span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100/90">
                Need programmatic access? Inspect `walletClientToSigner` & `publicClientToProvider` utilities to grab ready-to-use ethers interfaces.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {headlineStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-zinc-200/60 bg-white/70 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/70"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{stat.value}</p>
            <p
              className={`mt-2 text-sm font-medium ${
                stat.positive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {stat.delta} last 24h
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Top Performing Pools</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Real-time analytics for the most efficient routes.</p>
            </div>
            <Link
              href="/pools"
              className="rounded-full border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
            >
              View all
            </Link>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
            <table className="min-w-full divide-y divide-zinc-200/80 text-sm dark:divide-zinc-800/80">
              <thead className="bg-zinc-50/70 dark:bg-zinc-900">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="px-4 py-3">Pool</th>
                  <th className="px-4 py-3">TVL</th>
                  <th className="px-4 py-3">Volume (24h)</th>
                  <th className="px-4 py-3">Est. APR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {featuredPools.map((pool) => (
                  <tr key={pool.pair} className="bg-white/60 text-zinc-700 transition hover:bg-emerald-50 dark:bg-zinc-950/40 dark:text-zinc-200">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">{pool.pair}</td>
                    <td className="px-4 py-3">{pool.tvl}</td>
                    <td className="px-4 py-3">{pool.volume}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{pool.apr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200/60 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Strategy Center</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Shortcut into high-intent tasks with curated workflows built for professional liquidity desks.
          </p>
          <div className="flex flex-col gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-2xl border border-zinc-200 bg-white/70 px-4 py-4 transition hover:-translate-y-1 hover:border-emerald-400 hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:hover:border-emerald-400/70 dark:hover:bg-emerald-500/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-900 transition group-hover:text-emerald-600 dark:text-zinc-100">
                    {action.label}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    ↗
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 transition group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
