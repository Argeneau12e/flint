"use client";

import { useRouter } from "next/navigation";
import Logo from "@/components/logo";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8"
          style={{ background: "#111111", border: "1px solid #1f1f1f" }}
        >
          <img src="/flint-icon-192.png" width="40" height="40" alt="Flint" style={{ borderRadius: "8px" }} />
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