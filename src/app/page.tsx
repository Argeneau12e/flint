"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";

const IconZap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconCpu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
    <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M20 9h2M2 15h2M20 15h2" />
  </svg>
);
const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
  </svg>
);
const IconGlobe = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const IconFile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const hasVisited = localStorage.getItem("flint_visited");
    if (!hasVisited) {
      localStorage.setItem("flint_visited", "true");
      router.push("/landing");
    }
  }, []);

  const features = [
    { Icon: IconZap,    color: "#FF6B2B", bg: "rgba(255,107,43,0.1)",   title: "Solana Actions + Blinks", desc: "Payment links work in any Blink-aware wallet" },
    { Icon: IconCpu,    color: "#4ade80", bg: "rgba(74,222,128,0.1)",   title: "AI Agent Executable",     desc: "Autonomous agents read and pay via JSON-LD" },
    { Icon: IconLock,   color: "#FFB800", bg: "rgba(255,184,0,0.1)",    title: "Escrow + Conditions",     desc: "Enforceable conditions with PDA escrow" },
    { Icon: IconShield, color: "#4ade80", bg: "rgba(74,222,128,0.1)",   title: "On-chain Receipts",       desc: "Every payment is publicly verifiable forever" },
    { Icon: IconGlobe,  color: "#8888ff", bg: "rgba(136,136,255,0.1)",  title: "x402 Compatible",         desc: "Standard agentic payment response layer" },
    { Icon: IconFile,   color: "#aaaaaa", bg: "rgba(170,170,170,0.08)", title: "UBL 2.1 Export",          desc: "B2B/PEPPOL-grade invoice compliance" },
  ];

  const navButtons = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "AI Agent",  path: "/agent" },
    { label: "Embed",     path: "/embed-demo" },
    { label: "Spec",      path: "/spec" },
    { label: "Business",  path: "/business" },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 sm:px-8 relative overflow-hidden">

      {/* Background orbs */}
      <div style={{
        position: "fixed", top: "-20%", left: "-10%",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,107,43,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", right: "-10%",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(26,26,46,0.8) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "680px" }}>

        {/* Logo */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <Logo size={56} />
          <div className="text-center mt-1">
            <p className="text-lg" style={{ color: "#aaaaaa" }}>
              The open payment request protocol for Solana.
            </p>
            <p className="text-sm mt-1" style={{ color: "#666666" }}>
              Human-shareable. Agent-executable.
            </p>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <button
            onClick={() => router.push("/create")}
            className="px-8 py-4 rounded-2xl text-white font-medium text-lg transition-smooth hover:opacity-90 active:scale-95 focus-ring liquid-btn"
            style={{ minWidth: "260px" }}
          >
            Create Payment Request
          </button>
          <p className="text-sm" style={{ color: "#666666" }}>
            No wallet setup required for the payer
          </p>
          <div className="flex gap-2 flex-wrap justify-center mt-2">
            {navButtons.map((btn) => (
              <button
                key={btn.label}
                onClick={() => router.push(btn.path)}
                className="nav-pill"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {features.map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-5 transition-smooth hover:opacity-80">
              <div className="feature-icon-wrap" style={{ background: f.bg }}>
                <span style={{ color: f.color }}><f.Icon /></span>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--chalk)" }}>{f.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: "#666666" }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer stats */}
        <div className="flex gap-8 sm:gap-12 justify-center py-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { value: "< 1s", label: "Settlement time" },
            { value: "FRS-1", label: "Open standard" },
            { value: "MIT", label: "License" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl sm:text-2xl font-medium mb-1" style={{ color: "var(--spark)" }}>
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: "#666666" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-between mt-6 pt-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-xs" style={{ color: "#333333" }}>
            Flint · FRS-1 · MIT License
          </p>
          <div className="flex gap-4">
            {[
              { label: "Spec", path: "/spec" },
              { label: "Business", path: "/business" },
              { label: "Analytics", path: "/analytics" },
              { label: "GitHub", path: "https://github.com/Argeneau12e/flint" },
            ].map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  if (link.path.startsWith("http")) {
                    window.open(link.path, "_blank");
                  } else {
                    router.push(link.path);
                  }
                }}
                className="text-xs transition-smooth hover:opacity-70"
                style={{ color: "#444444", background: "none", border: "none", cursor: "pointer" }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
