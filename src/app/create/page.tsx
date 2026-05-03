"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FlintLoader from "@/components/flint-loader";

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

function CreatePageInner() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDC");
  const [memo, setMemo] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [recipientWallet, setRecipientWallet] = useState("");
  const [handle, setHandle] = useState("");
  const [condition, setCondition] = useState("");
  const [splits, setSplits] = useState<Array<{wallet: string, percentage: number, label: string}>>([]);
  const [showSplits, setShowSplits] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("monthly");
  const [recurringCount, setRecurringCount] = useState("12");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();

  useEffect(() => {
    const t = searchParams.get("title");
    const a = searchParams.get("amount");
    const tok = searchParams.get("token");
    const m = searchParams.get("memo");
    const e = searchParams.get("expiryDays");
    if (t) setTitle(t);
    if (a) setAmount(a);
    if (tok) setToken(tok);
    if (m) setMemo(m);
    if (e) setExpiryDays(e);
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Please add a title."); return; }
    if (!amount || Number(amount) <= 0) { setError("Please enter a valid amount."); return; }
    if (!recipientWallet.trim()) { setError("Please enter your wallet address."); return; }
    if (recipientWallet.length < 32) { setError("Wallet address looks too short."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/invoice/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, amount, token, memo, expiryDays, recipientWallet, handle, condition,
          splits: splits.length > 0 ? splits : undefined,
          recurring,
          recurringInterval: recurring ? recurringInterval : undefined,
          recurringCount: recurring ? Number(recurringCount) : undefined,
          webhookUrl: webhookUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/invoice/${data.id}`);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    color: "#aaaaaa",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    marginBottom: "8px",
    display: "block",
  };

  const tokens = [
    { id: "USDC", label: "USDC", icon: "◎", desc: "USD Coin" },
    { id: "SOL",  label: "SOL",  icon: "◉", desc: "Solana" },
  ];

  return (
    <main className="min-h-screen px-5 sm:px-8 py-10 sm:py-14">
      <div className="max-w-lg mx-auto mb-8">
        <button onClick={() => router.push("/")} className="back-btn mb-6">
          <ChevronLeft />
          <span>Flint</span>
        </button>
        <h1 className="text-3xl font-medium tracking-wide mt-1 mb-2" style={{ color: "var(--chalk)" }}>
          New Payment Request
        </h1>
        <p style={{ color: "#888888", fontSize: "14px" }}>
          Fill in the details. We&apos;ll generate a shareable link instantly.
        </p>
      </div>

      <div className="max-w-lg mx-auto rounded-2xl p-6 sm:p-8 flex flex-col gap-6 glass-medium">

        {/* Title */}
        <div>
          <label style={labelStyle}>Invoice Title</label>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(""); }}
            placeholder="e.g. Logo design Phase 1"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input"
          />
        </div>

        {/* Amount + Token */}
        <div>
          <label style={labelStyle}>Amount &amp; Token</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                placeholder="0.00"
                type="number"
                min="0"
                step="any"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input"
              />
            </div>
            <div
              className="flex gap-2 p-1 rounded-xl"
              style={{ background: "rgba(15,15,15,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {tokens.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setToken(t.id)}
                  className={`token-pill ${token === t.id ? "token-pill-active" : "token-pill-inactive"}`}
                  style={{ minWidth: "70px" }}
                >
                  <span style={{ fontSize: "15px" }}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <p style={{ color: "#444444", fontSize: "12px", marginTop: "6px" }}>
            {token === "USDC" ? "USD Coin — stable, dollar-pegged" : "Native Solana token"}
          </p>
        </div>

        {/* Wallet */}
        <div>
          <label style={labelStyle}>Your Wallet Address</label>
          <input
            value={recipientWallet}
            onChange={(e) => { setRecipientWallet(e.target.value); setError(""); }}
            placeholder="Your Solana wallet address"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input font-mono"
          />
          <p style={{ color: "#444444", fontSize: "12px", marginTop: "6px" }}>
            This is where you will receive the payment
          </p>
        </div>

        {/* Memo */}
        <div>
          <label style={labelStyle}>Memo <span style={{ color: "#444444", textTransform: "none", fontWeight: 400 }}>(optional)</span></label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="What is this payment for?"
            rows={2}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input resize-none"
          />
        </div>

        {/* Expiry */}
        <div>
          <label style={labelStyle}>Link Expires In</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { val: "1", label: "1 day" },
              { val: "3", label: "3 days" },
              { val: "7", label: "7 days" },
              { val: "14", label: "14 days" },
              { val: "30", label: "30 days" },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setExpiryDays(opt.val)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-smooth"
                style={{
                  background: expiryDays === opt.val ? "rgba(255,107,43,0.15)" : "rgba(15,15,15,0.5)",
                  border: expiryDays === opt.val ? "1px solid rgba(255,107,43,0.4)" : "1px solid rgba(255,255,255,0.07)",
                  color: expiryDays === opt.val ? "var(--spark)" : "#666666",
                  minHeight: "44px",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80 flex items-center justify-between px-4 glass-light"
          style={{ minHeight: "48px" }}
        >
          <span style={{ color: "var(--chalk)" }}>Advanced Options</span>
          <span style={{ fontSize: "12px", color: "var(--spark)" }}>
            {showAdvanced ? "− Hide" : "+ Show"}
          </span>
        </button>

        {showAdvanced && (
          <>
            {/* Handle */}
            <div>
              <label style={labelStyle}>
                Flint Handle <span style={{ color: "#444444", textTransform: "none", fontWeight: 400, fontSize: "11px" }}>(optional)</span>
              </label>
              <div className="flex items-center rounded-xl overflow-hidden"
                style={{ background: "rgba(15,15,15,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="px-3 py-3 text-sm flex-shrink-0"
                  style={{ color: "#555555", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                  flint.pay/to/
                </span>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="yourname"
                  className="flex-1 px-3 py-3 text-sm outline-none"
                  style={{ background: "transparent", color: "var(--chalk)" }}
                />
              </div>
              <p style={{ color: "#444444", fontSize: "12px", marginTop: "6px" }}>
                Anyone can pay you at this permanent link
              </p>
            </div>

            {/* Condition */}
            <div>
              <label style={labelStyle}>
                Payment Condition <span style={{ color: "#444444", textTransform: "none", fontWeight: 400, fontSize: "11px" }}>(optional)</span>
              </label>
              <input
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. Deliver mockups before payment releases"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input"
              />
              <p style={{ color: "#444444", fontSize: "12px", marginTop: "6px" }}>
                Condition the payer must meet before payment is valid
              </p>
            </div>

            {/* Splits */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label style={{ ...labelStyle, marginBottom: 0 }}>Split Payment</label>
                <button
                  onClick={() => {
                    setShowSplits(!showSplits);
                    if (!showSplits && splits.length === 0) {
                      setSplits([{ wallet: "", percentage: 50, label: "" }]);
                    }
                  }}
                  className="text-xs px-3 py-1 rounded-lg transition-all hover:opacity-80"
                  style={{
                    background: showSplits ? "#1a1a0a" : "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: showSplits ? "var(--spark)" : "#555555",
                  }}
                >
                  {showSplits ? "Remove splits" : "Add splits"}
                </button>
              </div>
              {showSplits && (
                <div className="flex flex-col gap-3">
                  {splits.map((split, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        value={split.label}
                        onChange={(e) => {
                          const updated = [...splits];
                          updated[index].label = e.target.value;
                          setSplits(updated);
                        }}
                        placeholder="Label"
                        className="w-24 px-3 py-2 rounded-xl text-xs outline-none"
                        style={{ background: "rgba(15,15,15,0.5)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--chalk)" }}
                      />
                      <input
                        value={split.wallet}
                        onChange={(e) => {
                          const updated = [...splits];
                          updated[index].wallet = e.target.value;
                          setSplits(updated);
                        }}
                        placeholder="Wallet address"
                        className="flex-1 px-3 py-2 rounded-xl text-xs outline-none font-mono"
                        style={{ background: "rgba(15,15,15,0.5)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--chalk)" }}
                      />
                      <input
                        value={split.percentage}
                        onChange={(e) => {
                          const updated = [...splits];
                          updated[index].percentage = Number(e.target.value);
                          setSplits(updated);
                        }}
                        type="number"
                        min="1"
                        max="100"
                        className="w-16 px-3 py-2 rounded-xl text-xs outline-none"
                        style={{ background: "rgba(15,15,15,0.5)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--spark)" }}
                      />
                      <span className="text-xs" style={{ color: "#555555" }}>%</span>
                      <button
                        onClick={() => setSplits(splits.filter((_, i) => i !== index))}
                        className="text-xs px-2 py-2 rounded-lg"
                        style={{ background: "#1a0a0a", color: "#ff6b6b", minHeight: "36px", minWidth: "36px" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setSplits([...splits, { wallet: "", percentage: 0, label: "" }])}
                    className="text-xs py-2 rounded-xl transition-all hover:opacity-80"
                    style={{ background: "rgba(15,15,15,0.5)", border: "1px solid rgba(255,255,255,0.07)", color: "#888888" }}
                  >
                    + Add recipient
                  </button>
                  <p className="text-xs" style={{ color: "#444444" }}>
                    Total: {splits.reduce((s, sp) => s + sp.percentage, 0)}% (must equal 100%)
                  </p>
                </div>
              )}
            </div>

            {/* Recurring */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label style={{ ...labelStyle, marginBottom: 0 }}>Recurring Payment</label>
                <button
                  onClick={() => setRecurring(!recurring)}
                  className="text-xs px-3 py-1 rounded-lg transition-all hover:opacity-80"
                  style={{
                    background: recurring ? "#1a1a0a" : "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: recurring ? "var(--spark)" : "#555555",
                  }}
                >
                  {recurring ? "Disable" : "Enable"}
                </button>
              </div>
              {recurring && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label style={labelStyle}>Interval</label>
                    <select
                      value={recurringInterval}
                      onChange={(e) => setRecurringInterval(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div style={{ width: "120px" }}>
                    <label style={labelStyle}>Cycles</label>
                    <input
                      value={recurringCount}
                      onChange={(e) => setRecurringCount(e.target.value)}
                      type="number"
                      min="1"
                      max="120"
                      placeholder="12"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input"
                    />
                  </div>
                </div>
              )}
              {recurring && (
                <p className="text-xs mt-2" style={{ color: "#444444" }}>
                  Payer will be charged {recurringCount}× {recurringInterval}
                </p>
              )}
            </div>

            {/* Webhook */}
            <div>
              <label style={labelStyle}>
                Webhook URL <span style={{ color: "#444444", textTransform: "none", fontWeight: 400, fontSize: "11px" }}>(optional — for developers)</span>
              </label>
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://yourapp.com/webhooks/flint"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input font-mono"
              />
              <p style={{ color: "#444444", fontSize: "12px", marginTop: "6px" }}>
                We POST to this URL when your invoice is paid
              </p>
            </div>
          </>
        )}

        {error && (
          <p className="text-sm px-4 py-3 rounded-xl"
            style={{ background: "#1a0a0a", color: "#ff6b6b", border: "1px solid #2a1010" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-xl font-medium text-white transition-all active:scale-95 disabled:opacity-50 liquid-btn"
          style={{ fontSize: "15px", minHeight: "54px" }}
        >
          {loading ? "Generating link..." : "Generate Payment Link"}
        </button>

        <p className="text-center text-xs" style={{ color: "#333333" }}>
          The payer needs no account — just a Solana wallet.
        </p>
      </div>
    </main>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f0f" }}>
        <FlintLoader message="Loading..." />
      </div>
    }>
      <CreatePageInner />
    </Suspense>
  );
}
