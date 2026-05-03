"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";

interface Stats {
  invoices: { total: number; paid: number };
  successRate: number;
  volume: { total: number };
}

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const hasVisited = localStorage.getItem("flint_visited");
    if (!hasVisited) {
      localStorage.setItem("flint_visited", "true");
      router.push("/landing");
    }
  }, []);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Background orbs */}
      <div style={{
        position: "fixed", top: "-20%", left: "-10%",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,107,43,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", right: "-10%",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(26,26,46,0.8) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "680px" }}>

        {/* Logo */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <Logo size={56} />
          <div className="text-center mt-2">
            <p className="text-lg" style={{ color: "#aaaaaa" }}>
              The open payment request protocol for Solana.
            </p>
            <p className="text-sm mt-1" style={{ color: "#666666" }}>
              Human-shareable. Agent-executable.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <button
            onClick={() => router.push("/create")}
            className="px-8 py-4 rounded-2xl text-white font-medium text-lg transition-smooth hover:opacity-90 active:scale-95 focus-ring"
            style={{ background: "var(--spark)", minWidth: "260px" }}
          >
            Create Payment Request
          </button>
          <p className="text-sm" style={{ color: "#666666" }}>
            No wallet setup required for the payer
          </p>
          <div className="flex gap-2 flex-wrap justify-center mt-2">
            {[
              { label: "Dashboard", path: "/dashboard", style: { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#aaaaaa" } },
              { label: "AI Agent", path: "/agent", style: { background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.3)", color: "#FF6B2B" } },
              { label: "Embed", path: "/embed-demo", style: { background: "rgba(136,136,255,0.1)", border: "1px solid rgba(136,136,255,0.3)", color: "#8888ff" } },
              { label: "Analytics", path: "/analytics", style: { background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" } },
              { label: "Spec", path: "/spec", style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#666666" } },
              { label: "Business", path: "/business", style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#666666" } },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => router.push(btn.path)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-smooth hover:opacity-80 focus-ring"
                style={btn.style}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live stats */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium tracking-widest uppercase"
              style={{ color: "#666666" }}>
              Live Protocol Stats
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
              <p className="text-xs" style={{ color: "#4ade80" }}>Solana Devnet</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Invoices Created", value: stats ? String(stats.invoices.total) : "—" },
              { label: "Successfully Paid", value: stats ? String(stats.invoices.paid) : "—" },
              { label: "Success Rate", value: stats ? `${stats.successRate}%` : "—" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-medium mb-1" style={{ color: "var(--spark)" }}>
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: "#666666" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { icon: "→", title: "Solana Actions + Blinks", desc: "Payment links work in any Blink-aware wallet" },
            { icon: "◈", title: "AI Agent Executable", desc: "Autonomous agents read and pay via JSON-LD" },
            { icon: "◻", title: "Escrow + Conditions", desc: "Enforceable conditions with PDA escrow" },
            { icon: "✓", title: "On-chain Receipts", desc: "Every payment is publicly verifiable forever" },
            { icon: "⬡", title: "x402 Compatible", desc: "Standard agentic payment response layer" },
            { icon: "≡", title: "UBL 2.1 Export", desc: "B2B/PEPPOL-grade invoice compliance" },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-4 transition-smooth hover:opacity-80">
              <p className="text-lg font-medium mb-2" style={{ color: "var(--spark)" }}>{f.icon}</p>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--chalk)" }}>{f.title}</p>
              <p className="text-xs" style={{ color: "#666666" }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer stats */}
        <div className="flex gap-12 justify-center pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { value: "< 1s", label: "Settlement time" },
            { value: "FRS-1", label: "Open standard" },
            { value: "MIT", label: "License" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-medium mb-1" style={{ color: "var(--spark)" }}>
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: "#666666" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-between mt-8 pt-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-xs" style={{ color: "#333333" }}>
            Flint · FRS-1 · MIT License
          </p>
          <div className="flex gap-4">
            {[
              { label: "Spec", path: "/spec" },
              { label: "Business", path: "/business" },
              { label: "Analytics", path: "/analytics" },
              { label: "GitHub", path: "https://github.com/Argeneau12e/flint" },
            ].map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  if (link.path.startsWith("http")) {
                    window.open(link.path, "_blank");
                  } else {
                    router.push(link.path);
                  }
                }}
                className="text-xs transition-smooth hover:opacity-70"
                style={{ color: "#444444", background: "none", border: "none", cursor: "pointer" }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}