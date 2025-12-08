"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { AppKitConnectButton } from "@reown/appkit/react";

// Mock tokens for demonstration
const mockTokens = [
  { symbol: "USDC", name: "USD Coin", address: "0x..." },
  { symbol: "DAI", name: "Dai Stablecoin", address: "0x..." },
  { symbol: "WETH", name: "Wrapped Ether", address: "0x..." },
];

// Mock active streams for demonstration
const mockStreams = [
  {
    id: "1",
    recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    token: "USDC",
    paymentPerBlock: "0.1",
    withdrawable: "245.80",
    progress: 65,
    status: "active" as const,
  },
  {
    id: "2",
    recipient: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    token: "DAI",
    paymentPerBlock: "0.05",
    withdrawable: "89.50",
    progress: 35,
    status: "active" as const,
  },
];

export const StreamingInterface = () => {
  const { isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState(mockTokens[0]);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentRate, setPaymentRate] = useState("");

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
          {/* Quick Create Stream Form */}
          <div className="rounded-2xl border border-purple-200/60 bg-white px-4 py-5 dark:border-purple-800/60 dark:bg-zinc-950/50">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Quick Create Stream
            </h3>
            <div className="space-y-3">
              {/* Recipient Address */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Recipient Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full rounded-xl border border-purple-200/60 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-purple-800/60 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                />
              </div>

              {/* Token and Amount */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Token
                  </label>
                  <select
                    className="w-full appearance-none rounded-xl border border-purple-200/60 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-purple-800/60 dark:bg-zinc-900 dark:text-zinc-100"
                    value={selectedToken.symbol}
                    onChange={(e) =>
                      setSelectedToken(mockTokens.find((t) => t.symbol === e.target.value) ?? mockTokens[0])
                    }
                  >
                    {mockTokens.map((token) => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Initial Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-purple-200/60 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-purple-800/60 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Payment Rate */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Payment Per Block
                </label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={paymentRate}
                  onChange={(e) => setPaymentRate(e.target.value)}
                  className="w-full rounded-xl border border-purple-200/60 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-purple-800/60 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                />
              </div>

              {/* Create Button */}
              <Link
                href="/streams/new"
                className="block w-full rounded-xl bg-gradient-to-r from-purple-600 to-lilac-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition hover:from-purple-700 hover:to-lilac-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Create Stream
              </Link>
            </div>
          </div>

          {/* Active Streams List */}
          <div className="rounded-2xl border border-purple-200/60 bg-white px-4 py-5 dark:border-purple-800/60 dark:bg-zinc-950/50">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Active Streams</h3>
              <Link
                href="/streams"
                className="text-sm font-semibold text-purple-600 transition hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                View All →
              </Link>
            </div>

            {mockStreams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-purple-200/60 bg-purple-50/30 p-8 text-center dark:border-purple-800/60 dark:bg-purple-950/10">
                <div className="mb-2 text-2xl">💧</div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">No active streams yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mockStreams.map((stream) => (
                  <div
                    key={stream.id}
                    className="rounded-xl border border-purple-200/60 bg-gradient-to-br from-purple-50/50 to-lilac-50/50 p-4 dark:border-purple-800/60 dark:from-purple-950/30 dark:to-lilac-950/30"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            Stream #{stream.id}
                          </span>
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {stream.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          To: {stream.recipient.slice(0, 6)}...{stream.recipient.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                          {stream.withdrawable} {stream.token}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Withdrawable</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="mb-1 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                        <span>{stream.paymentPerBlock} {stream.token}/block</span>
                        <span>{stream.progress}% complete</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-lilac-600"
                          style={{ width: `${stream.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <button className="flex-1 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-700">
                        Withdraw
                      </button>
                      <button className="flex-1 rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-600 transition hover:bg-purple-50 dark:border-purple-800 dark:bg-zinc-900 dark:text-purple-400 dark:hover:bg-purple-950/50">
                        Refuel
                      </button>
                      <Link
                        href={`/streams/${stream.id}`}
                        className="flex-1 rounded-lg border border-purple-200 bg-white px-3 py-2 text-center text-xs font-semibold text-purple-600 transition hover:bg-purple-50 dark:border-purple-800 dark:bg-zinc-900 dark:text-purple-400 dark:hover:bg-purple-950/50"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="rounded-2xl border border-purple-200/60 bg-purple-50/50 p-5 dark:border-purple-800/60 dark:bg-purple-950/20">
            <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
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
        </div>
      )}
    </div>
  );
};

