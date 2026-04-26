"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const [form, setForm] = useState({
    name: "",
    title: "",
    amount: "",
    token: "USDC",
    memo: "",
    expiryDays: "7",
  });

  const inputStyle = {
    background: "#0f0f0f",
    border: "1px solid #2a2a2a",
    color: "var(--chalk)",
  };

  const labelStyle = {
    color: "#888888",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    marginBottom: "6px",
    display: "block",
  };

  const connectWallet = async () => {
    try {
      if (!window.solana) return;
      await window.solana.connect();
      const address = window.solana.publicKey.toString();
      setWallet(address);
      setConnected(true);
      fetchTemplates(address);
    } catch {
      console.error("Failed to connect wallet");
    }
  };

  const fetchTemplates = async (address: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates?wallet=${address}`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      console.error("Failed to fetch templates");
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
      console.error("Failed to save template");
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
    if (typeof window !== "undefined" && window.solana?.publicKey) {
      const address = window.solana.publicKey.toString();
      setWallet(address);
      setConnected(true);
      fetchTemplates(address);
    }
  }, []);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-10">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm mb-2 block"
              style={{ color: "var(--spark)", background: "none", border: "none", cursor: "pointer" }}
            >
              Back to Dashboard
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
              className="px-5 py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "var(--spark)" }}
            >
              {showForm ? "Cancel" : "New Template"}
            </button>
          )}
        </div>

        {!connected && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          >
            <p className="text-lg font-medium mb-2" style={{ color: "var(--chalk)" }}>
              Connect your wallet
            </p>
            <p className="text-sm mb-6" style={{ color: "#888888" }}>
              To save and use templates
            </p>
            <button
              onClick={connectWallet}
              className="px-8 py-3 rounded-xl text-white font-medium transition-all hover:opacity-90"
              style={{ background: "var(--spark)" }}
            >
              Connect Phantom
            </button>
          </div>
        )}

        {connected && showForm && (
          <div
            className="rounded-2xl p-6 mb-6 flex flex-col gap-4"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          >
            <h2 className="text-sm font-medium" style={{ color: "var(--chalk)" }}>
              New Template
            </h2>
            <div>
              <label style={labelStyle}>Template Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Consulting Hour"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Invoice Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 1 Hour Consulting Session"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label style={labelStyle}>Amount</label>
                <input
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div style={{ width: "110px" }}>
                <label style={labelStyle}>Token</label>
                <select
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Memo (optional)</label>
              <input
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                placeholder="Default memo for this template"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <button
              onClick={saveTemplate}
              disabled={saving}
              className="w-full py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--spark)" }}
            >
              {saving ? "Saving..." : "Save Template"}
            </button>
          </div>
        )}

        {connected && loading && (
          <p className="text-center py-12" style={{ color: "#888888" }}>
            Loading templates...
          </p>
        )}

        {connected && !loading && templates.length === 0 && !showForm && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}
            >
              <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
                <rect x="12" y="8" width="40" height="48" rx="4" stroke="white" strokeWidth="2.5" fill="none" />
                <line x1="20" y1="24" x2="44" y2="24" stroke="#FF6B2B" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="34" x2="44" y2="34" stroke="#555555" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="44" x2="36" y2="44" stroke="#555555" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-base font-medium mb-2" style={{ color: "var(--chalk)" }}>
              No templates yet
            </p>
            <p className="text-sm mb-6" style={{ color: "#555555" }}>
              Save your frequently used invoice configurations for one-click reuse.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "var(--spark)" }}
            >
              Create First Template
            </button>
          </div>
        )}

        {connected && !loading && templates.length > 0 && (
          <div className="flex flex-col gap-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-2xl p-5 flex items-center justify-between"
                style={{ background: "#111111", border: "1px solid #1f1f1f" }}
              >
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--chalk)" }}>
                    {template.name}
                  </p>
                  <p className="text-xs mb-1" style={{ color: "#888888" }}>
                    {template.title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--spark)" }}>
                    {template.amount} {template.token}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => useTemplate(template)}
                    className="px-4 py-2 rounded-xl text-white text-xs font-medium transition-all hover:opacity-90"
                    style={{ background: "var(--spark)" }}
                  >
                    Use
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-90"
                    style={{ background: "#1a0a0a", color: "#ff6b6b", border: "1px solid #3a0a0a" }}
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