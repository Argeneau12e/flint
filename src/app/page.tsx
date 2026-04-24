"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Stats {
  invoices: { total: number; paid: number };
  successRate: number;
  volume: { total: number };
}

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">

      <div className="flex flex-col items-center gap-6 mb-12">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <polygon points="32,6 54,18 54,46 32,58 10,46 10,18"
            stroke="white" strokeWidth="2.5" fill="none" />
          <polyline points="48,8 60,8 60,20"
            stroke="#FF6B2B" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="24" y="24" width="6" height="20" rx="2" fill="white" />
          <rect x="30" y="24" width="14" height="6" rx="2" fill="white" />
          <rect x="30" y="34" width="10" height="5" rx="2" fill="white" />
        </svg>

        <div className="text-center">
          <h1 className="text-5xl font-medium tracking-widest mb-3"
            style={{ color: "var(--chalk)" }}>
            FLINT
          </h1>
          <p className="text-lg" style={{ color: "#888888" }}>
            The open payment request protocol for Solana.
          </p>
          <p className="text-sm mt-1" style={{ color: "#555555" }}>
            Human-shareable. Agent-executable.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 mb-16">
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
        <div className="flex gap-3 flex-wrap justify-center">
          <button onClick={() => router.push("/dashboard")}
            className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#888888" }}>
            Dashboard
          </button>
          <button onClick={() => router.push("/agent")}
            className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "#1a1a0a", border: "1px solid #FF6B2B", color: "#FF6B2B" }}>
            AI Agent Demo
          </button>
          <button onClick={() => router.push("/embed-demo")}
            className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "#1a1a2e", border: "1px solid #8888ff", color: "#8888ff" }}>
            Embed Button
          </button>
          <button onClick={() => router.push("/analytics")}
            className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "#0a1a1a", border: "1px solid #4ade80", color: "#4ade80" }}>
            Analytics
          </button>
          <button onClick={() => router.push("/spec")}
            className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#555555" }}>
            Protocol Spec
          </button>
          <button onClick={() => router.push("/business")}
            className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#555555" }}>
            Business Model
          </button>
        </div>
      </div>

      {/* Live protocol stats */}
      <div
        className="w-full max-w-2xl rounded-2xl p-6 mb-8"
        style={{ background: "#111111", border: "1px solid #1f1f1f" }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium tracking-widest uppercase"
            style={{ color: "#555555" }}>
            Live Protocol Stats
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
            <p className="text-xs" style={{ color: "#4ade80" }}>Solana Devnet</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Invoices Created",
              value: stats ? String(stats.invoices.total) : "—",
            },
            {
              label: "Successfully Paid",
              value: stats ? String(stats.invoices.paid) : "—",
            },
            {
              label: "Success Rate",
              value: stats ? `${stats.successRate}%` : "—",
            },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-medium mb-1"
                style={{ color: "var(--spark)" }}>
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: "#555555" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Protocol features */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-3 mb-8">
        {[
          { icon: "→", title: "Solana Actions + Blinks", desc: "Payment links work in any Blink-aware wallet" },
          { icon: "◈", title: "AI Agent Executable", desc: "Autonomous agents read and pay invoices via JSON-LD" },
          { icon: "◻", title: "Escrow + Conditions", desc: "Enforceable conditions with PDA escrow" },
          { icon: "✓", title: "On-chain Receipts", desc: "Every payment is publicly verifiable forever" },
          { icon: "⬡", title: "x402 Compatible", desc: "Standard agentic payment response layer" },
          { icon: "≡", title: "UBL 2.1 Export", desc: "B2B/PEPPOL-grade invoice compliance" },
        ].map((f) => (
          <div key={f.title}
            className="rounded-xl p-4"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          >
            <p className="text-lg font-medium mb-2" style={{ color: "var(--spark)" }}>{f.icon}</p>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--chalk)" }}>
              {f.title}
            </p>
            <p className="text-xs" style={{ color: "#555555" }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Bottom stats */}
      <div
        className="flex gap-12"
        style={{ borderTop: "1px solid #1a1a1a", paddingTop: "2rem" }}
      >
        {[
          { value: "< 1s", label: "Settlement time" },
          { value: "FRS-1", label: "Open standard" },
          { value: "MIT", label: "License" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-2xl font-medium mb-1"
              style={{ color: "var(--spark)" }}>
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: "#555555" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

    </main>
  );
}