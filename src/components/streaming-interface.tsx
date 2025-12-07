"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { AppKitConnectButton } from "@reown/appkit/react";

export const StreamingInterface = () => {
  const { isConnected } = useAccount();

  return (
    <div className="rounded-3xl border border-purple-200/60 bg-white/80 p-6 shadow-lg dark:border-purple-800/60 dark:bg-zinc-900/70 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Token Streaming</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Create continuous payment streams between parties
          </p>
        </div>
        <Link
          href="/streams"
          className="rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-600 transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-400 dark:hover:bg-purple-900/50"
        >
          Full Interface →
        </Link>
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-200/60 bg-purple-50/50 p-12 dark:border-purple-800/60 dark:bg-purple-950/20">
          <div className="mb-4 text-4xl">💧</div>
          <p className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Connect your wallet to start streaming
          </p>
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Create payment streams, withdraw tokens, and manage your streams
          </p>
          <AppKitConnectButton label="Connect Wallet" size="md" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Feature Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50 to-lilac-50 p-6 dark:border-purple-800/60 dark:from-purple-950/50 dark:to-lilac-950/50">
              <div className="mb-3 text-2xl">📤</div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Create Stream</h3>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Set up a continuous payment stream with flexible parameters
              </p>
              <Link
                href="/streams/new"
                className="inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Create →
              </Link>
            </div>

            <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50 to-lilac-50 p-6 dark:border-purple-800/60 dark:from-purple-950/50 dark:to-lilac-950/50">
              <div className="mb-3 text-2xl">📥</div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Withdraw</h3>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Withdraw accumulated tokens from your active streams
              </p>
              <Link
                href="/streams"
                className="inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                View Streams →
              </Link>
            </div>
          </div>

          {/* Info Section */}
          <div className="rounded-2xl border border-purple-200/60 bg-purple-50/50 p-6 dark:border-purple-800/60 dark:bg-purple-950/20">
            <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              How Token Streaming Works
            </h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-purple-600 dark:text-purple-400">•</span>
                <span>Create a stream with recipient, token, and payment rate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-purple-600 dark:text-purple-400">•</span>
                <span>Tokens are distributed continuously over time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-purple-600 dark:text-purple-400">•</span>
                <span>Recipients can withdraw accumulated tokens at any time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-purple-600 dark:text-purple-400">•</span>
                <span>Stream parameters can be updated with dual-party consent</span>
              </li>
            </ul>
          </div>

          {/* Coming Soon Notice */}
          <div className="rounded-xl border border-purple-200/60 bg-white p-4 text-center dark:border-purple-800/60 dark:bg-zinc-950/50">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-purple-600 dark:text-purple-400">Note:</span> Full streaming interface coming soon. 
              Check back for updates!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

