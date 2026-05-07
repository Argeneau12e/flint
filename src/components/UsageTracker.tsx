"use client";

interface UsageTrackerProps {
  tier: "FREE" | "PRO" | "BUSINESS";
  volumeUsd: number;
  invoicesCreated: number;
  aiAnalysesCount: number;
}

const TIER_LIMITS = {
  FREE: { volume: 1000, invoices: 10, ai: 5 },
  PRO: { volume: 10000, invoices: 100, ai: 50 },
  BUSINESS: { volume: 50000, invoices: 1000, ai: 500 },
};

export default function UsageTracker({
  tier,
  volumeUsd,
  invoicesCreated,
  aiAnalysesCount,
}: UsageTrackerProps) {
  const limits = TIER_LIMITS[tier];
  
  const volumeProgress = (volumeUsd / limits.volume) * 100;
  const invoicesProgress = (invoicesCreated / limits.invoices) * 100;
  const aiProgress = (aiAnalysesCount / limits.ai) * 100;

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "from-red-500 to-orange-500";
    if (progress >= 70) return "from-yellow-500 to-orange-500";
    return "from-green-500 to-emerald-500";
  };

  const getProgressColorHex = (progress: number) => {
    if (progress >= 90) return ["#ff4444", "#ff8800"];
    if (progress >= 70) return ["#ffb800", "#ff8800"];
    return ["#4ade80", "#22c55e"];
  };

  const colors = getProgressColorHex(volumeProgress);

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold" style={{ color: "#fff" }}>
          Monthly Usage
        </h3>
        <div
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: `${colors[0]}22`,
            color: colors[0],
            border: `1px solid ${colors[0]}44`,
          }}
        >
          {tier} Tier
        </div>
      </div>

      {/* Volume Usage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: "#888" }}>
            Volume
          </span>
          <span className="text-sm font-medium" style={{ color: "#fff" }}>
            ${volumeUsd.toLocaleString()} / ${limits.volume.toLocaleString()}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(volumeProgress, 100)}%`,
              background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
            }}
          />
        </div>
        {volumeProgress >= 90 && (
          <p className="text-xs mt-2" style={{ color: "#ff4444" }}>
            ⚠️ You&apos;re near your monthly limit! Consider upgrading.
          </p>
        )}
      </div>

      {/* Invoices Created */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: "#888" }}>
            Invoices
          </span>
          <span className="text-sm font-medium" style={{ color: "#fff" }}>
            {invoicesCreated} / {limits.invoices}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(invoicesProgress, 100)}%`,
              background: `linear-gradient(135deg, ${getProgressColorHex(invoicesProgress)[0]} 0%, ${getProgressColorHex(invoicesProgress)[1]} 100%)`,
            }}
          />
        </div>
      </div>

      {/* AI Analyses */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: "#888" }}>
            AI Analyses
          </span>
          <span className="text-sm font-medium" style={{ color: "#fff" }}>
            {aiAnalysesCount} / {limits.ai}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(aiProgress, 100)}%`,
              background: `linear-gradient(135deg, ${getProgressColorHex(aiProgress)[0]} 0%, ${getProgressColorHex(aiProgress)[1]} 100%)`,
            }}
          />
        </div>
      </div>

      {/* Upgrade CTA */}
      {tier === "FREE" && (
        <div
          className="mt-6 p-4 rounded-xl text-center"
          style={{
            background: "rgba(74,222,128,0.1)",
            border: "1px solid rgba(74,222,128,0.3)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "#4ade80" }}>
            🚀 Upgrade to PRO for 10x higher limits
          </p>
          <p className="text-xs mt-1" style={{ color: "#888" }}>
            Only $9.99/month
          </p>
        </div>
      )}

      {tier === "PRO" && (
        <div
          className="mt-6 p-4 rounded-xl text-center"
          style={{
            background: "rgba(255,215,0,0.1)",
            border: "1px solid rgba(255,215,0,0.3)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "#FFD700" }}>
            💼 Upgrade to BUSINESS for 5x higher limits
          </p>
          <p className="text-xs mt-1" style={{ color: "#888" }}>
            Only $49/month
          </p>
        </div>
      )}
    </div>
  );
}
