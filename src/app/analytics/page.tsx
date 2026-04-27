"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Analytics {
  invoices: { total: number; paid: number; pending: number; expired: number };
  volume: { total: number; sol: number; usdc: number };
  successRate: number;
  features: { withHandles: number; withConditions: number; withSplits: number; withRecurring: number };
  recentPaid: Array<{ title: string; amount: number; token: string; paidAt: number }>;
  protocol: string;
  network: string;
  lastUpdated: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const formatNum = (n: number) => n.toLocaleString("en-US");

  const fetchAnalytics = () => {
    setLoading(true);
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const statCard = (label: string, value: string | number, sub?: string, color?: string) => (
    <div className="glass-card rounded-xl p-5">
      <p className="text-xs mb-2" style={{ color: "#555555" }}>{label}</p>
      <p className="text-2xl font-medium" style={{ color: color || "var(--spark)" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "#444444" }}>{sub}</p>}
    </div>
  );

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto">

        <div className="mb-10">
          <button
            onClick={() => router.push("/")}
            className="text-sm mb-4 block"
            style={{ color: "var(--spark)", background: "none", border: "none", cursor: "pointer" }}
          >
            Back to Flint
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-medium tracking-wide mb-1" style={{ color: "var(--chalk)" }}>
                Protocol Analytics
              </h1>
              <p className="text-sm" style={{ color: "#888888" }}>
                Live usage data from the Flint Request Standard
              </p>
            </div>
            <div className="flex items-center gap-2">
            <div
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: "#0a1a0a", color: "#4ade80", border: "1px solid #1a3a1a" }}
            >
              LIVE
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
              style={{ background: "#111111", border: "1px solid #2a2a2a", color: "#888888" }}
            >
              Refresh
            </button>
          </div>
          </div>
        </div>

        {loading && (
          <p className="text-center py-20" style={{ color: "#888888" }}>
            Loading analytics...
          </p>
        )}

        {data && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {statCard("Total Invoices", formatNum(data.invoices.total))}
              {statCard("Success Rate", `${data.successRate}%`, undefined, "#4ade80")}
              {statCard("Total Volume", `${data.volume.total}`, "SOL + USDC")}
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {statCard("Paid", formatNum(data.invoices.paid), undefined, "#4ade80")}
              {statCard("Pending", formatNum(data.invoices.pending), undefined, "#FFB800")}
              {statCard("Expired", formatNum(data.invoices.expired), undefined, "#ff6b6b")}
              {statCard("SOL Volume", data.volume.sol, "SOL")}
            </div>

            <div
              className="rounded-2xl p-6 mb-6"
              style={{ background: "#111111", border: "1px solid #1f1f1f" }}
            >
              <p className="text-xs mb-4" style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Protocol Features Used
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "With Flint Handles", value: data.features.withHandles },
                  { label: "With Conditions", value: data.features.withConditions },
                  { label: "With Split Payments", value: data.features.withSplits },
                  { label: "Recurring", value: data.features.withRecurring },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="glass-card flex items-center justify-between px-4 py-3 rounded-xl"
                  >
                    <p className="text-sm" style={{ color: "#888888" }}>{f.label}</p>
                    <p className="text-sm font-medium" style={{ color: "var(--spark)" }}>{f.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {data.recentPaid.length > 0 && (
              <div   
                className="glass-card rounded-2xl overflow-hidden"
              >
                <div
                  className="px-6 py-4"
                  style={{ background: "#111111", borderBottom: "1px solid #1f1f1f" }}
                >
                  <p className="text-sm font-medium" style={{ color: "var(--chalk)" }}>
                    Recent Payments
                  </p>
                </div>
                {data.recentPaid.map((p, i) => (
                  <div
                    key={i}
                    className="px-6 py-4 flex items-center justify-between"
                    style={{
                      background: i % 2 === 0 ? "#0f0f0f" : "#111111",
                      borderBottom: i < data.recentPaid.length - 1 ? "1px solid #1a1a1a" : "none",
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--chalk)" }}>{p.title}</p>
                      <p className="text-xs" style={{ color: "#555555" }}>
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "#4ade80" }}>
                      {p.amount} {p.token}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div
              className="glass-card rounded-2xl p-6"
            >
              <p className="text-xs mb-4" style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Protocol Info
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <p className="text-sm" style={{ color: "#555555" }}>Standard</p>
                  <p className="text-sm" style={{ color: "var(--chalk)" }}>Flint Request Standard {data.protocol}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm" style={{ color: "#555555" }}>Network</p>
                  <p className="text-sm" style={{ color: "#4ade80" }}>Solana Devnet</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm" style={{ color: "#555555" }}>Last updated</p>
                  <p className="text-sm" style={{ color: "var(--chalk)" }}>
                    {new Date(data.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm" style={{ color: "#555555" }}>Schema</p>
                  <button
                    onClick={() => router.push("/api/schema")}
                    className="text-sm"
                    style={{ color: "var(--spark)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    View JSON-LD
                  </button>
                </div>
              </div>
            </div>

            <p className="text-center text-xs mt-6" style={{ color: "#333333" }}>
              Last updated: {new Date(data.lastUpdated).toLocaleString()} · Flint Protocol Analytics
            </p>
          </>
        )}
      </div>
    </main>
  );
}