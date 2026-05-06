interface ReputationBadgeProps {
  badgeTier: 'gray' | 'green' | 'blue' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const badgeColors = {
  gray: '#888888',
  green: '#4ade80',
  blue: '#3b82f6',
  gold: '#fbbf24',
};

const badgeLabels = {
  gray: 'Newcomer',
  green: 'Verified',
  blue: 'Pro',
  gold: 'Expert',
};

export default function ReputationBadge({ badgeTier, size = 'md', showTooltip = true }: ReputationBadgeProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Social media style verified badge (X/Twitter/Instagram style)
  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClasses[size]} rounded-full`}
      style={{ 
        background: badgeColors[badgeTier],
        boxShadow: `0 0 10px ${badgeColors[badgeTier]}40`,
      }}
      title={showTooltip ? `${badgeLabels[badgeTier]} - ${badgeTier.charAt(0).toUpperCase() + badgeTier.slice(1)} tier` : undefined}
    >
      {/* Verified Badge SVG - Same shape as X/Twitter/Instagram */}
      <svg
        className="w-full h-full text-white p-[15%]"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Checkmark path - matches social media verified badges */}
        <path
          d="M8.5 12.5L11 15L15.5 10.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

// Helper to get badge tier from points
export function getBadgeTier(points: number): 'gray' | 'green' | 'blue' | 'gold' {
  if (points >= 501) return 'gold';
  if (points >= 201) return 'blue';
  if (points >= 51) return 'green';
  return 'gray';
}

// Helper to get badge label from tier
export function getBadgeLabel(tier: string): string {
  return badgeLabels[tier as keyof typeof badgeLabels] || 'Newcomer';
}
