"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreatePage() {
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

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-lg mx-auto mb-10">
        <a href="/" style={{ color: "var(--spark)", fontSize: "14px" }}>
          Back to Flint
        </a>
        <h1 className="text-3xl font-medium tracking-wide mt-4 mb-2" style={{ color: "var(--chalk)" }}>
          New Payment Request
        </h1>
        <p style={{ color: "#888888", fontSize: "14px" }}>
          Fill in the details. We will generate a shareable link instantly.
        </p>
      </div>

      <div className="max-w-lg mx-auto rounded-2xl p-8 flex flex-col gap-6"
        style={{ background: "#111111", border: "1px solid #1f1f1f" }}>

        <div>
          <label style={labelStyle}>Invoice Title</label>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(""); }}
            placeholder="e.g. Logo design Phase 1"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label style={labelStyle}>Amount</label>
            <input
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              placeholder="0.00"
              type="number"
              min="0"
              step="any"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div style={{ width: "110px" }}>
            <label style={labelStyle}>Token</label>
            <select
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            >
              <option value="SOL">SOL</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Your Wallet Address</label>
          <input
            value={recipientWallet}
            onChange={(e) => { setRecipientWallet(e.target.value); setError(""); }}
            placeholder="Your Solana wallet address"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono"
            style={inputStyle}
          />
          <p style={{ color: "#444444", fontSize: "12px", marginTop: "4px" }}>
            This is where you will receive the payment
          </p>
        </div>

        <div>
          <label style={labelStyle}>Memo (optional)</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="What is this payment for?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Link Expires In</label>
          <select
            value={expiryDays}
            onChange={(e) => setExpiryDays(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle}
          >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>
            Flint Handle
            <span className="ml-2 normal-case" style={{ color: "#444444", fontSize: "11px" }}>
              (optional)
            </span>
          </label>
          <div className="flex items-center rounded-xl overflow-hidden"
            style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}>
            <span className="px-3 py-3 text-sm flex-shrink-0"
              style={{ color: "#555555", borderRight: "1px solid #2a2a2a" }}>
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
          <p style={{ color: "#444444", fontSize: "12px", marginTop: "4px" }}>
            Anyone can pay you at this permanent link
          </p>
        </div>

        <div>
          <label style={labelStyle}>
            Payment Condition
            <span className="ml-2 normal-case" style={{ color: "#444444", fontSize: "11px" }}>
              (optional)
            </span>
          </label>
          <input
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="e.g. Deliver mockups before payment releases"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "#0f0f0f",
              border: "1px solid #2a2a2a",
              color: "var(--chalk)",
            }}
          />
          <p style={{ color: "#444444", fontSize: "12px", marginTop: "4px" }}>
            Condition the payer must meet before payment is valid
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label style={labelStyle}>Split Payment</label>
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
                border: "1px solid #2a2a2a",
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
                    style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "var(--chalk)" }}
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
                    style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "var(--chalk)" }}
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
                    style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "var(--spark)" }}
                  />
                  <span className="text-xs" style={{ color: "#555555" }}>%</span>
                  <button
                    onClick={() => setSplits(splits.filter((_, i) => i !== index))}
                    className="text-xs px-2 py-2 rounded-lg"
                    style={{ background: "#1a0a0a", color: "#ff6b6b" }}
                  >
                    x
                  </button>
                </div>
              ))}
              <button
                onClick={() => setSplits([...splits, { wallet: "", percentage: 0, label: "" }])}
                className="text-xs py-2 rounded-xl transition-all hover:opacity-80"
                style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "#888888" }}
              >
                Add recipient
              </button>
              <p className="text-xs" style={{ color: "#444444" }}>
                Total: {splits.reduce((s, sp) => s + sp.percentage, 0)}% (must equal 100%)
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label style={labelStyle}>Recurring Payment</label>
            <button
              onClick={() => setRecurring(!recurring)}
              className="text-xs px-3 py-1 rounded-lg transition-all hover:opacity-80"
              style={{
                background: recurring ? "#1a1a0a" : "transparent",
                border: "1px solid #2a2a2a",
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
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={inputStyle}
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
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          )}
          {recurring && (
            <p className="text-xs mt-2" style={{ color: "#444444" }}>
              Payer will be charged {recurringCount}x {recurringInterval}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}>
            Webhook URL
            <span className="ml-2 normal-case" style={{ color: "#444444", fontSize: "11px" }}>
              (optional — for developers)
            </span>
          </label>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://yourapp.com/webhooks/flint"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono"
            style={inputStyle}
          />
          <p style={{ color: "#444444", fontSize: "12px", marginTop: "4px" }}>
            We POST to this URL when your invoice is paid
          </p>
        </div>

        {error && (
          <p className="text-sm px-4 py-3 rounded-xl"
            style={{ background: "#1a0a0a", color: "#ff6b6b" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          style={{ background: "var(--spark)" }}
        >
          {loading ? "Generating link..." : "Generate Payment Link"}
        </button>

        <p className="text-center text-xs" style={{ color: "#333333" }}>
          The payer needs no account. Just a Solana wallet.
        </p>
      </div>
    </main>
  );
}