"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Logo from "@/components/logo";

const AnimatedBackground = dynamic(() => import("./AnimatedBackground"), { ssr: false });

const IconZap = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconCpu = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
    <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M20 9h2M2 15h2M20 15h2" />
  </svg>
);
const IconShield = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
  </svg>
);
const IconGlobe = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const IconFile = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IconLock = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function LandingPage() {
  const router = useRouter();

  const particles = useMemo(() => [
    { id: 0, size: 3.2, opacity: 0.2, left: 15, top: 20, delay: 0, duration: 14 },
    { id: 1, size: 4.1, opacity: 0.15, left: 35, top: 65, delay: 2, duration: 18 },
    { id: 2, size: 2.8, opacity: 0.25, left: 55, top: 30, delay: 1, duration: 12 },
    { id: 3, size: 3.6, opacity: 0.18, left: 75, top: 80, delay: 3, duration: 16 },
    { id: 4, size: 4.5, opacity: 0.12, left: 90, top: 45, delay: 0.5, duration: 20 },
    { id: 5, size: 2.5, opacity: 0.22, left: 25, top: 90, delay: 4, duration: 15 },
    { id: 6, size: 3.8, opacity: 0.16, left: 45, top: 10, delay: 1.5, duration: 13 },
    { id: 7, size: 4.2, opacity: 0.2, left: 65, top: 55, delay: 2.5, duration: 17 },
    { id: 8, size: 3.0, opacity: 0.14, left: 80, top: 25, delay: 3.5, duration: 11 },
    { id: 9, size: 4.8, opacity: 0.18, left: 10, top: 75, delay: 1, duration: 19 },
    { id: 10, size: 3.4, opacity: 0.24, left: 50, top: 95, delay: 4.5, duration: 14 },
    { id: 11, size: 2.9, opacity: 0.19, left: 95, top: 5, delay: 2, duration: 16 },
  ], []);

  const features = [
    { Icon: IconZap,    color: "#FF6B2B", bg: "rgba(255,107,43,0.12)",  title: "Solana Actions + Blinks", desc: "Payment links that work in any Blink-aware wallet.",                delay: "anim-d2" },
    { Icon: IconCpu,    color: "#4ade80", bg: "rgba(74,222,128,0.12)",  title: "AI Agent Executable",     desc: "Autonomous agents read and pay invoices via JSON-LD.",           delay: "anim-d3" },
    { Icon: IconShield, color: "#8888ff", bg: "rgba(136,136,255,0.12)", title: "On-chain Receipts",       desc: "Every payment is publicly verifiable forever.",                  delay: "anim-d4" },
    { Icon: IconGlobe,  color: "#FFB800", bg: "rgba(255,184,0,0.12)",   title: "x402 Compatible",         desc: "Standard agentic payment response for machine commerce.",       delay: "anim-d5" },
    { Icon: IconFile,   color: "#e8e8e4", bg: "rgba(232,232,228,0.08)", title: "UBL 2.1 Export",          desc: "B2B/PEPPOL-grade invoice compliance for enterprise.",            delay: "anim-d6" },
    { Icon: IconLock,   color: "#4ade80", bg: "rgba(74,222,128,0.12)",  title: "Escrow + Conditions",     desc: "Enforceable conditions with PDA escrow on Solana.",             delay: "anim-d7" },
  ];

  const steps = [
    { n: "1", title: "Create",    desc: "Fill in title, amount, and your wallet address. Takes under 30 seconds." },
    { n: "2", title: "Share",     desc: "Send the link by WhatsApp, email, QR code, or embed it anywhere." },
    { n: "3", title: "Get Paid",  desc: "Payer clicks, connects their wallet, confirms. Receipt lives on-chain." },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "#0f0f0f" }}>
      <AnimatedBackground />

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(15,15,15,0.5), #0f0f0f)" }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 max-w-6xl mx-auto">
        <button onClick={() => router.push("/")} className="transition-smooth hover:opacity-80 focus-ring rounded-xl">
          <Logo size={36} />
        </button>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden sm:flex items-center gap-4">
            {[
              { label: "Spec", path: "/spec" },
              { label: "Analytics", path: "/analytics" },
              { label: "Dashboard", path: "/" },
            ].map((link) => (
              <button key={link.label} onClick={() => router.push(link.path)}
                className="text-sm transition-smooth hover:opacity-100 focus-ring rounded-lg px-2 py-1"
                style={{ color: "#aaaaaa", background: "none", border: "none", cursor: "pointer" }}>
                {link.label}
              </button>
            ))}
          </div>
          <button onClick={() => router.push("/create")}
            className="liquid-btn px-5 py-2 rounded-xl text-sm font-medium focus-ring">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 min-h-[88vh] flex flex-col items-center justify-center px-6 sm:px-10 text-center">

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <div key={p.id} className="absolute rounded-full animate-float"
              style={{
                width: `${p.size}px`, height: `${p.size}px`,
                background: `rgba(255,107,43,${p.opacity})`,
                left: `${p.left}%`, top: `${p.top}%`,
                animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
              }} />
          ))}
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-slide-up anim-d0"
          style={{ background: "rgba(26,26,46,0.4)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
          <span className="text-xs" style={{ color: "#aaaaaa" }}>
            Powered by Solana · FRS-1 Open Standard
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl font-medium tracking-tight mb-5 max-w-4xl animate-slide-up anim-d1"
          style={{
            background: "linear-gradient(135deg, #f7f7f5 0%, #e8e8e4 50%, #b8b8b4 100%)",
            backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: "1.1",
          }}>
          Programmable Payments
          <br />
          <span style={{ color: "#FF6B2B", WebkitTextFillColor: "#FF6B2B" }}>
            Reimagined.
          </span>
        </h1>

        <p className="text-base sm:text-lg max-w-xl mx-auto mb-10 animate-slide-up anim-d2"
          style={{ color: "#aaaaaa", lineHeight: "1.8" }}>
          The open payment request protocol for Solana.
          Human-shareable. Agent-executable.
          Built for the autonomous economy.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-16 animate-slide-up anim-d3 w-full sm:w-auto">
          <button
            onClick={() => router.push("/create")}
            className="liquid-btn px-8 py-4 rounded-2xl font-medium text-lg focus-ring w-full sm:w-auto"
            style={{ minWidth: "220px" }}>
            Create Payment Request
          </button>
          <div className="flex gap-3 w-full sm:w-auto">
            {[
              { label: "View Spec", path: "/spec" },
              { label: "Try AI Agent", path: "/agent" },
            ].map((btn) => (
              <button key={btn.label} onClick={() => router.push(btn.path)}
                className="liquid-btn-secondary px-5 py-4 rounded-xl text-sm font-medium focus-ring transition-smooth flex-1 sm:flex-auto">
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full">
          {features.map((f) => (
            <div key={f.title} className={`liquid-glass rounded-2xl p-6 text-left animate-slide-up ${f.delay}`}>
              <div className="feature-icon-wrap" style={{ background: f.bg }}>
                <span style={{ color: f.color }}><f.Icon /></span>
              </div>
              <h3 className="text-sm font-medium mb-2" style={{ color: "var(--chalk)" }}>
                {f.title}
              </h3>
              <p className="text-xs" style={{ color: "#b8b8b4", lineHeight: "1.6" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-20 px-6 sm:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs mb-3" style={{ color: "#FF6B2B", letterSpacing: "0.15em", textTransform: "uppercase" }}>Simple by design</p>
            <h2 className="text-3xl sm:text-4xl font-medium" style={{ color: "var(--chalk)" }}>
              How it works
            </h2>
          </div>

          {/* Connector line — desktop only */}
          <div className="hidden sm:block absolute left-1/2 h-px" style={{ width: "60%", transform: "translateX(-50%)", background: "rgba(255,107,43,0.15)" }} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            {steps.map((s) => (
              <div key={s.n} className="liquid-glass rounded-2xl p-6 flex flex-col gap-4">
                <div className="step-number">{s.n}</div>
                <div>
                  <h3 className="text-base font-medium mb-2" style={{ color: "var(--chalk)" }}>{s.title}</h3>
                  <p className="text-sm" style={{ color: "#888888", lineHeight: "1.6" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="relative z-10 py-12 px-6 sm:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="liquid-glass rounded-2xl px-8 py-8 flex flex-wrap gap-8 items-center justify-around">
            {[
              { value: "< 1s",   label: "Settlement" },
              { value: "FRS-1",  label: "Open standard" },
              { value: "MIT",    label: "License" },
              { value: "100%",   label: "On-chain" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-medium mb-1" style={{ color: "var(--spark)" }}>{stat.value}</p>
                <p className="text-xs" style={{ color: "#555555" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 py-20 px-6 sm:px-10 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-medium mb-5" style={{ color: "var(--chalk)" }}>
            Ready to get paid on Solana?
          </h2>
          <p className="text-base sm:text-lg mb-8" style={{ color: "#aaaaaa", lineHeight: "1.8" }}>
            Create your first payment request in seconds. No account required.
          </p>
          <button onClick={() => router.push("/create")}
            className="liquid-btn px-10 py-5 rounded-2xl font-medium text-lg focus-ring">
            Start for Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 sm:px-10 py-8 max-w-6xl mx-auto"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: "#444444" }}>
            Flint · FRS-1 · MIT License · Built for Solana
          </p>
          <div className="flex gap-5 flex-wrap justify-center">
            {[
              { label: "Spec", path: "/spec" },
              { label: "Business", path: "/business" },
              { label: "Analytics", path: "/analytics" },
              { label: "GitHub", path: "https://github.com/Argeneau12e/flint" },
            ].map((link) => (
              <button key={link.label}
                onClick={() => link.path.startsWith("http") ? window.open(link.path, "_blank") : router.push(link.path)}
                className="text-xs transition-smooth hover:opacity-100"
                style={{ color: "#444444", background: "none", border: "none", cursor: "pointer" }}>
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
