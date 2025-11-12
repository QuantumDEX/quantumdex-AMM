import { cookieStorage, createStorage } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
} from "@reown/appkit/networks";

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_REOWN_PROJECT_ID is required to initialize AppKit");
}

export const networks = [mainnet, arbitrum, optimism, base, polygon];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

