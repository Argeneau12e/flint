"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FlintLoader from "@/components/flint-loader";
import { getSolanaProvider, WALLET_NOT_FOUND_MSG } from "@/lib/wallet";

interface Template {
  id: string;
  name: string;
  title: string;
  amount: number;
  token: string;
  memo: string;
  expiryDays: number;
  createdAt: number;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [wallet, setWallet] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    title: "",
    amount: "",
    token: "USDC",
    memo: "",
    expiryDays: "7",
  });

  const labelStyle = {
    color: "#888888",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    marginBottom: "8px",
    display: "block",
  };

  const connectWallet = async () => {
    setError("");
    const provider = getSolanaProvider();
    if (!provider) {
      setError(WALLET_NOT_FOUND_MSG);
      return;
    }
    try {
      await provider.connect();
      const address = provider.publicKey?.toString() ?? "";
      if (!address) { setError("Could not read wallet address."); return; }
      setWallet(address);
      setConnected(true);
      fetchTemplates(address);
    } catch {
      setError("Connection cancelled or failed.");
    }
  };

  const fetchTemplates = async (address: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates?wallet=${address}`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!form.name || !form.title || !form.amount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, walletAddress: wallet }),
      });
      const data = await res.json();
      if (data.template) {
        setTemplates([data.template, ...templates]);
        setShowForm(false);
        setForm({ name: "", title: "", amount: "", token: "USDC", memo: "", expiryDays: "7" });
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const useTemplate = (template: Template) => {
    const params = new URLSearchParams({
      title: template.title,
      amount: String(template.amount),
      token: template.token,
      memo: template.memo,
      expiryDays: String(template.expiryDays),
    });
    router.push(`/create?${params.toString()}`);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const provider = getSolanaProvider();
    if (provider?.publicKey) {
      const address = provider.publicKey.toString();
      setWallet(address);
      setConnected(true);
      fetchTemplates(address);
    }
  }, []);

  return (
    <main className="min-h-screen px-5 sm:px-6 py-10 sm:py-14">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-start sm:items-center justify-between mb-10 gap-4">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm mb-3 block"
              style={{ color: "var(--spark)", background: "none", border: "none", cursor: "pointer" }}
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-medium tracking-wide" style={{ color: "var(--chalk)" }}>
              Templates
            </h1>
            <p className="text-sm mt-1" style={{ color: "#888888" }}>
              Save invoice templates for quick reuse
            </p>
          </div>
          {connected && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 liquid-btn flex-shrink-0"
            >
              {showForm ? "Cancel" : "New Template"}
            </button>
          )}
        </div>

        {!connected && (
          <div className="rounded-2xl p-12 text-center glass-light">
            <p className="text-lg font-medium mb-2" style={{ color: "var(--chalk)" }}>
              Connect your wallet
            </p>
            <p className="text-sm mb-2" style={{ color: "#888888" }}>
              To save and use templates
            </p>
            <p className="text-xs mb-8" style={{ color: "#555555" }}>
              Works with Phantom, Solflare, Backpack, and other Solana wallets
            </p>
            <button
              onClick={connectWallet}
              className="px-8 py-3 rounded-xl text-white font-medium transition-all hover:opacity-90 liquid-btn"
            >
              Connect Wallet
            </button>
            {error && (
              <p className="text-sm mt-5 px-4 py-3 rounded-xl inline-block"
                style={{ background: "#1a0a0a", color: "#ff6b6b" }}>
                {error}
              </p>
            )}
          </div>
        )}

        {connected && showForm && (
          <div className="glass-medium rounded-2xl p-6 mb-6 flex flex-col gap-5">
            <h2 className="text-sm font-medium" style={{ color: "var(--chalk)" }}>New Template</h2>
            <div>
              <label style={labelStyle}>Template Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Consulting Hour"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input"
              />
            </div>
            <div>
              <label style={labelStyle}>Invoice Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 1 Hour Consulting Session"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input"
              />
            </div>
            <div>
              <label style={labelStyle}>Amount &amp; Token</label>
              <div className="flex gap-3">
                <input
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  type="number"
                  className="flex-1 px-4 py-3 rounded-xl text-sm outline-none liquid-input"
                />
                <div className="flex gap-1 p-1 rounded-xl"
                  style={{ background: "rgba(15,15,15,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {["USDC", "SOL"].map((t) => (
                    <button key={t} onClick={() => setForm({ ...form, token: t })}
                      className={`token-pill ${form.token === t ? "token-pill-active" : "token-pill-inactive"}`}
                      style={{ minWidth: "64px", padding: "8px 12px" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Memo <span style={{ textTransform: "none", fontWeight: 400 }}>(optional)</span></label>
              <input
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                placeholder="Default memo for this template"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input"
              />
            </div>
            <button
              onClick={saveTemplate}
              disabled={saving}
              className="w-full py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 liquid-btn"
            >
              {saving ? "Saving..." : "Save Template"}
            </button>
          </div>
        )}

        {connected && loading && (
          <div className="flex items-center justify-center py-16">
            <FlintLoader message="Loading templates..." />
          </div>
        )}

        {connected && !loading && templates.length === 0 && !showForm && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(15,15,15,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
                <rect x="12" y="8" width="40" height="48" rx="4" stroke="white" strokeWidth="2.5" fill="none" />
                <line x1="20" y1="24" x2="44" y2="24" stroke="#FF6B2B" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="34" x2="44" y2="34" stroke="#555555" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="44" x2="36" y2="44" stroke="#555555" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-base font-medium mb-2" style={{ color: "var(--chalk)" }}>No templates yet</p>
            <p className="text-sm mb-8" style={{ color: "#555555" }}>
              Save your frequently used invoice configurations for one-click reuse.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 liquid-btn"
            >
              Create First Template
            </button>
          </div>
        )}

        {connected && !loading && templates.length > 0 && (
          <div className="flex flex-col gap-3">
            {templates.map((template) => (
              <div key={template.id}
                className="glass-light rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1 truncate" style={{ color: "var(--chalk)" }}>
                    {template.name}
                  </p>
                  <p className="text-xs mb-1 truncate" style={{ color: "#888888" }}>
                    {template.title}
                  </p>
                  <p className="text-xs font-medium" style={{ color: "var(--spark)" }}>
                    {template.amount} {template.token}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => useTemplate(template)}
                    className="px-4 py-2 rounded-xl text-white text-xs font-medium transition-all hover:opacity-90 liquid-btn"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                    style={{ background: "rgba(255,80,80,0.08)", color: "#ff6b6b", border: "1px solid rgba(255,80,80,0.2)" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
