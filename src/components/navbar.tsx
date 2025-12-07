"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppKitButton,
} from "@reown/appkit/react";
import { useAccount, useChainId, useDisconnect } from "wagmi";

import { shortenAddress } from "@/lib/utils";
import { networks } from "@/config/wagmi";
import { Logo } from "@/components/logo";

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

  const networkInfo = useMemo(() => {
    if (!chainId) return null;
    const network = networks.find((item) => item.id === chainId);
    return network ? { name: network.name } : { name: `Chain ${chainId}` };
  }, [chainId]);

  return (
    <header className="sticky top-0 z-50 border-b border-purple-200/70 bg-white/75 backdrop-blur-md transition dark:border-purple-800/60 dark:bg-black/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Logo variant="full" />

        <nav className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  isActive
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-purple-50 hover:text-purple-600 dark:text-zinc-300 dark:hover:bg-purple-950/50 dark:hover:text-purple-400"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {isConnected && displayAddress && networkInfo ? (
            <>
              <div className="hidden items-center gap-2 rounded-full border border-purple-200/60 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm dark:border-purple-800/60 dark:bg-zinc-900 dark:text-zinc-200 lg:flex">
                <span>{displayAddress}</span>
                <span className="text-zinc-400">|</span>
                <span>{networkInfo.name}</span>
              </div>
              <button
                onClick={() => disconnect()}
                className="rounded-full border border-purple-200/60 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-purple-500 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:border-purple-800/60 dark:text-zinc-100 dark:hover:border-purple-400 dark:hover:text-purple-400"
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

