"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useChainId, usePublicClient } from "wagmi";

import { networks } from "@/config/wagmi";
import { getAllPools, getPool, AMM_CONTRACT_ADDRESS, type PoolCreatedEvent, type PoolInfo } from "@/lib/amm";
import { publicClientToProvider } from "@/config/adapter";
import { shortenAddress } from "@/lib/utils";

type Pool = {
  id: string;
  pair: string;
  network: number;
  tvl: string;
  apr: string;
  volume24h: string;
  feeTier: string;
  utilization: string;
  poolInfo?: PoolInfo;
};

export default function PoolsPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [networkFilter, setNetworkFilter] = useState<number | "all">(
    () => chainId ?? "all",
  );
  const [feeFilter, setFeeFilter] = useState<Pool["feeTier"] | "all">("all");
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pools from contract
  useEffect(() => {
    const fetchPools = async () => {
      if (!publicClient || !AMM_CONTRACT_ADDRESS) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const provider = publicClientToProvider(publicClient);
        if (!provider) {
          setError("Provider not available");
          setLoading(false);
          return;
        }

        // Get all pools from events
        const poolEvents = await getAllPools(AMM_CONTRACT_ADDRESS, provider);
        
        // Fetch detailed pool info for each
        const poolsWithInfo = await Promise.all(
          poolEvents.map(async (event: PoolCreatedEvent) => {
            const poolInfo = await getPool(event.poolId, AMM_CONTRACT_ADDRESS, provider);
            
            // Format TVL (simplified - in production, you'd fetch token prices)
            const reserve0Formatted = poolInfo 
              ? (Number(poolInfo.reserve0) / 1e18).toFixed(2)
              : "0";
            const reserve1Formatted = poolInfo
              ? (Number(poolInfo.reserve1) / 1e18).toFixed(2)
              : "0";
            
            const feeTier = `${(event.feeBps / 100).toFixed(2)}%`;
            
            return {
              id: event.poolId,
              pair: `${shortenAddress(event.token0, 4)} / ${shortenAddress(event.token1, 4)}`,
              network: chainId || 1,
              tvl: `$${reserve0Formatted}M`, // Simplified
              apr: "—", // Would need to calculate from fees
              volume24h: "—", // Would need to track from swap events
              feeTier,
              utilization: "—", // Would need to calculate
              poolInfo,
            };
          })
        );

        setPools(poolsWithInfo);
      } catch (err) {
        console.error("Error fetching pools:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch pools");
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, [publicClient, chainId]);

  const filteredPools = useMemo(() => {
    return pools.filter((pool) => {
      const networkMatches =
        networkFilter === "all" ||
        pool.network === networkFilter;
      const feeMatches = feeFilter === "all" || pool.feeTier === feeFilter;
      return networkMatches && feeMatches;
    });
  }, [feeFilter, networkFilter, pools]);

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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Loading pools...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-rose-500">
                    Error: {error}
                  </td>
                </tr>
              ) : filteredPools.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No pools found. Create your first pool to get started!
                  </td>
                </tr>
              ) : (
                filteredPools.map((pool) => {
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
                        <Link
                          href={`/pools/${encodeURIComponent(pool.id)}`}
                          className="inline-block rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:border-emerald-400 hover:text-emerald-500 dark:border-zinc-700 dark:text-zinc-300"
                        >
                          View Pool
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

