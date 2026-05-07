"use client";

import { useEffect, useState } from "react";
import Navbar from "./Navbar";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const [userWallet, setUserWallet] = useState<string | undefined>();
  const [tier, setTier] = useState<"FREE" | "PRO" | "BUSINESS">("FREE");
  const [usage, setUsage] = useState<{
    volumeUsd: number;
    limitUsd: number;
    invoicesCreated: number;
    invoicesLimit: number;
  } | null>(null);

  useEffect(() => {
    // Check for connected wallet
    const checkWallet = async () => {
      const provider = (window as any).solana;
      if (provider?.isPhantom) {
        try {
          const response = await provider.connect({ onlyIfTrusted: true });
          if (response?.publicKey) {
            const wallet = response.publicKey.toString();
            setUserWallet(wallet);
            // In production, would fetch tier and usage from API
            setUsage({
              volumeUsd: 0,
              limitUsd: 1000,
              invoicesCreated: 0,
              invoicesLimit: 10,
            });
          }
        } catch (err) {
          // User not connected or denied
          console.log("Wallet not connected");
        }
      }
    };

    checkWallet();
  }, []);

  return (
    <>
      <Navbar
        userWallet={userWallet}
        tier={tier}
        usage={usage || undefined}
      />
      <main className="flex-1">
        {children}
      </main>
    </>
  );
}
