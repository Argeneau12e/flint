"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Step {
  step: number;
  action: string;
  status: string;
  detail: string;
}

interface Invoice {
  id: string;
  title: string;
  amount: number;
  token: string;
  status: string;
  recipientWallet: string;
  expiresAt: number;
}

interface AgentResult {
  invoice: Invoice;
  agentResponse: string;
  steps: Step[];
  approved: boolean;
  policyViolations: string[];
}

interface AutonomousResult {
  invoice: Invoice;
  approved: boolean;
  reasoning: string;
  violations: string[];
}

interface AutonomousResponse {
  mode: string;
  summary: { total: number; approved: number; rejected: number };
  results: AutonomousResult[];
  approved: AutonomousResult[];
  rejected: AutonomousResult[];
}

export default function AgentPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "autonomous">("single");
  const [invoiceId, setInvoiceId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [spendCap, setSpendCap] = useState("1");
  const [allowedRecipients, setAllowedRecipients] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [autonomousResult, setAutonomousResult] = useState<AutonomousResponse | null>(null);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [txSig, setTxSig] = useState("");
  const [payingIds, setPayingIds] = useState<string[]>([]);
  const [paidIds, setPaidIds] = useState<string[]>([]);

  const connectWallet = async () => {
    if (!window.solana) return "";
    await window.solana.connect();
    return window.solana.publicKey.toString();
  };

  const runAgent = async () => {
    setError("");
    setRunning(true);
    setResult(null);
    setAutonomousResult(null);
    setCurrentStep(0);
    setPaid(false);
    setTxSig("");
    setPaidIds([]);

    try {
      const agentWallet = await connectWallet();
      if (!agentWallet) {
        setError("Please install Phantom wallet.");
        return;
      }

      if (mode === "autonomous") {
        if (!walletAddress.trim()) {
          setError("Please enter the wallet address to scan.");
          return;
        }

        for (let i = 1; i <= 4; i++) {
          setCurrentStep(i);
          await new Promise((r) => setTimeout(r, 600));
        }

        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            autonomousMode: true,
            walletAddress,
            agentWallet,
            spendCap: spendCap || undefined,
            allowedRecipients: allowedRecipients
              ? allowedRecipients.split(",").map((s) => s.trim()).filter(Boolean)
              : undefined,
          }),
        });

        const data = await res.json();
        if (data.error) { setError(data.error); return; }
        setAutonomousResult(data);
        setCurrentStep(5);
        return;
      }

      if (!invoiceId.trim()) {
        setError("Please enter an invoice ID.");
        return;
      }

      for (let i = 1; i <= 5; i++) {
        setCurrentStep(i);
        await new Promise((r) => setTimeout(r, 700));
      }

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          agentWallet,
          spendCap: spendCap || undefined,
          allowedRecipients: allowedRecipients
            ? allowedRecipients.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
        }),
      });

      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResult(data);
      setCurrentStep(6);
    } catch {
      setError("Agent failed. Please try again.");
    } finally {
      setRunning(false);
    }
  };

  const executePayment = async (invId: string) => {
    if (!window.solana) return;
    setPayingIds((prev) => [...prev, invId]);
    try {
      const res = await fetch(`/api/pay/${invId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: window.solana.publicKey.toString() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }

      const { Transaction, Connection, clusterApiUrl } = await import("@solana/web3.js");
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const tx = Transaction.from(Buffer.from(data.transaction, "base64"));
      const { signature } = await window.solana.signAndSendTransaction(tx);

      try { await connection.confirmTransaction(signature, "confirmed"); } catch {}

      await fetch(`/api/receipt/${invId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txSignature: signature,
          payerWallet: window.solana.publicKey.toString(),
        }),
      });

      if (invId === invoiceId) {
        setTxSig(signature);
        setPaid(true);
      }
      setPaidIds((prev) => [...prev, invId]);
    } catch {
      setError("Payment failed.");
    } finally {
      setPayingIds((prev) => prev.filter((id) => id !== invId));
    }
  };

  const executeAllApproved = async () => {
    if (!autonomousResult || !window.solana) return;
    setPaying(true);
    for (const item of autonomousResult.approved) {
      await executePayment(item.invoice.id);
    }
    setPaying(false);
  };

  const stepLabels = mode === "autonomous" ? [
    "Connecting to Flint protocol",
    "Scanning all pending invoices",
    "Applying agent policy to each",
    "Running AI analysis",
    "Decisions ready",
  ] : [
    "Fetching invoice from Flint protocol",
    "Validating invoice fields",
    "Checking expiry and conditions",
    "Applying agent policy",
    "Running AI analysis",
    "Execution ready",
  ];

  const cardStyle = { background: "#111111", border: "1px solid #1f1f1f" };
  const labelStyle = { color: "#555555", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" as const };

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <button onClick={() => router.push("/")}
            style={{ color: "var(--spark)", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}>
            Back to Flint
          </button>
          <div className="flex items-center gap-3 mt-4 mb-2">
            <div className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: "#1a1a0a", color: "#FF6B2B", border: "1px solid #FF6B2B" }}>
              EXPERIMENTAL
            </div>
          </div>
          <h1 className="text-3xl font-medium tracking-wide mb-2" style={{ color: "var(--chalk)" }}>
            AI Payment Agent
          </h1>
          <p style={{ color: "#888888", fontSize: "14px" }}>
            Autonomous AI that reads, analyzes, and executes Flint payment requests.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-3 mb-6">
          {(["single", "autonomous"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setResult(null); setAutonomousResult(null); setCurrentStep(0); }}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                background: mode === m ? "var(--spark)" : "#111111",
                border: `1px solid ${mode === m ? "var(--spark)" : "#2a2a2a"}`,
                color: mode === m ? "white" : "#888888",
              }}>
              {m === "single" ? "Single Invoice" : "Autonomous Mode"}
            </button>
          ))}
        </div>

        {/* Input card */}
        <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
          <p style={labelStyle} className="mb-4">
            {mode === "single" ? "Invoice ID" : "Wallet to Scan"}
          </p>

          {mode === "single" ? (
            <input value={invoiceId} onChange={(e) => { setInvoiceId(e.target.value); setError(""); }}
              placeholder="Paste a Flint invoice ID"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono mb-4"
              style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "var(--chalk)" }} />
          ) : (
            <input value={walletAddress} onChange={(e) => { setWalletAddress(e.target.value); setError(""); }}
              placeholder="Solana wallet address to scan for pending invoices"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono mb-4"
              style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "var(--chalk)" }} />
          )}

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <p style={labelStyle} className="mb-2">Spend Cap (SOL)</p>
              <input value={spendCap} onChange={(e) => setSpendCap(e.target.value)}
                placeholder="Max amount" type="number"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "var(--chalk)" }} />
            </div>
            <div className="flex-1">
              <p style={labelStyle} className="mb-2">Allowed Recipients</p>
              <input value={allowedRecipients} onChange={(e) => setAllowedRecipients(e.target.value)}
                placeholder="wallet1,wallet2"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono"
                style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "var(--chalk)" }} />
            </div>
          </div>

          {mode === "autonomous" && (
            <div className="px-4 py-3 rounded-xl mb-4"
              style={{ background: "#0a1a0a", border: "1px solid #1a3a1a" }}>
              <p className="text-xs" style={{ color: "#4ade80" }}>
                Autonomous mode will scan ALL pending invoices for the wallet, analyze each with AI,
                apply your policy, and prepare approved payments for execution.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm px-4 py-3 rounded-xl mb-4"
              style={{ background: "#1a0a0a", color: "#ff6b6b" }}>{error}</p>
          )}

          <button onClick={runAgent} disabled={running}
            className="w-full py-4 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--spark)" }}>
            {running ? "Agent running..." : mode === "autonomous" ? "Run Autonomous Agent" : "Run Agent"}
          </button>
        </div>

        {/* Steps */}
        {(running || result || autonomousResult) && (
          <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
            <p style={labelStyle} className="mb-4">Agent Execution</p>
            <div className="flex flex-col gap-3">
              {stepLabels.map((label, i) => {
                const stepNum = i + 1;
                const isComplete = currentStep > stepNum;
                const isActive = currentStep === stepNum;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        background: isComplete ? "#0a1a0a" : isActive ? "#1a1a0a" : "#0f0f0f",
                        border: `1px solid ${isComplete ? "#4ade80" : isActive ? "var(--spark)" : "#2a2a2a"}`,
                        color: isComplete ? "#4ade80" : isActive ? "var(--spark)" : "#555555",
                      }}>
                      {isComplete ? "✓" : stepNum}
                    </div>
                    <p className="text-sm" style={{ color: isComplete ? "#4ade80" : isActive ? "var(--chalk)" : "#555555" }}>
                      {label}
                    </p>
                    {isActive && running && <span className="text-xs" style={{ color: "var(--spark)" }}>processing...</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Single result */}
        {result && (
          <>
            <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
              <p style={labelStyle} className="mb-4">AI Analysis — Llama 3.3 via Groq</p>
              <p className="text-sm" style={{ color: "#aaaaaa", lineHeight: "1.8" }}>{result.agentResponse}</p>
            </div>

            {result.policyViolations.length > 0 && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: "#1a0a0a", border: "1px solid #3a0a0a" }}>
                <p className="text-xs font-medium mb-2" style={{ color: "#ff6b6b" }}>POLICY VIOLATIONS</p>
                {result.policyViolations.map((v, i) => (
                  <p key={i} className="text-sm" style={{ color: "#ff6b6b" }}>• {v}</p>
                ))}
              </div>
            )}

            <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
              <p style={labelStyle} className="mb-4">Invoice</p>
              <div className="flex justify-between mb-2">
                <p className="text-sm" style={{ color: "#555555" }}>Title</p>
                <p className="text-sm" style={{ color: "var(--chalk)" }}>{result.invoice.title}</p>
              </div>
              <div className="flex justify-between mb-2">
                <p className="text-sm" style={{ color: "#555555" }}>Amount</p>
                <p className="text-sm font-medium" style={{ color: "var(--spark)" }}>
                  {result.invoice.amount} {result.invoice.token}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm" style={{ color: "#555555" }}>Decision</p>
                <p className="text-sm font-medium" style={{ color: result.approved ? "#4ade80" : "#ff6b6b" }}>
                  {result.approved ? "Approved" : "Rejected"}
                </p>
              </div>
            </div>

            {paid ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: "#0a1a0a", border: "1px solid #1a3a1a" }}>
                <p className="text-lg font-medium mb-2" style={{ color: "#4ade80" }}>Payment Executed</p>
                <p className="text-xs font-mono mb-4 break-all" style={{ color: "#4ade80" }}>{txSig}</p>
                <button onClick={() => window.open(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`, "_blank")}
                  className="px-6 py-2 rounded-xl text-sm font-medium"
                  style={{ background: "#111111", border: "1px solid #1a3a1a", color: "#4ade80" }}>
                  View on Explorer
                </button>
              </div>
            ) : result.approved ? (
              <button onClick={() => executePayment(result.invoice.id)} disabled={paying}
                className="w-full py-4 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--spark)" }}>
                {payingIds.includes(result.invoice.id) ? "Executing..." : "Execute Payment via Agent"}
              </button>
            ) : (
              <div className="w-full py-4 rounded-xl text-center"
                style={{ background: "#1a0a0a", color: "#ff6b6b" }}>
                Agent rejected this payment
              </div>
            )}
          </>
        )}

        {/* Autonomous result */}
        {autonomousResult && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Scanned", value: autonomousResult.summary.total },
                { label: "Approved", value: autonomousResult.summary.approved, color: "#4ade80" },
                { label: "Rejected", value: autonomousResult.summary.rejected, color: "#ff6b6b" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-4 text-center" style={cardStyle}>
                  <p className="text-xs mb-2" style={{ color: "#555555" }}>{s.label}</p>
                  <p className="text-2xl font-medium" style={{ color: s.color || "var(--spark)" }}>{s.value}</p>
                </div>
              ))}
            </div>

            {autonomousResult.approved.length > 0 && (
              <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid #1a3a1a" }}>
                <div className="px-6 py-4 flex items-center justify-between"
                  style={{ background: "#0a1a0a", borderBottom: "1px solid #1a3a1a" }}>
                  <p className="text-sm font-medium" style={{ color: "#4ade80" }}>
                    Approved Payments ({autonomousResult.approved.length})
                  </p>
                  {autonomousResult.approved.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Execute ${autonomousResult.approved.length} payments? This cannot be undone.`)) {
                          executeAllApproved();
                        }
                      }}
                      disabled={paying}
                      className="px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: "var(--spark)", color: "white" }}>
                      {paying ? "Executing all..." : "Execute All"}
                    </button>
                  )}
                </div>
                {autonomousResult.approved.map((item, i) => (
                  <div key={item.invoice.id}
                    className="px-6 py-4 flex items-center justify-between"
                    style={{
                      background: i % 2 === 0 ? "#0a0a0a" : "#0f0f0f",
                      borderBottom: i < autonomousResult.approved.length - 1 ? "1px solid #1a1a1a" : "none",
                    }}>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--chalk)" }}>
                        {item.invoice.title}
                      </p>
                      <p className="text-xs" style={{ color: "#555555" }}>{item.reasoning.slice(0, 80)}...</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <p className="text-sm font-medium" style={{ color: "var(--spark)" }}>
                        {item.invoice.amount} {item.invoice.token}
                      </p>
                      {paidIds.includes(item.invoice.id) ? (
                        <span className="text-xs px-3 py-1 rounded-full"
                          style={{ background: "#0a1a0a", color: "#4ade80" }}>Paid</span>
                      ) : (
                        <button onClick={() => executePayment(item.invoice.id)}
                          disabled={payingIds.includes(item.invoice.id)}
                          className="text-xs px-3 py-1 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50"
                          style={{ background: "var(--spark)", color: "white" }}>
                          {payingIds.includes(item.invoice.id) ? "..." : "Pay"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {autonomousResult.rejected.length > 0 && (
              <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid #3a0a0a" }}>
                <div className="px-6 py-4"
                  style={{ background: "#1a0a0a", borderBottom: "1px solid #3a0a0a" }}>
                  <p className="text-sm font-medium" style={{ color: "#ff6b6b" }}>
                    Rejected ({autonomousResult.rejected.length})
                  </p>
                </div>
                {autonomousResult.rejected.map((item, i) => (
                  <div key={item.invoice.id} className="px-6 py-4"
                    style={{
                      background: i % 2 === 0 ? "#0a0a0a" : "#0f0f0f",
                      borderBottom: i < autonomousResult.rejected.length - 1 ? "1px solid #1a1a1a" : "none",
                    }}>
                    <p className="text-sm font-medium mb-1" style={{ color: "var(--chalk)" }}>
                      {item.invoice.title}
                    </p>
                    {item.violations.map((v, j) => (
                      <p key={j} className="text-xs" style={{ color: "#ff6b6b" }}>• {v}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {autonomousResult.summary.total === 0 && (
              <div className="rounded-2xl p-8 text-center" style={cardStyle}>
                <p className="text-sm" style={{ color: "#888888" }}>
                  No pending invoices found for this wallet.
                </p>
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs mt-6" style={{ color: "#333333" }}>
          Powered by Flint Protocol · Llama 3.3 via Groq · Solana Devnet
        </p>
      </div>
    </main>
  );
}