"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8"
          style={{ background: "#111111", border: "1px solid #1f1f1f" }}
        >
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
            <polygon points="32,6 54,18 54,46 32,58 10,46 10,18"
              stroke="white" strokeWidth="2.5" fill="none" />
            <polyline points="48,8 60,8 60,20"
              stroke="#FF6B2B" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <rect x="24" y="24" width="6" height="20" rx="2" fill="white" />
            <rect x="30" y="24" width="14" height="6" rx="2" fill="white" />
            <rect x="30" y="34" width="10" height="5" rx="2" fill="white" />
          </svg>
        </div>
        <p
          className="text-6xl font-medium mb-4"
          style={{ color: "var(--spark)" }}
        >
          404
        </p>
        <h1
          className="text-2xl font-medium mb-3"
          style={{ color: "var(--chalk)" }}
        >
          Page not found
        </h1>
        <p className="text-sm mb-8" style={{ color: "#888888" }}>
          This page does not exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#888888" }}
          >
            Go back
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "var(--spark)" }}
          >
            Back to Flint
          </button>
        </div>
      </div>
    </main>
  );
}