"use client";

import Logo from "@/components/logo";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Invoice {
  id: string;
  title: string;
  amount: number;
  token: string;
  status: string;
  createdAt: number;
  expiresAt: number;
  memo: string;
  handle?: string;
  txSignature?: string;
}

interface Stats {
  total: number;
  paid: number;
  pending: number;
  expired: number;
  totalEarned: number;
  successRate: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState("");
  const [connected, setConnected] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const connectWallet = async () => {
    try {
      if (!window.solana) {
        setError("Please install Phantom wallet.");
        return;
      }
      await window.solana.connect();
      const address = window.solana.publicKey.toString();
      setWallet(address);
      setConnected(true);
      fetchDashboard(address);
    } catch {
      setError("Failed to connect wallet.");
    }
  };

  const fetchDashboard = async (address: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?wallet=${address}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
      setStats(data.stats);
    } catch {
      setError("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatStat = (value: number, suffix = "") => {
    if (stats?.total === 0) return "—";
    return `${value}${suffix}`;
  };
  
  const getStatusColor = (invoice: Invoice) => {
    if (invoice.status === "paid") return "#4ade80";
    if (Date.now() > invoice.expiresAt) return "#ff6b6b";
    return "#FFB800";
  };

  const getStatusLabel = (invoice: Invoice) => {
    if (invoice.status === "paid") return "Paid";
    if (Date.now() > invoice.expiresAt) return "Expired";
    return "Pending";
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.solana?.publicKey) {
      const address = window.solana.publicKey.toString();
      setWallet(address);
      setConnected(true);
      fetchDashboard(address);
    }
  }, []);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <button
              onClick={() => router.push("/")}
              className="text-sm mb-2 block"
              style={{ color: "var(--spark)", background: "none", border: "none", cursor: "pointer" }}
            >
              Back to Flint
            </button>
            <h1
              className="text-3xl font-medium tracking-wide"
              style={{ color: "var(--chalk)" }}
            >
              Dashboard
            </h1>
            {wallet && (
              <p className="text-sm font-mono mt-1" style={{ color: "#555555" }}>
                {wallet.slice(0, 6)}...{wallet.slice(-6)}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/templates")}
              className="px-5 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#888888" }}
            >
              Templates
            </button>
            <button
              onClick={() => router.push("/create")}
              className="px-5 py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "var(--spark)" }}
            >
              New Invoice
            </button>
          </div>
        </div>

        {/* Not connected */}
        {!connected && (
          <div
            className="glass-light rounded-2xl p-12 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}
            >
              <img src="/flint-icon-32.png" width="32" height="32" alt="Flint" />
            </div>
            <h2 className="text-xl font-medium mb-2" style={{ color: "var(--chalk)" }}>
              Connect your wallet
            </h2>
            <p className="text-sm mb-6" style={{ color: "#888888" }}>
              See all your invoices, earnings, and payment history
            </p>
            <button
              onClick={connectWallet}
              className="px-8 py-3 rounded-xl text-white font-medium transition-all hover:opacity-90"
              style={{ background: "var(--spark)" }}
            >
              Connect Phantom
            </button>
            {error && (
              <p className="text-sm mt-4" style={{ color: "#ff6b6b" }}>{error}</p>
            )}
          </div>
        )}

        {/* Loading */}
        {connected && loading && (
          <div className="text-center py-20">
            <p style={{ color: "#888888" }}>Loading your invoices...</p>
          </div>
        )}

        {/* Stats */}
        {connected && !loading && stats && (
          <>
        
            <div className="flex gap-3 mb-6">
              {[
                { label: "Analytics", path: "/analytics", color: "#4ade80", bg: "#0a1a0a", border: "#1a3a1a" },
                { label: "Templates", path: "/templates", color: "#888888", bg: "#111111", border: "#2a2a2a" },
                { label: "Agent", path: "/agent", color: "#FF6B2B", bg: "#1a1a0a", border: "#FF6B2B" },
                { label: "Spec", path: "/spec", color: "#8888ff", bg: "#1a1a2e", border: "#8888ff" },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                  style={{ background: item.bg, border: `1px solid ${item.border}`, color: item.color }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {[
                { label: "Total Earned", value: `${stats.totalEarned}`, suffix: "mixed" },
                { label: "Success Rate", value: stats.total === 0 ? "—" : `${stats.successRate}%`, suffix: "" },
                { label: "Total Invoices", value: `${stats.total}`, suffix: "" },
                { label: "Paid", value: `${stats.paid}`, suffix: "", color: "#4ade80" },
                { label: "Pending", value: `${stats.pending}`, suffix: "", color: "#FFB800" },
                { label: "Expired", value: `${stats.expired}`, suffix: "", color: "#ff6b6b" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass-light rounded-xl p-4"
                >
                  <p className="text-xs mb-2" style={{ color: "#555555" }}>
                    {stat.label}
                  </p>
                  <p
                    className="text-2xl font-medium"
                    style={{ color: stat.color || "var(--spark)" }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Invoice list */}
            <div
              className="glass-medium rounded-2xl overflow-hidden"
            >
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ background: "rgba(15,15,15,0.4)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--chalk)" }}>
                  Invoice History
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-xs" style={{ color: "#555555" }}>
                    {invoices.length} total
                  </p>
                  <button
                    onClick={() => setShowAllInvoices(!showAllInvoices)}
                    className="flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-all hover:opacity-80"
                    style={{ background: "#1a1a0a", color: "var(--spark)", border: "1px solid #2a2a0a" }}
                  >
                    {showAllInvoices ? "Show less" : "View all"}
                    <span style={{ fontSize: "10px" }}>{showAllInvoices ? "‹" : "›"}</span>
                  </button>
            </div>
              </div>

              {invoices.length === 0 ? (
                <div
                  className="px-6 py-12 text-center"
                  style={{ background: "#0f0f0f" }}
                >
                  <p className="text-sm mb-4" style={{ color: "#888888" }}>
                    No invoices yet
                  </p>
                  <button
                    onClick={() => router.push("/create")}
                    className="px-6 py-2 rounded-xl text-white text-sm transition-all hover:opacity-90"
                    style={{ background: "var(--spark)" }}
                  >
                    Create your first invoice
                  </button>
                </div>
              ) : (
                (showAllInvoices ? invoices : invoices.slice(0, 2)).map((invoice, index) => (
                  <div
                    key={invoice.id}
                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      background: index % 2 === 0 ? "#0f0f0f" : "#111111",
                      borderBottom: index < invoices.length - 1 ? "1px solid #1a1a1a" : "none",
                    }}
                    onClick={() => {
                      if (invoice.status === "paid") {
                        router.push(`/verify/${invoice.txSignature}`);
                      } else {
                        router.push(`/invoice/${invoice.id}`);
                      }
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-sm font-medium" style={{ color: "var(--chalk)" }}>
                          {invoice.title}
                        </p>
                        {invoice.handle && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "#1a1a2e", color: "#8888ff" }}
                          >
                            @{invoice.handle}
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "#555555" }}>
                        {formatDate(invoice.createdAt)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--chalk)" }}>
                        {invoice.amount} {invoice.token}
                      </p>
                      <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${getStatusColor(invoice)}22`,
                          color: getStatusColor(invoice),
                        }}
                      >
                        {getStatusLabel(invoice)}
                      </span>
                      {invoice.txSignature && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/verify/${invoice.txSignature}`, "_blank");
                          }}
                          className="text-xs px-2 py-0.5 rounded-full transition-all hover:opacity-80"
                          style={{ background: "#0a1a0a", color: "#4ade80", border: "1px solid #1a3a1a" }}
                        >
                          Verify
                        </button>
                      )}
                      {invoice.status === "pending" && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm("Cancel this invoice?")) return;
                            await fetch(`/api/invoice/create?id=${invoice.id}`, { method: "DELETE" });
                            fetchDashboard(wallet);
                          }}
                          className="text-xs px-2 py-0.5 rounded-full transition-all hover:opacity-80"
                          style={{ background: "#1a0a0a", color: "#ff6b6b", border: "1px solid #3a0a0a" }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}