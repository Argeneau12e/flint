"use client";

import { useRouter } from "next/navigation";

export default function BusinessPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen px-6 py-16 max-w-3xl mx-auto">

      <div className="mb-16">
        <button onClick={() => router.push("/")}
          style={{ color: "var(--spark)", fontSize: "14px", background: "none", border: "none", cursor: "pointer" }}>
          Back to Flint
        </button>
        <div className="flex items-center gap-3 mt-6 mb-4">
          <div className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: "#1a1a0a", color: "#FF6B2B", border: "1px solid #FF6B2B" }}>
            BUSINESS MODEL
          </div>
        </div>
        <h1 className="text-4xl font-medium tracking-wide mb-4"
          style={{ color: "var(--chalk)" }}>
          How Flint Captures Value
        </h1>
        <p className="text-lg" style={{ color: "#888888" }}>
          Protocol infrastructure with a clear monetization path.
        </p>
      </div>

      {/* Problem */}
      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>The Problem We Solve</h2>
        <div className="rounded-2xl p-6" style={{ background: "#111111", border: "1px solid #1f1f1f" }}>
          <p style={{ color: "#aaaaaa", lineHeight: "1.8" }}>
            Solana settles value in under a second. But real commerce needs more than raw transfers.
            Merchants, freelancers, and autonomous agents need structured requests — with fixed amounts,
            expiry dates, conditions, and verifiable receipts. Today teams stitch this together manually.
            Flint standardizes it.
          </p>
        </div>
      </section>

      {/* ICP */}
      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>Ideal Customer Profile</h2>
        <div className="grid grid-cols-1 gap-4">
          {[
            {
              tier: "Primary",
              title: "Crypto-native service businesses",
              desc: "Freelancers, agencies, and consultants who invoice in crypto. They need programmable invoice requests and verifiable settlement without building custom backends.",
              color: "var(--spark)",
            },
            {
              tier: "Secondary",
              title: "Solana developers and dApps",
              desc: "Developers who want to embed payment request functionality into their apps via the Flint API or embed.js script without building invoice infrastructure from scratch.",
              color: "#4ade80",
            },
            {
              tier: "Emerging",
              title: "AI agent operators",
              desc: "Teams deploying autonomous agents that need to make and receive structured payments on Solana. Flint's JSON-LD schema and x402 layer give agents a deterministic execution path.",
              color: "#8888ff",
            },
          ].map((icp) => (
            <div key={icp.tier} className="rounded-2xl p-6"
              style={{ background: "#111111", border: "1px solid #1f1f1f" }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: `${icp.color}22`, color: icp.color, border: `1px solid ${icp.color}44` }}>
                  {icp.tier}
                </span>
                <p className="text-sm font-medium" style={{ color: "var(--chalk)" }}>{icp.title}</p>
              </div>
              <p className="text-sm" style={{ color: "#888888", lineHeight: "1.7" }}>{icp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Monetization */}
      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>Monetization Model</h2>
        <div className="flex flex-col gap-4">
          {[
            {
              phase: "Phase 1 — Protocol Fee",
              desc: "0.1-0.5% fee on each settled invoice. Collected on-chain at settlement. Free tier: unlimited invoice creation. Fee only on successful payment.",
              status: "Primary wedge",
              color: "var(--spark)",
            },
            {
              phase: "Phase 2 — Developer API",
              desc: "Premium API tier for high-volume developers. Webhooks, advanced analytics, custom handle namespaces, priority webhook delivery, and SLA guarantees.",
              status: "Expansion",
              color: "#4ade80",
            },
            {
              phase: "Phase 3 — Enterprise",
              desc: "White-label protocol deployment for businesses. Custom branding, private invoice namespaces, compliance exports, Squads multisig approval flows, and dedicated support.",
              status: "Scale",
              color: "#8888ff",
            },
            {
              phase: "Phase 4 — Agent Infrastructure",
              desc: "Agent policy management, spend cap enforcement, allowlist registry, and autonomous payment execution as a managed service for AI agent operators.",
              status: "Future",
              color: "#FFB800",
            },
          ].map((m) => (
            <div key={m.phase} className="rounded-2xl p-6"
              style={{ background: "#111111", border: "1px solid #1f1f1f" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium" style={{ color: "var(--chalk)" }}>{m.phase}</p>
                <span className="text-xs px-3 py-1 rounded-full"
                  style={{ background: `${m.color}22`, color: m.color, border: `1px solid ${m.color}44` }}>
                  {m.status}
                </span>
              </div>
              <p className="text-sm" style={{ color: "#888888", lineHeight: "1.7" }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TAM */}
      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>Market Size</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "$10T+", label: "Global B2B invoicing market" },
            { value: "$150B+", label: "Crypto payments volume 2025" },
            { value: "$50B+", label: "Projected agentic payments 2027" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-5 text-center"
              style={{ background: "#111111", border: "1px solid #1f1f1f" }}>
              <p className="text-2xl font-medium mb-2" style={{ color: "var(--spark)" }}>{stat.value}</p>
              <p className="text-xs" style={{ color: "#555555" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Competitive moat */}
      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>Competitive Moat</h2>
        <div className="flex flex-col gap-3">
          {[
            "FRS-1 is an open standard — network effects compound as more wallets and agents implement it",
            "Flint.ID handles create identity lock-in — users keep their payment handle",
            "Audit logs and receipts create switching costs for businesses",
            "First-mover advantage in the agentic payments space on Solana",
            "Protocol positioning means Flint benefits from every payment on the network",
          ].map((point, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}>
              <span className="text-xs font-medium flex-shrink-0 mt-0.5"
                style={{ color: "var(--spark)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm" style={{ color: "#aaaaaa" }}>{point}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why now */}
      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>Why Now</h2>
        <div className="rounded-2xl p-6" style={{ background: "#111111", border: "1px solid #1f1f1f" }}>
          <p style={{ color: "#aaaaaa", lineHeight: "1.8" }}>
            The Solana Foundation declared agentic payments their strategic priority in 2026.
            AI agents need structured, machine-readable payment instructions and verifiable
            execution traces. Solana provides fast settlement. Flint adds the request, policy,
            and verification layer needed for real production commerce. The infrastructure
            moment is now.
          </p>
        </div>
      </section>

      <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "2rem" }}>
        <div className="flex gap-3">
          <button onClick={() => router.push("/spec")}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#888888" }}>
            Protocol Spec
          </button>
          <button onClick={() => router.push("/create")}
            className="px-6 py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "var(--spark)" }}>
            Try Flint
          </button>
        </div>
      </div>

    </main>
  );
}