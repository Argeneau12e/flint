"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">

      <div className="flex flex-col items-center gap-6 mb-12">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <polygon
            points="32,6 54,18 54,46 32,58 10,46 10,18"
            stroke="white"
            strokeWidth="2.5"
            fill="none"
          />
          <polyline
            points="48,8 60,8 60,20"
            stroke="#FF6B2B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="24" y="24" width="6" height="20" rx="2" fill="white" />
          <rect x="30" y="24" width="14" height="6" rx="2" fill="white" />
          <rect x="30" y="34" width="10" height="5" rx="2" fill="white" />
        </svg>

        <div className="text-center">
          <h1
            className="text-5xl font-medium tracking-widest mb-3"
            style={{ color: "var(--chalk)" }}
          >
            FLINT
          </h1>
          <p className="text-lg" style={{ color: "#888888" }}>
            Programmable payment requests on Solana
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => router.push("/create")}
          className="px-8 py-4 rounded-xl text-white font-medium text-lg transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{ background: "var(--spark)" }}
        >
          Create Payment Request
        </button>
        <p className="text-sm" style={{ color: "#555555" }}>
          No wallet setup required for the payer
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#888888" }}
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push("/agent")}
            className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "#1a1a0a", border: "1px solid #FF6B2B", color: "#FF6B2B" }}
          >
            AI Agent Demo
          </button>
          <button
            onClick={() => router.push("/embed-demo")}
            className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "#1a1a2e", border: "1px solid #8888ff", color: "#8888ff" }}
          >
            Embed Button
          </button>
        </div>
      </div>

      <div
        className="flex gap-12 mt-16 pt-8"
        style={{ borderTop: "1px solid #1a1a1a" }}
      >
        <div className="text-center">
          <p className="text-2xl font-medium mb-1" style={{ color: "#FF6B2B" }}>
            {"< 1s"}
          </p>
          <p className="text-xs" style={{ color: "#555555" }}>
            Settlement time
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-medium mb-1" style={{ color: "#FF6B2B" }}>
            $0.00025
          </p>
          <p className="text-xs" style={{ color: "#555555" }}>
            Per transaction
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-medium mb-1" style={{ color: "#FF6B2B" }}>
            100%
          </p>
          <p className="text-xs" style={{ color: "#555555" }}>
            On-chain receipts
          </p>
        </div>
      </div>

    </main>
  );
}