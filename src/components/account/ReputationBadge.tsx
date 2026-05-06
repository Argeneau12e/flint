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

  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClasses[size]} rounded-full`}
      style={{ 
        background: badgeColors[badgeTier],
        boxShadow: `0 0 10px ${badgeColors[badgeTier]}40`,
      }}
      title={showTooltip ? `${badgeLabels[badgeTier]} - ${badgeTier.charAt(0).toUpperCase() + badgeTier.slice(1)} tier` : undefined}
    >
      <svg
        className="w-full h-full text-black p-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
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
