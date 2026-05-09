"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FlintLoader from "@/components/flint-loader";
import FeeCalculator from "@/components/escrow/FeeCalculator";
import { FEE_TIERS } from "@/lib/escrow/types";
import { getSolanaProvider } from "@/lib/wallet";

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

function CreatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Wallet connection state
  const [walletConnected, setWalletConnected] = useState(false);
  const [userWallet, setUserWallet] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDC");
  const [memo, setMemo] = useState("");
  const [expiryDays, setExpiryDays] = useState("3");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [clientEmail, setClientEmail] = useState("");
  const [condition, setCondition] = useState("");
  const [aiConditions, setAiConditions] = useState<string[]>([]);
  const [suggestingConditions, setSuggestingConditions] = useState(false);
  const [feeTier, setFeeTier] = useState<keyof typeof FEE_TIERS>('FREE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prefill from URL params
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

  // Check wallet connection on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem("flint_wallet");
    if (savedWallet) {
      setUserWallet(savedWallet);
      setWalletConnected(true);
    }
  }, []);

  const connectWallet = async () => {
    setConnecting(true);
    setConnectionError("");
    try {
      const provider = await getSolanaProvider();
      if (!provider) {
        setConnectionError("Phantom wallet not found. Please install Phantom.");
        return;
      }
      const response = await provider.connect();
      const wallet = response.publicKey.toString();
      setUserWallet(wallet);
      setWalletConnected(true);
      localStorage.setItem("flint_wallet", wallet);
    } catch (err: any) {
      setConnectionError(err.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  // AI Condition Suggester using QVAC SDK pattern
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
      if (data.conditions && data.conditions.length > 0) {
        setAiConditions(data.conditions);
        setCondition(data.conditions.join('\n'));
      }
    } catch (e) {
      console.error('AI suggestion failed:', e);
      setError("AI suggestion unavailable. Please enter conditions manually.");
    } finally {
      setSuggestingConditions(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Please add a title."); return; }
    if (!amount || Number(amount) <= 0) { setError("Please enter a valid amount."); return; }
    if (!walletConnected) { setError("Please connect your wallet first."); return; }
    if (!clientEmail.trim()) { setError("Please enter your client's email."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/escrow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: Number(amount),
          token,
          description: memo,
          creator: userWallet,
          clientEmail,
          deliveryDays: Number(deliveryDays),
          linkExpiryDays: Number(expiryDays),
          feeTier,
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

  // Show wallet connection screen if not connected
  if (!walletConnected) {
    return (
      <main className="min-h-screen px-5 sm:px-8 py-10 sm:py-14 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-medium mb-4" style={{ color: "var(--chalk)" }}>
            Connect Wallet
          </h1>
          <p className="mb-8" style={{ color: "#888" }}>
            Connect your Solana wallet to create an invoice
          </p>
          
          {connectionError && (
            <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.2)" }}>
              <p className="text-sm" style={{ color: "#ff4444" }}>{connectionError}</p>
            </div>
          )}
          
          <button
            onClick={connectWallet}
            disabled={connecting}
            className="w-full py-4 rounded-xl font-medium text-white liquid-btn disabled:opacity-50"
            style={{ fontSize: "15px", minHeight: "54px" }}
          >
            {connecting ? "Connecting..." : "Connect Phantom Wallet"}
          </button>
          
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-sm"
            style={{ color: "#666" }}
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

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
          Fill in the details. We'll generate a shareable link instantly.
        </p>
      </div>

      <div className="max-w-lg mx-auto rounded-2xl p-6 sm:p-8 flex flex-col gap-6 glass-medium">

        {/* Fee Disclosure Banner */}
        <div 
          className="p-4 rounded-xl"
          style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)' }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0" style={{ color: '#FFB800' }}>
              <InfoIcon />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#FFB800' }}>
                You pay the escrow fee
              </p>
              <p className="text-xs mt-1" style={{ color: '#888' }}>
                Your client pays exactly the invoice amount. The fee is deducted from your payout — they never see it.
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={labelStyle}>Invoice Title</label>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(""); }}
            placeholder="e.g. Logo Design - Phase 1"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input"
          />
        </div>

        {/* Amount + Token */}
        <div>
          <label style={labelStyle}>Amount & Token</label>
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

        {/* Fee Calculator */}
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

        {/* Client's Email */}
        <div>
          <label style={labelStyle}>Client's Email</label>
          <input
            value={clientEmail}
            onChange={(e) => { setClientEmail(e.target.value); setError(""); }}
            placeholder="client@example.com"
            type="email"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none liquid-input"
          />
          <p style={{ color: "#444444", fontSize: "12px", marginTop: "6px" }}>
            Your client receives notifications here
          </p>
        </div>

        {/* Delivery Time */}
        <div>
          <label style={labelStyle}>Delivery Deadline</label>
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
            Client must pay by this date or the link expires
          </p>
        </div>

        {/* Service Conditions with AI Suggester */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label style={{ ...labelStyle, marginBottom: 0 }}>
              Service Conditions
            </label>
            <button
              onClick={suggestConditions}
              disabled={suggestingConditions || !title}
              className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80 flex items-center gap-1.5"
              style={{
                background: suggestingConditions || !title ? "rgba(255,107,43,0.1)" : "rgba(255,107,43,0.15)",
                border: "1px solid rgba(255,107,43,0.3)",
                color: "var(--spark)",
                opacity: suggestingConditions || !title ? 0.5 : 1,
              }}
            >
              <SparklesIcon />
              {suggestingConditions ? "Thinking..." : "AI Suggest"}
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
              <p className="text-xs font-medium" style={{ color: 'var(--spark)', marginBottom: '6px' }}>AI Suggestions:</p>
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
            These conditions will be shown to your client
          </p>
        </div>

        {/* Connected Wallet Display */}
        <div className="p-3 rounded-xl" style={{ background: 'rgba(15,15,15,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#666" }}>Connected Wallet</p>
          <p className="text-sm font-mono" style={{ color: "#888" }}>
            {userWallet.slice(0, 6)}...{userWallet.slice(-4)}
          </p>
        </div>

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
          Your client needs no account — just a Solana wallet.
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
