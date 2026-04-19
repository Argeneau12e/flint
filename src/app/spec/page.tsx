"use client";

import { useRouter } from "next/navigation";

export default function SpecPage() {
  const router = useRouter();

  const endpoints = [
    { method: "GET", path: "/api/schema", desc: "Full JSON-LD schema" },
    { method: "POST", path: "/api/invoice/create", desc: "Create payment request" },
    { method: "GET", path: "/api/invoice/create?id={id}", desc: "Fetch by ID" },
    { method: "GET", path: "/api/invoice/create?handle={handle}", desc: "Fetch by handle" },
    { method: "GET", path: "/api/pay/{id}", desc: "Actions metadata" },
    { method: "POST", path: "/api/pay/{id}", desc: "Build transaction" },
  ];

  const steps = [
    "Fetch invoice JSON from GET /api/invoice/create?id={id}",
    "Validate expiresAt is in the future",
    "Validate status is pending",
    "Check condition field if present and verify it is met",
    "Call POST /api/pay/{id} with agent wallet public key as account",
    "Sign and send the returned base64 transaction",
    "Confirm transaction on Solana",
    "Verify txSignature is stored on the receipt",
  ];

  return (
    <main className="min-h-screen px-6 py-16 max-w-3xl mx-auto">

      <div className="mb-16">
        <button
          onClick={() => router.push("/")}
          className="text-sm mb-8 inline-block"
          style={{ color: "var(--spark)", background: "none", border: "none", cursor: "pointer" }}
        >
          Back to Flint
        </button>
        <div className="flex items-center gap-3 mt-6 mb-4">
          <div
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: "#1a1a0a", color: "#FF6B2B", border: "1px solid #FF6B2B" }}
          >
            FRS-1
          </div>
          <p className="text-xs" style={{ color: "#555555" }}>
            Flint Request Standard · Version 1.0.0
          </p>
        </div>
        <h1
          className="text-4xl font-medium tracking-wide mb-4"
          style={{ color: "var(--chalk)" }}
        >
          Flint Request Standard
        </h1>
        <p className="text-lg" style={{ color: "#888888" }}>
          An open payment request protocol for Solana.
          Human-shareable. Agent-executable.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>
          Abstract
        </h2>
        <p style={{ color: "#aaaaaa", lineHeight: "1.8" }}>
          The Flint Request Standard (FRS-1) defines a structured,
          machine-readable payment request object for the Solana blockchain.
          A Flint Request encodes all information necessary for both humans
          and autonomous agents to discover, validate, and settle a payment
          using Solana Actions as transport and Solana Blinks as the
          shareable interface layer.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>
          Motivation
        </h2>
        <p style={{ color: "#aaaaaa", lineHeight: "1.8" }}>
          Solana Pay defines how to transfer value. Solana Actions define
          how to present signable transactions. Neither defines how to
          request payment with a fixed amount, expiry, memo, conditions,
          and verifiable receipt. FRS-1 fills this gap. It is the missing
          invoice layer between Solana settlement speed and real-world
          commercial use.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>
          The Flint Request Object
        </h2>
        <div
          className="rounded-xl p-6"
          style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}
        >
          <pre
            className="text-sm overflow-x-auto"
            style={{ color: "#aaaaaa", lineHeight: "1.8" }}
          >
{`{
  "id": "uuid-v4",
  "title": "string",
  "amount": "number",
  "token": "SOL | USDC | SPL mint",
  "recipientWallet": "base58 address",
  "memo": "string — on-chain",
  "expiresAt": "unix timestamp",
  "status": "pending | paid | expired | cancelled",
  "lineItems": [{ description, quantity, unitPrice, total }],
  "taxAmount": "number",
  "sellerVatId": "string",
  "buyerReference": "string",
  "handle": "string",
  "condition": "string",
  "txSignature": "base58 tx signature",
  "payerWallet": "base58 address",
  "paidAt": "unix timestamp"
}`}
          </pre>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>
          Agent Execution Instructions
        </h2>
        <div className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-4 py-3 rounded-xl"
              style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}
            >
              <span
                className="text-xs font-medium mt-0.5 flex-shrink-0"
                style={{ color: "var(--spark)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm" style={{ color: "#aaaaaa" }}>
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>
          Protocol Endpoints
        </h2>
        <div className="flex flex-col gap-3">
          {endpoints.map((ep) => (
            <div
              key={`${ep.method}-${ep.path}`}
              className="flex items-center gap-4 px-4 py-3 rounded-xl"
              style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}
            >
              <span
                className="text-xs font-medium w-10 flex-shrink-0"
                style={{ color: ep.method === "GET" ? "#4ade80" : "var(--spark)" }}
              >
                {ep.method}
              </span>
              <code className="text-sm flex-1" style={{ color: "var(--chalk)" }}>
                {ep.path}
              </code>
              <p className="text-xs" style={{ color: "#555555" }}>
                {ep.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "2rem" }}>
        <p className="text-xs" style={{ color: "#333333" }}>
          Flint Request Standard FRS-1 · Open source · MIT License · Built for Solana
        </p>
      </div>

    </main>
  );
}