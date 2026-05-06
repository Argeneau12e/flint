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

  // EXACT Twitter/X verified badge shape - from official SVG
  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClasses[size]} rounded-full`}
      style={{ 
        background: badgeColors[badgeTier],
        boxShadow: `0 0 10px ${badgeColors[badgeTier]}40`,
      }}
      title={showTooltip ? `${badgeLabels[badgeTier]} - ${badgeTier.charAt(0).toUpperCase() + badgeTier.slice(1)} tier` : undefined}
    >
      {/* Twitter/X Verified Badge - Official SVG Path */}
      <svg
        className="w-full h-full text-white p-[10%]"
        viewBox="0 0 22 22"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
          fill="currentColor"
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
