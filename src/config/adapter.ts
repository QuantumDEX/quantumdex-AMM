import { BrowserProvider, JsonRpcSigner } from "ethers";
import type { Address, PublicClient, WalletClient } from "viem";
import { wagmiAdapter, wagmiConfig, networks, projectId } from "./wagmi";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
};

export const metadata = {
  name: "QuantumDEX",
  description: "QuantumDEX — connect and trade across EVM networks.",
  url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  icons: ["https://avatars.githubusercontent.com/u/37784886?s=200&v=4"],
};

export const appKitOptions = {
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    swaps: false,
    send: false,
    analytics: false,
  },
  themeMode: "dark" as const,
};

const wrapWalletClient = (walletClient: WalletClient): Eip1193Provider => ({
  request: async ({ method, params }) =>
    walletClient.request({
      method,
      params,
    } as never),
});

export const walletClientToSigner = async (
  walletClient: WalletClient | null | undefined,
): Promise<JsonRpcSigner | null> => {
  if (!walletClient) return null;
  const provider = new BrowserProvider(
    wrapWalletClient(walletClient) as never,
    walletClient.chain?.id ?? 1,
  );
  return provider.getSigner(walletClient.account.address as Address);
};

const wrapPublicClient = (publicClient: PublicClient): Eip1193Provider => ({
  request: async ({ method, params }) =>
    publicClient.request({
      method,
      params,
    } as never),
});

export const publicClientToProvider = (publicClient: PublicClient | null) => {
  if (!publicClient) return null;
  return new BrowserProvider(
    wrapPublicClient(publicClient) as never,
    publicClient.chain?.id ?? 1,
  );
};

export { wagmiConfig };

