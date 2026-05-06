/**
 * Reputation System - Points Calculation
 * 
 * Badge tiers:
 * - Gray: 0-50 points (New)
 * - Green: 51-200 points (Trusted)
 * - Blue: 201-500 points (Verified)
 * - Gold: 501+ points (Elite)
 */

export const REPUTATION_TIERS = {
  GRAY: { name: "Gray", min: 0, max: 50, color: "#888888" },
  GREEN: { name: "Green", min: 51, max: 200, color: "#4ade80" },
  BLUE: { name: "Blue", min: 201, max: 500, color: "#3b82f6" },
  GOLD: { name: "Gold", min: 501, max: Infinity, color: "#FFD700" },
} as const;

export type ReputationTier = keyof typeof REPUTATION_TIERS;

export interface ReputationData {
  points: number;
  tier: ReputationTier;
  badges: string[];
  transactionsCompleted: number;
  totalVolume: number;
  averageRating: number;
}

/**
 * Calculate reputation tier based on points
 */
export function getTierFromPoints(points: number): ReputationTier {
  if (points >= 501) return "GOLD";
  if (points >= 201) return "BLUE";
  if (points >= 51) return "GREEN";
  return "GRAY";
}

/**
 * Calculate points from transaction
 */
export function calculatePointsFromTransaction(amount: number, token: string, success: boolean): number {
  if (!success) return 0;

  // Base points: $1 USD = 1 point
  const usdValue = convertToUSD(amount, token);
  const points = Math.floor(usdValue);

  // Bonus for completed escrow
  const bonus = 10;

  return points + bonus;
}

/**
 * Convert token amount to USD
 */
export function convertToUSD(amount: number, token: string): number {
  const prices: Record<string, number> = {
    SOL: 175,
    USDC: 1,
    USDT: 1,
  };

  return amount * (prices[token as keyof typeof prices] || 1);
}

/**
 * Calculate reputation from user activity
 */
export function calculateReputation(activity: {
  transactionsCompleted: number;
  totalVolume: number;
  averageRating: number;
  disputes: number;
}): ReputationData {
  let points = 0;

  // Points from transactions
  points += activity.transactionsCompleted * 20;

  // Points from volume
  points += Math.floor(activity.totalVolume / 10);

  // Points from rating
  const ratingBonus = (activity.averageRating - 1) * 50; // 1-5 scale
  points += Math.max(0, ratingBonus);

  // Penalty for disputes
  points -= activity.disputes * 50;

  // Ensure minimum
  points = Math.max(0, points);

  return {
    points,
    tier: getTierFromPoints(points),
    badges: calculateBadges(points, activity),
    transactionsCompleted: activity.transactionsCompleted,
    totalVolume: activity.totalVolume,
    averageRating: activity.averageRating,
  };
}

/**
 * Calculate badges based on achievements
 */
export function calculateBadges(points: number, activity: {
  transactionsCompleted: number;
  totalVolume: number;
  averageRating: number;
}): string[] {
  const badges: string[] = [];

  if (activity.transactionsCompleted >= 10) badges.push("Early Adopter");
  if (activity.transactionsCompleted >= 50) badges.push("Power User");
  if (activity.transactionsCompleted >= 100) badges.push("Veteran");

  if (activity.totalVolume >= 1000) badges.push("High Volume");
  if (activity.totalVolume >= 10000) badges.push("Whale");

  if (activity.averageRating >= 4.5) badges.push("Top Rated");
  if (activity.averageRating >= 4.9) badges.push("Perfect Score");

  if (points >= 500) badges.push("Elite");

  return badges;
}

/**
 * Get badge SVG based on tier
 */
export function getBadgeSVG(tier: ReputationTier): string {
  const colors: Record<ReputationTier, string> = {
    GRAY: "#888888",
    GREEN: "#4ade80",
    BLUE: "#3b82f6",
    GOLD: "#FFD700",
  };

  const color = colors[tier];

  return `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" opacity="0.2"/>
      <path d="M12 6L14.5 11.5L18 12.5L15 16L16 21L12 18L8 21L9 16L6 12.5L9.5 11.5L12 6Z" fill="${color}"/>
    </svg>
  `;
}
