"use client";

import { useEffect } from "react";
import { usePublicClient, useWalletClient } from "wagmi";

import { publicClientToProvider, walletClientToSigner } from "@/config/adapter";
import { Hero } from "@/components/hero";
import { FeatureTabs } from "@/components/feature-tabs";
import { DexInterface } from "@/components/dex-interface";
import { StreamingInterface } from "@/components/streaming-interface";
import { Footer } from "@/components/footer";

export default function Home() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (!walletClient) return;
    const logSigner = async () => {
      const signer = await walletClientToSigner(walletClient);
      if (process.env.NODE_ENV === "development") {
        console.log("🔑 Ethers signer ready:", signer);
      }
    };
    logSigner();
  }, [walletClient]);

  useEffect(() => {
    if (!publicClient || process.env.NODE_ENV !== "development") return;
    const provider = publicClientToProvider(publicClient);
    console.log("📡 Read provider ready:", provider);
  }, [publicClient]);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <Hero />
      </section>

      {/* Feature Tabs Section */}
      <section className="mx-auto w-full max-w-6xl px-6 py-8">
        <FeatureTabs
          dexContent={<DexInterface />}
          streamingContent={<StreamingInterface />}
        />
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
