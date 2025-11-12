"use client";

import { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { AppKitProvider } from "@reown/appkit/react";
import { wagmiConfig } from "@/config/wagmi";
import { appKitOptions } from "@/config/adapter";

const queryClient = new QueryClient();

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppKitProvider {...appKitOptions}>
          {children}
        </AppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

