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
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0f0f0f" />
          </linearGradient>
          <linearGradient id="g2" x1="48" y1="0" x2="0" y2="48">
            <stop offset="0%" stopColor="#FF6B2B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1a1a2e" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <rect x="4" y="8" width="30" height="30" rx="6" fill="url(#g1)" opacity="0.9" />
        <rect x="14" y="10" width="30" height="30" rx="6" fill="url(#g2)" opacity="0.7" />
        <line x1="12" y1="23" x2="36" y2="23" stroke="#FF6B2B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="18" y1="29" x2="36" y2="29" stroke="rgba(255,107,43,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="g3" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0f0f0f" />
          </linearGradient>
          <linearGradient id="g4" x1="48" y1="0" x2="0" y2="48">
            <stop offset="0%" stopColor="#FF6B2B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1a1a2e" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <rect x="4" y="8" width="30" height="30" rx="6" fill="url(#g3)" opacity="0.9" />
        <rect x="14" y="10" width="30" height="30" rx="6" fill="url(#g4)" opacity="0.7" />
        <line x1="12" y1="23" x2="36" y2="23" stroke="#FF6B2B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="18" y1="29" x2="36" y2="29" stroke="rgba(255,107,43,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span
        className="text-xl font-medium tracking-widest"
        style={{ fontFamily: "var(--font-dm-sans)", color: "var(--chalk)", letterSpacing: "0.15em" }}
      >
        FLINT
      </span>
    </div>
  );
}