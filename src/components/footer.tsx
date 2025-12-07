"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";

const footerLinks = {
  product: [
    { href: "/swap", label: "Swap" },
    { href: "/pools", label: "Pools" },
    { href: "/portfolio", label: "Portfolio" },
  ],
  resources: [
    { href: "#", label: "Documentation" },
    { href: "#", label: "GitHub" },
    { href: "#", label: "Blog" },
  ],
  social: [
    { href: "#", label: "Twitter", icon: "𝕏" },
    { href: "#", label: "Discord", icon: "💬" },
    { href: "#", label: "Telegram", icon: "✈️" },
  ],
};

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-purple-200/60 bg-white/80 backdrop-blur-sm dark:border-purple-800/60 dark:bg-zinc-950/80">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Logo variant="full" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Decentralized exchange and token streaming platform built for the future of DeFi.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Product
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-600 transition hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Resources
            </h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-600 transition hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Connect
            </h3>
            <ul className="space-y-2">
              {footerLinks.social.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-zinc-600 transition hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400"
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-purple-200/60 pt-8 dark:border-purple-800/60">
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            © {currentYear} QuantumDEX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

