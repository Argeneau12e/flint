"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Logo from "@/components/logo";

const AnimatedBackground = dynamic(() => import("./AnimatedBackground"), { ssr: false });

interface Stats {
  invoices: { total: number; paid: number };
  successRate: number;
}

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch("/api/analytics").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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
    { icon: "→", title: "Solana Actions + Blinks", desc: "Payment links that work in any Blink-aware wallet.", color: "#FF6B2B" },
    { icon: "◈", title: "AI Agent Executable", desc: "Autonomous agents read and pay invoices via JSON-LD.", color: "#4ade80" },
    { icon: "✓", title: "On-chain Receipts", desc: "Every payment is publicly verifiable forever.", color: "#8888ff" },
    { icon: "⬡", title: "x402 Compatible", desc: "Standard agentic payment response for machine commerce.", color: "#FFB800" },
    { icon: "≡", title: "UBL 2.1 Export", desc: "B2B/PEPPOL-grade invoice compliance for enterprise.", color: "#e8e8e4" },
    { icon: "◻", title: "Escrow + Conditions", desc: "Enforceable conditions with PDA escrow on Solana.", color: "#4ade80" },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "#0f0f0f" }}>
      <AnimatedBackground />

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(15,15,15,0.5), #0f0f0f)" }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <button onClick={() => router.push("/")} className="transition-smooth hover:opacity-80 focus-ring rounded-xl">
          <Logo size={36} />
        </button>
        <div className="flex items-center gap-6">
          {[
            { label: "Spec", path: "/spec" },
            { label: "Analytics", path: "/analytics" },
            { label: "Dashboard", path: "/" },
          ].map((link) => (
            <button key={link.label} onClick={() => router.push(link.path)}
              className="text-sm transition-smooth hover:opacity-100 focus-ring rounded-lg px-2 py-1"
              style={{ color: "#aaaaaa", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)" }}>
              {link.label}
            </button>
          ))}
          <button onClick={() => router.push("/create")}
            className="liquid-btn px-5 py-2 rounded-xl text-sm font-medium focus-ring"
            style={{ fontFamily: "var(--font-inter)" }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 min-h-[85vh] flex flex-col items-center justify-center px-6 text-center">

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p: { id: number; size: number; opacity: number; left: number; top: number; delay: number; duration: number }) => (
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10"
          style={{ background: "rgba(26,26,46,0.4)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
          <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "#aaaaaa" }}>
            Powered by Solana · FRS-1 Open Standard
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-6xl font-medium tracking-tight mb-6 max-w-4xl"
          style={{
            fontFamily: "var(--font-dm-sans)",
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

        <p className="text-lg max-w-2xl mx-auto mb-12"
          style={{ fontFamily: "var(--font-inter)", color: "#aaaaaa", lineHeight: "1.8" }}>
          The open payment request protocol for Solana.
          Human-shareable. Agent-executable.
          Built for the autonomous economy.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 mb-16">
          <button
            ref={btnRef}
            onClick={() => router.push("/create")}
            className="liquid-btn px-10 py-5 rounded-2xl font-medium text-lg focus-ring"
            style={{ fontFamily: "var(--font-dm-sans)", minWidth: "280px" }}>
            Create Payment Request
          </button>
          <div className="flex gap-3">
            {[
              { label: "View Protocol Spec", path: "/spec" },
              { label: "Try AI Agent", path: "/agent" },
            ].map((btn) => (
              <button key={btn.label} onClick={() => router.push(btn.path)}
                className="liquid-btn-secondary px-6 py-3 rounded-xl text-sm font-medium focus-ring transition-smooth"
                style={{ fontFamily: "var(--font-inter)" }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live stats */}
        <div className="glass-medium rounded-2xl p-8 max-w-3xl w-full mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
              <p className="text-xs font-medium tracking-widest"
                style={{ fontFamily: "var(--font-inter)", color: "#aaaaaa" }}>
                LIVE PROTOCOL STATS
              </p>
            </div>
            <p className="text-xs" style={{ color: "#555555" }}>Solana Devnet</p>
          </div>
          <div className="grid grid-cols-3 gap-8">
            {[
              { label: "Invoices Created", value: stats ? String(stats.invoices.total) : "—" },
              { label: "Successfully Paid", value: stats ? String(stats.invoices.paid) : "—" },
              { label: "Success Rate", value: stats ? `${stats.successRate}%` : "—" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-medium mb-1"
                  style={{ fontFamily: "var(--font-dm-sans)", color: "var(--spark)" }}>
                  {stat.value}
                </p>
                <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "#666666" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-4 max-w-4xl w-full">
          {features.map((f) => (
            <div key={f.title} className="liquid-glass rounded-2xl p-6 text-left">
              <p className="text-2xl font-medium mb-3" style={{ color: f.color }}>{f.icon}</p>
              <h3 className="text-base font-medium mb-2"
                style={{ fontFamily: "var(--font-dm-sans)", color: "var(--chalk)" }}>
                {f.title}
              </h3>
              <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "#b8b8b4", lineHeight: "1.6" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-medium mb-6"
            style={{ fontFamily: "var(--font-dm-sans)", color: "var(--chalk)" }}>
            Ready to get paid on Solana?
          </h2>
          <p className="text-lg mb-8"
            style={{ fontFamily: "var(--font-inter)", color: "#aaaaaa", lineHeight: "1.8" }}>
            Create your first payment request in seconds. No account required.
          </p>
          <button onClick={() => router.push("/create")}
            className="liquid-btn px-10 py-5 rounded-2xl font-medium text-lg focus-ring"
            style={{ fontFamily: "var(--font-dm-sans)" }}>
            Start for Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 max-w-6xl mx-auto"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "#444444" }}>
            Flint · FRS-1 · MIT License · Built for Solana
          </p>
          <div className="flex gap-6">
            {[
              { label: "Spec", path: "/spec" },
              { label: "Business", path: "/business" },
              { label: "Analytics", path: "/analytics" },
              { label: "GitHub", path: "https://github.com/Argeneau12e/flint" },
            ].map((link) => (
              <button key={link.label}
                onClick={() => link.path.startsWith("http") ? window.open(link.path, "_blank") : router.push(link.path)}
                className="text-xs transition-smooth hover:opacity-100"
                style={{ color: "#444444", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)" }}>
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}