"use client";

import Link from "next/link";
import { useAccount } from "wagmi";

const feeTiers = [
  { value: "0.01%", description: "Best for stable pairs with minimal volatility." },
  { value: "0.03%", description: "Balanced fee for blue-chip markets." },
  { value: "0.05%", description: "Maximize yield for long-tail assets." },
];

const launchChecklist = [
  "Token contracts verified and decimals confirmed",
  "Sufficient liquidity prepared for both assets",
  "Price oracle monitoring configured",
  "On-chain analytics alerts subscribed",
];

export default function CreatePoolPage() {
  const { isConnected } = useAccount();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-6 py-14">
      <header className="flex flex-col gap-3">
        <Link href="/pools" className="text-sm font-semibold text-emerald-600 hover:text-emerald-500">
          ← Back to Pools
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Create a Liquidity Pool</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Deploy a concentrated liquidity pool with deterministic token ordering and professional-grade defaults.
          </p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <form className="space-y-6 rounded-3xl border border-zinc-200/60 bg-white/80 p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
              Token Pair
            </label>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Token 0</span>
                <input
                  type="text"
                  placeholder="0x... (token address)"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 focus:border-emerald-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Token 1</span>
                <input
                  type="text"
                  placeholder="0x... (token address)"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 focus:border-emerald-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Addresses are sorted automatically to ensure deterministic pool deployments.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
              Initial Price
            </label>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Price Token0 / Token1</span>
                <input
                  type="number"
                  placeholder="e.g. 0.000056"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 focus:border-emerald-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Price Token1 / Token0</span>
                <input
                  type="number"
                  placeholder="Auto calculated"
                  disabled
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950/40"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
              Fee Tier
            </label>
            <div className="mt-3 grid gap-3">
              {feeTiers.map((tier) => (
                <label
                  key={tier.value}
                  className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-950/50"
                >
                  <input type="radio" name="fee-tier" className="mt-1 accent-emerald-500" defaultChecked={tier.value === "0.01%"} />
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{tier.value}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{tier.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
              Minimum Liquidity
            </label>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Token0 Amount</span>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 focus:border-emerald-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Token1 Amount</span>
                <input
                  type="number"
                  placeholder="e.g. 120,000"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 focus:border-emerald-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 disabled:bg-zinc-300 disabled:text-zinc-500"
            disabled={!isConnected}
          >
            {isConnected ? "Deploy Pool" : "Connect Wallet to Deploy"}
          </button>
        </form>

        <aside className="flex flex-col gap-4 rounded-3xl border border-zinc-200/60 bg-white/80 p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Launch Checklist</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ensure the following items are complete prior to submitting on mainnet. Test deployments on a testnet first.
          </p>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            {launchChecklist.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 text-emerald-500">✔</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/70 p-4 text-xs text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
            Need white-glove support? Contact institutional@quantumdex.xyz for deployment guidance and custom liquidity mining.
          </div>
        </aside>
      </section>
    </main>
  );
}

