"use client";

interface FlintLoaderProps {
  message?: string;
  size?: number;
}

export default function FlintLoader({ message = "Loading...", size = 48 }: FlintLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flint-loader-wrap" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          className="flint-loader-svg"
        >
          <defs>
            <linearGradient id="fl-bg" x1="0" y1="0" x2="48" y2="48">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="100%" stopColor="#0f0f0f" />
            </linearGradient>
            <linearGradient id="fl-glow" x1="48" y1="0" x2="0" y2="48">
              <stop offset="0%" stopColor="#FF6B2B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#1a1a2e" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <rect x="4" y="8" width="30" height="30" rx="6" fill="url(#fl-bg)" opacity="0.95" />
          <rect x="14" y="10" width="30" height="30" rx="6" fill="url(#fl-glow)" opacity="0.75" />
          <line
            x1="12"
            y1="23"
            x2="36"
            y2="23"
            stroke="#FF6B2B"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="flint-line-main"
          />
          <line
            x1="18"
            y1="29"
            x2="36"
            y2="29"
            stroke="rgba(255,107,43,0.45)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="flint-line-sub"
          />
        </svg>
      </div>
      {message && (
        <p className="text-sm" style={{ color: "#666666", letterSpacing: "0.01em" }}>
          {message}
        </p>
      )}
    </div>
  );
}
