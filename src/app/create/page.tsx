"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FlintLoader from "@/components/flint-loader";
import FeeCalculator from "@/components/escrow/FeeCalculator";
import { FEE_TIERS } from "@/lib/escrow/types";

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
  const [expiryDays, setExpiryDays] = useState("3");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [recipientWallet, setRecipientWallet] = useState("");
  const [handle, setHandle] = useState("");
  const [condition, setCondition] = useState("");
  const [aliceWhatsapp, setAliceWhatsapp] = useState("");
  const [aiConditions, setAiConditions] = useState<string[]>([]);
  const [suggestingConditions, setSuggestingConditions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Removed: splits, showSplits, recurring, webhookUrl (not part of REAL Flint Flow)
  
  // Escrow integration
  const [escrowEnabled] = useState(true); // Escrow is DEFAULT (no toggle)
  const [feeTier, setFeeTier] = useState<keyof typeof FEE_TIERS>('FREE');

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

  // AI Condition Suggester
  const suggestConditions = async () => {
    if (!title) return;
    setSuggestingConditions(true);
    try {
      const res = await fetch('/api/escrow/suggest-conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, memo }),
      });
      const data = await res.json();
      if (data.conditions) {
        setAiConditions(data.conditions);
        // Auto-fill condition with suggestions
        setCondition(data.conditions.join('\n'));
      }
    } catch (e) {
      console.error('AI suggestion failed:', e);
    } finally {
      setSuggestingConditions(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Please add a title."); return; }
    if (!amount || Number(amount) <= 0) { setError("Please enter a valid amount."); return; }
    if (!recipientWallet.trim()) { setError("Please enter your wallet address."); return; }
    if (recipientWallet.length < 32) { setError("Wallet address looks too short."); return; }
    if (!aliceWhatsapp.trim()) { setError("Please enter Alice's WhatsApp for notifications."); return; }

    setLoading(true);
    console.log('Creating invoice:', { title, amount: Number(amount), token, creator: recipientWallet, aliceWhatsapp });
    try {
      // Use escrow create API (includes fee calculation)
      const res = await fetch("/api/escrow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: Number(amount),
          token,
          description: memo,
          creator: recipientWallet, // Seller wallet
          aliceWhatsapp, // Alice's contact for notifications
          deliveryDays: Number(deliveryDays),
          linkExpiryDays: Number(expiryDays),
          feeTier,
          escrowEnabled,
          handle,
          condition,
        }),
      });
      const data = await res.json();
      if (data.escrow?.id) {
        router.push(`/pay/${data.escrow.id}`);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
      console.error('Submit error:', err);
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
    { id: "USDC", label: "USDC",  icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png", desc: "USD Coin" },
    { id: "USDT", label: "USDT",  icon: "https://assets.coingecko.com/coins/images/325/thumb/Tether-logo.png?1696501661", desc: "Tether USD" },
    { id: "SOL",  label: "SOL",   icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png", desc: "Solana" },
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

        {/* Fee Disclosure Banner - CRITICAL for REAL flow */}
        {amount && Number(amount) > 0 && (
          <div 
            className="p-4 rounded-xl flex items-start gap-3"
            style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)' }}
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,184,0,0.2)' }}>
              <svg className="w-3 h-3 text-[#FFB800]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#FFB800' }}>💡 You (Bob) pay the escrow fee</p>
              <p className="text-xs mt-1" style={{ color: '#888' }}>
                Alice pays exactly {amount} {token}. Your fee is deducted from your payout.
                Alice never sees this fee — to her, it's just paying you.
              </p>
            </div>
          </div>
        )}

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
                  style={{ minWidth: "80px", padding: "8px 12px" }}
                >
                  <img 
                    src={t.icon} 
                    alt={t.label}
                    style={{ 
                      width: "20px", 
                      height: "20px", 
                      objectFit: "contain",
                      marginRight: "6px"
                    }}
                    loading="lazy"
                  />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <p style={{ color: "#444444", fontSize: "12px", marginTop: "6px" }}>
            {token === "USDC" ? "USD Coin — stable, dollar-pegged" : "Native Solana token"}
          </p>
        </div>

        {/* Fee Calculator - ESCROW INTEGRATION */}
        {amount && Number(amount) > 0 && (
          <div>
            <label style={labelStyle}>Escrow Protection</label>
            <FeeCalculator 
              amount={Number(amount)} 
              token={token as 'SOL' | 'USDC' | 'USDT'} 
              feeTier={feeTier}
              showDisclosure={true}
            />

          </div>
        )}

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

        {/* Alice's WhatsApp */}
        <div>
          <label style={labelStyle}>Alice's WhatsApp <span style={{ color: "#ff6b6b" }}>*</span></label>
          <input
            value={aliceWhatsapp}
            onChange={(e) => { setAliceWhatsapp(e.target.value); setError(""); }}
            placeholder="+1-234-567-8900 (with country code)"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input font-mono"
          />
          <p style={{ color: "#444444", fontSize: "12px", marginTop: "6px" }}>
            Alice receives notifications here. She never knows this is escrow.
          </p>
        </div>

        {/* Delivery Time */}
        <div>
          <label style={labelStyle}>Bob Has To Deliver</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { val: "3", label: "3 days" },
              { val: "7", label: "7 days" },
              { val: "14", label: "14 days" },
              { val: "30", label: "30 days" },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setDeliveryDays(opt.val)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-smooth"
                style={{
                  background: deliveryDays === opt.val ? "rgba(255,107,43,0.15)" : "rgba(15,15,15,0.5)",
                  border: deliveryDays === opt.val ? "1px solid rgba(255,107,43,0.4)" : "1px solid rgba(255,255,255,0.07)",
                  color: deliveryDays === opt.val ? "var(--spark)" : "#666666",
                  minHeight: "44px",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Link Expiry */}
        <div>
          <label style={labelStyle}>Payment Link Expires In</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { val: "1", label: "1 day" },
              { val: "3", label: "3 days" },
              { val: "7", label: "7 days" },
              { val: "14", label: "14 days" },
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
          <p style={{ color: "#444444", fontSize: "12px", marginTop: "6px" }}>
            Alice must fund by this date or the link expires
          </p>
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

            {/* Condition with AI Suggester */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Service Conditions <span style={{ color: "#444444", textTransform: "none", fontWeight: 400, fontSize: "11px" }}>(what you'll deliver)</span>
                </label>
                <button
                  onClick={suggestConditions}
                  disabled={suggestingConditions || !title}
                  className="text-xs px-3 py-1 rounded-lg transition-all hover:opacity-80 flex items-center gap-1"
                  style={{
                    background: suggestingConditions ? "rgba(255,107,43,0.2)" : "rgba(255,107,43,0.1)",
                    border: "1px solid rgba(255,107,43,0.3)",
                    color: "var(--spark)",
                    opacity: suggestingConditions || !title ? 0.5 : 1,
                  }}
                >
                  {suggestingConditions ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Thinking...
                    </>
                  ) : (
                    <>
                      ✨ AI Suggest
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="Describe what you'll deliver (or click AI Suggest above)"
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input resize-none"
              />
              {aiConditions.length > 0 && (
                <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(255,107,43,0.08)', border: '1px solid rgba(255,107,43,0.2)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--spark)', marginBottom: '6px' }}>AI Suggestions (applied above):</p>
                  <ul className="text-xs space-y-1" style={{ color: '#888' }}>
                    {aiConditions.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span style={{ color: 'var(--spark)' }}>•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p style={{ color: "#444444", fontSize: "12px", marginTop: "6px" }}>
                These conditions will be shown to Alice. Be clear about deliverables.
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
