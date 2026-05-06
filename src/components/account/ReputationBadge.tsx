import { REPUTATION_TIERS, getTierFromPoints } from "@/lib/reputation";

interface ReputationBadgeProps {
  tier: "gray" | "green" | "blue" | "gold";
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

// Export for dashboard compatibility
export function getBadgeTier(points: number): "gray" | "green" | "blue" | "gold" {
  const tier = getTierFromPoints(points);
  return tier.toLowerCase() as "gray" | "green" | "blue" | "gold";
}

const sizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

const badgeLabels = {
  gray: "Newcomer",
  green: "Verified",
  blue: "Pro",
  gold: "Expert",
};

export default function ReputationBadge({ tier, size = "md", showTooltip = true }: ReputationBadgeProps) {
  const color = REPUTATION_TIERS[tier.toUpperCase() as "GRAY" | "GREEN" | "BLUE" | "GOLD"]?.color || "#888888";

  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClasses[size]} rounded-full relative group`}
      style={{
        background: `${color}20`,
        border: `1px solid ${color}`,
      }}
      title={showTooltip ? `${badgeLabels[tier]} (${tier})` : ""}
    >
      {/* Star icon */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill={color}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </span>
  );
}
