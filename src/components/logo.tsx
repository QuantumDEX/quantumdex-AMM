"use client";

import Link from "next/link";
import { Atom, ArrowLeftRight } from "lucide-react";

interface LogoProps {
  variant?: "full" | "icon" | "compact";
  className?: string;
  href?: string;
}

export const Logo = ({ variant = "full", className = "", href = "/" }: LogoProps) => {
  const logoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icon */}
      <div className="relative flex items-center justify-center">
        {/* Atom icon with swap arrows overlay */}
        <div className="relative">
          <Atom className="h-6 w-6 text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
          <ArrowLeftRight className="absolute -bottom-1 -right-1 h-3 w-3 text-lilac-600 dark:text-lilac-400" strokeWidth={2.5} />
        </div>
      </div>

      {/* Text */}
      {variant !== "icon" && (
        <span className="text-lg font-bold tracking-tight text-purple-600 transition-colors dark:text-purple-400">
          {variant === "compact" ? "QDEX" : "QuantumDEX"}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

