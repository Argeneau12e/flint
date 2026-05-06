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
      {/* Verified Badge SVG - User Provided */}
      {/* Circle background = tier color, Checkmark = white */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        className="w-full h-full p-[12%]"
        fill="white"
      >
        <path d="M490.11,205.16q-15.94-15.43-31.94-31.09-.45-21.69-1.13-43.36c-.6-19.35-9-37.81-23.31-52.15S400.86,55.91,381.49,55.3q-21.72-.67-43.44-1.12Q322.39,38.24,307,22.34C293.11,8.12,275.13.17,256,.18s-37.12,8-50.92,22.16q-15.47,15.93-31.15,31.91-21.72.44-43.43,1.12C90.62,56.73,56.3,91,54.94,130.77q-.67,21.69-1.13,43.36-16,15.65-31.94,31.08C7.68,219-.29,237-.29,256s7.92,37,22.16,50.84q15.94,15.42,32,31.05.43,21.69,1.12,43.39c.61,19.38,9,37.79,23.3,52.15s32.85,22.65,52.25,23.25q21.72.69,43.44,1.13,15.66,15.93,31.11,31.82c13.83,14.22,31.83,22.17,51,22.16s37.12-7.94,51-22.15q15.45-15.92,31.12-31.88,21.72-.45,43.43-1.13c39.87-1.35,74.19-35.62,75.55-75.4q.68-21.67,1.12-43.34,16-15.66,31.95-31.09c14.19-13.78,22.16-31.76,22.16-50.83S504.32,219,490.11,205.16ZM383.3,223.57c-43.18,44.87-87.05,90.74-130.19,136.24a37.56,37.56,0,0,1-27.27,11.78h-.17a38.25,38.25,0,0,1-27.3-11.72q-34.6-35.73-69.42-71.2a37.36,37.36,0,0,1,.76-53.43,38.37,38.37,0,0,1,54,.67q20.69,21.21,41.43,42.54c34.25-35.89,68.67-72,102.55-107.54,14.38-15.13,38.37-15.38,53.79-.78S397.79,208.52,383.3,223.57Z"></path>
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
