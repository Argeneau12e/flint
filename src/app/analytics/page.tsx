"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FlintLoader from "@/components/flint-loader";

const IconChart = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconDollar = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconUsers = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconCheck = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalVolume: 0,
    totalRevenue: 0,
    activeUsers: 0,
    completionRate: 0,
  });

  useEffect(() => {
    // Fetch analytics from API
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Fetch analytics error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const statCards = [
    {
      icon: IconChart,
      label: "Total Invoices",
      value: stats.totalInvoices.toLocaleString(),
      color: "#FF6B2B",
      bg: "rgba(255,107,43,0.1)",
      border: "rgba(255,107,43,0.2)",
    },
    {
      icon: IconDollar,
      label: "Total Volume",
      value: `$${stats.totalVolume.toLocaleString()}`,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.1)",
      border: "rgba(74,222,128,0.2)",
    },
    {
      icon: IconUsers,
      label: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      color: "#8888ff",
      bg: "rgba(136,136,255,0.1)",
      border: "rgba(136,136,255,0.2)",
    },
    {
      icon: IconCheck,
      label: "Completion Rate",
      value: `${stats.completionRate}%`,
      color: "#FFB800",
      bg: "rgba(255,184,0,0.1)",
      border: "rgba(255,184,0,0.2)",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f0f" }}>
        <FlintLoader message="Loading analytics..." />
      </div>
    );
  }

  return (
    <main className="min-h-screen px-5 sm:px-8 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push("/")} className="back-btn">
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-medium" style={{ color: "#f7f7f5" }}>
            Analytics Dashboard
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="glass-medium rounded-2xl p-6"
              style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}20` }}>
                  <span style={{ color: stat.color }}>
                    <stat.icon size={20} />
                  </span>
                </div>
              </div>
              <p className="text-xs mb-1" style={{ color: "#666" }}>{stat.label}</p>
              <p className="text-2xl font-medium" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="glass-medium rounded-2xl p-6">
            <h3 className="text-sm font-medium mb-4" style={{ color: "#f7f7f5" }}>
              Revenue Overview
            </h3>
            <div className="h-48 flex items-end justify-between gap-2">
              {[65, 78, 85, 72, 90, 82, 95].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg transition-all hover:opacity-80"
                    style={{
                      height: `${height}%`,
                      background: "linear-gradient(to top, #FF6B2B, #FFB800)",
                    }}
                  />
                  <p className="text-xs" style={{ color: "#555" }}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Token Distribution */}
          <div className="glass-medium rounded-2xl p-6">
            <h3 className="text-sm font-medium mb-4" style={{ color: "#f7f7f5" }}>
              Token Distribution
            </h3>
            <div className="space-y-4">
              {[
                { token: "USDC", amount: 45, color: "#2775CA" },
                { token: "USDT", amount: 35, color: "#26A17B" },
                { token: "SOL", amount: 20, color: "#9945FF" },
              ].map((item) => (
                <div key={item.token}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: "#aaa" }}>{item.token}</span>
                    <span className="text-sm font-medium" style={{ color: "#f7f7f5" }}>{item.amount}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.amount}%`, background: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-medium rounded-2xl p-6 mt-6">
          <h3 className="text-sm font-medium mb-4" style={{ color: "#f7f7f5" }}>
            Recent Activity
          </h3>
          <div className="space-y-3">
            {[
              { action: "Payment completed", amount: "+$150 USDC", time: "2 min ago", color: "#4ade80" },
              { action: "New invoice created", amount: "$500 USDC", time: "15 min ago", color: "#FF6B2B" },
              { action: "Escrow released", amount: "+$200 USDC", time: "1 hour ago", color: "#4ade80" },
              { action: "Invoice disputed", amount: "$300 USDC", time: "2 hours ago", color: "#ff6b6b" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${item.color}20` }}>
                    <IconCheck size={14} style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#f7f7f5" }}>{item.action}</p>
                    <p className="text-xs" style={{ color: "#555" }}>{item.time}</p>
                  </div>
                </div>
                <p className="text-sm font-medium" style={{ color: item.color }}>{item.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
