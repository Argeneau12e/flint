"use client";

interface ReputationBadgeProps {
  points?: number;
  tier?: "NEWCOMER" | "VERIFIED" | "PRO" | "EXPERT";
  walletAddress?: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

export default function ReputationBadge({
  points = 0,
  tier = "NEWCOMER",
  walletAddress,
  size = "md",
  showTooltip = true,
}: ReputationBadgeProps) {
  // Determine badge color and label based on tier
  const getBadgeInfo = (t: string) => {
    switch (t) {
      case "EXPERT":
        return { color: "#FFD700", label: "Expert", icon: "🏆" };
      case "PRO":
        return { color: "#4A90D9", label: "Pro", icon: "⭐" };
      case "VERIFIED":
        return { color: "#4ade80", label: "Verified", icon: "✓" };
      default:
        return { color: "#888888", label: "Newcomer", icon: "🌱" };
    }
  };

  const badge = getBadgeInfo(tier);
  
  const sizeClasses = {
    sm: "w-5 h-5 text-xs",
    md: "w-7 h-7 text-sm",
    lg: "w-10 h-10 text-lg",
  };

  const badgeContent = (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold`}
      style={{
        background: `linear-gradient(135deg, ${badge.color} 0%, ${badge.color}cc 100%)`,
        color: "#000",
        boxShadow: `0 2px 8px ${badge.color}66`,
      }}
      title={showTooltip ? `${badge.label} - ${points} points` : undefined}
    >
      {badge.icon}
    </div>
  );

  return (
    <div className="inline-flex items-center gap-2">
      {badgeContent}
      {size !== "sm" && (
        <div className="flex flex-col">
          <span className="text-xs font-semibold" style={{ color: badge.color }}>
            {badge.label}
          </span>
          {walletAddress && (
            <span className="text-xs" style={{ color: "#888" }}>
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Get tier from points
 */
export function getTierFromPoints(points: number): "NEWCOMER" | "VERIFIED" | "PRO" | "EXPERT" {
  if (points >= 501) return "EXPERT";
  if (points >= 201) return "PRO";
  if (points >= 51) return "VERIFIED";
  return "NEWCOMER";
}

/**
 * Get points needed for next tier
 */
export function getNextTierInfo(currentPoints: number): { nextTier: string; pointsNeeded: number; progress: number } {
  if (currentPoints >= 501) return { nextTier: "Max", pointsNeeded: 0, progress: 100 };
  if (currentPoints >= 201) return { nextTier: "EXPERT", pointsNeeded: 501 - currentPoints, progress: ((currentPoints - 201) / 300) * 100 };
  if (currentPoints >= 51) return { nextTier: "PRO", pointsNeeded: 201 - currentPoints, progress: ((currentPoints - 51) / 150) * 100 };
  if (currentPoints >= 1) return { nextTier: "VERIFIED", pointsNeeded: 51 - currentPoints, progress: (currentPoints / 51) * 100 };
  return { nextTier: "VERIFIED", pointsNeeded: 51, progress: 0 };
}
