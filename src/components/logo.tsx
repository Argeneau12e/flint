"use client";

interface LogoProps {
  size?: number;
  className?: string;
  variant?: "full" | "icon";
}

export default function Logo({ size = 48, className = "", variant = "full" }: LogoProps) {
  if (variant === "icon") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="6" y="10" width="28" height="28" rx="4" fill="url(#pane-gradient-icon)" opacity="0.6" />
        <rect x="14" y="10" width="28" height="28" rx="4" fill="url(#pane-gradient-icon)" opacity="0.5" />
        <line x1="14" y1="24" x2="42" y2="24" stroke="#FF6B2B" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="pane-gradient-icon" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0f0f0f" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="6" y="10" width="28" height="28" rx="4" fill="url(#pane-gradient-full)" opacity="0.6" />
        <rect x="14" y="10" width="28" height="28" rx="4" fill="url(#pane-gradient-full)" opacity="0.5" />
        <line x1="14" y1="24" x2="42" y2="24" stroke="#FF6B2B" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="pane-gradient-full" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0f0f0f" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className="text-xl font-medium tracking-widest"
        style={{ fontFamily: "var(--font-dm-sans)", color: "var(--chalk)" }}
      >
        FLINT
      </span>
    </div>
  );
}