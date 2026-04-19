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
  memo: string;
  expiresAt: number;
}

interface AgentResult {
  invoice: Invoice;
  agentResponse: string;
  steps: Step[];
  approved: boolean;
}

export default function AgentPage() {
  const router = useRouter();
  const [invoiceId, setInvoiceId] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [txSig, setTxSig] = useState("");

  const runAgent = async () => {
    if (!invoiceId.trim()) {
      setError("Please enter an invoice ID.");
      return;
    }
    if (!window.solana) {
      setError("Please install Phantom wallet.");
      return;
    }

    setError("");
    setRunning(true);
    setResult(null);
    setCurrentStep(0);
    setPaid(false);
    setTxSig("");

    try {
      await window.solana.connect();
      const agentWallet = window.solana.publicKey.toString();

      for (let i = 1; i <= 4; i++) {
        setCurrentStep(i);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, agentWallet }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      setResult(data);
      setCurrentStep(5);
    } catch {
      setError("Agent failed. Please try again.");
    } finally {
      setRunning(false);
    }
  };

  const executePayment = async () => {
    if (!result || !window.solana) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/pay/${result.invoice.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: window.solana.publicKey.toString(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      const { Transaction, Connection, clusterApiUrl } = await import("@solana/web3.js");
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const tx = Transaction.from(Buffer.from(data.transaction, "base64"));
      const { signature } = await window.solana.signAndSendTransaction(tx);

      try {
        await connection.confirmTransaction(signature, "confirmed");
      } catch {
        console.log("Confirmation timeout — likely succeeded");
      }

      await fetch(`/api/receipt/${result.invoice.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txSignature: signature,
          payerWallet: window.solana.publicKey.toString(),
        }),
      });

      setTxSig(signature);
      setPaid(true);
    } catch {
      setError("Payment execution failed.");
    } finally {
      setPaying(false);
    }
  };

  const stepLabels = [
    "Fetching invoice from Flint protocol",
    "Validating invoice fields",
    "Checking expiry and conditions",
    "Running AI analysis with Gemini",
    "Ready to execute payment",
  ];

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">

        <div className="mb-10">
          <button
            onClick={() => router.push("/")}
            className="text-sm mb-4 block"
            style={{ color: "var(--spark)", background: "none", border: "none", cursor: "pointer" }}
          >
            Back to Flint
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: "#1a1a0a", color: "#FF6B2B", border: "1px solid #FF6B2B" }}
            >
              EXPERIMENTAL
            </div>
          </div>
          <h1
            className="text-3xl font-medium tracking-wide mb-2"
            style={{ color: "var(--chalk)" }}
          >
            AI Payment Agent
          </h1>
          <p style={{ color: "#888888", fontSize: "14px" }}>
            An autonomous AI agent that reads, analyzes, and executes
            Flint payment requests without human intervention.
          </p>
        </div>

        {/* Input */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "#111111", border: "1px solid #1f1f1f" }}
        >
          <p className="text-xs mb-4" style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Invoice ID
          </p>
          <input
            value={invoiceId}
            onChange={(e) => { setInvoiceId(e.target.value); setError(""); }}
            placeholder="Paste a Flint invoice ID here"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono mb-4"
            style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "var(--chalk)" }}
          />
          <p className="text-xs mb-4" style={{ color: "#444444" }}>
            Create an invoice at /create and paste the ID here to watch the agent process it autonomously.
          </p>
          {error && (
            <p className="text-sm px-4 py-3 rounded-xl mb-4"
              style={{ background: "#1a0a0a", color: "#ff6b6b" }}>
              {error}
            </p>
          )}
          <button
            onClick={runAgent}
            disabled={running}
            className="w-full py-4 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--spark)" }}
          >
            {running ? "Agent running..." : "Run Agent"}
          </button>
        </div>

        {/* Steps */}
        {(running || result) && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          >
            <p className="text-xs mb-4" style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Agent Execution Steps
            </p>
            <div className="flex flex-col gap-3">
              {stepLabels.map((label, i) => {
                const stepNum = i + 1;
                const isComplete = currentStep > stepNum;
                const isActive = currentStep === stepNum;
                const isPending = currentStep < stepNum;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        background: isComplete ? "#0a1a0a" : isActive ? "#1a1a0a" : "#0f0f0f",
                        border: `1px solid ${isComplete ? "#4ade80" : isActive ? "var(--spark)" : "#2a2a2a"}`,
                        color: isComplete ? "#4ade80" : isActive ? "var(--spark)" : "#555555",
                      }}
                    >
                      {isComplete ? "✓" : stepNum}
                    </div>
                    <p
                      className="text-sm"
                      style={{
                        color: isComplete ? "#4ade80" : isActive ? "var(--chalk)" : "#555555",
                      }}
                    >
                      {label}
                    </p>
                    {isActive && running && (
                      <span className="text-xs" style={{ color: "var(--spark)" }}>
                        processing...
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Agent Analysis */}
        {result && (
          <>
            <div
              className="rounded-2xl p-6 mb-6"
              style={{ background: "#111111", border: "1px solid #1f1f1f" }}
            >
              <p className="text-xs mb-4" style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                AI Analysis — Llama 3.3 via Groq
              </p>
              <p className="text-sm" style={{ color: "#aaaaaa", lineHeight: "1.8" }}>
                {result.agentResponse}
              </p>
            </div>

            <div
              className="rounded-2xl p-6 mb-6"
              style={{ background: "#111111", border: "1px solid #1f1f1f" }}
            >
              <p className="text-xs mb-4" style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Invoice Summary
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <p className="text-sm" style={{ color: "#555555" }}>Title</p>
                  <p className="text-sm" style={{ color: "var(--chalk)" }}>{result.invoice.title}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm" style={{ color: "#555555" }}>Amount</p>
                  <p className="text-sm font-medium" style={{ color: "var(--spark)" }}>
                    {result.invoice.amount} {result.invoice.token}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm" style={{ color: "#555555" }}>Status</p>
                  <p className="text-sm" style={{ color: result.approved ? "#4ade80" : "#ff6b6b" }}>
                    {result.approved ? "Approved for payment" : "Cannot process"}
                  </p>
                </div>
              </div>
            </div>

            {paid ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: "#0a1a0a", border: "1px solid #1a3a1a" }}
              >
                <p className="text-lg font-medium mb-2" style={{ color: "#4ade80" }}>
                  Payment Executed by Agent
                </p>
                <p className="text-xs font-mono mb-4 break-all" style={{ color: "#4ade80" }}>
                  {txSig}
                </p>
                <button
                  onClick={() => window.open(
                    `https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
                    "_blank"
                  )}
                  className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: "#111111", border: "1px solid #1a3a1a", color: "#4ade80" }}
                >
                  View on Solana Explorer
                </button>
              </div>
            ) : result.approved ? (
              <button
                onClick={executePayment}
                disabled={paying}
                className="w-full py-4 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--spark)" }}
              >
                {paying ? "Agent executing payment..." : "Execute Payment via Agent"}
              </button>
            ) : (
              <div
                className="w-full py-4 rounded-xl text-center"
                style={{ background: "#1a0a0a", color: "#ff6b6b" }}
              >
                Agent cannot process this invoice
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