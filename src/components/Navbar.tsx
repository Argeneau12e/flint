"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReputationBadge, { getTierFromPoints } from "./account/ReputationBadge";

interface NavbarProps {
  userWallet?: string;
  tier?: "FREE" | "PRO" | "BUSINESS";
  usage?: {
    volumeUsd: number;
    limitUsd: number;
    invoicesCreated: number;
    invoicesLimit: number;
  };
}

export default function Navbar({ userWallet, tier = "FREE", usage }: NavbarProps) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(!!userWallet);

  useEffect(() => {
    setIsConnected(!!userWallet);
  }, [userWallet]);

  const getTierColor = (t: string) => {
    switch (t) {
      case "BUSINESS":
        return "#FFD700";
      case "PRO":
        return "#4A90D9";
      default:
        return "#888888";
    }
  };

  const getTierLimit = (t: string) => {
    switch (t) {
      case "BUSINESS":
        return "$50,000/mo";
      case "PRO":
        return "$10,000/mo";
      default:
        return "$1,000/mo";
    }
  };

  const connectWallet = async () => {
    const provider = (window as any).solana;
    if (!provider) {
      alert("Please install Phantom wallet");
      return;
    }
    try {
      const response = await provider.connect();
      const wallet = response.publicKey.toString();
      setIsConnected(true);
      // In real app, would update context/parent state
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  const tierColor = getTierColor(tier);
  const tierLimit = getTierLimit(tier);

  return (
    <nav
      className="sticky top-0 z-40 backdrop-blur-md border-b"
      style={{
        background: "rgba(15,15,15,0.8)",
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg"
              style={{ background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)" }}
            >
              F
            </div>
            <span className="text-xl font-bold" style={{ color: "#fff" }}>
              Flint
            </span>
          </div>

          {/* Center - Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => router.push("/create")}
              className="text-sm font-medium transition-colors"
              style={{ color: "#888" }}
            >
              Create Invoice
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm font-medium transition-colors"
              style={{ color: "#888" }}
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push("/pricing")}
              className="text-sm font-medium transition-colors"
              style={{ color: "#888" }}
            >
              Pricing
            </button>
          </div>

          {/* Right - Wallet & Tier */}
          <div className="flex items-center gap-4">
            {/* Usage Indicator (if available) */}
            {usage && (
              <div className="hidden lg:flex items-center gap-2 text-xs" style={{ color: "#888" }}>
                <span>${usage.volumeUsd.toLocaleString()} / {tierLimit}</span>
              </div>
            )}

            {/* Tier Badge */}
            <div
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: `${tierColor}22`,
                color: tierColor,
                border: `1px solid ${tierColor}44`,
              }}
            >
              {tier}
            </div>

            {/* Wallet Connect */}
            {isConnected ? (
              <div
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(74,222,128,0.1)",
                  color: "#4ade80",
                  border: "1px solid rgba(74,222,128,0.3)",
                }}
              >
                {userWallet?.slice(0, 4)}...{userWallet?.slice(-4)}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
                  color: "#000",
                }}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Usage Bar (if available) */}
        {usage && (
          <div className="pb-3">
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: "#888" }}>
              <span>Monthly Usage</span>
              <span className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((usage.volumeUsd / usage.limitUsd) * 100, 100)}%`,
                    background: usage.volumeUsd / usage.limitUsd > 0.8
                      ? "linear-gradient(135deg, #ffb800 0%, #ff8800 100%)"
                      : "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
                  }}
                />
              </span>
              <span>{Math.round((usage.volumeUsd / usage.limitUsd) * 100)}%</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
