"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppKitAccountButton,
  AppKitButton,
  AppKitNetworkButton,
} from "@reown/appkit/react";
import { useAccount, useChainId, useDisconnect } from "wagmi";

import { shortenAddress } from "@/lib/utils";
import { networks } from "@/config/wagmi";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/swap", label: "Swap" },
  { href: "/pools", label: "Pools" },
  { href: "/portfolio", label: "Portfolio" },
];

export const Navbar = () => {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const displayAddress = useMemo(() => {
    if (!address) return null;
    return shortenAddress(address);
  }, [address]);

  const displayNetwork = useMemo(() => {
    if (!chainId) return "Unknown";
    const network = networks.find((item) => item.id === chainId);
    return network?.name ?? `Chain ${chainId}`;
  }, [chainId]);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/75 backdrop-blur-md transition dark:border-zinc-800/60 dark:bg-black/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900 transition hover:text-emerald-500 dark:text-zinc-50">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30">
              QD
            </span>
            QuantumDEX
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && displayAddress ? (
            <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 lg:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_theme(colors.emerald.400)]" />
                {displayAddress}
              </span>
              <span className="text-zinc-400">|</span>
              <span>{displayNetwork}</span>
            </div>
          ) : null}
          <AppKitNetworkButton size="md" />
          {isConnected ? (
            <>
              <AppKitAccountButton size="md" />
              <button
                onClick={() => disconnect()}
                className="hidden rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-emerald-400 dark:hover:text-emerald-300 md:inline-flex"
              >
                Disconnect
              </button>
            </>
          ) : (
            <AppKitButton label="Connect" size="md" />
          )}
        </div>
      </div>
    </header>
  );
};

